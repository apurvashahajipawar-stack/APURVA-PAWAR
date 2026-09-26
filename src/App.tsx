/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import {
  DISTANCES,
  DistanceResult,
  STATE_LABELS,
  STATE_COLORS,
  STATE_BG_COLORS,
  SmartHomeDevice,
  ActiveTimer,
} from './types';
import { useNoiseMonitor } from './hooks/useNoiseMonitor';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { InitModal } from './components/InitModal';
import { Header } from './components/Header';
import { WaveformViz } from './components/WaveformViz';
import { VoiceAssistantCard } from './components/VoiceAssistantCard';
import { ConversationHistory } from './components/ConversationHistory';
import { NoiseMonitor } from './components/NoiseMonitor';
import { LatencyCard } from './components/LatencyMetrics';
import { Architecture } from './components/Architecture';
import { DistanceTesting } from './components/DistanceTesting';
import { DemoControls } from './components/DemoControls';
import { SmartHomeHub } from './components/SmartHomeHub';
import { EdgeTimerWidget } from './components/EdgeTimerWidget';
import { LatencyBenchmarkCard } from './components/LatencyBenchmarkCard';
import { EdgeWeatherCard } from './components/EdgeWeatherCard';

export default function App() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [distanceResults, setDistanceResults] = useState<Record<string, DistanceResult>>(() =>
    Object.fromEntries(DISTANCES.map((d) => [d, { attempts: 0, successes: 0 }]))
  );

  // Alexa-like Smart Home Devices (Edge Direct Bus)
  const [devices, setDevices] = useState<SmartHomeDevice[]>([
    { id: 'light', name: 'Living Room Lights', type: 'light', state: false, lastExecutionMs: 3 },
    { id: 'ac', name: 'Smart Climate AC', type: 'ac', state: true, value: '22°C', lastExecutionMs: 4 },
    { id: 'fan', name: 'Ceiling Fan', type: 'fan', state: false, value: 'Speed 3', lastExecutionMs: 2 },
    { id: 'lock', name: 'Front Door Lock', type: 'lock', state: true, lastExecutionMs: 3 },
  ]);

  // Alexa-like Timers (On-Device Scheduler)
  const [timer, setTimer] = useState<ActiveTimer | null>(null);

  // Active Timer countdown interval
  useEffect(() => {
    if (!timer || !timer.isRunning || timer.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (!prev || prev.remainingSeconds <= 1) {
          return prev ? { ...prev, remainingSeconds: 0, isRunning: false } : null;
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer?.isRunning, timer?.remainingSeconds]);

  // Handle local voice actions (Smart Home, Timer, etc.)
  const handleVoiceAction = useCallback((action: any) => {
    if (!action) return;

    if (action.type === 'SMART_HOME' && action.payload) {
      const { device, state } = action.payload;
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device || d.type === device
            ? { ...d, state, lastExecutionMs: Math.floor(Math.random() * 3) + 2 }
            : d
        )
      );
    } else if (action.type === 'TIMER' && action.payload) {
      if (action.payload.cancel) {
        setTimer(null);
      } else {
        const secs = action.payload.seconds || 30;
        setTimer({
          id: String(Date.now()),
          label: action.payload.label || `${secs}s Timer`,
          totalSeconds: secs,
          remainingSeconds: secs,
          isRunning: true,
        });
      }
    }
  }, []);

  const noise = useNoiseMonitor();
  const getAudioStream = useCallback(() => noise.streamRef.current, [noise.streamRef]);
  const voice = useVoiceAssistant(handleVoiceAction, getAudioStream);

  // Toggle smart home device via UI or voice
  const handleToggleDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, state: !d.state, lastExecutionMs: Math.floor(Math.random() * 3) + 2 }
          : d
      )
    );
  }, []);

  // Timer controls
  const handleSetTimer = useCallback((seconds: number, label: string = 'Quick Timer') => {
    setTimer({
      id: String(Date.now()),
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
    });
  }, []);

  const handleCancelTimer = useCallback(() => {
    setTimer(null);
  }, []);

  const handleToggleTimerPause = useCallback(() => {
    setTimer((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : null));
  }, []);

  // "Start Echo" initialization handler - PROPER SEQUENCING
  const handleStartEcho = useCallback(async () => {
    try {
      // 1. Explicitly prompt user for microphone permission FIRST
      await noise.initialize();
    } catch (err: any) {
      console.warn('Microphone permission or audio context setup notice:', err);
    }
    // 2. Start speech recognition now that microphone access has been granted
    voice.initialize();
    setIsStarted(true);
  }, [noise, voice]);

  // Retry / Re-grant microphone access
  const handleRetryMic = useCallback(async () => {
    try {
      await noise.initialize();
    } catch (err) {
      console.warn('Retry mic error:', err);
    }
    voice.initialize();
  }, [noise, voice]);

  // Log distance testing trial
  const handleRecordDistance = useCallback((dist: string, success: boolean) => {
    setDistanceResults((prev) => ({
      ...prev,
      [dist]: {
        attempts: (prev[dist]?.attempts ?? 0) + 1,
        successes: (prev[dist]?.successes ?? 0) + (success ? 1 : 0),
      },
    }));
  }, []);

  // Re-read current answer aloud
  const handleSpeakAgain = useCallback(() => {
    if (voice.response) {
      voice.triggerCommand(voice.transcript || voice.response);
    }
  }, [voice]);

  // If user hasn't clicked "Start Echo" yet, show initial setup modal
  if (!isStarted) {
    return (
      <InitModal
        onStartEcho={handleStartEcho}
        isSupported={voice.isSupported}
        error={noise.error || voice.error}
      />
    );
  }

  const voiceState = voice.voiceState;
  const statusLabel = STATE_LABELS[voiceState] || 'Ready';
  const statusColor = STATE_COLORS[voiceState] || 'text-slate-400';
  const statusBg = STATE_BG_COLORS[voiceState] || 'bg-slate-700';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar with Fast Stop & Listen Actions */}
      <Header
        voiceState={voiceState}
        isMicActive={noise.isInitialized}
        noiseStatus={noise.noiseStatus}
        processingLocation={voice.processingLocation}
        wakeCount={voice.wakeCount}
        isMuted={voice.isMuted}
        onToggleMute={voice.toggleMute}
        onStop={voice.stop}
        onRestart={handleRetryMic}
        onStartListening={voice.startListening}
        onStopAction={voice.stopAction}
      />

      {/* Subheader Waveform Visualizer Banner */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] h-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[0.25, 0.5, 0.75].map((y) => (
            <div
              key={y}
              className="absolute w-full h-px bg-slate-400"
              style={{ top: `${y * 100}%` }}
            />
          ))}
        </div>

        {/* Live Audio Canvas Visualizer */}
        <WaveformViz analyserRef={noise.analyserRef} voiceState={voiceState} />

        {/* Status Pill on the Right with Context Clue */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[var(--surface)]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[var(--border)] shadow-md">
          <div
            className={`h-2 w-2 rounded-full ${statusBg} ${
              voiceState !== 'IDLE' ? 'pulse-ring' : ''
            }`}
          />
          <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
          {voiceState === 'LISTENING' && (
            <span className="text-[10px] font-mono text-cyan-400/80 hidden sm:inline">
              · Say &quot;Stop&quot; to cancel
            </span>
          )}
          {voiceState === 'SPEAKING' && (
            <span className="text-[10px] font-mono text-emerald-400/80 hidden sm:inline">
              · Say &quot;Stop&quot; to halt
            </span>
          )}
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-5 space-y-4">
        {/* Top 2:1 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Voice Assistant and Conversation History (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <VoiceAssistantCard
              voiceState={voiceState}
              transcript={voice.transcript}
              interimTranscript={voice.interimTranscript}
              response={voice.response}
              processingLocation={voice.processingLocation}
              error={voice.error}
              lastHeard={voice.lastHeard}
              isMicListening={voice.isMicListening}
              isRecordingDirect={voice.isRecordingDirect}
              noiseLevel={noise.noiseLevel}
              engineMode={voice.engineMode}
              onManualQuery={voice.triggerCommand}
              onSpeakAgain={handleSpeakAgain}
              onStopSpeaking={voice.stopAction}
              onStartListening={voice.startListening}
              onStopAction={voice.stopAction}
              onStopAndListen={voice.stopAndListen}
              onTriggerWake={voice.triggerWakeWord}
              onDirectRecord={voice.startDirectAudioRecording}
              onRetryMic={handleRetryMic}
              isMuted={voice.isMuted}
            />

            {/* Alexa-Style Feature 1: Edge Smart Home Control (<4ms) */}
            <SmartHomeHub
              devices={devices}
              onToggleDevice={handleToggleDevice}
              onVoiceCommand={voice.triggerCommand}
            />

            {/* Alexa-Style Feature 2: Side-by-Side Latency Benchmark Matrix (Alexa vs EchoEdge) */}
            <LatencyBenchmarkCard />

            <ConversationHistory entries={voice.history} />
          </div>

          {/* Diagnostics, Alexa-like Edge Widgets, and Acoustic Monitoring (1 col) */}
          <div className="space-y-4">
            {/* Alexa-Style Feature 3: Live Countdown Timer & Alarms */}
            <EdgeTimerWidget
              timer={timer}
              onSetTimer={handleSetTimer}
              onCancelTimer={handleCancelTimer}
              onTogglePause={handleToggleTimerPause}
            />

            {/* Alexa-Style Feature 4: Edge Weather Forecast */}
            <EdgeWeatherCard onAskWeather={() => voice.triggerCommand("What's the weather?")} />

            <NoiseMonitor level={noise.noiseLevel} status={noise.noiseStatus} />
            <LatencyCard latency={voice.latency} />
          </div>
        </div>

        {/* Bottom 3-Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DistanceTesting
            results={distanceResults}
            onRecordResult={handleRecordDistance}
          />
          <Architecture processingLocation={voice.processingLocation} />
          <DemoControls
            onCommand={voice.triggerCommand}
            onWake={voice.triggerWakeWord}
            voiceState={voiceState}
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-[var(--border)] text-[10px] font-mono text-slate-600">
          <span>EchoEdge · Low Latency Edge Voice Activator · </span>
          <span className="text-cyan-400/60">
            Continuous Wake Detection · Direct Audio Mode · &lt;5ms Edge Commands
          </span>
        </footer>
      </main>
    </div>
  );
}
