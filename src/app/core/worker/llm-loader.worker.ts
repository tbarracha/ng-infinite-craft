/// <reference lib="webworker" />
import { pipeline } from '@huggingface/transformers';

let textGenerator: any = null;

addEventListener('message', async (event: MessageEvent) => {
  const { action, modelId, prompt, options } = event.data;

  try {
    if (action === 'loadModel') {
      // Load the model
      textGenerator = await pipeline('text-generation', modelId, {
        device: 'webgpu',
        dtype: 'q4f16',
      });
      postMessage({ success: true });
    } else if (action === 'generate' && textGenerator) {
      // Generate text using the loaded model
      const result = await textGenerator(prompt, options);
      postMessage({ success: true, result });
    } else {
      postMessage({ success: false, error: 'Invalid action or model not loaded.' });
    }
  } catch (error) {
    postMessage({ success: false, error: (error as Error).message });
  }
});
