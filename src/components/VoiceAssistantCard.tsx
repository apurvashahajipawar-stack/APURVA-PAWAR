/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  VoiceState,
  ProcessingLocation,
  STATE_LABELS,
  STATE_COLORS,
  STATE_BG_COLORS,
} from '../types';
import { Card, SectionHeader } from './Common';
import { Volume2, Square, Send, CornerDownLeft, Sparkles, Mic, Zap, RefreshCw, Radio } from 'lucide-react';

interface VoiceAssistantCardProps {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  response: string;
  processingLocation: ProcessingLocation | null;
  error: string | null;
  lastHeard?: string;
  isMicListening?: boolean;
  isRecordingDirect?: boolean;
  noiseLevel?: number;
  engineMode?: 'WEB_SPEECH' | 'DIRECT_AUDIO';
  onManualQuery: (query: string) => void;
  onSpeakAgain: () => void;
  onStopSpeaking: () => void;
  onStartListening?: () => void;
  onStopAction?: () => void;
  onStopAndListen?: () => void;
  onTriggerWake?: () => void;
  onDirectRecord?: () => void;
  onRetryMic?: () => void;
  isMuted: boolean;
}

const PIPELINE_STAGES: Array<{ id: VoiceState; label: string; number: number }> = [
  { id: 'WAITING_FOR_WAKE_WORD', label: 'Waiting for wake word', number: 1 },
  { id: 'WAKE_DETECTED', label: 'Wake word detected', number: 2 },
  { id: 'LISTENING', label: 'Listening…', number: 3 },
  { id: 'PROCESSING', label: 'Processing…', number: 4 },
  { id: 'SPEAKING', label: 'Speaking…', number: 5 },
];

