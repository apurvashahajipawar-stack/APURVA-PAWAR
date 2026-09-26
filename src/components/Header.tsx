/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VoiceState, ProcessingLocation, NoiseStatus } from '../types';
import { StatusDot } from './Common';
import { Volume2, VolumeX, Mic, MicOff, Square } from 'lucide-react';

interface HeaderProps {
  voiceState: VoiceState;
  isMicActive: boolean;
  noiseStatus: NoiseStatus;
  processingLocation: ProcessingLocation | null;
  wakeCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onStop: () => void;
  onRestart: () => void;
  onStartListening?: () => void;
  onStopAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  voiceState,
  isMicActive,
  noiseStatus,
  processingLocation,
  wakeCount,
  isMuted,
  onToggleMute,
  onStop,
  onRestart,
  onStartListening,
  onStopAction,
}) => {
  const isListening = voiceState === 'LISTENING' || voiceState === 'WAKE_DETECTED';
  const isProcessingOrSpeaking = voiceState === 'PROCESSING' || voiceState === 'SPEAKING';
  const canStop = voiceState === 'LISTENING' || voiceState === 'PROCESSING' || voiceState === 'SPEAKING';

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-cyan-400/40 bg-cyan-400/10">
            <span className="text-lg">🎙️</span>
            {isListening && (
              <div className="absolute inset-0 rounded-lg border border-cyan-400/40 pulse-ring" />
            )}
          </div>
          <div>
            <h1 className="font-mono font-bold text-white text-lg leading-none">
              Echo<span className="text-cyan-400">Edge</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono leading-none mt-1">
              SIH · Edge Voice AI Prototype
            </p>
          </div>
        </div>

        {/* Live Indicators & Fast Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Hardware & Pipeline Status Dots */}
          <div className="flex items-center gap-1.5 bg-[var(--surface2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            <StatusDot active={isMicActive} color="bg-emerald-400" />
            <span className="text-[11px] font-mono text-slate-400 font-medium">MIC</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--surface2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            <StatusDot active={isListening} color="bg-cyan-400" />
            <span className="text-[11px] font-mono text-slate-400 font-medium">LISTEN</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--surface2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            <StatusDot active={isProcessingOrSpeaking} color="bg-violet-400" />
            <span className="text-[11px] font-mono text-slate-400 font-medium">AI</span>
          </div>

          {/* Noise Level Badge */}
          <div
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
              noiseStatus === 'QUIET'
                ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10'
                : noiseStatus === 'NORMAL'
                ? 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10'
                : 'border-red-400/40 text-red-400 bg-red-400/10'
            }`}
          >
            {noiseStatus}
          </div>

          {/* Routing location badge */}
          {processingLocation && (
            <div
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                processingLocation === 'LOCAL'
                  ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10'
                  : 'border-violet-400/40 text-violet-400 bg-violet-400/10'
              }`}
            >
              [{processingLocation}]
            </div>
          )}

          {/* Wake Count */}
          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            <span className="text-cyan-400 font-bold">{wakeCount}</span> detections
          </div>

          {/* Dedicated STOP & LISTEN Fast Header Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-[var(--border)]">
            {onStartListening && (
              <button
                onClick={onStartListening}
                disabled={isListening}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isListening
                    ? 'bg-cyan-400/30 text-cyan-300 border border-cyan-400/70'
                    : 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40 hover:bg-cyan-400/25'
                }`}
                title="Start listening immediately"
              >
                <Mic size={12} className={isListening ? 'animate-pulse' : ''} />
                <span className="hidden md:inline">Listen</span>
              </button>
            )}

            {canStop && onStopAction && (
              <button
                onClick={onStopAction}
                className="px-2 py-1 rounded-lg bg-red-400/20 text-red-400 border border-red-400/50 hover:bg-red-400/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="Stop current speech, query, or listening"
              >
                <Square size={10} className="fill-current" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'border-red-400/40 text-red-400 bg-red-400/10 hover:bg-red-400/20'
                  : 'border-[var(--border)] text-slate-400 hover:text-slate-200 hover:bg-[var(--surface2)]'
              }`}
              title={isMuted ? 'Unmute Text-to-Speech' : 'Mute Text-to-Speech'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {voiceState === 'IDLE' ? (
              <button
                onClick={onRestart}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-400/50 bg-cyan-400/10 text-cyan-400 text-xs font-mono font-semibold hover:bg-cyan-400/20 transition-all cursor-pointer"
              >
                <Mic size={12} />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex items-center gap-1 p-1.5 rounded-lg border border-[var(--border)] text-slate-400 hover:text-red-400 hover:bg-[var(--surface2)] transition-all cursor-pointer"
                title="Pause voice assistant"
              >
                <MicOff size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
