import { Component, Input, Renderer2, ElementRef } from '@angular/core';
import { Element } from '../element/element';
import { ElementEventService } from '../element/element-event.service';

@Component({
  selector: 'app-element-card',
  templateUrl: './element-card.component.html',
  styleUrls: ['./element-card.component.scss'],
})
export class ElementCardComponent {
  @Input() element!: Element;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  onClick() {
    ElementEventService.onElementClicked.emit(this.element);
  }

  onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(this.element));
      const rect = this.el.nativeElement.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      event.dataTransfer.setData('offsetX', offsetX.toString());
      event.dataTransfer.setData('offsetY', offsetY.toString());
    }
  }

  onDragEnd() {
    this.renderer.removeStyle(this.el.nativeElement, 'position');
    this.renderer.removeStyle(this.el.nativeElement, 'top');
    this.renderer.removeStyle(this.el.nativeElement, 'left');
  }
}
