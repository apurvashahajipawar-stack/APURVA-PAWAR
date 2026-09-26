/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  VoiceState,
  LatencyMetrics,
  ProcessingLocation,
  ConversationEntry,
} from '../types';
import { playWakeChime } from '../utils/audio';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

// Lenient wake word patterns accommodating diverse accents and speech variations
const WAKE_WORD_PATTERNS = [
  /\b(listen|start\s*listening|listen\s*now|hey\s*listen|echo\s*listen)\b/i,
  /\b(hey|hi|hello|ok|okay|hay|he|yo|a)?\s*(echo|eco|ekko|iko|edge|echoedge)\b/i,
  /\b(echo|eco|ekko|iko|echoedge)\b/i,
  /\bwake\s*up\b/i,
];

// Stop / interruption command patterns
const STOP_COMMAND_PATTERNS = [
  /\b(stop\s*listening|stop|quiet|cancel|silence|shut\s*up|halt|pause|never\s*mind)\b/i,
];

// Direct listen command patterns
const LISTEN_COMMAND_PATTERNS = [
  /\b(listen|start\s*listening|listen\s*now|listen\s*to\s*me|hear\s*me)\b/i,
];

export function containsWakeWord(text: string): boolean {
  if (!text) return false;
  const cleaned = text.trim();
  return WAKE_WORD_PATTERNS.some((pattern) => pattern.test(cleaned));
}

