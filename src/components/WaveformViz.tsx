/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { VoiceState } from '../types';

interface WaveformVizProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  voiceState: VoiceState;
}

const WAVE_COLORS: Record<VoiceState, string> = {
  READY: '#22d3ee',
  WAITING_FOR_WAKE_WORD: '#22d3ee40',
  WAKE_DETECTED: '#fbbf24',
  LISTENING: '#22d3ee',
  PROCESSING: '#a78bfa',
  SPEAKING: '#34d399',
  IDLE: '#22d3ee20',
  ERROR: '#f87171',
};

const GLOW_COLORS: Record<VoiceState, string> = {
  READY: '#22d3ee30',
  WAITING_FOR_WAKE_WORD: 'transparent',
  WAKE_DETECTED: '#fbbf2440',
  LISTENING: '#22d3ee30',
  PROCESSING: '#a78bfa30',
  SPEAKING: '#34d39930',
  IDLE: 'transparent',
  ERROR: '#f8717130',
};

export const WaveformViz: React.FC<WaveformVizProps> = ({ analyserRef, voiceState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const voiceStateRef = useRef<VoiceState>(voiceState);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isRunning = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const currentState = voiceStateRef.current;
      const waveColor = WAVE_COLORS[currentState] || WAVE_COLORS.IDLE;
      const glowColor = GLOW_COLORS[currentState] || 'transparent';

      ctx.clearRect(0, 0, width, height);

      // If analyser is connected and streaming live mic data
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        const sliceWidth = width / bufferLength;

        // Draw glow layer for active states
        if (currentState !== 'IDLE' && currentState !== 'WAITING_FOR_WAKE_WORD' && glowColor !== 'transparent') {
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 10;
          ctx.lineJoin = 'round';
          ctx.beginPath();

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v - 1.0) * (height * 0.42) + height / 2;

            if (i === 0) {
              ctx.moveTo(0, y);
            } else {
              ctx.lineTo(i * sliceWidth, y);
            }
          }
          ctx.stroke();
        }

        // Draw sharp wave line
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = currentState === 'IDLE' || currentState === 'WAITING_FOR_WAKE_WORD' ? 1.2 : 2.0;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v - 1.0) * (height * 0.42) + height / 2;

          if (i === 0) {
            ctx.moveTo(0, y);
          } else {
            ctx.lineTo(i * sliceWidth, y);
          }
        }
        ctx.stroke();
      } else {
        // Fallback synthetic wave simulation
        phaseRef.current += currentState === 'SPEAKING' || currentState === 'LISTENING' ? 0.08 : 0.03;
        const phase = phaseRef.current;

        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const points = 160;
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * width;
          const amp =
            currentState === 'IDLE' || currentState === 'WAITING_FOR_WAKE_WORD'
              ? 3.5
              : currentState === 'WAKE_DETECTED'
              ? 16
              : currentState === 'PROCESSING'
              ? 12
              : 20;

          const y = height / 2 + Math.sin((i / points) * Math.PI * 6 + phase) * amp;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [analyserRef]);

  return <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: 'pixelated' }} />;
};
