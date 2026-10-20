export type TaskStatus = 'pending' | 'done' | 'skipped' | 'missed';

export type Priority = 'low' | 'medium' | 'high';

export type ThemeOption = 'amoled' | 'dark' | 'light' | 'system';

export interface Profile {
  name: string;
  wake_time: string; // HH:mm format, e.g. "07:00"
  sleep_time: string; // HH:mm format, e.g. "23:00"
  categories: string[];
  created_at: string;
}

export interface Routine {
  id: string;
  name: string;
  category: string;
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  routine_id: string; // Can be a routine id or 'adhoc_today'
  title: string;
  description?: string;
  scheduled_time?: string; // HH:mm or undefined for all-day
  duration_minutes?: number; // default 15
  priority: Priority;
  is_optional: boolean;
  reminder_offset?: number; // 5, 10, 15, or 30
  order?: number;
}

export interface CompletionLog {
  id: string;
  task_id: string;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  completed_at?: string; // ISO
}

export interface Settings {
  theme: ThemeOption;
  notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  default_reminder_offset: number; // 5, 10, 15, or 30
}

export interface StreakState {
  current_streak: number;
  best_streak: number;
  last_success_date?: string; // YYYY-MM-DD
}

export interface RoutineTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  days: number[];
  tasks: Omit<Task, 'id' | 'routine_id'>[];
}

export interface AppData {
  profile: Profile | null;
  routines: Routine[];
  tasks: Task[];
  logs: CompletionLog[];
  settings: Settings;
  streak: StreakState;
  isOnboarded: boolean;
}
