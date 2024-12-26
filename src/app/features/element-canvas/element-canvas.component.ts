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

  ngOnInit(): void {
    this.loadCanvasElements();

    ElementEventService.onCanvasUpdated.subscribe((updatedCanvasElements) => {
      this.canvasElements = updatedCanvasElements;
    });

    ElementEventService.onElementClicked.subscribe((element) => {
      this.placeElementAtRandomPosition(element);
    });

    ElementEventService.onElementDropped.subscribe(({ element, x, y }) => {
      this.handleElementDrop(element, x, y);
    });
  }

  ngAfterViewInit(): void {
    this.updateCanvasBounds();
    window.addEventListener('resize', () => this.updateCanvasBounds());
  }

  private loadCanvasElements(): void {
    this.canvasElements = this.elementService.getCanvasElements();
  }

  private updateCanvasBounds(): void {
    if (!this.canvasRef) {
      console.warn('Canvas reference not available.');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  }

  private placeElementAtRandomPosition(element: Element): void {
    const x = Math.random() * (this.canvasWidth - 50);
    const y = Math.random() * (this.canvasHeight - 50);
    this.elementService.addPlacedElement(element, x, y);
  }

  private handleElementDrop(element: Element, x: number, y: number): void {
    const constrainedX = Math.max(0, Math.min(this.canvasWidth - 50, x));
    const constrainedY = Math.max(0, Math.min(this.canvasHeight - 50, y));
    this.elementService.addPlacedElement(element, constrainedX, constrainedY);
  }

  clearCanvas(): void {
    this.elementService.clearCanvasElements();
    console.log('Canvas cleared.');
  }
}
