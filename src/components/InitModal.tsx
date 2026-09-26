/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface InitModalProps {
  onStartEcho: () => Promise<void>;
  isSupported: boolean;
  error: string | null;
}

export const InitModal: React.FC<InitModalProps> = ({
  onStartEcho,
  isSupported,
  error,
}) => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await onStartEcho();
    } catch (err: any) {
      console.error('Initialization error:', err);
      setLocalError(
        err?.message ||
          'Microphone permission is required to enable voice activation.'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="max-w-lg w-full text-center space-y-8 fade-in">
        {/* Logo and Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 mb-4 relative shadow-lg shadow-cyan-500/10">
            <span className="text-4xl">🎙️</span>
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 pulse-ring" />
          </div>
          <h1 className="text-4xl font-bold text-white font-mono tracking-tight">
            Echo<span className="text-cyan-400">Edge</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Low-Latency Voice Activator for Edge Devices
          </p>
          <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono">
            Smart India Hackathon · Hardware & Edge AI Prototype
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            {
              icon: '⚡',
              label: 'Edge-First',
              desc: 'Sub-50ms local wake word detection',
            },
            {
              icon: '🧠',
              label: 'Gemini AI',
              desc: 'Intelligent cloud Q&A engine',
            },
            {
              icon: '📊',
              label: 'Real Metrics',
              desc: 'Live millisecond latency tracking',
            },
            {
              icon: '🔇',
              label: 'Noise Aware',
              desc: 'Real-time RMS acoustic monitoring',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-left hover:border-cyan-400/30 transition-colors"
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-slate-200 font-mono">
                {item.label}
              </div>
              <div className="text-[10px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Browser compatibility check */}
        {!isSupported && (
          <div className="p-3 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 text-xs font-mono text-left">
            ⚠️ Web Speech API is not supported in this browser. For the best voice experience, please open EchoEdge in Google Chrome or Microsoft Edge.
          </div>
        )}

        {/* Permission / Runtime errors */}
        {displayError && (
          <div className="p-3 rounded-lg border border-red-400/40 bg-red-400/10 text-red-400 text-xs font-mono text-left">
            ✕ {displayError}
          </div>
        )}

        {/* Main CTA button */}
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-mono font-bold text-base bg-cyan-400/20 text-cyan-400 border border-cyan-400/60 hover:bg-cyan-400/30 hover:shadow-lg hover:shadow-cyan-400/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                Requesting Microphone & Initializing...
              </span>
            ) : (
              '🎙️ Start Echo'
            )}
          </button>
          <p className="text-[11px] font-mono text-slate-600">
            Clicking Start Echo will prompt your browser for microphone permission.
          </p>
        </div>
      </div>
    </div>
  );
};
