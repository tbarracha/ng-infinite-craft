import { Injectable } from '@angular/core';
import { DEFAULT_ELEMENTS, Element, CanvasElement } from './element';
import { TransformerService } from '../../core/services/transformer.service';
import { ElementEventService } from './element-event.service';
import { List } from '../../core/list';
import { VisualEffectsService } from '../../core/services/visual-effects.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private elements: List<Element> = new List<Element>();
  private canvasElements: List<CanvasElement> = new List<CanvasElement>();
  private mergeRecipes: Map<string, Element> = new Map();

  private isGenerating = false;
  private nextElementId: number = 5;
  private currentState: 'Idle' | 'Updating' | 'Completed' = 'Idle';

  constructor(
    private transformerService: TransformerService,
    private visualEffectService: VisualEffectsService
  ) {
    ElementEventService.onElementDroppedOn.subscribe(async ({ sourceElement, targetElement }) => {
      await this.mergeCanvasElements(sourceElement, targetElement);
    });

    this.elements.addRange(DEFAULT_ELEMENTS);
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
    return this.elements.toArray();
  }

  async removeElements(elementIdsToRemove: string[]): Promise<Element[]> {
    if (this.currentState !== 'Idle') {
      console.warn('Operation already in progress. Please wait.');
      return this.getAllElements();
    }

    this.setState('Updating');

    try {
      const highestDefaultId = Math.max(...DEFAULT_ELEMENTS.map(el => Number(el.id)));
      console.log('Highest ID:', highestDefaultId);

      const prevElements = this.elements.toArray();
      const prevCanvasElements = this.canvasElements.toArray();

      this.elements.clear();
      this.elements.addRange(DEFAULT_ELEMENTS);

      for (let i = 0; i < prevElements.length; i++) {
        const element = prevElements[i];
        const id = Number(element.id);
        if (id > highestDefaultId && !elementIdsToRemove.includes(element.id)) {
          this.elements.add(element);
        }
      }

      this.canvasElements.clear();

      for (let i = 0; i < prevCanvasElements.length; i++) {
        const canvasElement = prevCanvasElements[i];
        if (!elementIdsToRemove.includes(canvasElement.element.id)) {
          this.canvasElements.add(canvasElement);
        }
      }

      ElementEventService.onElementListRefreshed.emit();
      ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());

      this.setState('Completed');
      return this.getAllElements();
    } catch (error) {
      console.error('Error during element removal:', error);
      this.setState('Idle');
      throw error;
    }
  }

  async removeAllElements(): Promise<Element[]> {
    if (this.currentState !== 'Idle') {
        console.warn('Operation already in progress. Please wait.');
        return this.getAllElements();
    }

    try {
        // Determine the IDs of all non-default elements
        const highestDefaultId = Math.max(...DEFAULT_ELEMENTS.map(el => Number(el.id)));
        const elementIdsToRemove = this.elements
            .toArray()
            .filter(element => Number(element.id) > highestDefaultId)
            .map(element => element.id);

        // Delegate removal to removeElements
        const updatedElements = await this.removeElements(elementIdsToRemove);

        // Emit events to update the UI
        ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
        return updatedElements;
    } catch (error) {
        console.error('Error during removeAllElements:', error);
        this.setState('Idle');
        throw error;
    }
  }

  addPlacedElement(element: Element, x: number, y: number): void {
    const canvasElement: CanvasElement = {
      canvasId: Math.random().toString(36).substr(2, 9),
      element,
      x,
      y,
    };
    this.canvasElements.add(canvasElement);
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  getCanvasElements(): CanvasElement[] {
    return this.canvasElements.toArray();
  }

  clearCanvasElements(): void {
    if (this.currentState !== 'Idle' || this.isGenerating) {
      console.warn('Cannot clear elements while another operation is in progress.');
      return;
    }

    this.canvasElements.clear();
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  removeCanvasElementById(canvasId: string): void {
    if (this.currentState !== 'Idle') {
      console.warn('Cannot remove canvas elements while another operation is in progress.');
      return;
    }

    this.canvasElements = new List<CanvasElement>();
    this.canvasElements.addRange(
      this.canvasElements.toArray().filter((el) => el.canvasId !== canvasId)
    );
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
  }

  async mergeCanvasElements(sourceElement: CanvasElement, targetElement: CanvasElement): Promise<CanvasElement | null> {
    if (this.currentState !== 'Idle') {
        console.warn('Cannot merge elements while another operation is in progress.');
        return null;
    }

    this.setState('Updating');

    const elementA = this.elements.find(element => element.id === sourceElement.element.id);
    const elementB = this.elements.find(element => element.id === targetElement.element.id);

    if (!elementA || !elementB) {
        console.error('Merge failed: One or both elements not found.');
        this.setState('Idle');
        return null;
    }

    console.log(`Merging elements: ${elementA.name} (${elementA.emoji}) + ${elementB.name} (${elementB.emoji})`);

    // Check if the merge already exists in the dictionary
    const mergeKey = this.generateMergeKey(elementA, elementB);
    if (this.mergeRecipes.has(mergeKey)) {
        const existingElement = this.mergeRecipes.get(mergeKey)!;

        console.log('Merge found in recipes:', existingElement);
        return this.mergeSuccess(existingElement, sourceElement, targetElement);
    }

    // Generate a new merge via the LLM if not found
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

                if (this.isValidJson(newElement, elementA, elementB)) {
                    // Add the recipe to the dictionary
                    this.mergeRecipes.set(mergeKey, newElement);

                    return this.mergeSuccess(newElement, sourceElement, targetElement);
                }
            }

            console.warn(`Attempt ${attempts + 1}: Invalid generated element. Retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts + 1}: Error during element generation:`, error);
        }

        attempts++;
    }

    console.error('Failed to generate a valid element after maximum retries.');
    this.mergeFailed(sourceElement, targetElement);
    return null;
  }

  private mergeSuccess(newElement: Element, sourceElement: CanvasElement, targetElement: CanvasElement): CanvasElement {
    newElement.id = (this.nextElementId++).toString();
    this.elements.add(newElement);

    // Remove only the merged elements from canvasElements
    this.canvasElements.removeAll(canvasEl =>
        canvasEl.canvasId === sourceElement.canvasId || canvasEl.canvasId === targetElement.canvasId
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
    this.canvasElements.add(newCanvasElement);

    // Trigger visual and sound effects
    const offset: number = 32;
    this.visualEffectService.playConfettiAtPosition(midX + offset, midY - offset);
    this.visualEffectService.playSuccess();

    // Emit events
    ElementEventService.onCanvasUpdated.emit(this.getCanvasElements());
    ElementEventService.onElementListRefreshed.emit();
    ElementEventService.onElementMerged.emit(newCanvasElement);

    this.isGenerating = false;
    this.setState('Completed');
    console.log('Merge successful:', newCanvasElement);
    return newCanvasElement;
  }

  mergeFailed(sourceElement: CanvasElement, targetElement: CanvasElement) {
    this.visualEffectService.playFailure();
    this.isGenerating = false;
    this.setState('Idle');

    sourceElement.isBeingMerged = false;
    sourceElement.isMarkedForMerge = false;

    targetElement.isBeingMerged = false;
    targetElement.isMarkedForMerge = false;
  }

  isValidJson(json: Element, elementA: Element, elementB: Element): boolean {
    if (!json || typeof json.name !== 'string' || typeof json.emoji !== 'string') {
        console.warn('Invalid JSON structure:', json);
        return false;
    }

    // Check for a valid emoji
    if (!this.isValidEmoji(json.emoji)) {
        console.warn('Invalid emoji:', json.emoji);
        return false;
    }

    // Check for concatenated names
    const invalidNames = [
        `${elementA.name}${elementB.name}`,
        `${elementA.name} ${elementB.name}`,
        `${elementA.name}+${elementB.name}`,
        `${elementB.name}${elementA.name}`,
        `${elementB.name} ${elementA.name}`,
        `${elementB.name}+${elementA.name}`,
    ];

    if (invalidNames.includes(json.name)) {
        console.warn('Invalid merged name:', json.name);
        return false;
    }

    // Check for emojis inside the name
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;
    if (emojiRegex.test(json.name)) {
        console.warn('Name contains emojis:', json.name);
        return false;
    }

    // Check if the name already exists in the elements list
    if (this.elements.toArray().some(element => element.name === json.name)) {
        console.warn('Duplicate element name detected:', json.name);
        return false;
    }

    // Check if the emoji is a combination of text and emoji
    const textAndEmojiRegex = /^[^\p{Emoji}]+[\p{Emoji}].*$/gu;
    if (textAndEmojiRegex.test(json.emoji)) {
        console.warn('Emoji contains text and emoji:', json.emoji);
        return false;
    }

    // Check if the emoji includes two or more words with emojis
    const multipleNamesInEmoji = /\b\w+\s+\p{Emoji}/gu;
    if (multipleNamesInEmoji.test(json.emoji)) {
        console.warn('Emoji contains multiple names with emojis:', json.emoji);
        return false;
    }

    return true;
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

  isValidEmoji(emoji: string): boolean {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;
    const matches = emoji.match(emojiRegex);
    return matches !== null && matches.length === 1;
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

  private generateMergeKey(elementA: Element, elementB: Element): string {
    const names = [elementA.name, elementB.name].sort(); // Alphabetical order
    return `${names[0]}+${names[1]}`;
  }
}
