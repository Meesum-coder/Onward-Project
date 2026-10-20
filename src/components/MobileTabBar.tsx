import React from 'react';
import { CheckCircle2, Layers, Calendar, BarChart3, Settings as SettingsIcon } from 'lucide-react';

interface MobileTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'today', label: 'Today', icon: CheckCircle2 },
    { id: 'routines', label: 'Routines', icon: Layers },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-neutral-900 pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center transition-colors focus:outline-none"
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'text-white scale-105' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
