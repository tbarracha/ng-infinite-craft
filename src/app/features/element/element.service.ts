import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element } from './element';
import { ElementEventService } from './element-event.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: Element[] = DEFAULT_ELEMENTS;

  constructor(
  ) {}

  getAllElements(): Element[] {
    return this.elements;
  }

  mergeElements(idElementA: string, idElementB: string): void {
    const elementA = this.elements.find((element) => element.id === idElementA);
    const elementB = this.elements.find((element) => element.id === idElementB);

    if (!elementA || !elementB) {
      return;
    }

    // simulate with added element but need to use Transformer.js LLM to create new merged elements
    const newElementName = `${elementA.name} + ${elementB.name}`;
    const newElementEmoji = `${elementA.emoji}${elementB.emoji}`;

    this.addNewElement(newElementName, newElementEmoji);
  }

  addNewElement(name: string, emoji: string): void {
    const id = (this.elements.length + 1).toString();
    this.elements.push({ id, name, emoji });
  }
}
