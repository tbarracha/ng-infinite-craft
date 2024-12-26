import { Component, OnInit } from '@angular/core';
import { ElementService } from '../element/element.service';
import { Element } from '../element/element';
import { ElementCardComponent } from "../element-card/element-card.component";
import { ElementEventService } from '../element/element-event.service';

@Component({
  selector: 'app-element-list',
  templateUrl: './element-list.component.html',
  styleUrls: ['./element-list.component.scss'],
  imports: [ElementCardComponent],
})
export class ElementListComponent implements OnInit {
  elements: Element[] = [];
  isDeleteMode: boolean = false;
  selectedElements: Set<string> = new Set();
  showCancelOnHover: boolean = false;

  constructor(private elementService: ElementService) {}

  ngOnInit(): void {
    // Initialize the element list from the service
    this.loadElements();

    // Subscribe to element list refresh events
    ElementEventService.onElementListRefreshed.subscribe(() => {
      this.loadElements();
    });
  }

  private loadElements(): void {
    this.elements = this.elementService.getAllElements();
    console.log('Elements loaded:', this.elements);
  }

  toggleDeleteMode(): void {
    this.isDeleteMode = !this.isDeleteMode;
    if (!this.isDeleteMode) {
      this.selectedElements.clear();
    }
  }

  toggleSelection(elementId: string): void {
    if (this.selectedElements.has(elementId)) {
      this.selectedElements.delete(elementId);
    } else {
      this.selectedElements.add(elementId);
    }
  }

  async confirmDeletion(): Promise<void> {
    if (this.selectedElements.size === 0) {
      console.warn('No elements selected for deletion.');
      return;
    }

    try {
      console.log('Deleting selected elements:', this.selectedElements);

      // Use the service method to remove elements asynchronously
      this.elements = await this.elementService.removeElements([...this.selectedElements]);

      console.log('Selected elements deleted. Updated elements:', this.elements);

      // Reset delete mode
      this.isDeleteMode = false;
      this.selectedElements.clear();
    } catch (error) {
      console.error('Error deleting selected elements:', error);
    }
  }

  async deleteAll(): Promise<void> {
    try {
      // Call the service method to clear all elements asynchronously
      this.elements = await this.elementService.removeAllElements();

      console.log('All elements deleted. Updated elements:', this.elements);

      // Reset delete mode
      this.isDeleteMode = false;
      this.selectedElements.clear();
    } catch (error) {
      console.error('Error deleting all elements:', error);
    }
  }
}
