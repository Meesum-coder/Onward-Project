import type { Task, CompletionLog, Routine, StreakState } from '../types/index.ts';

/**
 * Returns YYYY-MM-DD string for a Date in local time.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats HH:mm string (24h) to 12h AM/PM display string.
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return 'All Day';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Returns tasks scheduled for a given date.
 * Matches tasks by routine's active status and scheduled days of the week,
 * plus any ad-hoc tasks created for today (routine_id === 'adhoc_today').
 */
export function getTasksForDate(
  date: Date,
  routines: Routine[],
  tasks: Task[]
): Task[] {
  const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
  const activeRoutineIds = new Set(
    routines.filter((r) => r.is_active && r.days.includes(dayOfWeek)).map((r) => r.id)
  );

  return tasks
    .filter((task) => activeRoutineIds.has(task.routine_id) || task.routine_id === 'adhoc_today')
    .sort((a, b) => {
      // Fixed time tasks first, sorted by scheduled_time
      if (a.scheduled_time && b.scheduled_time) {
        return a.scheduled_time.localeCompare(b.scheduled_time);
      }
      if (a.scheduled_time && !b.scheduled_time) return -1;
      if (!a.scheduled_time && b.scheduled_time) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
}

/**
 * Calculates progress for a specific day using mandatory scheduled tasks only.
 * FR-035: daily completion percentage using mandatory scheduled tasks only.
 * Returns { mandatoryTotal, mandatoryDone, optionalTotal, optionalDone, percentage, totalCount, doneCount }
 */
export function calculateDailyProgress(
  scheduledTasks: Task[],
  logsForDate: CompletionLog[]
) {
  const logMap = new Map<string, CompletionLog>();
  logsForDate.forEach((log) => logMap.set(log.task_id, log));

  let mandatoryTotal = 0;
  let mandatoryDone = 0;
  let optionalTotal = 0;
  let optionalDone = 0;

  for (const task of scheduledTasks) {
    const status = logMap.get(task.id)?.status ?? 'pending';
    if (task.is_optional) {
      optionalTotal++;
      if (status === 'done') optionalDone++;
    } else {
      mandatoryTotal++;
      if (status === 'done') mandatoryDone++;
    }
  }

  // If there are zero mandatory tasks, but some optional tasks, percentage based on optional
  let percentage = 0;
  if (mandatoryTotal > 0) {
    percentage = Math.round((mandatoryDone / mandatoryTotal) * 100);
  } else if (optionalTotal > 0) {
    percentage = Math.round((optionalDone / optionalTotal) * 100);
  }

  return {
    mandatoryTotal,
    mandatoryDone,
    optionalTotal,
    optionalDone,
    totalCount: mandatoryTotal + optionalTotal,
    doneCount: mandatoryDone + optionalDone,
    percentage,
    isSuccessful: mandatoryTotal > 0 ? (mandatoryDone / mandatoryTotal) >= 0.70 : optionalTotal > 0 && (optionalDone / optionalTotal) >= 0.70,
    isNeutral: mandatoryTotal === 0 && optionalTotal === 0,
  };
}

/**
 * BR-003: A timed task becomes Missed if it is not marked Done or Skipped
 * within 30 minutes after its scheduled end time.
 * @param scheduledTime "HH:mm"
 * @param durationMinutes duration in minutes (default 15)
 * @param currentTime Date object representing the current moment
 * @param taskDate Date object representing the task's date (defaults to today)
 */
export function isTimedTaskMissed(
  scheduledTime: string | undefined,
  durationMinutes: number = 15,
  currentTime: Date,
  taskDate: Date
): boolean {
  if (!scheduledTime) return false;

  const [hoursStr, minutesStr] = scheduledTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return false;

  // Deadline: scheduled time + duration minutes + 30 minutes grace period
  const deadline = new Date(taskDate.getTime());
  deadline.setHours(hours, minutes + durationMinutes + 30, 0, 0);

  return currentTime.getTime() > deadline.getTime();
}

/**
 * Finds the next upcoming timed or pending task for today.
 * FR-030: Show the next upcoming task.
 */
export function getNextUpcomingTask(
  scheduledTasks: Task[],
  logsForDate: CompletionLog[],
  now: Date
): Task | null {
  const logMap = new Map<string, CompletionLog>();
  logsForDate.forEach((log) => logMap.set(log.task_id, log));

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find timed pending task that is >= current time or within grace
  const pendingTasks = scheduledTasks.filter((task) => {
    const status = logMap.get(task.id)?.status ?? 'pending';
    return status === 'pending';
  });

  // Check timed tasks that start today and haven't passed completely
  const upcomingTimed = pendingTasks
    .filter((task) => task.scheduled_time)
    .sort((a, b) => (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? ''))
    .find((task) => {
      const [h, m] = (task.scheduled_time || '00:00').split(':').map(Number);
      const taskStartMinutes = h * 60 + m;
      // If task is within 60 minutes in future, or just about to start, or ongoing
      return taskStartMinutes + (task.duration_minutes || 15) >= currentMinutes;
    });

  if (upcomingTimed) return upcomingTimed;

  // Fallback to first pending task (timed or untimed)
  return pendingTasks[0] || null;
}

/**
 * FR-042: Quiet hours checking. Suppress notifications during sleep time.
 * Handles cases where sleep_time spans past midnight (e.g., 23:00 to 07:00).
 */
export function isWithinQuietHours(
  now: Date,
  wakeTime: string,
  sleepTime: string
): boolean {
  if (!wakeTime || !sleepTime) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const wakeMinutes = wakeH * 60 + wakeM;

  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const sleepMinutes = sleepH * 60 + sleepM;

  if (sleepMinutes < wakeMinutes) {
    // Normal same-day sleep interval (unlikely, e.g. 13:00 to 15:00)
    return currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes;
  } else {
    // Spans midnight: sleep at 23:00, wake at 07:00
    // Quiet hours are: current >= 23:00 OR current < 07:00
    return currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes;
  }
}

/**
 * Calculates current streak and best streak following:
 * - BR-004: Optional tasks are excluded from streak-breaking logic.
 * - BR-005: A day is counted as successful if at least 70% of mandatory tasks are Done.
 * - BR-006: A day with zero mandatory tasks is neutral and does not break the streak.
 * @param historyByDate Map of date string 'YYYY-MM-DD' to daily stats
 * @param todayKey 'YYYY-MM-DD'
 */
export interface DayHistoryRecord {
  mandatoryTotal: number;
  mandatoryDone: number;
  optionalTotal: number;
  optionalDone: number;
}

export function calculateStreaks(
  historyByDate: Record<string, DayHistoryRecord>,
  todayKey: string,
  existingBestStreak: number = 0
): StreakState {
  // Sort date keys ascending
  const dates = Object.keys(historyByDate).sort();
  if (dates.length === 0) {
    return { current_streak: 0, best_streak: existingBestStreak };
  }

  let runningStreak = 0;
  let bestStreak = existingBestStreak;
  let lastSuccessDate: string | undefined = undefined;

  // Evaluate day-by-day streak evolution
  // To handle gaps accurately:
  // Walk from the earliest date to today
  const startDate = new Date(dates[0]);
  const endDate = new Date(todayKey);

  let cur = new Date(startDate);
  while (cur <= endDate) {
    const key = formatDateKey(cur);
    const dayData = historyByDate[key];

    if (!dayData) {
      // Day with no data recorded
      // If cur is today and today hasn't finished yet, don't break current streak yet unless it's past
      if (key !== todayKey) {
        runningStreak = 0;
      }
    } else {
      const isNeutral = dayData.mandatoryTotal === 0;
      const isSuccess = dayData.mandatoryTotal > 0
        ? (dayData.mandatoryDone / dayData.mandatoryTotal) >= 0.70
        : (dayData.optionalTotal > 0 && (dayData.optionalDone / dayData.optionalTotal) >= 0.70);

      if (isSuccess) {
        runningStreak++;
        lastSuccessDate = key;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else if (isNeutral) {
        // BR-006: Neutral day doesn't break the streak, nor does it necessarily increment
        // Keep runningStreak as is
      } else {
        // Mandatory tasks existed but < 70% completed
        if (key === todayKey) {
          // If it's today, it could still be in progress!
          // We don't break until the day is over, unless 0 done and it's already recorded
        } else {
          runningStreak = 0;
        }
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  return {
    current_streak: runningStreak,
    best_streak: Math.max(bestStreak, runningStreak),
    last_success_date: lastSuccessDate,
  };
}

/**
 * Category-wise performance calculation (FR-047).
 */
export function calculateCategoryStats(
  routines: Routine[],
  tasks: Task[],
  logs: CompletionLog[]
): { category: string; total: number; completed: number; percentage: number }[] {
  const routineCategoryMap = new Map<string, string>();
  routines.forEach((r) => routineCategoryMap.set(r.id, r.category || 'General'));

  const logMap = new Map<string, string>();
  logs.forEach((l) => logMap.set(`${l.task_id}_${l.date}`, l.status));

  const categoryTotals: Record<string, { total: number; completed: number }> = {};

  tasks.forEach((t) => {
    const cat = routineCategoryMap.get(t.routine_id) || 'General';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, completed: 0 };
    }
  });

  // Calculate using logs
  logs.forEach((log) => {
    const task = tasks.find((t) => t.id === log.task_id);
    const cat = task ? (routineCategoryMap.get(task.routine_id) || 'General') : 'General';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, completed: 0 };
    }
    categoryTotals[cat].total++;
    if (log.status === 'done') {
      categoryTotals[cat].completed++;
    }
  });

  return Object.entries(categoryTotals).map(([category, stats]) => ({
    category,
    total: stats.total,
    completed: stats.completed,
    percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));
}

/**
 * FR-048: Most skipped or missed tasks report.
 */
export function calculateMostSkippedOrMissed(
  tasks: Task[],
  logs: CompletionLog[]
): { taskTitle: string; skippedCount: number; missedCount: number; totalProblems: number }[] {
  const counts: Record<string, { title: string; skipped: number; missed: number }> = {};

  const taskTitleMap = new Map<string, string>();
  tasks.forEach((t) => taskTitleMap.set(t.id, t.title));

  logs.forEach((log) => {
    if (log.status === 'skipped' || log.status === 'missed') {
      const title = taskTitleMap.get(log.task_id) || 'Unlisted Task';
      if (!counts[log.task_id]) {
        counts[log.task_id] = { title, skipped: 0, missed: 0 };
      }
      if (log.status === 'skipped') counts[log.task_id].skipped++;
      if (log.status === 'missed') counts[log.task_id].missed++;
    }
  });

  return Object.values(counts)
    .map((c) => ({
      taskTitle: c.title,
      skippedCount: c.skipped,
      missedCount: c.missed,
      totalProblems: c.skipped + c.missed,
    }))
    .sort((a, b) => b.totalProblems - a.totalProblems)
    .slice(0, 5);
}
