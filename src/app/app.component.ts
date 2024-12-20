import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TransformerService } from './core/services/transformer.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Ng Infinite Craft';

  constructor(private transformerService: TransformerService) {}

  async ngOnInit() {
    console.log('AppComponent initialized');
    try {
      await this.transformerService.loadModel();
      console.log('Transformer model loaded successfully.');

      await this.transformerService.warmUpModel();
      console.log('Model warmed up successfully.');
    } catch (error) {
      console.error('Error initializing Transformer model:', error);
    }
  }
}
