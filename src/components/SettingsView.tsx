import React, { useState } from 'react';
import {
  User,
  Clock,
  Moon,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Profile, Settings, ThemeOption } from '../types/index.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  getNotificationPermissionState,
  requestBrowserNotificationPermission,
} from '../utils/notifications.ts';

interface SettingsViewProps {
  profile: Profile | null;
  settings: Settings;
  onUpdateProfile: (profile: Profile) => void;
  onUpdateSettings: (settings: Settings) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onResetData: () => void;
  onTriggerTestNotification: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
  onTriggerTestNotification,
}) => {
  // Local profile state
  const [name, setName] = useState(profile?.name || '');
  const [wakeTime, setWakeTime] = useState(profile?.wake_time || '07:00');
  const [sleepTime, setSleepTime] = useState(profile?.sleep_time || '23:00');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<string | null>(null);
  const [importError, setImportError] = useState('');

  const notificationPermission = getNotificationPermissionState();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      name: name.trim() || 'Alex',
      wake_time: wakeTime,
      sleep_time: sleepTime,
    };
    onUpdateProfile(updated);
    setProfileSuccessMsg('Profile schedule updated successfully');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  const handleRequestNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res === 'granted') {
      onUpdateSettings({ ...settings, notifications_enabled: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setPendingImportData(text);
        setIsImportConfirmOpen(true);
        setImportError('');
      } catch (err: any) {
        setImportError(err.message || 'Failed to read backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Configure profile hours, notification policies, theme, and data backups.
        </p>
      </div>

      {/* 1. Profile and Sleep Schedule (FR-054) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
          <User className="w-5 h-5 text-neutral-300" />
          <h2 className="text-base font-bold text-white">Profile & Quiet Hours Schedule</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="settings-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Display Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label htmlFor="settings-wake" className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Wake-Up Time
              </label>
              <input
                id="settings-wake"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label htmlFor="settings-sleep" className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5" />
                Sleep Time
              </label>
              <input
                id="settings-sleep"
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-400">
              Times are referenced for Quiet Hours and task deadlines.
            </span>
            <div className="flex items-center gap-3">
              {profileSuccessMsg && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {profileSuccessMsg}
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors shadow-sm"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Theme & Display (FR-055) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
          <Moon className="w-5 h-5 text-neutral-300" />
          <div>
            <h2 className="text-base font-bold text-white">Display Theme</h2>
            <p className="text-xs text-neutral-400">
              AMOLED mode produces pitch black pixels for battery efficiency and contrast
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { id: 'amoled', label: 'AMOLED Black', desc: '#000000 Pitch Black' },
            { id: 'dark', label: 'Dark Slate', desc: '#0f172a Deep Slate' },
            { id: 'light', label: 'Clean Light', desc: 'High Contrast Light' },
            { id: 'system', label: 'System Default', desc: 'Match OS Preferences' },
          ].map((th) => (
            <button
              key={th.id}
              onClick={() =>
                onUpdateSettings({ ...settings, theme: th.id as ThemeOption })
              }
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                settings.theme === th.id
                  ? 'bg-neutral-800 border-white text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-semibold text-white">{th.label}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{th.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notifications & Quiet Hours (FR-056, FR-040 - FR-044) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
          <Bell className="w-5 h-5 text-neutral-300" />
          <div>
            <h2 className="text-base font-bold text-white">Reminders & Quiet Hours</h2>
            <p className="text-xs text-neutral-400">
              Manage browser notification permissions and sleep-time silencing
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* Permission status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
            <div>
              <span className="text-xs font-semibold text-white block">
                Browser Push Notifications (FR-040)
              </span>
              <span className="text-xs text-neutral-400">
                Permission status:{' '}
                <span className="capitalize font-mono text-neutral-200">
                  {notificationPermission}
                </span>
              </span>
              {notificationPermission === 'denied' && (
                <p className="text-xs text-amber-400 mt-1">
                  Notifications were denied in browser permissions. Please reset site permissions in your browser bar. In-app reminders will continue to show.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Enable Permissions
                </button>
              )}
              <button
                type="button"
                onClick={onTriggerTestNotification}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-xl transition-colors"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* Quiet hours toggle (FR-042) */}
          <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
            <div>
              <span className="text-xs font-semibold text-white block">
                Quiet Hours (FR-042)
              </span>
              <span className="text-xs text-neutral-400">
                Automatically silence all notifications during sleep hours ({sleepTime} &ndash; {wakeTime})
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quiet_hours_enabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    quiet_hours_enabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
            </label>
          </div>

          {/* Default reminder offset (FR-041) */}
          <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
            <div>
              <span className="text-xs font-semibold text-white block">
                Default Reminder Lead Time (FR-041)
              </span>
              <span className="text-xs text-neutral-400">
                Notify me before a scheduled task begins
              </span>
            </div>
            <select
              value={settings.default_reminder_offset}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  default_reminder_offset: parseInt(e.target.value, 10),
                })
              }
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Backup & Data Management (FR-057, FR-058, FR-059) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
          <ShieldCheck className="w-5 h-5 text-neutral-300" />
          <div>
            <h2 className="text-base font-bold text-white">Local-First Data Management</h2>
            <p className="text-xs text-neutral-400">
              Export and restore all routines, history, logs, and settings in open JSON format
            </p>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-red-950/60 border border-red-900/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export JSON (FR-057) */}
          <button
            onClick={onExportData}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-2xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          {/* Import JSON (FR-058) */}
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-2xl text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Restore Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Reset All Data (FR-059) */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-red-950/40 text-red-400 border border-neutral-800 rounded-2xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      {/* 5. About & App Version (FR-060) */}
      <div className="p-6 bg-neutral-950/70 border border-neutral-900 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0e0e11] border border-[#23232a] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M5.5 6.5L10 12L5.5 17.5" stroke="#4d7c1b" />
              <path d="M12.5 6.5L17 12L12.5 17.5" stroke="#84cc16" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Onward</span>
              <span className="text-neutral-500 font-mono text-[11px]">v1.0 Final</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              One routine at a time · Local-first AMOLED Routine Tracker
            </p>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 font-mono">
          Private · Local-First · Battery Efficient
        </p>
      </div>

      {/* Reset Confirmation Modal (FR-059) */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset All Routine Tracker Data"
        message="This will permanently delete all routines, tasks, history logs, and profile preferences on this device. This action cannot be undone."
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Import Confirmation Modal (FR-058) */}
      <ConfirmModal
        isOpen={isImportConfirmOpen}
        title="Restore JSON Backup"
        message="Restoring from a backup will overwrite your current routines and task history. Would you like to proceed?"
        confirmLabel="Restore Data"
        onConfirm={() => {
          if (pendingImportData) {
            onImportData(pendingImportData);
            setPendingImportData(null);
          }
          setIsImportConfirmOpen(false);
        }}
        onCancel={() => {
          setPendingImportData(null);
          setIsImportConfirmOpen(false);
        }}
      />
    </div>
  );
};
