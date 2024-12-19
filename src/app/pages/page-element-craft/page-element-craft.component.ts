import { Component } from '@angular/core';
import { ElementCanvasComponent } from "../../features/element-canvas/element-canvas.component";
import { ElementListComponent } from "../../features/element-list/element-list.component";

@Component({
  selector: 'app-page-element-craft',
  imports: [ElementCanvasComponent, ElementListComponent],
  templateUrl: './page-element-craft.component.html',
  styleUrl: './page-element-craft.component.scss'
})
export class PageElementCraftComponent {

}
