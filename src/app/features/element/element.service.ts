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
  private nextElementId: number = 5;
  private currentState: 'Idle' | 'Updating' | 'Completed' = 'Idle';

  constructor(private transformerService: TransformerService) {
    ElementEventService.onElementDroppedOn.subscribe(async ({ sourceElement, targetElement }) => {
      await this.mergeElements(sourceElement, targetElement);
    });
  }

  private setState(state: 'Idle' | 'Updating' | 'Completed'): void {
    console.log(`Transitioning to state: ${state}`);
    this.currentState = state;

    if (state === 'Completed') {
      setTimeout(() => {
        this.setState('Idle');
      }, 50);
    }
  }

  getIsGenerating(): boolean {
    return this.isGenerating;
  }

  getAllElements(): Element[] {
    return this.elements;
  }

  async removeElements(elementIdsToRemove: string[]): Promise<Element[]> {
    if (this.currentState !== 'Idle') {
      console.warn('Operation already in progress. Please wait.');
      return this.elements;
    }

    this.setState('Updating');

    try {
      console.log('Initial elements:', this.elements);
      console.log('Initial canvas elements:', this.canvasElements);
      console.log('IDs to remove:', elementIdsToRemove);

      this.elements = this.elements.filter(
        (element) =>
          !elementIdsToRemove.includes(element.id) ||
          DEFAULT_ELEMENTS.some((defaultEl) => defaultEl.id === element.id)
      );

      const missingDefaultElements = DEFAULT_ELEMENTS.filter(
        (defaultElement) => !this.elements.some((el) => el.id === defaultElement.id)
      );
      this.elements = [...missingDefaultElements, ...this.elements];

      this.canvasElements = this.canvasElements.filter(
        (canvasElement) =>
          !elementIdsToRemove.includes(canvasElement.element.id) ||
          DEFAULT_ELEMENTS.some((defaultEl) => defaultEl.id === canvasElement.element.id)
      );

      console.log('Updated elements:', this.elements);
      console.log('Updated canvas elements:', this.canvasElements);

      ElementEventService.onElementListRefreshed.emit();
      ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());

      this.setState('Completed');
      return this.elements;
    } catch (error) {
      console.error('Error during element removal:', error);
      this.setState('Idle');
      throw error;
    }
  }

  async removeAllElements(): Promise<Element[]> {
    if (this.currentState !== 'Idle') {
      console.warn('Operation already in progress. Please wait.');
      return this.elements;
    }

    this.setState('Updating');

    try {
      this.elements = [...DEFAULT_ELEMENTS];
      this.canvasElements = [];

      ElementEventService.onElementListRefreshed.emit();
      ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());

      this.setState('Completed');
      return this.elements;
    } catch (error) {
      console.error('Error during removeAllElements:', error);
      this.setState('Idle');
      throw error;
    }
  }

  addPlacedElement(element: Element, x: number, y: number): void {
    if (this.currentState !== 'Idle') {
      console.warn('Cannot add elements while another operation is in progress.');
      return;
    }

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
    if (this.currentState !== 'Idle') {
      console.warn('Cannot clear elements while another operation is in progress.');
      return;
    }

    this.canvasElements = [];
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  removePlacedElement(canvasId: string): void {
    if (this.currentState !== 'Idle') {
      console.warn('Cannot remove canvas elements while another operation is in progress.');
      return;
    }

    this.canvasElements = this.canvasElements.filter((el) => el.canvasId !== canvasId);
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  async mergeElements(sourceElement: CanvasElement, targetElement: CanvasElement): Promise<CanvasElement | null> {
    if (this.currentState !== 'Idle') {
        console.warn('Cannot merge elements while another operation is in progress.');
        return null;
    }

    this.setState('Updating');
    const elementA = this.elements.find((element) => element.id === sourceElement.element.id);
    const elementB = this.elements.find((element) => element.id === targetElement.element.id);

    if (!elementA || !elementB) {
        console.error('Merge failed: One or both elements not found.');
        this.setState('Idle');
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
                    newElement.id = (this.nextElementId++).toString();
                    this.elements.push(newElement);

                    // Remove the old canvas elements
                    this.canvasElements = this.canvasElements.filter(
                        (canvasEl) =>
                            canvasEl.canvasId !== sourceElement.canvasId &&
                            canvasEl.canvasId !== targetElement.canvasId
                    );

                    // Create and place the new canvas element
                    const midX = (sourceElement.x + targetElement.x) / 2;
                    const midY = (sourceElement.y + targetElement.y) / 2;
                    const newCanvasElement: CanvasElement = {
                        canvasId: Math.random().toString(36).substr(2, 9),
                        element: newElement,
                        x: midX,
                        y: midY,
                    };
                    this.canvasElements.push(newCanvasElement);

                    // Emit events
                    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
                    ElementEventService.onElementListRefreshed.emit();
                    ElementEventService.onElementMerged.emit(newCanvasElement);

                    this.isGenerating = false;
                    this.setState('Completed');
                    console.log('Merge successful:', newCanvasElement);
                    return newCanvasElement;
                }
            }

            console.warn(`Attempt ${attempts + 1}: Invalid generated element. Retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts + 1}: Error during element generation:`, error);
        }

        attempts++;
    }

    this.isGenerating = false;
    this.setState('Idle');
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
    const jsonMatches = text.match(/\{[\s\S]*?\}/g);
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

    return jsonObjects.filter((json) => json !== null);
  }
}
