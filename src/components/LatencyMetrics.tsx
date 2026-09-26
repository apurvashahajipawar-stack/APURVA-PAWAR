/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LatencyMetrics } from '../types';
import { Card, SectionHeader } from './Common';

interface LatencyMetricsProps {
  latency: LatencyMetrics;
}

export const LatencyCard: React.FC<LatencyMetricsProps> = ({ latency }) => {
  const formatMs = (val: number | null) => (val === null ? '—' : `${val}ms`);

  const getColorClass = (val: number | null, low: number, high: number) => {
    if (val === null) return 'text-slate-500';
    if (val < low) return 'text-emerald-400';
    if (val < high) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBgClass = (val: number | null, low: number, high: number) => {
    if (val === null) return 'bg-slate-700';
    if (val < low) return 'bg-emerald-400';
    if (val < high) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const metrics = [
    {
      label: 'Wake Detection',
      value: latency.wakeDetection,
      low: 50,
      high: 150,
      desc: 'Edge target <50ms',
    },
    {
      label: 'AI Processing',
      value: latency.aiProcessing,
      low: 600,
      high: 2000,
      desc: 'Gemini AI inference',
    },
    {
      label: 'Total Response',
      value: latency.total,
      low: 700,
      high: 2500,
      desc: 'Speech-to-speech roundtrip',
    },
  ];

  return (
    <Card>
      <SectionHeader>Latency Metrics</SectionHeader>
      <div className="space-y-3.5">
        {metrics.map(({ label, value, low, high, desc }) => {
          const color = getColorClass(value, low, high);
          const bg = getBgClass(value, low, high);
          const percentage = value === null ? 0 : Math.min(100, (value / (high * 1.3)) * 100);

          return (
            <div key={label} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-300 font-mono">{label}</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">({desc})</span>
                </div>
                <span className={`font-mono font-bold text-sm ${color}`}>
                  {formatMs(value)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${bg}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-[var(--border)] space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs">●</span>
            <span>Edge Target: &lt;50ms local wake word</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-violet-400 text-xs">●</span>
            <span>Gemini AI: 300–1200ms cloud generation</span>
          </div>
          <p className="text-slate-600 pt-0.5">
            All latency metrics recorded live with performance.now()
          </p>
        </div>
      </div>
    </Card>
  );
};
