import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element, CanvasElement } from './element';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: Element[] = DEFAULT_ELEMENTS;
  private placedElements: CanvasElement[] = [];

  constructor() {}

  getAllElements(): Element[] {
    return this.elements;
  }

  addPlacedElement(element: Element, x: number, y: number): void {
    const canvasElement: CanvasElement = {
      canvasId: Math.random().toString(36).substr(2, 9), // Generate unique ID
      element,
      x,
      y,
    };
    this.placedElements.push(canvasElement);
  }

  getPlacedElements(): CanvasElement[] {
    return this.placedElements;
  }

  clearPlacedElements(): void {
    this.placedElements = [];
  }

  removePlacedElement(canvasId: string): void {
    this.placedElements = this.placedElements.filter((el) => el.canvasId !== canvasId);
  }

  mergeElements(idElementA: string, idElementB: string): Element | null {
    const elementA = this.elements.find((element) => element.id === idElementA);
    const elementB = this.elements.find((element) => element.id === idElementB);

    if (!elementA || !elementB) {
      console.log('Merge failed: One or both elements not found.');
      return null;
    }

    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);

    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${elementA.name} + ${elementB.name}`,
      emoji: `${elementA.emoji}${elementB.emoji}`,
    };

    return newElement;
  }
}
