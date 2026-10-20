import {
  Profile,
  Routine,
  Task,
  CompletionLog,
  Settings,
  StreakState,
  AppData,
} from '../types/index.ts';
import { BUILT_IN_TEMPLATES } from '../data/templates.ts';
import { formatDateKey } from './routineCalculations.ts';

const STORAGE_KEYS = {
  PROFILE: 'prt_profile_v1',
  ROUTINES: 'prt_routines_v1',
  TASKS: 'prt_tasks_v1',
  LOGS: 'prt_logs_v1',
  SETTINGS: 'prt_settings_v1',
  STREAK: 'prt_streak_v1',
  ONBOARDED: 'prt_onboarded_v1',
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'amoled',
  notifications_enabled: false,
  quiet_hours_enabled: true,
  default_reminder_offset: 10,
};

/**
 * Creates seed data for instant testability and autostart support.
 */
export function createSeedData(): AppData {
  const profile: Profile = {
    name: 'Alex Rivera',
    wake_time: '07:00',
    sleep_time: '23:00',
    categories: ['Health', 'Work', 'Fitness', 'Personal'],
    created_at: new Date().toISOString(),
  };

  const routines: Routine[] = [
    {
      id: 'routine_morning_1',
      name: 'Morning Vitality',
      category: 'Health',
      days: [0, 1, 2, 3, 4, 5, 6],
      is_active: true,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'routine_work_1',
      name: 'Deep Focus Work',
      category: 'Work',
      days: [1, 2, 3, 4, 5],
      is_active: true,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'routine_evening_1',
      name: 'Evening Wind-Down',
      category: 'Personal',
      days: [0, 1, 2, 3, 4, 5, 6],
      is_active: true,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task_m1',
      routine_id: 'routine_morning_1',
      title: 'Drink 500ml Water & Electrolytes',
      description: 'Hydrate right away to awaken metabolism.',
      scheduled_time: '07:05',
      duration_minutes: 5,
      priority: 'high',
      is_optional: false,
      reminder_offset: 5,
      order: 1,
    },
    {
      id: 'task_m2',
      routine_id: 'routine_morning_1',
      title: 'Morning Sunlight & Mobility',
      description: '10 min light stretching outdoors.',
      scheduled_time: '07:20',
      duration_minutes: 15,
      priority: 'medium',
      is_optional: false,
      reminder_offset: 10,
      order: 2,
    },
    {
      id: 'task_m3',
      routine_id: 'routine_morning_1',
      title: 'Nutritious High-Protein Breakfast',
      description: 'Fuel body for cognitive output.',
      scheduled_time: '07:45',
      duration_minutes: 25,
      priority: 'medium',
      is_optional: false,
      order: 3,
    },
    {
      id: 'task_w1',
      routine_id: 'routine_work_1',
      title: 'Notification Lockdown & Daily Top 3',
      description: 'Select three priority outcomes.',
      scheduled_time: '09:00',
      duration_minutes: 15,
      priority: 'high',
      is_optional: false,
      reminder_offset: 5,
      order: 1,
    },
    {
      id: 'task_w2',
      routine_id: 'routine_work_1',
      title: 'Deep Work Sprint 1 (Heavy Thinking)',
      description: '90m uninterrupted focus session.',
      scheduled_time: '09:20',
      duration_minutes: 90,
      priority: 'high',
      is_optional: false,
      order: 2,
    },
    {
      id: 'task_w3',
      routine_id: 'routine_work_1',
      title: 'Quick Movement Break',
      description: 'Step away from monitors, walk.',
      scheduled_time: '11:00',
      duration_minutes: 15,
      priority: 'low',
      is_optional: true,
      order: 3,
    },
    {
      id: 'task_e1',
      routine_id: 'routine_evening_1',
      title: 'Screens Off & Digital Sunset',
      description: 'Shut down work machine and laptop.',
      scheduled_time: '21:30',
      duration_minutes: 15,
      priority: 'high',
      is_optional: false,
      reminder_offset: 15,
      order: 1,
    },
    {
      id: 'task_e2',
      routine_id: 'routine_evening_1',
      title: 'Evening Journaling & Reflection',
      description: 'Three wins from today and lesson learned.',
      scheduled_time: '22:00',
      duration_minutes: 15,
      priority: 'low',
      is_optional: true,
      order: 2,
    },
  ];

  // Seed 14 days of realistic history logs for calendar, streak, and 7-day chart
  const logs: CompletionLog[] = [];
  const now = new Date();
  
  // Previous 7 days
  for (let i = 13; i >= 1; i--) {
    const pastDate = new Date(now.getTime() - i * 86400000);
    const dateStr = formatDateKey(pastDate);
    const dayOfWeek = pastDate.getDay();

    // Routine morning tasks
    logs.push({
      id: `seed_m1_${dateStr}`,
      task_id: 'task_m1',
      date: dateStr,
      status: 'done',
      completed_at: `${dateStr}T07:08:00.000Z`,
    });
    logs.push({
      id: `seed_m2_${dateStr}`,
      task_id: 'task_m2',
      date: dateStr,
      status: i === 4 ? 'skipped' : 'done',
      completed_at: i === 4 ? undefined : `${dateStr}T07:35:00.000Z`,
    });
    logs.push({
      id: `seed_m3_${dateStr}`,
      task_id: 'task_m3',
      date: dateStr,
      status: 'done',
      completed_at: `${dateStr}T08:12:00.000Z`,
    });

    // Weekday work tasks
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      logs.push({
        id: `seed_w1_${dateStr}`,
        task_id: 'task_w1',
        date: dateStr,
        status: 'done',
        completed_at: `${dateStr}T09:10:00.000Z`,
      });
      logs.push({
        id: `seed_w2_${dateStr}`,
        task_id: 'task_w2',
        date: dateStr,
        status: i === 2 ? 'missed' : 'done',
        completed_at: i === 2 ? undefined : `${dateStr}T10:55:00.000Z`,
      });
    }

    // Evening tasks
    logs.push({
      id: `seed_e1_${dateStr}`,
      task_id: 'task_e1',
      date: dateStr,
      status: 'done',
      completed_at: `${dateStr}T21:42:00.000Z`,
    });
  }

  return {
    profile,
    routines,
    tasks,
    logs,
    settings: DEFAULT_SETTINGS,
    streak: {
      current_streak: 6,
      best_streak: 12,
      last_success_date: formatDateKey(new Date(now.getTime() - 86400000)),
    },
    isOnboarded: true,
  };
}

