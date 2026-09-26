/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProcessingLocation } from '../types';
import { Card, SectionHeader } from './Common';

interface ArchitectureProps {
  processingLocation: ProcessingLocation | null;
}

export const Architecture: React.FC<ArchitectureProps> = ({ processingLocation }) => {
  const isLocal = processingLocation === 'LOCAL';
  const isCloud = processingLocation === 'CLOUD';

  return (
    <Card>
      <SectionHeader>Edge Architecture</SectionHeader>
      <div className="space-y-3 text-xs font-mono">
        {/* Audio capture to Wake Word NN */}
        <div className="flex items-center gap-2">
          <div className="w-24 p-2 rounded border border-cyan-400/40 bg-cyan-400/5 text-center">
            <div className="text-cyan-400 text-base">🎙️</div>
            <div className="text-cyan-400 text-[10px] font-bold">Microphone</div>
          </div>

          <div className="flex flex-col items-center flex-1">
            <div className="text-[9px] text-slate-500">Raw Audio</div>
            <div className="w-full h-px bg-cyan-400/40 relative overflow-hidden my-1">
              <div className="absolute h-full w-1/3 bg-cyan-400 scan-line" />
            </div>
            <div className="text-[8px] text-cyan-400/70">Continuous</div>
          </div>

          <div className="w-28 p-2 rounded border border-cyan-400/60 bg-cyan-400/10 text-center shadow-sm shadow-cyan-400/10">
            <div className="text-base">⚡</div>
            <div className="text-cyan-400 text-[10px] font-bold">Edge Device</div>
            <div className="text-[9px] text-slate-400">Wake Word NN</div>
          </div>
        </div>

        {/* Dual-path routing (Local vs Cloud) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Local Branch */}
          <div>
            <div className="flex flex-col items-center mb-1">
              <div className="h-3 w-px bg-emerald-400/50" />
              <div className="text-[9px] text-emerald-400 font-bold uppercase">
                [LOCAL PATH]
              </div>
            </div>
            <div
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isLocal
                  ? 'border-emerald-400/70 bg-emerald-400/15 ring-1 ring-emerald-400/30'
                  : 'border-[var(--border)] bg-[var(--surface2)] opacity-50'
              }`}
            >
              <div className="text-lg">🖥️</div>
              <div className="text-[10px] text-emerald-400 font-bold">
                On-Device Engine
              </div>
              <div className="text-[9px] text-slate-400">Time, Date, Fast-Path</div>
              <div className="text-[9px] text-emerald-400 font-semibold mt-1">
                &lt; 5ms Latency
              </div>
            </div>
          </div>

          {/* Cloud Gemini Branch */}
          <div>
            <div className="flex flex-col items-center mb-1">
              <div className="h-3 w-px bg-violet-400/50" />
              <div className="text-[9px] text-violet-400 font-bold uppercase">
                [CLOUD PATH]
              </div>
            </div>
            <div
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isCloud
                  ? 'border-violet-400/70 bg-violet-400/15 ring-1 ring-violet-400/30'
                  : 'border-[var(--border)] bg-[var(--surface2)] opacity-50'
              }`}
            >
              <div className="text-lg">☁️</div>
              <div className="text-[10px] text-violet-400 font-bold">
                Gemini 3.8 Flash
              </div>
              <div className="text-[9px] text-slate-400">General Q&A & Reasoning</div>
              <div className="text-[9px] text-violet-400 font-semibold mt-1">
                Zero Frontend Keys
              </div>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-slate-600 leading-tight pt-1">
          Two-tier edge compute architecture: instant local wake activation with intelligent backend routing.
        </p>
      </div>
    </Card>
  );
};
