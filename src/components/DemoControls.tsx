/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { VoiceState, SAMPLE_QUERIES } from '../types';
import { Card, SectionHeader } from './Common';
import { Play, Square, Bell, Sparkles } from 'lucide-react';

interface DemoControlsProps {
  onCommand: (query: string) => void;
  onWake: () => void;
  voiceState: VoiceState;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  onCommand,
  onWake,
  voiceState,
}) => {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const timerRef = useRef<any>(null);

  const isBusy = voiceState === 'PROCESSING' || voiceState === 'SPEAKING';

  const stopDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsDemoRunning(false);
  };

  const startDemo = () => {
    setIsDemoRunning(true);
    runDemoStep(0);
  };

  const runDemoStep = (index: number) => {
    const query = SAMPLE_QUERIES[index % SAMPLE_QUERIES.length];
    setDemoIndex(index);
    onCommand(query);

    // Schedule next query after answering and speaking complete
    timerRef.current = setTimeout(() => {
      if (index + 1 < SAMPLE_QUERIES.length) {
        runDemoStep(index + 1);
      } else {
        setIsDemoRunning(false);
      }
    }, 11000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Card>
      <SectionHeader>SIH Demo &amp; Evaluation</SectionHeader>
      <div className="space-y-3">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={isDemoRunning ? stopDemo : startDemo}
            disabled={isBusy && !isDemoRunning}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDemoRunning
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/60 hover:bg-amber-400/30'
                : 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/60 hover:bg-cyan-400/30'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isDemoRunning ? (
              <>
                <Square size={12} />
                <span>Stop Demo</span>
              </>
            ) : (
              <>
                <Play size={12} />
                <span>Run Auto Demo</span>
              </>
            )}
          </button>

          <button
            onClick={onWake}
            disabled={voiceState !== 'WAITING_FOR_WAKE_WORD' && voiceState !== 'READY'}
            className="px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-violet-400/20 text-violet-400 border border-violet-400/60 hover:bg-violet-400/30 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Simulate hardware wake word detection"
          >
            <Bell size={12} />
            <span>Wake</span>
          </button>
        </div>

        {/* Demo status banner */}
        {isDemoRunning && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 fade-in">
            <div className="h-2 w-2 rounded-full bg-amber-400 pulse-ring flex-shrink-0" />
            <span className="text-amber-400 text-xs font-mono truncate">
              Demo {demoIndex + 1}/{SAMPLE_QUERIES.length}: {SAMPLE_QUERIES[demoIndex]}
            </span>
          </div>
        )}

        {/* Quick-fire query chips */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <Sparkles size={10} className="text-cyan-400" />
            <span>Quick-fire test questions:</span>
          </div>
          <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
            {SAMPLE_QUERIES.slice(0, 7).map((query) => (
              <button
                key={query}
                onClick={() => onCommand(query)}
                disabled={isBusy}
                className="text-left text-[11px] font-mono px-2.5 py-1.5 rounded border border-[var(--border)] text-slate-300 hover:border-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed truncate cursor-pointer"
              >
                › {query}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[9px] font-mono text-slate-600 leading-tight">
          For SIH jury evaluation: Click any chip or use Auto Demo to trigger real-time AI query execution and measure true latency.
        </p>
      </div>
    </Card>
  );
};