export function loadAppData(): AppData {
  try {
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';

    const savedOnboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDED);

    if (isAutostart && savedOnboarded !== 'true') {
      const seed = createSeedData();
      saveAppData(seed);
      return seed;
    }

    const rawProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const rawRoutines = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const rawStreak = localStorage.getItem(STORAGE_KEYS.STREAK);

    if (!rawProfile && !rawRoutines) {
      // First time user, not onboarded yet
      return {
        profile: null,
        routines: [],
        tasks: [],
        logs: [],
        settings: DEFAULT_SETTINGS,
        streak: { current_streak: 0, best_streak: 0 },
        isOnboarded: false,
      };
    }

    return {
      profile: rawProfile ? JSON.parse(rawProfile) : null,
      routines: rawRoutines ? JSON.parse(rawRoutines) : [],
      tasks: rawTasks ? JSON.parse(rawTasks) : [],
      logs: rawLogs ? JSON.parse(rawLogs) : [],
      settings: rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS,
      streak: rawStreak ? JSON.parse(rawStreak) : { current_streak: 0, best_streak: 0 },
      isOnboarded: savedOnboarded === 'true',
    };
  } catch (err) {
    console.error('Error loading app data from localStorage:', err);
    return {
      profile: null,
      routines: [],
      tasks: [],
      logs: [],
      settings: DEFAULT_SETTINGS,
      streak: { current_streak: 0, best_streak: 0 },
      isOnboarded: false,
    };
  }
}

export function saveAppData(data: AppData): void {
  try {
    if (data.profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
    }
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(data.routines));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(data.streak));
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, data.isOnboarded ? 'true' : 'false');
  } catch (err) {
    console.error('Error saving app data to localStorage:', err);
  }
}

export function exportDataAsJSON(data: AppData): void {
  const payload = {
    appName: 'Onward — Personal Routine Tracker',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data,
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `onward-backup-${formatDateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseImportJSON(jsonText: string): AppData {
  const parsed = JSON.parse(jsonText);
  const d = parsed.data || parsed;

  if (!d.routines || !Array.isArray(d.routines)) {
    throw new Error('Invalid backup file: missing routines array.');
  }
  if (!d.tasks || !Array.isArray(d.tasks)) {
    throw new Error('Invalid backup file: missing tasks array.');
  }

  return {
    profile: d.profile || null,
    routines: d.routines,
    tasks: d.tasks,
    logs: Array.isArray(d.logs) ? d.logs : [],
    settings: d.settings || DEFAULT_SETTINGS,
    streak: d.streak || { current_streak: 0, best_streak: 0 },
    isOnboarded: Boolean(d.isOnboarded || d.profile),
  };
}

export function clearAllLocalData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
