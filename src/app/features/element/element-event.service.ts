import { EventEmitter, Injectable } from '@angular/core';
import { CanvasElement, Element } from './element';

@Injectable({
  providedIn: 'root',
})
export class ElementEventService {
  public static readonly onElementClicked = new EventEmitter<Element>();
  public static readonly onElementDropped = new EventEmitter<{ element: Element; x: number; y: number }>();
  
  public static readonly onElementDragged = new EventEmitter<CanvasElement>();
  public static readonly onElementDroppedOn = new EventEmitter<{ sourceElement: CanvasElement; targetElement: CanvasElement }>();
  public static readonly onCanvasUpdated = new EventEmitter<CanvasElement[]>();

  public static readonly onElementListRefreshed = new EventEmitter<void>();

  constructor() {}
}
