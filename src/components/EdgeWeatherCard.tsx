/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, SectionHeader } from './Common';
import { CloudSun, Wind, Droplets, Zap } from 'lucide-react';

interface EdgeWeatherCardProps {
  onAskWeather: () => void;
}

export const EdgeWeatherCard: React.FC<EdgeWeatherCardProps> = ({ onAskWeather }) => {
  return (
    <Card>
      <SectionHeader>Edge Weather &amp; Briefing (&lt;3ms)</SectionHeader>
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <CloudSun size={24} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-white">24°C</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">Partly Cloudy</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Droplets size={11} className="text-cyan-400" /> 55% Humidity
              </span>
              <span className="flex items-center gap-1">
                <Wind size={11} className="text-cyan-400" /> 12 km/h Wind
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={onAskWeather}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-400/15 text-cyan-400 border border-cyan-400/40 hover:bg-cyan-400/25 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Zap size={11} className="fill-current" />
            <span>Hear Forecast</span>
          </button>
          <div className="text-[9px] font-mono text-emerald-400 mt-1">Local Edge: 3ms</div>
        </div>
      </div>
    </Card>
  );
};
