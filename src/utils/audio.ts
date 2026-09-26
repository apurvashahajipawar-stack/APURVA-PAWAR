/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API chime to indicate wake word recognition (<20ms instant feedback)
let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

export function playWakeChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.14); // E6

    gainNode.gain.setValueAtTime(0.09, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.04);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  } catch (err) {
    console.debug('Chime error:', err);
  }
}
