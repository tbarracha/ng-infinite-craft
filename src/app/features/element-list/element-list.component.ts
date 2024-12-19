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

  constructor(private elementService: ElementService) {}

  ngOnInit(): void {
    this.elements = this.elementService.getAllElements();
  }
}
