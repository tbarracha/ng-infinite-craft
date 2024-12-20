import { Injectable } from '@angular/core';
import { pipeline } from '@huggingface/transformers';

@Injectable({
  providedIn: 'root',
})
export class TransformerService {
  private textGenerator: any;
  readonly default_model_id: string = 'HuggingFaceTB/SmolLM2-1.7B-Instruct';

  constructor() {}

  private async checkWebGPUSupport(): Promise<boolean> {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch (error) {
      console.error('WebGPU is not supported:', error);
      return false;
    }
  }

  async loadModel(modelId: string = this.default_model_id): Promise<void> {
    const webGPUSupported = await this.checkWebGPUSupport();
    if (!webGPUSupported) {
      console.error('WebGPU is not supported on this device.');
      throw new Error('WebGPU not supported.');
    }

    try {
      console.log(`Loading model: ${modelId} with WebGPU...`);
      this.textGenerator = await pipeline('text-generation', modelId, {
        device: 'webgpu',
        dtype: 'q4f16',
      });
      console.log(`Model ${modelId} loaded successfully using WebGPU.`);
    } catch (error) {
      console.error('Failed to load model with WebGPU:', error);
      throw error;
    }
  }

  async generateChatCompletion(
    prompt: string,
    options: { max_new_tokens?: number; temperature?: number } = { max_new_tokens: 512, temperature: 0.7 }
  ): Promise<string> {
    if (!this.textGenerator) {
      throw new Error('Model is not loaded.');
    }

    console.log(`Generating completion for prompt: "${prompt}"`);
    try {
      const result = await this.textGenerator(prompt, options);

      if (result.length === 0 || !result[0]?.generated_text) {
        console.error('Generated result is empty or invalid:', result);
        throw new Error('Model did not return any output.');
      }

      console.log('Generated result:', result);
      const generatedText = result[0].generated_text.trim();
      console.log('Generated text:', generatedText);
      return generatedText;
    } catch (error) {
      console.error('Error during text generation:', error);
      throw error;
    }
  }

  async warmUpModel(): Promise<void> {
    try {
      const warmUpPrompt = 'Warm-up prompt to initialize the model.';
      console.log(`Warming up model with prompt: "${warmUpPrompt}"`);
      await this.generateChatCompletion(warmUpPrompt, { max_new_tokens: 1 });
      console.log('Model warm-up completed.');
    } catch (error) {
      console.error('Failed during model warm-up:', error);
    }
  }
}