export const VoiceAssistantCard: React.FC<VoiceAssistantCardProps> = ({
  voiceState,
  transcript,
  interimTranscript,
  response,
  processingLocation,
  error,
  lastHeard = '',
  isMicListening = false,
  isRecordingDirect = false,
  noiseLevel = 0,
  engineMode = 'WEB_SPEECH',
  onManualQuery,
  onSpeakAgain,
  onStopSpeaking,
  onStartListening,
  onStopAction,
  onStopAndListen,
  onTriggerWake,
  onDirectRecord,
  onRetryMic,
  isMuted,
}) => {
  const [typedInput, setTypedInput] = useState('');

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    onManualQuery(typedInput.trim());
    setTypedInput('');
  };

  const currentStateLabel = STATE_LABELS[voiceState] || 'Ready';
  const currentStateColor = STATE_COLORS[voiceState] || 'text-slate-400';
  const currentStateBg = STATE_BG_COLORS[voiceState] || 'bg-slate-700';

  const activeStageIdx =
    voiceState === 'READY' || voiceState === 'WAITING_FOR_WAKE_WORD' || voiceState === 'IDLE'
      ? 0
      : voiceState === 'WAKE_DETECTED'
      ? 1
      : voiceState === 'LISTENING'
      ? 2
      : voiceState === 'PROCESSING'
      ? 3
      : voiceState === 'SPEAKING'
      ? 4
      : 0;

  const isSpeaking = voiceState === 'SPEAKING';
  const isListening = voiceState === 'LISTENING';
  const isProcessing = voiceState === 'PROCESSING';
  const isWaiting = voiceState === 'WAITING_FOR_WAKE_WORD' || voiceState === 'READY' || voiceState === 'IDLE';

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <SectionHeader>Voice Assistant Engine</SectionHeader>
        {/* Live Audio Level VU Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--surface2)] border border-[var(--border)] text-[10px] font-mono">
          <Radio size={11} className={noiseLevel > 15 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
          <span className="text-slate-400">Mic Signal:</span>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                noiseLevel > 40 ? 'bg-red-400' : noiseLevel > 15 ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, noiseLevel * 2)}%` }}
            />
          </div>
          <span className="text-emerald-400 font-bold">{noiseLevel}%</span>
        </div>
      </div>

      {/* 5-Stage Interactive Progress Bar */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)] overflow-x-auto">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCurrent = activeStageIdx === idx;
          const isPast = activeStageIdx > idx;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[70px]">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${
                    isCurrent
                      ? `${currentStateBg} text-slate-900 shadow-md scale-110 ring-2 ring-cyan-400/40`
                      : isPast
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isPast ? '✓' : stage.number}
                </div>
                <span
                  className={`text-[9px] font-mono text-center leading-tight transition-colors duration-200 ${
                    isCurrent ? currentStateColor : isPast ? 'text-cyan-400/80' : 'text-slate-600'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-3 sm:w-6 flex-shrink-0 transition-colors duration-300 ${
                    activeStageIdx > idx ? 'bg-cyan-400/80' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* DEDICATED SITUATION BANNERS */}
      {isListening && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-cyan-400/60 bg-cyan-500/10 mb-4 shadow-sm shadow-cyan-500/10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 pulse-ring" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
            </span>
            <div>
              <span className="text-cyan-300 font-mono text-xs font-bold block sm:inline">
                🎙️ Listening:
              </span>{' '}
              <span className="text-slate-300 font-mono text-xs">
                Speak now · Auto-stops when you stop talking (or say &quot;Stop listening&quot;)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {onStopAction && (
              <button
                onClick={onStopAction}
                className="px-3 py-1.5 rounded-lg bg-red-400/20 text-red-400 border border-red-400/60 hover:bg-red-400/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Stop listening"
              >
                <Square size={11} className="fill-current" />
                <span>Stop Listening</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-emerald-400/60 bg-emerald-500/10 mb-4 shadow-sm shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pulse-ring" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <div>
              <span className="text-emerald-300 font-mono text-xs font-bold block sm:inline">
                🔊 Speaking situation active:
              </span>{' '}
              <span className="text-slate-300 font-mono text-xs">
                Reading answer aloud (say &quot;Stop&quot; or &quot;Listen&quot; to interrupt)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {onStopAndListen && (
              <button
                onClick={onStopAndListen}
                className="px-3 py-1.5 rounded-lg bg-cyan-400/20 text-cyan-400 border border-cyan-400/60 hover:bg-cyan-400/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Interrupt speech and start listening for a new question"
              >
                <Mic size={12} />
                <span>Stop &amp; Listen</span>
              </button>
            )}
            {onStopAction && (
              <button
                onClick={onStopAction}
                className="px-3 py-1.5 rounded-lg bg-red-400/20 text-red-400 border border-red-400/60 hover:bg-red-400/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Stop speaking"
              >
                <Square size={11} className="fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-violet-400/60 bg-violet-500/10 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 pulse-ring" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-400" />
            </span>
            <div>
              <span className="text-violet-300 font-mono text-xs font-bold">
                ⚡ Processing Query with Gemini AI...
              </span>
            </div>
          </div>
          {onStopAction && (
            <button
              onClick={onStopAction}
              className="px-3 py-1.5 rounded-lg bg-red-400/20 text-red-400 border border-red-400/60 hover:bg-red-400/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all self-end sm:self-center"
              title="Cancel processing"
            >
              <Square size={11} className="fill-current" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* TACTILE MIC ACTIVATOR & VOICE COMMAND SHORTCUTS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 p-3 rounded-lg border border-cyan-400/40 bg-[var(--surface2)] shadow-sm">
        {/* Big Glow Tap-To-Speak Mic Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={isListening ? onStopAction : (onDirectRecord || onStartListening)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-md ${
              isListening
                ? 'bg-red-500 text-white ring-4 ring-red-400/40 scale-105 animate-pulse'
                : 'bg-cyan-400 text-slate-900 ring-4 ring-cyan-400/30 hover:scale-105 active:scale-95'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to talk directly'}
          >
            {isListening ? <Square size={18} className="fill-current" /> : <Mic size={22} />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-mono font-bold">
                {isListening ? '🎙️ Listening to your voice...' : 'Say "Listen" or "Hey Echo" to talk'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                Auto-Stop on Silence
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Say <strong className="text-cyan-400">&quot;Listen&quot;</strong> to start · Automatically stops when you finish speaking
            </div>
          </div>
        </div>

        {/* Action Controls for Stop & Listen */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center flex-wrap">
          {/* Quick "Listen" action button */}
          {onStartListening && (
            <button
              onClick={onStartListening}
              disabled={isListening}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isListening
                  ? 'bg-cyan-400/40 text-cyan-200 border border-cyan-400 cursor-default ring-2 ring-cyan-400/40'
                  : 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/30 active:scale-95 shadow-sm'
              }`}
              title="Click to start listening immediately"
            >
              <Mic size={13} className={isListening ? 'animate-pulse' : ''} />
              <span>{isListening ? 'Listening…' : 'Listen Now'}</span>
            </button>
          )}

          {/* Quick "Stop" action button */}
          {onStopAction && (
            <button
              onClick={onStopAction}
              disabled={isWaiting}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                isWaiting
                  ? 'border border-[var(--border)] text-slate-600 bg-slate-800/40 cursor-not-allowed opacity-50'
                  : 'bg-red-400/20 text-red-400 border border-red-400/50 hover:bg-red-400/30 active:scale-95 cursor-pointer shadow-sm'
              }`}
              title="Stop listening, speaking, or processing"
            >
              <Square size={11} className={!isWaiting ? 'fill-current' : ''} />
              <span>Stop</span>
            </button>
          )}

          {/* Tap-To-Wake shortcut */}
          {onTriggerWake && (
            <button
              onClick={onTriggerWake}
              disabled={isProcessing || isSpeaking}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-violet-400/15 text-violet-300 border border-violet-400/40 hover:bg-violet-400/25 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              title="Simulate hardware wake word"
            >
              <Zap size={11} className="text-violet-400" />
              <span>Wake</span>
            </button>
          )}

          {/* Current State Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div
              className={`h-2 w-2 rounded-full ${currentStateBg} ${
                voiceState !== 'IDLE' ? 'pulse-ring' : ''
              }`}
            />
            <span className={`text-[11px] font-mono font-semibold ${currentStateColor}`}>
              {currentStateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Live Mic Activity & Audio Feedback Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-4 rounded-md bg-[var(--surface)]/80 border border-[var(--border)] text-[10px] font-mono">
        <div className="flex items-center gap-2 text-slate-400 truncate">
          <Mic
            size={12}
            className={isMicListening || isRecordingDirect ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}
          />
          <span className="text-slate-500 font-semibold">Microphone Status:</span>
          {lastHeard ? (
            <span className="text-cyan-300 italic truncate">&quot;{lastHeard}&quot;</span>
          ) : (
            <span className="text-slate-600">Awaiting audio input (&quot;Hey Echo&quot;, &quot;Listen&quot;, &quot;Stop&quot;)...</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-slate-500">Live RMS: {noiseLevel}%</span>
          <span className={`h-1.5 w-1.5 rounded-full ${noiseLevel > 15 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className={noiseLevel > 15 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
            {noiseLevel > 15 ? 'Receiving Voice' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Recognized Speech and AI Response Two-Column Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Box 1: Speech Recognition */}
        <div
          className={`p-3.5 rounded-lg border bg-[var(--surface)] min-h-[110px] flex flex-col justify-between transition-all duration-300 ${
            isListening
              ? 'border-cyan-400/70 ring-1 ring-cyan-400/40 shadow-sm shadow-cyan-500/10'
              : 'border-[var(--border)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : 'bg-cyan-400'}`} />
                Recognized Speech
              </span>
              {isListening && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-cyan-400 animate-pulse font-semibold">
                    Listening live...
                  </span>
                  {onStopAction && (
                    <button
                      onClick={onStopAction}
                      className="text-[9px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {interimTranscript ? (
              <p className="text-slate-200 text-sm italic font-sans leading-snug">
                &ldquo;{interimTranscript}&hellip;&rdquo;
              </p>
            ) : transcript ? (
              <p className="text-slate-100 text-sm font-sans leading-snug fade-in">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : isListening ? (
              <p className="text-cyan-400/80 text-xs font-mono pt-1 animate-pulse">
                🎙️ Listening... speak your complete question now
              </p>
            ) : (
              <p className="text-slate-600 text-xs font-mono pt-1">
                Say &quot;Hey Echo&quot; or click &quot;Click to Speak&quot; above...
              </p>
            )}
          </div>

          <div className="pt-2 text-[10px] font-mono text-slate-600 flex justify-between">
            <span>Speech Input Engine</span>
            <span>{isListening ? 'State: LISTENING' : 'State: Awaiting Wake'}</span>
          </div>
        </div>

        {/* Box 2: AI Response */}
        <div
          className={`p-3.5 rounded-lg border bg-[var(--surface)] min-h-[110px] flex flex-col justify-between transition-all duration-300 ${
            isSpeaking
              ? 'border-emerald-400/70 ring-1 ring-emerald-400/40 shadow-sm shadow-emerald-500/10'
              : isProcessing
              ? 'border-violet-400/70 ring-1 ring-violet-400/40'
              : 'border-[var(--border)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-400" />
                  AI Response
                </span>
                {processingLocation && (
                  <span
                    className={`text-[9px] font-mono px-1 rounded font-semibold ${
                      processingLocation === 'LOCAL'
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-violet-400 bg-violet-400/10'
                    }`}
                  >
                    [{processingLocation}]
                  </span>
                )}
              </div>

              {/* TTS Playback Controls */}
              {response && (
                <div className="flex items-center gap-1.5">
                  {isSpeaking ? (
                    <>
                      {onStopAndListen && (
                        <button
                          onClick={onStopAndListen}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors cursor-pointer"
                          title="Stop speech and listen"
                        >
                          <Mic size={10} />
                          <span>Listen</span>
                        </button>
                      )}
                      <button
                        onClick={onStopSpeaking}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors cursor-pointer font-bold"
                        title="Stop speaking"
                      >
                        <Square size={9} className="fill-current" />
                        <span>Stop</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onSpeakAgain}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors cursor-pointer"
                      title="Speak answer aloud"
                    >
                      <Volume2 size={10} />
                      <span>Speak</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isProcessing ? (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400"
                      style={{
                        animation: `pulse-ring 1.1s ease-in-out ${i * 0.22}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-violet-400 text-xs font-mono font-medium">
                  Querying Gemini AI...
                </span>
              </div>
            ) : response ? (
              <p className="text-slate-100 text-sm leading-snug fade-in">
                {response}
              </p>
            ) : (
              <p className="text-slate-600 text-xs font-mono pt-1">
                AI answer will appear and be spoken aloud here...
              </p>
            )}
          </div>

          <div className="pt-2 text-[10px] font-mono text-slate-600 flex justify-between">
            <span className="flex items-center gap-1 text-violet-400/90 font-semibold">
              <Sparkles size={11} className="text-violet-400" /> Cloud Intelligence: Gemini Flash
            </span>
            <span className={isSpeaking ? 'text-emerald-400 font-semibold' : ''}>
              {isSpeaking ? '🔊 Speaking Aloud' : isMuted ? 'TTS Muted' : 'Spoken Aloud'}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Intelligence Prompt Explorer */}
      <div className="mb-3.5 p-2 rounded-lg bg-[var(--surface2)] border border-violet-400/30">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-violet-300 font-bold">
            <Sparkles size={11} className="text-violet-400" />
            <span>Ask Cloud Intelligence Anything:</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">Gemini-Powered General Q&amp;A</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
          {[
            'What is quantum computing?',
            'Why do leaves change color in autumn?',
            'Explain the theory of relativity simply',
            'How does artificial intelligence learn?',
            'What is the speed of light?',
            'How does photosynthesis work?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => onManualQuery(q)}
              className="px-2 py-1 rounded bg-[var(--surface)] border border-violet-400/20 text-slate-300 hover:text-violet-300 hover:border-violet-400/60 whitespace-nowrap cursor-pointer transition-all text-left flex items-center gap-1"
            >
              <span className="text-violet-400">›</span> {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error / Permission Recovery Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-amber-400/50 bg-amber-400/10 text-amber-300 text-xs font-mono fade-in flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
          {onRetryMic && (
            <button
              onClick={onRetryMic}
              className="px-3 py-1 rounded bg-amber-400 text-slate-900 font-bold hover:bg-amber-300 flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <RefreshCw size={11} />
              <span>Allow / Retry Mic</span>
            </button>
          )}
        </div>
      )}

      {/* Manual Input Bar */}
      <form onSubmit={handleInputSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Type any question or command for EchoEdge..."
            className="w-full py-2 pl-3 pr-8 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!typedInput.trim() || isProcessing}
          className="px-3 py-2 rounded-lg bg-cyan-400/20 text-cyan-400 border border-cyan-400/60 text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-cyan-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send size={12} />
          <span>Ask</span>
          <CornerDownLeft size={10} className="text-cyan-400/60" />
        </button>
      </form>
    </Card>
  );
};
