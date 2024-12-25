import { Injectable } from '@angular/core';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root',
})
export class TransformerService {
  private worker: Worker | null = null;

  readonly modelIds = {
    qwen_25_coder_15b: 'onnx-community/Qwen2.5-Coder-1.5B-Instruct',  // best one yet (still creates some gibberish & needs cleaning)
    llama_32_1b: 'onnx-community/Llama-3.2-1B-Instruct',              // kinda works (creates some gibberish)
    smollm2_17b: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',               // doesn't work (creates a lot of gibberish)
    phi3_mini_4k: 'Xenova/Phi-3-mini-4k-instruct',                    // doesn't work (doesn't load)
    exaone_35_24b: 'onnx-community/EXAONE-3.5-2.4B-Instruct',         // doesn't work (doesn't load)
  };

  constructor(private eventService: EventService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../worker/llm-loader.worker', import.meta.url));
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
  }

  private printTitle(title: string): void {
    console.log(`\n${'-'.repeat(40)}\n> ${title}\n${'-'.repeat(40)}`);
  }

  loadModel(modelId: string = this.modelIds.qwen_25_coder_15b): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        const error = 'Web Worker is not initialized.';
        this.eventService.onError.emit(error);
        reject(error);
        return;
      }

      this.eventService.onLoadingStateChange.emit(true); // Emit loading start

      this.worker.onmessage = (event: MessageEvent) => {
        const { success, error } = event.data;

        if (success) {
          console.log(`Model ${modelId} loaded successfully.`);
          this.eventService.onLoadingStateChange.emit(false); // Emit loading end
          resolve();
        } else {
          console.error('Failed to load the model:', error);
          this.eventService.onError.emit(error); // Emit error
          this.eventService.onLoadingStateChange.emit(false); // Emit loading end
          reject(error);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Web Worker encountered an error:', error);
        const errorMessage = error.message || 'Unknown error occurred in Web Worker.';
        this.eventService.onError.emit(errorMessage); // Emit error
        this.eventService.onLoadingStateChange.emit(false); // Emit loading end
        reject(errorMessage);
      };

      this.worker.postMessage({ action: 'loadModel', modelId });
    });
  }

  generateChatCompletion(
    prompt: string,
    options: { max_new_tokens?: number; temperature?: number } = { max_new_tokens: 512, temperature: 0.7 }
  ): Promise<{ prompt: string; options: { max_new_tokens?: number; temperature?: number }; rawOutput: string; cleanOutput: string }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject('Web Worker is not initialized.');
        return;
      }

      this.printTitle('GENERATING CHAT COMPLETION');

      this.worker.onmessage = (event: MessageEvent) => {
        const { success, result, error } = event.data;

        if (success) {
          const rawOutput = result[0]?.generated_text.trim();
          const cleanOutput = rawOutput.replace(prompt, '').trim();

          console.log('Model raw output:', rawOutput);
          console.log('Cleaned model output:', cleanOutput);

          resolve({
            prompt,
            options,
            rawOutput,
            cleanOutput,
          });
        } else {
          console.error('Failed to generate chat completion:', error);
          reject(error);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Web Worker encountered an error:', error);
        reject(error.message);
      };

      this.worker.postMessage({ action: 'generate', prompt, options });
    });
  }

  async warmUpModel(): Promise<void> {
    this.printTitle('WARMING UP MODEL');
    try {
      const warmUpPrompt = 'Warm-up test input.';
      console.log(`Warming up model with prompt: "${warmUpPrompt}"`);
      await this.generateChatCompletion(warmUpPrompt, { max_new_tokens: 1 });
      console.log('Model warm-up completed.');
    } catch (error) {
      console.error('Failed during model warm-up:', error);
    }
  }
}
