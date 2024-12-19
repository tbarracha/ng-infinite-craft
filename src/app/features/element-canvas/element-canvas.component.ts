import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Element } from '../element/element';
import { ElementCardComponent } from '../element-card/element-card.component';
import { NgFor } from '@angular/common';
import { ElementEventService } from '../element/element-event.service';

@Component({
  selector: 'app-element-canvas',
  templateUrl: './element-canvas.component.html',
  styleUrls: ['./element-canvas.component.scss'],
  imports: [NgFor, ElementCardComponent],
})
export class ElementCanvasComponent implements OnInit, AfterViewInit {
  placedElements: { element: Element; x: number; y: number }[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  canvasWidth: number = 0;
  canvasHeight: number = 0;

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
    this.canvasWidth = canvas.offsetWidth;
    this.canvasHeight = canvas.offsetHeight;
  }

  placeElement(element: Element, x: number, y: number) {
    const existingElement = this.placedElements.find((e) => e.element.id === element.id);

    if (existingElement) {
      existingElement.x = x;
      existingElement.y = y;
    } else {
      this.placedElements.push({ element, x, y });
    }
  }

  placeElementAtRandomPosition(element: Element) {
    const x = Math.random() * (this.canvasWidth - 50);
    const y = Math.random() * (this.canvasHeight - 50);
    this.placeElement(element, x, y);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const elementData = event.dataTransfer?.getData('text/plain');
    const offsetX = parseFloat(event.dataTransfer?.getData('offsetX') || '0');
    const offsetY = parseFloat(event.dataTransfer?.getData('offsetY') || '0');

    if (elementData) {
      const element: Element = JSON.parse(elementData);
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - canvasRect.left - offsetX;
      const y = event.clientY - canvasRect.top - offsetY;

      this.placeElement(element, x, y);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  clearCanvas() {
    this.placedElements = [];
  }
}
