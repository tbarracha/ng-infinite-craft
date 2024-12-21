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
      console.error('Merge failed: One or both elements not found.');
      return null;
    }

    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);

    const prompt = `I am trying to combine two elements to create new elements using the json format with "name" and "emoji" keys only.
Here are some examples to understand how elements are merged:
- Fire + Water = Steam
- Water + Earth = Plant
- Earth + Fire = Lava

Each element is represented in JSON format with "name" and "emoji" keys only. 

For example if:
Element A: {"name":"Fire","emoji":"🔥"}
Element B: {"name":"Water","emoji":"💧"}
The result would be: {"name":"Steam","emoji":"🌫️"}

or if:
Element A: {"name":"Water","emoji":"💧"}
Element B: {"name":"Earth","emoji":"🪨"}
The result would be: {"name":"Plant","emoji":"🌿"}

This means that the new element merged from the following elements:
Element A: {"name":"${elementA.name}","emoji":"${elementA.emoji}"}
Element B: {"name":"${elementB.name}","emoji":"${elementB.emoji}"}
Should be the following:
`;

    try {
      const output = await this.transformerService.generateChatCompletion(prompt, { max_new_tokens: 100, temperature: 0.7 });
      const cleanOutput = output.replace(prompt, '').trim();
      const extractedJsons = this.extractJsonsFromString(cleanOutput);

      if (extractedJsons.length === 0) {
        console.error('No valid JSON found in the output:', output);
        return null;
      }

      const newElement: Element = extractedJsons[0]; // Assuming the first JSON is the desired one

      if (!newElement?.name || !newElement?.emoji) {
        console.error('Invalid generated element:', newElement);
        return null;
      }

      newElement.id = Math.random().toString(36).substr(2, 9); // Generate unique ID
      this.elements.push(newElement);

      return newElement;
    } catch (error) {
      console.error('Error merging elements:', error);
      return null;
    }
  }

  extractJsonsFromString(text: string): any[] {
    const jsonMatches = text.match(/\{[\s\S]*?\}/g); // Match all JSON-like blocks
    if (!jsonMatches) {
      return [];
    }

    const jsonObjects = jsonMatches.map((jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse JSON:', jsonString, error);
        return null;
      }
    });

    return jsonObjects.filter((json) => json !== null); // Filter out invalid JSONs
  }
}
