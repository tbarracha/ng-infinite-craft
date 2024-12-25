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

  constructor(private transformerService: TransformerService) {
    ElementEventService.onElementDroppedOn.subscribe(async ({ sourceElement, targetElement }) => {
      await this.mergeElements(sourceElement, targetElement);
    });
  }

  getIsGenerating(): boolean {
    return this.isGenerating;
  }

  getAllElements(): Element[] {
    return this.elements;
  }

  removeElements(elementIds: string[]): void {
    this.elements = this.elements.filter((element) => !elementIds.includes(element.id));
    DEFAULT_ELEMENTS.forEach((defaultElement) => {
      if (!this.elements.some((element) => element.id === defaultElement.id)) {
        this.elements.push({ ...defaultElement });
      }
    });
    this.elements.sort((a, b) => a.id.localeCompare(b.id));
    this.canvasElements = this.canvasElements.filter(
      (canvasElement) => !elementIds.includes(canvasElement.element.id)
    );

    ElementEventService.onElementListRefreshed.emit();
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  addPlacedElement(element: Element, x: number, y: number): void {
    const canvasElement: CanvasElement = {
      canvasId: Math.random().toString(36).substr(2, 9),
      element,
      x,
      y,
    };
    this.canvasElements.push(canvasElement);
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  getCanvasElements(): CanvasElement[] {
    return this.canvasElements;
  }

  clearPlacedElements(): void {
    this.canvasElements = [];
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  removePlacedElement(canvasId: string): void {
    this.canvasElements = this.canvasElements.filter((el) => el.canvasId !== canvasId);
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  async mergeElements(sourceElement: CanvasElement, targetElement: CanvasElement): Promise<Element | null> {
    const elementA = this.elements.find((element) => element.id === sourceElement.element.id);
    const elementB = this.elements.find((element) => element.id === targetElement.element.id);

    if (!elementA || !elementB) {
        console.error('Merge failed: One or both elements not found.');
        return null;
    }

    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);
    const prompt = this.createMergePrompt(elementA, elementB);
    this.isGenerating = true;

    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const { rawOutput, cleanOutput } = await this.transformerService.generateChatCompletion(prompt, {
                max_new_tokens: 100,
                temperature: 0.7,
            });

            const extractedJsons = this.extractJsonsFromString(cleanOutput);

            if (extractedJsons.length > 0) {
                const newElement: Element = extractedJsons[0];

                if (newElement?.name && this.isValidEmoji(newElement.emoji)) {
                    newElement.id = this.elements.length.toString(); // Assign a unique ID
                    this.elements.push(newElement);

                    // Update canvas
                    this.removePlacedElement(sourceElement.canvasId);
                    this.removePlacedElement(targetElement.canvasId);
                    const midX = (sourceElement.x + targetElement.x) / 2;
                    const midY = (sourceElement.y + targetElement.y) / 2;
                    this.addPlacedElement(newElement, midX, midY);

                    this.isGenerating = false;
                    console.log('Merge successful:', newElement);
                    return newElement;
                }
            }

            console.warn(`Attempt ${attempts + 1}: Invalid generated element. Retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts + 1}: Error during element generation:`, error);
        }

        attempts++;
    }

    this.isGenerating = false;
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
