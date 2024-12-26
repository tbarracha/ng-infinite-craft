import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root',
})
export class VisualEffectsService {
  private confettiCanvas: HTMLCanvasElement | null = null;
  private audio: HTMLAudioElement;

  constructor() {
    this.createConfettiCanvas();
    this.audio = new Audio('/merge-sound.mp3');
    this.audio.load();
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
  
      // Normalize coordinates to percentages for canvas-confetti
      const normalizedX = x / window.innerWidth;
      const normalizedY = y / window.innerHeight;
  
      confetti.create(this.confettiCanvas, { resize: true })({
        particleCount: 25, // Smaller particle count
        spread: 360, // Smaller spread for a tighter burst
        startVelocity: 10, // Faster particles
        origin: { x: normalizedX, y: normalizedY }, // Burst origin
        colors: ['#FF4500', '#008080', '#FFD700'], // Customize colors
      });
  
      console.log(`Confetti burst at position (${x}, ${y}) with smaller size`);
    } catch (error) {
      console.error('Error playing confetti:', error);
    }
  }

  playSound() {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();

      // Randomize pitch between 0.95 and 1.15
      const pitch = Math.random() * (1.15 - 0.95) + 0.95;

      // Load audio file
      fetch('/merge-sound.mp3')
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
          source.buffer = buffer;
          source.playbackRate.value = pitch;
          source.connect(audioContext.destination);
          source.start(0);
        })
        .catch(error => console.error('Error playing sound:', error));
    } catch (error) {
      console.error('Error with audio playback:', error);
    }
  }
}
