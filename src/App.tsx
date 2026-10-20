/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Profile,
  Routine,
  Task,
  CompletionLog,
  Settings,
  StreakState,
  AppData,
  TaskStatus,
} from './types/index.ts';
import {
  loadAppData,
  saveAppData,
  exportDataAsJSON,
  validateAndParseImportJSON,
  clearAllLocalData,
  createSeedData,
} from './utils/storage.ts';
import {
  formatDateKey,
  getTasksForDate,
  calculateDailyProgress,
  calculateStreaks,
  DayHistoryRecord,
} from './utils/routineCalculations.ts';
import {
  dispatchNotification,
  InAppNotification,
} from './utils/notifications.ts';
import { BUILT_IN_TEMPLATES } from './data/templates.ts';
import { Navbar } from './components/Navbar.tsx';
import { MobileTabBar } from './components/MobileTabBar.tsx';
import { TodayView } from './components/TodayView.tsx';
import { RoutinesView } from './components/RoutinesView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { InAppNotificationToast } from './components/InAppNotificationToast.tsx';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<string>('today');
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-amoled', 'theme-dark', 'theme-light', 'dark', 'light');

    if (data.settings.theme === 'amoled') {
      root.classList.add('dark', 'theme-amoled');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#FFFFFF';
    } else if (data.settings.theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      document.body.style.backgroundColor = '#090d16';
      document.body.style.color = '#F1F5F9';
    } else if (data.settings.theme === 'light') {
      root.classList.add('light', 'theme-light');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    } else {
      // System default
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark', 'theme-amoled');
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#FFFFFF';
      } else {
        root.classList.add('light', 'theme-light');
        document.body.style.backgroundColor = '#F8FAFC';
        document.body.style.color = '#0F172A';
      }
    }
  }, [data.settings.theme]);

  // Persist data updates to localStorage
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const todayDate = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(todayDate), [todayDate]);

  // Tasks scheduled for today
  const todayTasks = useMemo(() => {
    return getTasksForDate(todayDate, data.routines, data.tasks);
  }, [todayDate, data.routines, data.tasks]);

  // Today's logs
  const todayLogs = useMemo(() => {
    return data.logs.filter((l) => l.date === todayKey);
  }, [data.logs, todayKey]);

  // Re-calculate streak dynamically across history
  const recalculateStreaksFromLogs = useCallback(
    (currentLogs: CompletionLog[], routines: Routine[], tasks: Task[]): StreakState => {
      // Group dates present in logs and routines
      const dateKeys = Array.from(new Set(currentLogs.map((l) => l.date)));
      if (!dateKeys.includes(todayKey)) dateKeys.push(todayKey);

      const historyByDate: Record<string, DayHistoryRecord> = {};

      dateKeys.forEach((dKey) => {
        const parts = dKey.split('-').map(Number);
        const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const dTasks = getTasksForDate(dObj, routines, tasks);
        const dLogs = currentLogs.filter((l) => l.date === dKey);
        const prog = calculateDailyProgress(dTasks, dLogs);

        historyByDate[dKey] = {
          mandatoryTotal: prog.mandatoryTotal,
          mandatoryDone: prog.mandatoryDone,
          optionalTotal: prog.optionalTotal,
          optionalDone: prog.optionalDone,
        };
      });

      return calculateStreaks(historyByDate, todayKey, data.streak.best_streak);
    },
    [todayKey, data.streak.best_streak]
  );

  // Status toggle handler for TodayView
  const handleUpdateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateData((prev) => {
        let updatedLogs = [...prev.logs];
        const existingIdx = updatedLogs.findIndex(
          (l) => l.task_id === taskId && l.date === todayKey
        );

        if (newStatus === 'pending') {
          // Remove log or set to pending
          if (existingIdx >= 0) {
            updatedLogs.splice(existingIdx, 1);
          }
        } else {
          const newLog: CompletionLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            task_id: taskId,
            date: todayKey,
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : undefined,
          };

          if (existingIdx >= 0) {
            updatedLogs[existingIdx] = newLog;
          } else {
            updatedLogs.push(newLog);
          }
        }

        // Re-evaluate streaks
        const newStreak = recalculateStreaksFromLogs(updatedLogs, prev.routines, prev.tasks);

        return {
          ...prev,
          logs: updatedLogs,
          streak: newStreak,
        };
      });
    },
    [todayKey, recalculateStreaksFromLogs, updateData]
  );

  // Add one-time today task (FR-031)
  const handleAddAdhocTask = useCallback(
    (newTask: Task) => {
      updateData((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
    },
    [updateData]
  );

  // Onboarding completion
  const handleCompleteOnboarding = useCallback(
    ({
      profile,
      selectedRoutines,
      tasks: newTasks,
    }: {
      profile: Profile;
      selectedRoutines: Routine[];
      tasks: Task[];
    }) => {
      updateData((prev) => ({
        ...prev,
        profile,
        routines: [...prev.routines, ...selectedRoutines],
        tasks: [...prev.tasks, ...newTasks],
        isOnboarded: true,
      }));
    },
    [updateData]
  );

  // Routine Management
  const handleSaveRoutine = useCallback(
    (routine: Routine, routineTasks: Task[]) => {
      updateData((prev) => {
        const isExisting = prev.routines.some((r) => r.id === routine.id);
        const updatedRoutines = isExisting
          ? prev.routines.map((r) => (r.id === routine.id ? routine : r))
          : [...prev.routines, routine];

        // Replace tasks for this routine
        const otherTasks = prev.tasks.filter((t) => t.routine_id !== routine.id);
        const updatedTasks = [...otherTasks, ...routineTasks];

        return {
          ...prev,
          routines: updatedRoutines,
          tasks: updatedTasks,
        };
      });
    },
    [updateData]
  );

  const handleDeleteRoutine = useCallback(
    (routineId: string) => {
      updateData((prev) => ({
        ...prev,
        routines: prev.routines.filter((r) => r.id !== routineId),
        tasks: prev.tasks.filter((t) => t.routine_id !== routineId),
      }));
    },
    [updateData]
  );

  const handleDuplicateRoutine = useCallback(
    (routineId: string) => {
      updateData((prev) => {
        const sourceRoutine = prev.routines.find((r) => r.id === routineId);
        if (!sourceRoutine) return prev;

        const newRoutineId = `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const duplicatedRoutine: Routine = {
          ...sourceRoutine,
          id: newRoutineId,
          name: `${sourceRoutine.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const sourceTasks = prev.tasks.filter((t) => t.routine_id === routineId);
        const duplicatedTasks: Task[] = sourceTasks.map((t, idx) => ({
          ...t,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
          routine_id: newRoutineId,
        }));

        return {
          ...prev,
          routines: [...prev.routines, duplicatedRoutine],
          tasks: [...prev.tasks, ...duplicatedTasks],
        };
      });
    },
    [updateData]
  );

  const handleToggleRoutineActive = useCallback(
    (routineId: string) => {
      updateData((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === routineId ? { ...r, is_active: !r.is_active } : r
        ),
      }));
    },
    [updateData]
  );

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const tmpl = BUILT_IN_TEMPLATES.find((t) => t.id === templateId);
      if (!tmpl) return;

      const routineId = `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newRoutine: Routine = {
        id: routineId,
        name: tmpl.name,
        category: tmpl.category,
        days: tmpl.days,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newTasks: Task[] = tmpl.tasks.map((t, idx) => ({
        ...t,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
        routine_id: routineId,
      }));

      updateData((prev) => ({
        ...prev,
        routines: [...prev.routines, newRoutine],
        tasks: [...prev.tasks, ...newTasks],
      }));
    },
    [updateData]
  );

  // Settings Handlers
  const handleUpdateProfile = useCallback(
    (updatedProfile: Profile) => {
      updateData((prev) => ({ ...prev, profile: updatedProfile }));
    },
    [updateData]
  );

  const handleUpdateSettings = useCallback(
    (updatedSettings: Settings) => {
      updateData((prev) => ({ ...prev, settings: updatedSettings }));
    },
    [updateData]
  );

  const handleExportData = useCallback(() => {
    exportDataAsJSON(data);
  }, [data]);

  const handleImportData = useCallback(
    (jsonStr: string) => {
      try {
        const parsed = validateAndParseImportJSON(jsonStr);
        updateData(() => parsed);
      } catch (err: any) {
        alert(err.message || 'Invalid JSON format');
      }
    },
    [updateData]
  );

  const handleResetData = useCallback(() => {
    clearAllLocalData();
    setData({
      profile: null,
      routines: [],
      tasks: [],
      logs: [],
      settings: {
        theme: 'amoled',
        notifications_enabled: false,
        quiet_hours_enabled: true,
        default_reminder_offset: 10,
      },
      streak: { current_streak: 0, best_streak: 0 },
      isOnboarded: false,
    });
  }, []);

  const handleTriggerTestNotification = useCallback(() => {
    dispatchNotification({
      title: 'Routine Tracker Test',
      body: 'Notifications are configured and working properly!',
      wakeTime: data.profile?.wake_time,
      sleepTime: data.profile?.sleep_time,
      quietHoursEnabled: data.settings.quiet_hours_enabled,
      onInAppFallback: (notif) => {
        setInAppNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      },
    });
  }, [data.profile, data.settings.quiet_hours_enabled]);

  const handleDismissNotification = useCallback((id: string) => {
    setInAppNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const todayFormatted = useMemo(() => {
    return todayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [todayDate]);

  const availableCategories = useMemo(() => {
    const fromProfile = data.profile?.categories || [];
    const fromRoutines = data.routines.map((r) => r.category).filter(Boolean);
    return Array.from(new Set([...fromProfile, ...fromRoutines]));
  }, [data.profile, data.routines]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-neutral-800">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={data.streak}
        todayFormatted={todayFormatted}
      />

      {/* Floating In-App Notifications Toast */}
      <InAppNotificationToast
        notifications={inAppNotifications}
        onDismiss={handleDismissNotification}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl w-full mx-auto">
        {activeTab === 'today' && (
          <TodayView
            tasks={todayTasks}
            routines={data.routines}
            logs={todayLogs}
            streak={data.streak}
            userName={data.profile?.name || ''}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddAdhocTask={handleAddAdhocTask}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesView
            routines={data.routines}
            tasks={data.tasks}
            availableCategories={availableCategories}
            onSaveRoutine={handleSaveRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onDuplicateRoutine={handleDuplicateRoutine}
            onToggleActive={handleToggleRoutineActive}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            routines={data.routines}
            tasks={data.tasks}
            logs={data.logs}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            routines={data.routines}
            tasks={data.tasks}
            logs={data.logs}
            streak={data.streak}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={data.profile}
            settings={data.settings}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onTriggerTestNotification={handleTriggerTestNotification}
          />
        )}
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* First Time Onboarding Modal */}
      <OnboardingModal
        isOpen={!data.isOnboarded}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
