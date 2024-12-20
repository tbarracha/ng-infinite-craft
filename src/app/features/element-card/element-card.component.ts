import { Component, Input, Renderer2, ElementRef, HostListener } from '@angular/core';
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

  @HostListener('dragstart', ['$event'])
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

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent) {
    const offsetX = parseFloat(event.dataTransfer?.getData('offsetX') || '0');
    const offsetY = parseFloat(event.dataTransfer?.getData('offsetY') || '0');

    if (event.clientX && event.clientY) {
      ElementEventService.onElementDropped.emit({
        element: this.element,
        x: event.clientX - offsetX,
        y: event.clientY - offsetY,
      });
    }
  }
}
