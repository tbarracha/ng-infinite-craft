import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Element, CanvasElement } from '../element/element';
import { ElementService } from '../element/element.service';
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

  constructor(private elementService: ElementService) {}

  ngOnInit() {
    this.updatePlacedElements();

    ElementEventService.onElementClicked.subscribe((element) => {
      this.placeElementAtRandomPosition(element);
    });

    ElementEventService.onElementDroppedOn.subscribe(({ sourceElement, targetElement }) => {
      this.handleMerge(sourceElement, targetElement);
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

  updatePlacedElements() {
    this.placedElements = this.elementService.getPlacedElements();
  }

  placeElementAtRandomPosition(element: Element) {
    const x = Math.random() * (this.canvasWidth - 50);
    const y = Math.random() * (this.canvasHeight - 50);
    this.elementService.addPlacedElement(element, x, y);
    this.updatePlacedElements();
  }

  handleMerge(source: CanvasElement, target: CanvasElement) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    const mergedElement = this.elementService.mergeElements(source.element.id, target.element.id);

    if (mergedElement) {
      this.elementService.removePlacedElement(source.canvasId);
      this.elementService.removePlacedElement(target.canvasId);
      this.elementService.addPlacedElement(mergedElement, midX, midY);
      this.updatePlacedElements();
    }
  }

  clearCanvas() {
    this.elementService.clearPlacedElements();
    this.updatePlacedElements();
  }
}
