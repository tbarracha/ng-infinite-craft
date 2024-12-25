import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Element, CanvasElement } from '../element/element';
import { ElementService } from '../element/element.service';
import { ElementEventService } from '../element/element-event.service';
import { ElementCanvasCardComponent } from '../element-canvas-card/element-canvas-card.component';

@Component({
  selector: 'app-element-canvas',
  templateUrl: './element-canvas.component.html',
  styleUrls: ['./element-canvas.component.scss'],
  imports: [ElementCanvasCardComponent],
})
export class ElementCanvasComponent implements OnInit, AfterViewInit {
  canvasElements: CanvasElement[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  canvasWidth: number = 0;
  canvasHeight: number = 0;

  constructor(private elementService: ElementService) {}

  ngOnInit() {
    this.updatePlacedElements();

    ElementEventService.onElementClicked.subscribe((element) => {
      this.placeElementAtRandomPosition(element);
    });

    ElementEventService.onElementDropped.subscribe(({ element, x, y }) => {
      this.handleElementDrop(element, x, y);
    });

    ElementEventService.onElementDroppedOn.subscribe(({ sourceElement, targetElement }) => {
      this.handleMerge(sourceElement, targetElement);
    });

    ElementEventService.onElementListRefreshed.subscribe(() => {
      this.refreshCanvas();
    });
  }

  ngAfterViewInit() {
    this.updateCanvasBounds();
    window.addEventListener('resize', () => this.updateCanvasBounds());
  }

  refreshCanvas(): void {
    // Logic to refresh the canvas based on the updated activeElements
    this.canvasElements = this.elementService.getPlacedElements();
    console.log('Canvas refreshed:', this.canvasElements);
  }

  updateCanvasBounds() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  }

  updatePlacedElements() {
    this.canvasElements = this.elementService.getPlacedElements();
  }

  placeElementAtRandomPosition(element: Element) {
    const x = Math.random() * (this.canvasWidth - 50);
    const y = Math.random() * (this.canvasHeight - 50);
    this.elementService.addPlacedElement(element, x, y);
    this.updatePlacedElements();
  }

  handleElementDrop(element: Element, x: number, y: number) {
    const constrainedX = Math.max(0, Math.min(this.canvasWidth - 50, x));
    const constrainedY = Math.max(0, Math.min(this.canvasHeight - 50, y));
    this.elementService.addPlacedElement(element, constrainedX, constrainedY);
    this.updatePlacedElements();
  }

  async handleMerge(source: CanvasElement, target: CanvasElement) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    try {
      const mergedElement = await this.elementService.mergeElements(source.element.id, target.element.id);

      if (mergedElement) {
        this.elementService.removePlacedElement(source.canvasId);
        this.elementService.removePlacedElement(target.canvasId);
        this.elementService.addPlacedElement(mergedElement, midX, midY);
        this.updatePlacedElements();
      }
    } catch (error) {
      console.error('Error merging elements:', error);
    }
  }

  clearCanvas() {
    this.elementService.clearPlacedElements();
    this.updatePlacedElements();
  }
}
