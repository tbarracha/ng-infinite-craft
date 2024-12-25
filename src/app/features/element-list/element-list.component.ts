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
  }

  confirmDeletion(): void {
    this.elementService.removeElements([...this.selectedElements]);
    this.elements = this.elementService.getAllElements();
    this.isDeleteMode = false;
    this.selectedElements.clear();
  }
}
