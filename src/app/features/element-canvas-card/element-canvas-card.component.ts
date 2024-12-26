import { Component, Input, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CanvasElement } from '../element/element';
import { ElementEventService } from '../element/element-event.service';
import { ElementService } from '../element/element.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-element-canvas-card',
  imports: [NgClass],
  templateUrl: './element-canvas-card.component.html',
  styleUrls: ['./element-canvas-card.component.scss'],
})
export class ElementCanvasCardComponent implements AfterViewInit {
  @Input() canvasElement!: CanvasElement;
  @Input() canvasWidth!: number;
  @Input() canvasHeight!: number;
  @Input() allCanvasElements: CanvasElement[] = [];
  @ViewChild('card', { static: false }) cardRef!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private cardWidth: number = 0;
  private cardHeight: number = 0;
  private activeTargetElement: CanvasElement | null = null;

  constructor(public elementService: ElementService) {}

  ngAfterViewInit() {
    this.refreshCardSize();

    ElementEventService.onElementDroppedOn.subscribe(({ sourceElement, targetElement }) => {
      if (sourceElement.canvasId === this.canvasElement.canvasId || targetElement.canvasId === this.canvasElement.canvasId) {
        this.canvasElement.isBeingMerged = true;
      }
    });
  }

  refreshCardSize() {
    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.cardWidth = rect.width;
    this.cardHeight = rect.height;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Prevent interaction during element generation
    if (this.canvasElement.isBeingMerged || this.canvasElement.isMarkedForMerge) {
      return;
    }

    this.refreshCardSize();

    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
    this.isDragging = true;

    this.cardRef.nativeElement.style.zIndex = '1000'; // Raise z-index while dragging
    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const newX = event.clientX - this.offsetX;
      const newY = event.clientY - this.offsetY;

      this.canvasElement.x = Math.max(
        0,
        Math.min(this.canvasWidth - this.cardWidth, newX)
      );
      this.canvasElement.y = Math.max(
        0,
        Math.min(this.canvasHeight - this.cardHeight, newY)
      );
      
      this.checkForCollisions();
      event.preventDefault();
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.isDragging) {
      this.canvasElement.x = Math.max(
        0,
        Math.min(this.canvasWidth - this.cardWidth, this.canvasElement.x)
      );
      this.canvasElement.y = Math.max(
        0,
        Math.min(this.canvasHeight - this.cardHeight, this.canvasElement.y)
      );

      this.cardRef.nativeElement.style.zIndex = '1';

      if (this.activeTargetElement) {
        ElementEventService.onElementDroppedOn.emit({
          sourceElement: this.canvasElement,
          targetElement: this.activeTargetElement,
        });

        console.log(`Dropped on: ${this.activeTargetElement.element.name}`);
      }

      this.resetCollisionState();
    }

    this.isDragging = false;
  }

  private checkForCollisions() {
    if (this.elementService.getIsGenerating()) {
      return;
    }

    const thisRect = this.cardRef.nativeElement.getBoundingClientRect();
    let currentTarget: CanvasElement | null = null;
  
    for (const element of this.allCanvasElements) {
      if (element.canvasId === this.canvasElement.canvasId) {
        continue; // Skip self
      }
  
      const otherElement = document.querySelector(`[data-id="${element.canvasId}"]`) as HTMLElement;
      if (otherElement) {
        const otherRect = otherElement.getBoundingClientRect();
  
        const isColliding =
          thisRect.left < otherRect.right &&
          thisRect.right > otherRect.left &&
          thisRect.top < otherRect.bottom &&
          thisRect.bottom > otherRect.top;
  
        if (isColliding) {
          currentTarget = element;
          break; // Stop on the first collision detected
        }
      }
    }
  
    if (currentTarget !== this.activeTargetElement) {
      this.resetCollisionState();
      this.activeTargetElement = currentTarget;
  
      if (this.activeTargetElement) {
        this.activeTargetElement.isMarkedForMerge = true;
      }
    }
  }
  
  private resetCollisionState() {
    if (this.activeTargetElement) {
      this.activeTargetElement.isMarkedForMerge = false;
    }
    this.canvasElement.isMarkedForMerge = false;
    this.activeTargetElement = null;
  }
}
