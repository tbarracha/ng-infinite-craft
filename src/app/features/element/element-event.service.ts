import { EventEmitter, Injectable } from '@angular/core';
import { Element } from './element';

@Injectable({
  providedIn: 'root',
})
export class ElementEventService {
  public static readonly onElementClicked = new EventEmitter<Element>();
  public static readonly onElementDragged = new EventEmitter<Element>();
  public static readonly onElementDropped = new EventEmitter<{ element: Element; x: number; y: number }>();

  public static readonly onElementMerged = new EventEmitter<{ elementA: Element; elementB: Element }>();

  constructor() {}
}