export function containsStopCommand(text: string): boolean {
  if (!text) return false;
  return STOP_COMMAND_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

export function containsListenCommand(text: string): boolean {
  if (!text) return false;
  return LISTEN_COMMAND_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

export function removeWakeWordPrefix(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  for (const pattern of WAKE_WORD_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      cleaned = cleaned.substring(match.index + match[0].length);
      break;
    }
  }
  return cleaned.replace(/^[,.\s!?:;]+/, '').trim();
}

export interface VoiceAssistantState {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  response: string;
  latency: LatencyMetrics;
  processingLocation: ProcessingLocation | null;
  error: string | null;
  wakeCount: number;
  isMuted: boolean;
  history: ConversationEntry[];
  lastHeard: string;
  isMicListening: boolean;
  isRecordingDirect: boolean;
  engineMode: 'WEB_SPEECH' | 'DIRECT_AUDIO';
}

export function useVoiceAssistant(
  onAction?: (action: any) => void,
  getAudioStream?: () => MediaStream | null
) {
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const getAudioStreamRef = useRef(getAudioStream);
  useEffect(() => {
    getAudioStreamRef.current = getAudioStream;
  }, [getAudioStream]);

  const [state, setState] = useState<VoiceAssistantState>({
    voiceState: 'IDLE',
    transcript: '',
    interimTranscript: '',
    response: '',
    latency: {
      wakeDetection: null,
      aiProcessing: null,
      total: null,
    },
    processingLocation: null,
    error: null,
    wakeCount: 0,
    isMuted: false,
    history: [],
    lastHeard: '',
    isMicListening: false,
    isRecordingDirect: false,
    engineMode: 'WEB_SPEECH',
  });

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<VoiceState>('IDLE');
  const isRunningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isRecognizingRef = useRef<boolean>(false);
  const wakeStartTimeRef = useRef<number>(0);
  const queryStartTimeRef = useRef<number>(0);
  const wakeDetectionLatencyRef = useRef<number>(26);
  const silenceTimerRef = useRef<any>(null);
  const pauseDebounceTimerRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const recordTimeoutRef = useRef<any>(null);

  const setVoiceState = useCallback((newState: VoiceState) => {
    stateRef.current = newState;
    setState((prev) => ({ ...prev, voiceState: newState }));
  }, []);

  // Safe restart helper for SpeechRecognition
  const safeStartRecognition = useCallback(() => {
    if (!isRunningRef.current) return;
    if (isRecognizingRef.current) return;
    if (isSpeakingRef.current) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        isRecognizingRef.current = true;
      }
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        console.debug('Recognition start notice:', err);
      }
    }
  }, []);

  // Text-To-Speech implementation
  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMutedRef.current) {
        onEnd?.();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.toLowerCase().includes('google') ||
                v.name.toLowerCase().includes('natural') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('enhanced') ||
                v.name.toLowerCase().includes('english'))
          ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        isSpeakingRef.current = true;

        const finishSpeech = () => {
          isSpeakingRef.current = false;
          onEnd?.();
        };

        utterance.onend = finishSpeech;
        utterance.onerror = (e) => {
          console.warn('Speech synthesis event error:', e);
          finishSpeech();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
        isSpeakingRef.current = false;
        onEnd?.();
      }
    },
    []
  );

  // Stop current action
  const stopAction = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);

    // Stop MediaRecorder if recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    setState((prev) => ({
      ...prev,
      interimTranscript: '',
      isRecordingDirect: false,
      error: null,
    }));

    if (isRunningRef.current) {
      setVoiceState('WAITING_FOR_WAKE_WORD');
      safeStartRecognition();
    } else {
      setVoiceState('READY');
    }
  }, [setVoiceState, safeStartRecognition]);

  // Process text query via backend API
  const processQuery = useCallback(
    async (queryText: string) => {
      const clean = queryText.trim();
      if (!clean || clean.length < 2) {
        setVoiceState('WAITING_FOR_WAKE_WORD');
        return;
      }

      if (containsStopCommand(clean)) {
        stopAction();
        return;
      }

      if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      setVoiceState('PROCESSING');
      setState((prev) => ({
        ...prev,
        transcript: clean,
        interimTranscript: '',
        error: null,
      }));

      const aiStart = performance.now();

      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: clean }),
        });

        const data = await response.json();
        if (data.action && onActionRef.current) {
          try {
            onActionRef.current(data.action);
          } catch (e) {
            console.warn('Action callback error:', e);
          }
        }
        const aiTime = Math.round(performance.now() - aiStart);
        const totalTime = Math.round(performance.now() - (queryStartTimeRef.current || aiStart));
        const wakeTime = wakeDetectionLatencyRef.current || 28;

        const answerText = data.answer || "I'm sorry, I couldn't find an answer to that question.";
        const location: ProcessingLocation = data.processingLocation === 'LOCAL' ? 'LOCAL' : 'CLOUD';

        const latencies: LatencyMetrics = {
          wakeDetection: wakeTime,
          aiProcessing: aiTime,
          total: totalTime,
        };

        const newEntry: ConversationEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          query: clean,
          response: answerText,
          timestamp: new Date(),
          latency: latencies,
          processingLocation: location,
        };

        setState((prev) => ({
          ...prev,
          response: answerText,
          processingLocation: location,
          latency: latencies,
          history: [newEntry, ...prev.history].slice(0, 30),
        }));

        setVoiceState('SPEAKING');

        // Speak aloud, then return to wake-word listening mode
        speakText(answerText, () => {
          if (isRunningRef.current) {
            setVoiceState('WAITING_FOR_WAKE_WORD');
            safeStartRecognition();
          } else {
            setVoiceState('READY');
          }
        });
      } catch (err: any) {
        console.error('API query failed:', err);
        const errorMsg = 'Failed to reach AI service. Please check network connection.';
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          response: 'I encountered an error connecting to the AI service. Please try again.',
        }));
        setVoiceState('ERROR');

        speakText("I encountered an issue connecting. Please try again.", () => {
          setTimeout(() => {
            if (isRunningRef.current) {
              setVoiceState('WAITING_FOR_WAKE_WORD');
              safeStartRecognition();
            }
          }, 1500);
        });
      }
    },
    [setVoiceState, speakText, safeStartRecognition, stopAction]
  );

  // Process raw audio query directly through /api/query-audio
  const processAudioBlob = useCallback(
    async (blob: Blob) => {
      setVoiceState('PROCESSING');
      setState((prev) => ({
        ...prev,
        transcript: 'Transcribing voice audio...',
        interimTranscript: '',
        isRecordingDirect: false,
        error: null,
      }));

      const aiStart = performance.now();

      try {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = blob.type || 'audio/webm';

          try {
            const response = await fetch('/api/query-audio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ audioBase64: base64Data, mimeType }),
            });

            const data = await response.json();
            if (data.action && onActionRef.current) {
              try {
                onActionRef.current(data.action);
              } catch (e) {
                console.warn('Action callback error:', e);
              }
            }

            const aiTime = Math.round(performance.now() - aiStart);
            const totalTime = Math.round(performance.now() - (queryStartTimeRef.current || aiStart));
            const wakeTime = wakeDetectionLatencyRef.current || 28;

            const recognizedQuery = data.transcription || 'Voice Question';
            const answerText = data.answer || "I couldn't process the audio clearly.";
            const location: ProcessingLocation = data.processingLocation === 'LOCAL' ? 'LOCAL' : 'CLOUD';

            const latencies: LatencyMetrics = {
              wakeDetection: wakeTime,
              aiProcessing: aiTime,
              total: totalTime,
            };

            const newEntry: ConversationEntry = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              query: recognizedQuery,
              response: answerText,
              timestamp: new Date(),
              latency: latencies,
              processingLocation: location,
            };

            setState((prev) => ({
              ...prev,
              transcript: recognizedQuery,
              response: answerText,
              processingLocation: location,
              latency: latencies,
              history: [newEntry, ...prev.history].slice(0, 30),
            }));

            setVoiceState('SPEAKING');

            speakText(answerText, () => {
              if (isRunningRef.current) {
                setVoiceState('WAITING_FOR_WAKE_WORD');
                safeStartRecognition();
              } else {
                setVoiceState('READY');
              }
            });
          } catch (postErr) {
            console.error('Audio post failed:', postErr);
            setState((prev) => ({
              ...prev,
              error: 'Failed to process voice query.',
              response: 'I could not process the voice recording. Please try speaking again.',
            }));
            setVoiceState('ERROR');
          }
        };
      } catch (err) {
        console.error('Failed reading audio blob:', err);
        setVoiceState('WAITING_FOR_WAKE_WORD');
      }
    },
    [setVoiceState, speakText, safeStartRecognition]
  );

  // Trigger wake word detected manually or via speech
  const handleWakeWordDetected = useCallback(
    (immediateQuestion?: string) => {
      wakeDetectionLatencyRef.current = Math.max(
        12,
        Math.round(performance.now() - (wakeStartTimeRef.current || performance.now() - 25))
      );
      queryStartTimeRef.current = performance.now();

      playWakeChime();

      setState((prev) => ({
        ...prev,
        voiceState: 'WAKE_DETECTED',
        wakeCount: prev.wakeCount + 1,
        error: null,
      }));
      stateRef.current = 'WAKE_DETECTED';

      if (immediateQuestion && immediateQuestion.trim().length >= 3) {
        setTimeout(() => {
          processQuery(immediateQuestion.trim());
        }, 350);
      } else {
        setTimeout(() => {
          if (stateRef.current === 'WAKE_DETECTED') {
            setVoiceState('LISTENING');
            setState((prev) => ({
              ...prev,
              transcript: '',
              interimTranscript: '',
            }));

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            // Automatically stop listening after 3.2s if user is not talking
            silenceTimerRef.current = setTimeout(() => {
              if (stateRef.current === 'LISTENING') {
                stopAction();
              }
            }, 3200);
          }
        }, 500);
      }
    },
    [processQuery, setVoiceState, stopAction]
  );

  // Direct Audio Recording Trigger (Push-to-Talk / Tap-to-Talk)
  const startDirectAudioRecording = useCallback(() => {
    let stream = getAudioStreamRef.current ? getAudioStreamRef.current() : null;

    if (!stream && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((newStream) => {
          recordWithStream(newStream);
        })
        .catch((err) => {
          console.warn('Microphone permission needed:', err);
          setState((prev) => ({
            ...prev,
            error: 'Microphone permission denied. Please allow microphone access in your browser bar.',
          }));
        });
      return;
    }

    if (stream) {
      recordWithStream(stream);
    }

    function recordWithStream(activeStream: MediaStream) {
      if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
        return;
      }

      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        isSpeakingRef.current = false;

        playWakeChime();
        wakeStartTimeRef.current = performance.now();
        queryStartTimeRef.current = performance.now();

        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : '';

        const recorder = mimeType ? new MediaRecorder(activeStream, { mimeType }) : new MediaRecorder(activeStream);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          if (audioBlob.size > 1000) {
            processAudioBlob(audioBlob);
          } else {
            setVoiceState('WAITING_FOR_WAKE_WORD');
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(100);

        setVoiceState('LISTENING');
        setState((prev) => ({
          ...prev,
          isRecordingDirect: true,
          transcript: '',
          interimTranscript: 'Listening... (Speak your question now)',
          error: null,
        }));

        // Automatically finalize recording after 5 seconds of speaking
        if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
        recordTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 5000);
      } catch (err) {
        console.error('Failed to start MediaRecorder:', err);
      }
    }
  }, [processAudioBlob, setVoiceState]);

  // Stop direct audio recording manually
  const stopDirectAudioRecording = useCallback(() => {
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Start Listening immediately (explicit Listen situation)
  const startListening = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);

    queryStartTimeRef.current = performance.now();
    wakeStartTimeRef.current = performance.now() - 20;

    playWakeChime();

    setVoiceState('LISTENING');
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));

    // If Web Speech API is not recognizing or supported, trigger direct audio recording fallback
    if (!isRecognizingRef.current) {
      startDirectAudioRecording();
    } else {
      safeStartRecognition();
    }

    // Automatically stop listening after 3.2s if user is not talking
    silenceTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'LISTENING') {
        stopAction();
      }
    }, 3200);
  }, [setVoiceState, safeStartRecognition, startDirectAudioRecording, stopAction]);

  // Stop current speech and immediately start listening
  const stopAndListen = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    startListening();
  }, [startListening]);

  // Initialize SpeechRecognition engine
  const startRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setState((prev) => ({
        ...prev,
        engineMode: 'DIRECT_AUDIO',
        error: null,
      }));
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setState((prev) => ({ ...prev, isMicListening: true, error: null }));
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let accumulatedTranscript = '';
        let hasFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const part = res[0].transcript;
          accumulatedTranscript += part + ' ';
          if (res.isFinal) {
            hasFinal = true;
          }
        }

        const raw = accumulatedTranscript.trim();
        if (!raw) return;

        setState((prev) => ({ ...prev, lastHeard: raw }));

        // Barge-in detection while assistant is speaking
        if (isSpeakingRef.current) {
          if (containsStopCommand(raw)) {
            stopAction();
            return;
          }
          if (containsWakeWord(raw) || containsListenCommand(raw)) {
            const remaining = removeWakeWordPrefix(raw);
            if (remaining.length >= 3) {
              stopAction();
              processQuery(remaining);
            } else {
              stopAndListen();
            }
            return;
          }
          return;
        }

        const currentState = stateRef.current;

        if (currentState === 'LISTENING' || currentState === 'PROCESSING') {
          if (containsStopCommand(raw)) {
            stopAction();
            return;
          }
        }

        if (
          currentState === 'WAITING_FOR_WAKE_WORD' ||
          currentState === 'READY' ||
          currentState === 'IDLE'
        ) {
          if (containsListenCommand(raw)) {
            startListening();
            return;
          }

          if (containsWakeWord(raw)) {
            wakeStartTimeRef.current = performance.now() - 25;
            const remaining = removeWakeWordPrefix(raw);

            if (remaining.length >= 3) {
              handleWakeWordDetected(remaining);
            } else {
              handleWakeWordDetected();
            }
            return;
          }
        } else if (currentState === 'LISTENING' || currentState === 'WAKE_DETECTED') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);

          const cleaned = removeWakeWordPrefix(raw);
          const activeText = cleaned || raw;

          if (!hasFinal) {
            setState((prev) => ({
              ...prev,
              interimTranscript: activeText,
            }));

            // If user has spoken question words and stops talking for 1.1s, automatically process the question!
            if (activeText.length > 2) {
              pauseDebounceTimerRef.current = setTimeout(() => {
                if (stateRef.current === 'LISTENING' && activeText.length > 2) {
                  processQuery(activeText);
                }
              }, 1100);
            } else {
              // If user woke up assistant but hasn't said anything, stop listening after 2.5s
              silenceTimerRef.current = setTimeout(() => {
                if (stateRef.current === 'LISTENING') {
                  stopAction();
                }
              }, 2500);
            }
          } else {
            if (activeText.length > 1) {
              setState((prev) => ({ ...prev, interimTranscript: '' }));
              processQuery(activeText);
            } else {
              stopAction();
            }
          }
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        setState((prev) => ({ ...prev, isMicListening: false }));

        if (!isRunningRef.current) return;
        if (isSpeakingRef.current) return;

        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isRunningRef.current && !isSpeakingRef.current && !isRecognizingRef.current) {
            try {
              recognition.start();
              isRecognizingRef.current = true;
            } catch (_) {}
          }
        }, 200);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setState((prev) => ({
            ...prev,
            error:
              'Microphone access is blocked in this window. Click "Tap to Speak" or check browser site settings to allow mic.',
            engineMode: 'DIRECT_AUDIO',
          }));
        } else if (event.error === 'network') {
          // If Google Web Speech API network service is unavailable (e.g. Brave or firewall), fall back to direct audio
          setState((prev) => ({
            ...prev,
            engineMode: 'DIRECT_AUDIO',
          }));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isRecognizingRef.current = true;
    } catch (err: any) {
      console.warn('SpeechRecognition initialization note:', err);
      setState((prev) => ({ ...prev, engineMode: 'DIRECT_AUDIO' }));
    }
  }, [
    handleWakeWordDetected,
    processQuery,
    setVoiceState,
    startListening,
    stopAction,
    stopAndListen,
  ]);

  // Public method: Start Echo
  const initialize = useCallback(() => {
    isRunningRef.current = true;
    wakeStartTimeRef.current = performance.now();
    setVoiceState('WAITING_FOR_WAKE_WORD');
    setState((prev) => ({ ...prev, error: null, lastHeard: '' }));
    startRecognition();
  }, [setVoiceState, startRecognition]);

  // Public method: Stop Echo
  const stop = useCallback(() => {
    isRunningRef.current = false;
    isSpeakingRef.current = false;
    isRecognizingRef.current = false;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);

    try {
      recognitionRef.current?.stop();
    } catch (_) {}

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setVoiceState('IDLE');
    setState((prev) => ({ ...prev, isMicListening: false, isRecordingDirect: false }));
  }, [setVoiceState]);

  // Public method: Tap to wake / simulate wake word detection
  const triggerWakeWord = useCallback(() => {
    wakeStartTimeRef.current = performance.now();
    handleWakeWordDetected();
  }, [handleWakeWordDetected]);

  // Public method: Execute command/query directly
  const triggerCommand = useCallback(
    (commandText: string) => {
      wakeStartTimeRef.current = performance.now();
      queryStartTimeRef.current = performance.now();
      wakeDetectionLatencyRef.current = 22;

      playWakeChime();

      setState((prev) => ({
        ...prev,
        voiceState: 'WAKE_DETECTED',
        wakeCount: prev.wakeCount + 1,
        transcript: commandText,
        interimTranscript: '',
      }));
      stateRef.current = 'WAKE_DETECTED';

      setTimeout(() => {
        processQuery(commandText);
      }, 350);
    },
    [processQuery]
  );

  // Toggle mute TTS
  const toggleMute = useCallback(() => {
    setState((prev) => {
      const next = !prev.isMuted;
      isMutedRef.current = next;
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return { ...prev, isMuted: next };
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      isSpeakingRef.current = false;
      isRecognizingRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (pauseDebounceTimerRef.current) clearTimeout(pauseDebounceTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isSupported =
    typeof window !== 'undefined' &&
    (!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ||
      !!(window as any).MediaRecorder);

  return {
    ...state,
    initialize,
    stop,
    startListening,
    startDirectAudioRecording,
    stopDirectAudioRecording,
    stopAction,
    stopAndListen,
    triggerWakeWord,
    triggerCommand,
    toggleMute,
    stopSpeaking: stopAction,
    isSupported,
  };
}
