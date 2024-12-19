import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CanvasElement } from '../element/element';

@Component({
  selector: 'app-element-canvas-card',
  templateUrl: './element-canvas-card.component.html',
  styleUrls: ['./element-canvas-card.component.scss'],
})
export class ElementCanvasCardComponent {
  @Input() canvasElement!: CanvasElement;
  @Output() dragStarted = new EventEmitter<{ canvasId: string; offsetX: number; offsetY: number }>();

  private offsetX: number = 0;
  private offsetY: number = 0;

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      this.offsetX = event.clientX - rect.left;
      this.offsetY = event.clientY - rect.top;

      event.dataTransfer.setData('canvasId', this.canvasElement.canvasId);
      event.dataTransfer.setData('offsetX', this.offsetX.toString());
      event.dataTransfer.setData('offsetY', this.offsetY.toString());

      this.dragStarted.emit({
        canvasId: this.canvasElement.canvasId,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
      });
    }
  }
}
