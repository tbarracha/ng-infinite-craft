import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root',
})
export class VisualEffectsService {
  allowSFX: boolean = true;

  private confettiCanvas: HTMLCanvasElement | null = null;
  private audioPaths = {
    mergeSuccess: 'audio/infinitiy_craft_merge_sucess.ogg',
    mergeFailure: 'audio/infinitiy_craft_merge_failure.ogg',
  };

  constructor() {
    this.createConfettiCanvas();
  }

  private createConfettiCanvas() {
    this.confettiCanvas = document.createElement('canvas');
    this.confettiCanvas.id = 'confetti-canvas';
    this.confettiCanvas.style.position = 'fixed';
    this.confettiCanvas.style.top = '0';
    this.confettiCanvas.style.left = '0';
    this.confettiCanvas.style.width = '100vw';
    this.confettiCanvas.style.height = '100vh';
    this.confettiCanvas.style.pointerEvents = 'none';
    document.body.appendChild(this.confettiCanvas);
  }

  playConfetti() {
    try {
      if (!this.confettiCanvas) {
        console.warn('Confetti canvas not initialized.');
        return;
      }

      confetti.create(this.confettiCanvas, { resize: true })({
        particleCount: 150,
        spread: 180,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FF4500', '#008080', '#FFD700'],
      });

      console.log('Confetti animation played.');
    } catch (error) {
      console.error('Error playing confetti:', error);
    }
  }

  playConfettiAtPosition(x: number, y: number) {
    try {
      if (!this.confettiCanvas) {
        console.warn('Confetti canvas not initialized.');
        return;
      }

      const normalizedX = x / window.innerWidth;
      const normalizedY = y / window.innerHeight;

      confetti.create(this.confettiCanvas, { resize: true })({
        particleCount: 25,
        spread: 360,
        startVelocity: 10,
        origin: { x: normalizedX, y: normalizedY },
        colors: ['#FF4500', '#008080', '#FFD700'],
      });

      console.log(`Confetti burst at position (${x}, ${y}) with smaller size`);
    } catch (error) {
      console.error('Error playing confetti:', error);
    }
  }

  playAudio(audioPath: string) {
    if (!this.allowSFX) {
      return;
    }

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();

      // Randomize pitch between 0.95 and 1.15
      const pitch = Math.random() * (1.15 - 0.95) + 0.95;

      // Load audio file dynamically
      fetch(audioPath)
        .then((response) => response.arrayBuffer())
        .then((data) => audioContext.decodeAudioData(data))
        .then((buffer) => {
          source.buffer = buffer;
          source.playbackRate.value = pitch;
          source.connect(audioContext.destination);
          source.start(0);
        })
        .catch((error) => console.error('Error playing sound:', error));
    } catch (error) {
      console.error('Error with audio playback:', error);
    }
  }

  playSuccess() {
    this.playAudio(this.audioPaths.mergeSuccess);
  }

  playFailure() {
    this.playAudio(this.audioPaths.mergeFailure);
  }
}
