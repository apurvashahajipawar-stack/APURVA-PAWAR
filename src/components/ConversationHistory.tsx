/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ConversationEntry } from '../types';
import { Card, SectionHeader } from './Common';
import { Clock } from 'lucide-react';

interface ConversationHistoryProps {
  entries: ConversationEntry[];
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  entries,
}) => {
  return (
    <Card>
      <SectionHeader>Conversation History</SectionHeader>
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-6 text-slate-600 font-mono text-xs">
            <Clock size={18} className="mx-auto mb-1.5 opacity-50" />
            <p>No conversation history yet</p>
            <p className="text-[10px] text-slate-700 mt-1">
              Spoken queries and AI responses will be logged here.
            </p>
          </div>
        ) : (
          entries.map((item) => (
            <div
              key={item.id}
              className="fade-in p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-cyan-400 text-xs font-mono font-medium">
                  Q: {item.query}
                </span>
                <span className="text-slate-500 text-[10px] font-mono flex-shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <p className="text-slate-200 text-xs leading-relaxed font-sans">
                {item.response}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[9px] font-mono text-slate-500">
                <span
                  className={`font-semibold ${
                    item.processingLocation === 'LOCAL'
                      ? 'text-emerald-400'
                      : 'text-violet-400'
                  }`}
                >
                  [{item.processingLocation}]
                </span>

                {item.latency.total !== null && (
                  <span>{item.latency.total}ms total</span>
                )}

                {item.latency.wakeDetection !== null && (
                  <span className="text-slate-600">
                    wake: {item.latency.wakeDetection}ms
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
