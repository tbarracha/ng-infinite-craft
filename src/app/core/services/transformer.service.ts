import { Injectable } from '@angular/core';
import { pipeline, TextStreamer } from '@huggingface/transformers';

@Injectable({
  providedIn: 'root',
})
export class TransformerService {
  private textGenerator: any;
  readonly modelIds = {
    qwen_25_coder_15b: 'onnx-community/Qwen2.5-Coder-1.5B-Instruct',  // best one yet (still creates some gibberish & needs cleaning)
    llama_32_1b: 'onnx-community/Llama-3.2-1B-Instruct',              // kinda works (creates some gibberish)
    smollm2_17b: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',               // doesn't work (creates a lot of gibberish)
    phi3_mini_4k: 'Xenova/Phi-3-mini-4k-instruct',                    // doesn't work (doesn't load)
    exaone_35_24b: 'onnx-community/EXAONE-3.5-2.4B-Instruct',         // doesn't work (doesn't load)
  };

  constructor() {}

  private printTitle(title: string): void {
    console.log(`\n${'-'.repeat(40)}\n> ${title}\n${'-'.repeat(40)}`);
  }

  private async checkWebGPUSupport(): Promise<boolean> {
    this.printTitle('CHECKING WEBGPU SUPPORT');
    try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
            console.log('WebGPU Support: SUPPORTED');
            console.log('Adapter Details:', adapter);
            return true;
        } else {
            console.warn('WebGPU Support: NOT SUPPORTED');
            return false;
        }
    } catch (error) {
        console.error('WebGPU Support Check: ERROR', error);
        return false;
    }
  }

  async loadModel(modelId: string = this.modelIds.qwen_25_coder_15b): Promise<void> {
    this.printTitle('LOADING MODEL');
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

  // returning lots of things here, but only using rawOutput and cleanOutput
  async generateChatCompletion(
    prompt: string,
    options: { max_new_tokens?: number; temperature?: number } = { max_new_tokens: 512, temperature: 0.7 }
  ): Promise<{ prompt: string; options: { max_new_tokens?: number; temperature?: number }, rawOutput: string; cleanOutput: string; }> {
    this.printTitle('GENERATING CHAT COMPLETION');
  
    if (!this.textGenerator) {
      throw new Error('Model is not loaded.');
    }
  
    try {
      const result = await this.textGenerator(prompt, options);
  
      if (!result || result.length === 0 || !result[0]?.generated_text) {
        throw new Error('Model did not return any output.');
      }
  
      const rawOutput = result[0]?.generated_text.trim();
      const cleanOutput = rawOutput.replace(prompt, '').trim();
  
      console.log('Model raw output:', rawOutput);
      console.log('Cleaned model output:', cleanOutput);
  
      return {
        prompt,
        options,
        rawOutput,
        cleanOutput,
      };
    } catch (error) {
      console.error('Error during text generation:', error);
      throw error;
    }
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
