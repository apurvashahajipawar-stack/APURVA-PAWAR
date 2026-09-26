/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NoiseStatus } from '../types';
import { Card, SectionHeader } from './Common';

interface NoiseMonitorProps {
  level: number;
  status: NoiseStatus;
}

export const NoiseMonitor: React.FC<NoiseMonitorProps> = ({ level, status }) => {
  const activeBars = Math.round((level / 100) * 20);
  const colorClass =
    status === 'QUIET'
      ? 'bg-emerald-400'
      : status === 'NORMAL'
      ? 'bg-cyan-400'
      : 'bg-red-400';

  const textColorClass =
    status === 'QUIET'
      ? 'text-emerald-400'
      : status === 'NORMAL'
      ? 'text-cyan-400'
      : 'text-red-400';

  return (
    <Card>
      <SectionHeader>Noise Monitor</SectionHeader>
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <span className={`font-mono font-bold text-2xl ${textColorClass}`}>
            {status}
          </span>
          <span className="font-mono text-slate-400 text-sm">{level}% RMS</span>
        </div>

        {/* 20 Live Equalizer / RMS Bars */}
        <div className="flex gap-1 items-end h-9 px-1 py-1 rounded bg-[var(--surface2)] border border-[var(--border)]">
          {Array.from({ length: 20 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-sm transition-all duration-100 ${
                idx < activeBars ? colorClass : 'bg-slate-800'
              }`}
              style={{ height: `${35 + idx * 3.2}%` }}
            />
          ))}
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {(['QUIET', 'NORMAL', 'NOISY'] as NoiseStatus[]).map((s) => (
            <div
              key={s}
              className={`text-[10px] font-mono py-1 rounded border transition-colors ${
                status === s
                  ? s === 'QUIET'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10 font-bold'
                    : s === 'NORMAL'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10 font-bold'
                    : 'border-red-400 text-red-400 bg-red-400/10 font-bold'
                  : 'border-[var(--border)] text-slate-600'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-500 font-mono leading-snug">
          Live microphone acoustic RMS via Web Audio API. Evaluates wake word detection reliability in noisy environments.
        </p>
      </div>
    </Card>
  );
};
