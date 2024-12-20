import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element, CanvasElement } from './element';
import { TransformerService } from '../../core/services/transformer.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: Element[] = DEFAULT_ELEMENTS;
  private activeElements: CanvasElement[] = [];

  constructor(private transformerService: TransformerService) {}

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
    this.activeElements.push(canvasElement);
  }

  getPlacedElements(): CanvasElement[] {
    return this.activeElements;
  }

  clearPlacedElements(): void {
    this.activeElements = [];
  }

  removePlacedElement(canvasId: string): void {
    this.activeElements = this.activeElements.filter((el) => el.canvasId !== canvasId);
  }

  async mergeElements(idElementA: string, idElementB: string): Promise<Element | null> {
    const elementA = this.elements.find((element) => element.id === idElementA);
    const elementB = this.elements.find((element) => element.id === idElementB);

    if (!elementA || !elementB) {
      console.log('Merge failed: One or both elements not found.');
      return null;
    }

    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);

    // Generate the new element using the TransformerService
    const prompt = `Given the following elements: ${elementA.name} ${elementA.emoji} and ${elementB.name} ${elementB.emoji}, combine them and create a new element with a Name and an Emoji. The new element should represent the combination of the two and should be in JSON format.`;
    try {
      const generatedText = await this.transformerService.generateChatCompletion(prompt);
      
      // Parse generated result (assuming format: "NewElementName NewElementEmoji")
      const [newName, newEmoji] = generatedText.trim().split(' ');

      if (!newName || !newEmoji) {
        console.error('Invalid result from Transformer model:', generatedText);
        return null;
      }

      const newElement: Element = {
        id: Math.random().toString(36).substr(2, 9),
        name: newName,
        emoji: newEmoji,
      };

      // Optionally add this new element to the global elements list
      this.elements.push(newElement);
      return newElement;

    } catch (error) {
      console.error('Error generating new element:', error);
      return null;
    }
  }
}
