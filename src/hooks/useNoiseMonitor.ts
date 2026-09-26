/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { NoiseStatus } from '../types';
import { getAudioContext } from '../utils/audio';

export interface NoiseMonitorState {
  noiseLevel: number;
  noiseStatus: NoiseStatus;
  isInitialized: boolean;
  error: string | null;
}

export function useNoiseMonitor() {
  const [state, setState] = useState<NoiseMonitorState>({
    noiseLevel: 0,
    noiseStatus: 'QUIET',
    isInitialized: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const measureNoise = useCallback(() => {
    if (!analyserRef.current || !isActiveRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = dataArray[i] / 128 - 1;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / bufferLength);
    const level = Math.min(100, Math.round(rms * 350));
    const status: NoiseStatus = level < 14 ? 'QUIET' : level < 44 ? 'NORMAL' : 'NOISY';

    setState((prev) => ({
      ...prev,
      noiseLevel: level,
      noiseStatus: status,
    }));

    animFrameRef.current = requestAnimationFrame(measureNoise);
  }, []);

  const initialize = useCallback(async () => {
    if (state.isInitialized && streamRef.current) {
      return streamRef.current;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioCtx = getAudioContext() || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      isActiveRef.current = true;
      setState({
        noiseLevel: 0,
        noiseStatus: 'QUIET',
        isInitialized: true,
        error: null,
      });

      measureNoise();
      return stream;
    } catch (err: any) {
      console.error('Microphone initialization error:', err);
      let errorMsg = 'Microphone access denied. Please grant microphone permission in your browser.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device was detected on your system.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser.';
      }
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isInitialized: false,
      }));
      throw err;
    }
  }, [state.isInitialized, measureNoise]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isInitialized: false,
      noiseLevel: 0,
    }));
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    stop,
    analyserRef,
    streamRef,
  };
}
