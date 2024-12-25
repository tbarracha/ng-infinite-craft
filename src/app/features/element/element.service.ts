import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element, CanvasElement } from './element';
import { TransformerService } from '../../core/services/transformer.service';
import { ElementEventService } from './element-event.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: Element[] = DEFAULT_ELEMENTS;
  private canvasElements: CanvasElement[] = [];
  private isGenerating = false;

  constructor(private transformerService: TransformerService) {}

  getIsGenerating(): boolean {
    return this.isGenerating;
  }

  getAllElements(): Element[] {
    return this.elements;
  }
  
  removeElements(elementIds: string[]): void {
    // Remove elements from the list
    this.elements = this.elements.filter((element) => !elementIds.includes(element.id));
  
    // Re-add missing default elements
    DEFAULT_ELEMENTS.forEach((defaultElement) => {
      if (!this.elements.some((element) => element.id === defaultElement.id)) {
        this.elements.push({ ...defaultElement }); // Add a copy of the default element
      }
    });
  
    // Sort the elements by their ID
    this.elements.sort((a, b) => a.id.localeCompare(b.id));
  
    // Remove elements from the canvas
    this.canvasElements = this.canvasElements.filter(
      (canvasElement) => !elementIds.includes(canvasElement.element.id)
    );

    ElementEventService.onElementListRefreshed.emit();
  }

  addPlacedElement(element: Element, x: number, y: number): void {
    const canvasElement: CanvasElement = {
      canvasId: Math.random().toString(36).substr(2, 9), // Generate unique ID
      element,
      x,
      y,
    };
    this.canvasElements.push(canvasElement);
  }

  getPlacedElements(): CanvasElement[] {
    return this.canvasElements;
  }

  clearPlacedElements(): void {
    this.canvasElements = [];
  }

  removePlacedElement(canvasId: string): void {
    this.canvasElements = this.canvasElements.filter((el) => el.canvasId !== canvasId);
  }

  async mergeElements(idElementA: string, idElementB: string): Promise<Element | null> {
    const elementA = this.elements.find((element) => element.id === idElementA);
    const elementB = this.elements.find((element) => element.id === idElementB);
  
    if (!elementA || !elementB) {
      console.error('Merge failed: One or both elements not found.');
      return null;
    }
  
    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);
  
    const prompt = this.createMergePrompt(elementA, elementB);
    this.isGenerating = true; // Start generation
    let attempts = 0;
    const maxAttempts = 5;
  
    while (attempts < maxAttempts) {
      try {
        const { rawOutput, cleanOutput } = await this.transformerService.generateChatCompletion(prompt, {
          max_new_tokens: 100,
          temperature: 0.7,
        });
  
        const extractedJsons = this.extractJsonsFromString(cleanOutput);
  
        if (extractedJsons.length > 0) {
          const newElement: Element = extractedJsons[0]; // Assuming the first JSON is the desired one
  
          if (newElement?.name && this.isValidEmoji(newElement.emoji)) {
            newElement.id = this.elements.length.toString(); // Set id to the current length of elements array
            this.elements.push(newElement);
            this.isGenerating = false; // End generation
            return newElement;
          }
        }
  
        console.warn(`Attempt ${attempts + 1}: Invalid generated element. Retrying...`);
      } catch (error) {
        console.error(`Attempt ${attempts + 1}: Error during element generation:`, error);
      }
  
      attempts++;
    }
  
    this.isGenerating = false; // End generation
    console.error('Failed to generate a valid element after maximum retries.');
    return null;
  }  
  
  createMergePrompt(elementA: Element, elementB: Element): string {
    return `I am trying to combine two elements to create new elements using the json format with "name" and "emoji" keys only.
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
  }
  
  isValidEmoji(emoji: string): boolean {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;
    const matches = emoji.match(emojiRegex);
    return matches !== null && matches.length === 1;
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
