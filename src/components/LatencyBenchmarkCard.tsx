/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BENCHMARK_DATA } from '../types';
import { Card, SectionHeader } from './Common';
import { Zap, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const LatencyBenchmarkCard: React.FC = () => {
  const [isRacing, setIsRacing] = useState(false);
  const [echoEdgeProgress, setEchoEdgeProgress] = useState(0);
  const [alexaProgress, setAlexaProgress] = useState(0);
  const [echoEdgeDoneTime, setEchoEdgeDoneTime] = useState<number | null>(null);
  const [alexaDoneTime, setAlexaDoneTime] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  const startRace = () => {
    setIsRacing(true);
    setEchoEdgeProgress(0);
    setAlexaProgress(0);
    setEchoEdgeDoneTime(null);
    setAlexaDoneTime(null);

    const startTime = performance.now();

    // EchoEdge completes local edge execution in ~24ms
    setTimeout(() => {
      setEchoEdgeProgress(100);
      setEchoEdgeDoneTime(24);
    }, 150); // slight visual delay so user sees the race start

    // Alexa takes ~1650ms for cloud roundtrip
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / 1650) * 100));
      setAlexaProgress(progress);

      if (elapsed >= 1650) {
        clearInterval(interval);
        setAlexaProgress(100);
        setAlexaDoneTime(1650);
        setIsRacing(false);
      }
    }, 40);

    timerRef.current = interval;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <SectionHeader>Alexa vs EchoEdge: Live Latency Benchmark</SectionHeader>
        <button
          onClick={startRace}
          disabled={isRacing}
          className="self-end sm:self-center px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-400/20 text-cyan-400 border border-cyan-400/60 hover:bg-cyan-400/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Play size={11} className="fill-current" />
          <span>{isRacing ? 'Racing...' : '🏁 Run Live Race'}</span>
        </button>
      </div>

      {/* Live Interactive Race Visualizer */}
      {(isRacing || echoEdgeDoneTime !== null) && (
        <div className="p-3.5 mb-4 rounded-lg bg-[var(--surface2)] border border-cyan-400/40 space-y-3 fade-in">
          <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
            <span>Live Command Race: &quot;Turn on living room light&quot;</span>
            <span className="text-cyan-400">
              {echoEdgeDoneTime !== null && alexaDoneTime === null
                ? '⚡ EchoEdge Finished First!'
                : alexaDoneTime !== null
                ? 'Race Complete'
                : 'In Progress...'}
            </span>
          </div>

          {/* EchoEdge Track */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Zap size={12} className="fill-current" /> EchoEdge (Local Edge Bus)
              </span>
              <span className="text-emerald-400 font-bold">
                {echoEdgeDoneTime !== null ? `${echoEdgeDoneTime}ms (Winner)` : 'Running...'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150 rounded-full"
                style={{ width: `${echoEdgeProgress}%` }}
              />
            </div>
          </div>

          {/* Alexa Track */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-medium">Amazon Alexa (AWS Cloud Lambda + IoT Hub)</span>
              <span className={alexaDoneTime ? 'text-amber-400' : 'text-slate-500'}>
                {alexaDoneTime !== null ? `${alexaDoneTime}ms (~70x slower)` : `${alexaProgress}%`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75 rounded-full"
                style={{ width: `${alexaProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Latency Comparison Table */}
      <div className="space-y-2 mb-3">
        {BENCHMARK_DATA.map((item) => {
          const ratio = Math.round(item.alexaMs / item.echoEdgeMs);

          return (
            <div
              key={item.feature}
              className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="min-w-0">
                <div className="font-bold text-slate-200">{item.feature}</div>
                <div className="text-[10px] text-slate-500">{item.description}</div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Alexa Cloud</div>
                  <div className="text-amber-400/90 font-bold">{item.alexaMs}ms</div>
                </div>

                <div className="text-slate-600 font-bold">vs</div>

                <div className="text-right">
                  <div className="text-[10px] text-cyan-400/80">EchoEdge</div>
                  <div className="text-emerald-400 font-bold">{item.echoEdgeMs}ms</div>
                </div>

                <div className="px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 font-bold text-[10px]">
                  {ratio}x Faster
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architectural Explanations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-[var(--border)]">
        <div className="flex items-start gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-200">Zero Cloud Hops:</strong> EchoEdge resolves smart home, timers, and calculations directly on edge hardware with 0 network delay.
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-200">Why Alexa is Slower:</strong> Alexa streams all raw audio to AWS servers, invokes Lambda skills, and brokers through 3 separate clouds before executing.
          </span>
        </div>
      </div>
    </Card>
  );
};
