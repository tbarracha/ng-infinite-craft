import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element, CanvasElement } from './element';
import { TransformerService } from '../../core/services/transformer.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: Element[] = DEFAULT_ELEMENTS;
  private activeElements: CanvasElement[] = [];
  private isGenerating = false;

  constructor(private transformerService: TransformerService) {}

  getIsGenerating(): boolean {
    return this.isGenerating;
  }

  getAllElements(): Element[] {
    return this.elements;
  }removeElements(elementIds: string[]): void {
    const defaultElementIds = new Set(DEFAULT_ELEMENTS.map((element) => element.id));
  
    // Ensure only non-default elements are removed
    this.elements = this.elements.filter((element) => {
      const isDefaultElement = defaultElementIds.has(element.id);
      const isMarkedForRemoval = elementIds.includes(element.id);
  
      if (isDefaultElement && isMarkedForRemoval) {
        console.warn(`Element "${element.name}" (${element.id}) is a default element and cannot be removed.`);
        return true;
      }
  
      return !isMarkedForRemoval;
    });
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
            newElement.id = Math.random().toString(36).substr(2, 9); // Generate unique ID
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
