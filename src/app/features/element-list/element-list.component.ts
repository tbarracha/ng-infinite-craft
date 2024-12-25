import { Component, OnInit } from '@angular/core';
import { ElementService } from '../element/element.service';
import { Element } from '../element/element';
import { ElementCardComponent } from "../element-card/element-card.component";

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
    this.elements = this.elementService.getAllElements();
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
  
    console.log('Selected elements:', Array.from(this.selectedElements));
  }

  confirmDeletion(): void {
    console.log('Selected elements for deletion:', Array.from(this.selectedElements));

    // Remove elements and get the updated list
    const updatedElements = this.elementService.removeElements([...this.selectedElements]);

    // Update the local elements list
    this.elements = updatedElements;
    console.log('Elements after deletion:', this.elements);

    // Reset delete mode
    this.isDeleteMode = false;
    this.selectedElements.clear();
  }
}
