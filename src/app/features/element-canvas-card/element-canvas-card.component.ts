import { Component, Input, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CanvasElement } from '../element/element';
import { ElementEventService } from '../element/element-event.service';

@Component({
  selector: 'app-element-canvas-card',
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

  ngAfterViewInit() {
    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.cardWidth = rect.width;
    this.cardHeight = rect.height;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
    this.isDragging = true;

    // Raise z-index while dragging
    this.cardRef.nativeElement.style.zIndex = '1000';

    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const newX = event.clientX - this.offsetX;
      const newY = event.clientY - this.offsetY;

      this.canvasElement.x = newX;
      this.canvasElement.y = newY;

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

      this.checkForCollisions();
    }

    this.isDragging = false;
  }

  private checkForCollisions() {
    const thisRect = this.cardRef.nativeElement.getBoundingClientRect();

    for (const element of this.allCanvasElements) {
      if (element.canvasId === this.canvasElement.canvasId) {
        continue; // Skip self
      }

      const otherElement = document.querySelector(`[data-id="${element.canvasId}"]`) as HTMLElement;
      if (otherElement) {
        const otherRect = otherElement.getBoundingClientRect();

        if (
          thisRect.left < otherRect.right &&
          thisRect.right > otherRect.left &&
          thisRect.top < otherRect.bottom &&
          thisRect.bottom > otherRect.top
        ) {
          ElementEventService.onElementDroppedOn.emit({
            sourceElement: this.canvasElement,
            targetElement: element,
          });
          console.log(`Dropped on: ${element.element.name}`);
          break;
        }
      }
    }
  }
}
