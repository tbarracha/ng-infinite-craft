import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Element, CanvasElement } from '../element/element';
import { ElementEventService } from '../element/element-event.service';
import { NgFor } from '@angular/common';
import { ElementCanvasCardComponent } from '../element-canvas-card/element-canvas-card.component';

@Component({
  selector: 'app-element-canvas',
  templateUrl: './element-canvas.component.html',
  styleUrls: ['./element-canvas.component.scss'],
  imports: [NgFor, ElementCanvasCardComponent],
})
export class ElementCanvasComponent implements OnInit, AfterViewInit {
  placedElements: CanvasElement[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  draggedElement: { canvasId: string; offsetX: number; offsetY: number } | null = null;

  constructor() {}

  ngOnInit() {
    ElementEventService.onElementClicked.subscribe((element) => {
      this.placeElementAtRandomPosition(element);
    });
  }

  ngAfterViewInit() {
    this.updateCanvasBounds();
    window.addEventListener('resize', () => this.updateCanvasBounds());
  }

  updateCanvasBounds() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  }

  generateCanvasId(): string {
    return Math.random().toString(36).substr(2, 9); // Generate a unique ID for canvas elements
  }

  placeElement(element: Element, x: number, y: number) {
    // Ensure the element is placed within the canvas bounds
    x = Math.max(0, Math.min(this.canvasWidth, x));
    y = Math.max(0, Math.min(this.canvasHeight, y));

    const canvasElement: CanvasElement = {
      canvasId: this.generateCanvasId(),
      element,
      x,
      y,
    };
    this.placedElements.push(canvasElement);
  }

  placeElementAtRandomPosition(element: Element) {
    const x = Math.random() * (this.canvasWidth - 50);
    const y = Math.random() * (this.canvasHeight - 50);
    this.placeElement(element, x, y);
  }

  onDragStart({ canvasId, offsetX, offsetY }: { canvasId: string; offsetX: number; offsetY: number }) {
    this.draggedElement = { canvasId, offsetX, offsetY };
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.draggedElement) {
      const { canvasId, offsetX, offsetY } = this.draggedElement;
      const canvasElement = this.placedElements.find((e) => e.canvasId === canvasId);

      if (canvasElement) {
        const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
        let x = event.clientX - canvasRect.left - offsetX;
        let y = event.clientY - canvasRect.top - offsetY;

        // Ensure the element stays within the canvas bounds
        x = Math.max(0, Math.min(this.canvasWidth, x));
        y = Math.max(0, Math.min(this.canvasHeight, y));

        canvasElement.x = x;
        canvasElement.y = y;
      }

      this.draggedElement = null; // Reset the dragging state
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  clearCanvas() {
    this.placedElements = [];
  }
}