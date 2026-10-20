import React from 'react';
import { Flame, CheckCircle2, Calendar, BarChart3, Settings as SettingsIcon, Layers } from 'lucide-react';
import { StreakState } from '../types/index.ts';

import { OnwardLogo } from './OnwardLogo.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streak: StreakState;
  todayFormatted: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  todayFormatted,
}) => {
  const navItems = [
    { id: 'today', label: 'Today', icon: CheckCircle2 },
    { id: 'routines', label: 'Routines', icon: Layers },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-900 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand Wordmark with Onward Logo */}
        <button
          onClick={() => setActiveTab('today')}
          className="text-left group flex items-center gap-2.5 focus:outline-none cursor-pointer"
        >
          <OnwardLogo size="md" showWordmark={true} />
          <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline ml-1 border-l border-neutral-800 pl-2.5 py-0.5">
            {todayFormatted}
          </span>
        </button>

        {/* Zone 2: Desktop Nav Links (Hidden on small mobile, handled by bottom tab bar) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-900"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Streak Counter / Stats */}
        <div className="flex items-center gap-3">
          <div
            title={`Current Streak: ${streak.current_streak} days (Best: ${streak.best_streak})`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-200"
          >
            <Flame
              className={`w-4 h-4 ${
                streak.current_streak > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-neutral-500'
              }`}
            />
            <span className="tabular-nums font-semibold text-white">{streak.current_streak}</span>
            <span className="text-neutral-400 text-[11px] hidden xs:inline">
              {streak.current_streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
