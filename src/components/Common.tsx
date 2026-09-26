/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg backdrop-blur-sm ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
      }}
    >
      {children}
    </div>
  );
};

export const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
        {children}
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
};

export const StatusDot: React.FC<{ active: boolean; color: string }> = ({
  active,
  color,
}) => {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${color} pulse-ring`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          active ? color : 'bg-slate-700'
        }`}
      />
    </span>
  );
};

export const MetricStat: React.FC<{
  label: string;
  value: React.ReactNode;
  color: string;
}> = ({ label, value, color }) => {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-mono text-xl font-bold ${color}`}>{value}</span>
      <span className="text-slate-500 text-xs uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};
