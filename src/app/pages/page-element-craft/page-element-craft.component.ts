import { Component } from '@angular/core';
import { ElementCanvasComponent } from '../../features/element-canvas/element-canvas.component';
import { ElementListComponent } from '../../features/element-list/element-list.component';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-page-element-craft',
  imports: [ElementCanvasComponent, ElementListComponent],
  templateUrl: './page-element-craft.component.html',
  styleUrls: ['./page-element-craft.component.scss'],
})
export class PageElementCraftComponent {
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private eventService: EventService) {
    eventService.onLoadingStateChange.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

    eventService.onError.subscribe((message) => {
      this.errorMessage = message;
    });
  }
}
