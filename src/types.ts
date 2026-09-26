/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoiceState =
  | 'READY'
  | 'WAITING_FOR_WAKE_WORD'
  | 'WAKE_DETECTED'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'IDLE'
  | 'ERROR';

export type ProcessingLocation = 'LOCAL' | 'CLOUD';

export type NoiseStatus = 'QUIET' | 'NORMAL' | 'NOISY';

export interface LatencyMetrics {
  wakeDetection: number | null;
  aiProcessing: number | null;
  total: number | null;
}

export interface ConversationEntry {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  latency: LatencyMetrics;
  processingLocation: ProcessingLocation;
}

export interface DistanceResult {
  attempts: number;
  successes: number;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'ac' | 'lock';
  state: boolean;
  value?: string;
  lastExecutionMs?: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface EdgeReminder {
  id: string;
  text: string;
  time: string;
}

export interface LatencyBenchmarkItem {
  feature: string;
  alexaMs: number;
  echoEdgeMs: number;
  category: 'Edge' | 'Hybrid' | 'Cloud';
  description: string;
}

export const BENCHMARK_DATA: LatencyBenchmarkItem[] = [
  {
    feature: 'Wake Word Detection',
    alexaMs: 280,
    echoEdgeMs: 24,
    category: 'Edge',
    description: 'Local neural network on-device vs Alexa cloud stream',
  },
  {
    feature: 'Smart Home Control',
    alexaMs: 1650,
    echoEdgeMs: 4,
    category: 'Edge',
    description: 'Direct edge bus vs AWS IoT Core + Lambda + OEM cloud',
  },
  {
    feature: 'Timers & Alarms',
    alexaMs: 1200,
    echoEdgeMs: 3,
    category: 'Edge',
    description: 'On-device timer scheduler vs cloud skill service',
  },
  {
    feature: 'Math & Unit Conversion',
    alexaMs: 950,
    echoEdgeMs: 2,
    category: 'Edge',
    description: 'Local arithmetic parser vs remote cloud roundtrip',
  },
  {
    feature: 'General Q&A Reasoning',
    alexaMs: 2400,
    echoEdgeMs: 460,
    category: 'Hybrid',
    description: 'Gemini 3.8 Flash streaming vs legacy Alexa skill NLP',
  },
];

export const STATE_LABELS: Record<VoiceState, string> = {
  READY: 'Ready',
  WAITING_FOR_WAKE_WORD: 'Waiting for wake word',
  WAKE_DETECTED: 'Wake word detected',
  LISTENING: 'Listening…',
  PROCESSING: 'Processing…',
  SPEAKING: 'Speaking…',
  IDLE: 'Waiting for wake word',
  ERROR: 'Error',
};

export const STATE_COLORS: Record<VoiceState, string> = {
  READY: 'text-cyan-400',
  WAITING_FOR_WAKE_WORD: 'text-slate-400',
  WAKE_DETECTED: 'text-amber-400',
  LISTENING: 'text-cyan-400',
  PROCESSING: 'text-violet-400',
  SPEAKING: 'text-emerald-400',
  IDLE: 'text-slate-400',
  ERROR: 'text-red-400',
};

export const STATE_BG_COLORS: Record<VoiceState, string> = {
  READY: 'bg-cyan-400',
  WAITING_FOR_WAKE_WORD: 'bg-slate-700',
  WAKE_DETECTED: 'bg-amber-400',
  LISTENING: 'bg-cyan-400',
  PROCESSING: 'bg-violet-400',
  SPEAKING: 'bg-emerald-400',
  IDLE: 'bg-slate-700',
  ERROR: 'bg-red-400',
};

export const SAMPLE_QUERIES = [
  'What is quantum computing?',
  'Why do leaves change color in autumn?',
  'Explain the theory of relativity simply',
  'How does artificial intelligence learn?',
  'Who invented the first computer?',
  'What causes auroras in the night sky?',
  'What is the speed of light?',
  'How does photosynthesis work?',
  'What is the capital of Japan?',
  'Turn on living room light',
  'Set a timer for 30 seconds',
  'What is the weather today?',
  'Calculate 128 times 256',
  'Lock the front door',
];

export const DISTANCES = ['1m', '2m', '2.5m', '3m', '4m'];
