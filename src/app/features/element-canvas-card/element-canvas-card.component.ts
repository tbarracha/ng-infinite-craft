import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CanvasElement } from '../element/element';

@Component({
  selector: 'app-element-canvas-card',
  templateUrl: './element-canvas-card.component.html',
  styleUrls: ['./element-canvas-card.component.scss'],
})
export class ElementCanvasCardComponent implements AfterViewInit {
  @Input() canvasElement!: CanvasElement;
  @Input() canvasWidth!: number;
  @Input() canvasHeight!: number;
  @Input() allCanvasElements: CanvasElement[] = []; // Default to an empty array
  @Output() dragStarted = new EventEmitter<{ canvasId: string; offsetX: number; offsetY: number }>();
  @Output() elementDroppedOn = new EventEmitter<CanvasElement>(); // Event for detecting drop on another element
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

      // Move the element without constraining during dragging
      this.canvasElement.x = newX;
      this.canvasElement.y = newY;

      event.preventDefault(); // Prevent text selection or unwanted scrolling
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.isDragging) {
      // Constrain the element position within canvas bounds, accounting for card dimensions
      this.canvasElement.x = Math.max(
        0,
        Math.min(this.canvasWidth - this.cardWidth, this.canvasElement.x)
      );
      this.canvasElement.y = Math.max(
        0,
        Math.min(this.canvasHeight - this.cardHeight, this.canvasElement.y)
      );

      // Reset z-index after dragging
      this.cardRef.nativeElement.style.zIndex = '1';

      // Check for collisions
      this.checkForCollisions();
    }

    this.isDragging = false;
  }

  private checkForCollisions() {
    if (!Array.isArray(this.allCanvasElements)) {
      return; // Safeguard against undefined or null
    }

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
          // Collision detected
          this.elementDroppedOn.emit(element);
          console.log(`Dropped on: ${element.element.name}`);
          break;
        }
      }
    }
  }
}
