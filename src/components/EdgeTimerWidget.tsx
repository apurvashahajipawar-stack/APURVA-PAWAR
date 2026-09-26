/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ActiveTimer } from '../types';
import { Card, SectionHeader } from './Common';
import { Timer, Play, Pause, X, Plus, BellRing } from 'lucide-react';
import { playWakeChime } from '../utils/audio';

interface EdgeTimerWidgetProps {
  timer: ActiveTimer | null;
  onSetTimer: (seconds: number, label?: string) => void;
  onCancelTimer: () => void;
  onTogglePause: () => void;
}

export const EdgeTimerWidget: React.FC<EdgeTimerWidgetProps> = ({
  timer,
  onSetTimer,
  onCancelTimer,
  onTogglePause,
}) => {
  // Sound alarm when timer completes
  useEffect(() => {
    if (timer && timer.remainingSeconds === 0 && timer.totalSeconds > 0) {
      playWakeChime();
      const interval = setInterval(() => {
        playWakeChime();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progress =
    timer && timer.totalSeconds > 0
      ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
      : 0;

  return (
    <Card>
      <SectionHeader>Edge Timer &amp; Alarms (&lt;3ms On-Device)</SectionHeader>

      {timer && timer.remainingSeconds > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-[var(--surface2)] border border-cyan-400/40">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 transition-all duration-1000 ease-linear"
                  strokeDasharray={`${progress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Timer size={18} className="absolute text-cyan-400" />
            </div>

            <div>
              <div className="text-xl font-mono font-bold text-white tracking-wider">
                {formatTime(timer.remainingSeconds)}
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80">
                {timer.label} · Edge Scheduler (&lt;3ms)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePause}
              className="p-2 rounded-lg bg-cyan-400/20 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/30 transition-all cursor-pointer"
              title={timer.isRunning ? 'Pause Timer' : 'Resume Timer'}
            >
              {timer.isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => onSetTimer(timer.remainingSeconds + 30, timer.label)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 text-xs font-mono flex items-center gap-1 cursor-pointer"
              title="Add 30 seconds"
            >
              <Plus size={12} />
              <span>30s</span>
            </button>
            <button
              onClick={onCancelTimer}
              className="p-2 rounded-lg bg-red-400/20 text-red-400 border border-red-400/50 hover:bg-red-400/30 transition-all cursor-pointer"
              title="Cancel Timer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : timer && timer.remainingSeconds === 0 ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-400/20 border border-amber-400/60 animate-pulse">
          <div className="flex items-center gap-2 text-amber-300">
            <BellRing size={20} className="text-amber-400 animate-bounce" />
            <span className="font-mono text-xs font-bold">Timer Complete! {timer.label}</span>
          </div>
          <button
            onClick={onCancelTimer}
            className="px-3 py-1 rounded bg-amber-400 text-slate-900 font-mono text-xs font-bold hover:bg-amber-300 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Timer size={15} className="text-cyan-400" />
            <span>No active timer. Say: &quot;Set a timer for 30 seconds&quot;</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSetTimer(30, '30s Quick Timer')}
              className="px-2 py-1 rounded text-[10px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              +30s
            </button>
            <button
              onClick={() => onSetTimer(60, '1m Quick Timer')}
              className="px-2 py-1 rounded text-[10px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              +1 Min
            </button>
            <button
              onClick={() => onSetTimer(300, '5m Quick Timer')}
              className="px-2 py-1 rounded text-[10px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              +5 Min
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
