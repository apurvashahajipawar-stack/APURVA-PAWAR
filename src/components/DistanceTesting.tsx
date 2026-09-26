/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DISTANCES, DistanceResult } from '../types';
import { Card, SectionHeader, MetricStat } from './Common';

interface DistanceTestingProps {
  results: Record<string, DistanceResult>;
  onRecordResult: (distance: string, success: boolean) => void;
}

export const DistanceTesting: React.FC<DistanceTestingProps> = ({
  results,
  onRecordResult,
}) => {
  const [activeDistance, setActiveDistance] = useState<string | null>(null);

  const handleTest = (dist: string, success: boolean) => {
    onRecordResult(dist, success);
    setActiveDistance(null);
  };

  const totalTests = DISTANCES.reduce(
    (acc, d) => acc + (results[d]?.attempts ?? 0),
    0
  );
  const totalSuccesses = DISTANCES.reduce(
    (acc, d) => acc + (results[d]?.successes ?? 0),
    0
  );
  const overallRate =
    totalTests > 0 ? Math.round((totalSuccesses / totalTests) * 100) : null;

  return (
    <Card>
      <SectionHeader>Distance Testing</SectionHeader>
      <div className="space-y-2">
        {DISTANCES.map((dist) => {
          const stats = results[dist] || { attempts: 0, successes: 0 };
          const rate =
            stats.attempts > 0
              ? Math.round((stats.successes / stats.attempts) * 100)
              : null;
          const isSelected = activeDistance === dist;

          const rateColor =
            rate === null
              ? 'text-slate-500'
              : rate >= 80
              ? 'text-emerald-400'
              : rate >= 50
              ? 'text-amber-400'
              : 'text-red-400';

          return (
            <div
              key={dist}
              className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="w-10 font-bold text-slate-300">{dist}</span>
                <span className="text-slate-500">
                  {stats.successes}/{stats.attempts}
                </span>
                {rate !== null && (
                  <span className={`font-semibold ${rateColor}`}>({rate}%)</span>
                )}
              </div>

              {isSelected ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTest(dist, true)}
                    className="px-2 py-0.5 rounded text-[10px] bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/30 transition-colors cursor-pointer"
                    title="Wake word detected successfully"
                  >
                    ✓ Pass
                  </button>
                  <button
                    onClick={() => handleTest(dist, false)}
                    className="px-2 py-0.5 rounded text-[10px] bg-red-400/20 text-red-400 border border-red-400/40 hover:bg-red-400/30 transition-colors cursor-pointer"
                    title="Wake word missed"
                  >
                    ✗ Fail
                  </button>
                  <button
                    onClick={() => setActiveDistance(null)}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400 hover:bg-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveDistance(dist)}
                  className="px-2.5 py-1 rounded text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors cursor-pointer"
                >
                  Log Trial
                </button>
              )}
            </div>
          );
        })}

        {/* Aggregate Stats */}
        <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
          <MetricStat label="Tests" value={totalTests} color="text-slate-300" />
          <MetricStat label="Detected" value={totalSuccesses} color="text-emerald-400" />
          <MetricStat
            label="Rate"
            value={overallRate === null ? '—' : `${overallRate}%`}
            color={
              overallRate !== null && overallRate >= 70
                ? 'text-emerald-400'
                : 'text-amber-400'
            }
          />
        </div>
      </div>
    </Card>
  );
};
