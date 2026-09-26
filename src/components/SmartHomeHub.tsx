/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SmartHomeDevice } from '../types';
import { Card, SectionHeader } from './Common';
import { Lightbulb, Fan, Thermometer, Lock, Unlock, Zap } from 'lucide-react';

interface SmartHomeHubProps {
  devices: SmartHomeDevice[];
  onToggleDevice: (id: string) => void;
  onVoiceCommand: (cmd: string) => void;
}

export const SmartHomeHub: React.FC<SmartHomeHubProps> = ({
  devices,
  onToggleDevice,
  onVoiceCommand,
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <SectionHeader>Edge Smart Home (Ultra-Low Latency IoT)</SectionHeader>
      </div>

      <div className="flex items-center justify-between gap-2 p-2 mb-3 rounded bg-[var(--surface2)] border border-cyan-400/30 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Zap size={13} className="text-cyan-400 fill-current" />
          <span className="font-bold">Edge Direct Bus:</span>
          <span>Local execution in &lt;4ms</span>
        </div>
        <div className="text-slate-400 text-[10px]">
          Alexa cloud route: <span className="text-red-400 font-bold">~1,650ms</span> (400x slower)
        </div>
      </div>

      {/* Grid of 4 Smart Home Devices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        {devices.map((device) => {
          const isActive = device.state;

          const getIcon = () => {
            switch (device.type) {
              case 'light':
                return <Lightbulb size={18} className={isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />;
              case 'fan':
                return <Fan size={18} className={isActive ? 'text-cyan-400 animate-spin' : 'text-slate-500'} />;
              case 'ac':
                return <Thermometer size={18} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />;
              case 'lock':
                return isActive ? (
                  <Lock size={18} className="text-emerald-400" />
                ) : (
                  <Unlock size={18} className="text-amber-400" />
                );
              default:
                return <Zap size={18} />;
            }
          };

          return (
            <div
              key={device.id}
              onClick={() => onToggleDevice(device.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px] ${
                isActive
                  ? 'border-cyan-400/60 bg-cyan-400/10 shadow-sm shadow-cyan-500/10'
                  : 'border-[var(--border)] bg-[var(--surface2)] opacity-70 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-cyan-400/20' : 'bg-slate-800'}`}>
                  {getIcon()}
                </div>
                <div
                  className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                    isActive ? 'bg-cyan-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xs font-mono font-bold text-slate-200 truncate">
                  {device.name}
                </div>
                <div className="text-[10px] font-mono flex items-center justify-between mt-0.5">
                  <span className={isActive ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                    {device.type === 'lock'
                      ? isActive
                        ? 'Locked'
                        : 'Unlocked'
                      : isActive
                      ? 'ON'
                      : 'OFF'}
                  </span>
                  <span className="text-[9px] text-emerald-400/80 font-mono">
                    {device.lastExecutionMs ? `${device.lastExecutionMs}ms` : '<4ms'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Prompt Shortcuts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
        <span className="text-slate-500 flex-shrink-0">Try saying:</span>
        {[
          'Turn on living room light',
          'Turn on the AC',
          'Turn on the fan',
          'Lock the front door',
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={() => onVoiceCommand(cmd)}
            className="px-2 py-1 rounded bg-[var(--surface2)] border border-[var(--border)] text-slate-300 hover:border-cyan-400/50 hover:text-cyan-400 whitespace-nowrap cursor-pointer transition-colors"
          >
            › {cmd}
          </button>
        ))}
      </div>
    </Card>
  );
};
