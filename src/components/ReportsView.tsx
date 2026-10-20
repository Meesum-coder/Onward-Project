import React from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { CompletionLog, Routine, StreakState, Task } from '../types/index.ts';
import {
  formatDateKey,
  getTasksForDate,
  calculateDailyProgress,
  calculateCategoryStats,
  calculateMostSkippedOrMissed,
} from '../utils/routineCalculations.ts';

interface ReportsViewProps {
  routines: Routine[];
  tasks: Task[];
  logs: CompletionLog[];
  streak: StreakState;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  routines,
  tasks,
  logs,
  streak,
}) => {
  const now = new Date();

  // 1. Calculate past 7 days stats (FR-046)
  const last7Days = [];
  let weeklyTotalScheduled = 0;
  let weeklyTotalDone = 0;
  let successfulDaysCount = 0;
  let bestDayName = 'None';
  let bestDayPercentage = -1;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = formatDateKey(d);
    const dayTasks = getTasksForDate(d, routines, tasks);
    const dayLogs = logs.filter((l) => l.date === dateKey);
    const progress = calculateDailyProgress(dayTasks, dayLogs);

    weeklyTotalScheduled += progress.mandatoryTotal;
    weeklyTotalDone += progress.mandatoryDone;
    if (progress.isSuccessful) successfulDaysCount++;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (progress.percentage > bestDayPercentage && progress.mandatoryTotal > 0) {
      bestDayPercentage = progress.percentage;
      bestDayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    }

    last7Days.push({
      dateKey,
      dayName,
      dayNumber: d.getDate(),
      percentage: progress.percentage,
      isSuccessful: progress.isSuccessful,
      doneCount: progress.mandatoryDone,
      totalCount: progress.mandatoryTotal,
      isToday: i === 0,
    });
  }

  // 2. Weekly Consistency Rate (FR-049)
  const weeklyRate =
    weeklyTotalScheduled > 0
      ? Math.round((weeklyTotalDone / weeklyTotalScheduled) * 100)
      : 0;

  // 3. Category-wise performance (FR-047)
  const categoryStats = calculateCategoryStats(routines, tasks, logs);

  // 4. Most skipped or missed tasks (FR-048)
  const problemTasks = calculateMostSkippedOrMissed(tasks, logs);

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Reports & Analytics
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Actionable performance insights, habit friction spots, and weekly summaries.
        </p>
      </div>

      {/* Weekly Summary Cards (FR-049) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Weekly Consistency</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">
            {weeklyRate}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {successfulDaysCount} of 7 days &ge; 70%
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Completed Tasks</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">
            {weeklyTotalDone}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Out of {weeklyTotalScheduled} scheduled
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">
            {streak.current_streak} <span className="text-xs font-normal text-neutral-400">days</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Best streak: {streak.best_streak} days
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-neutral-300" />
            <span>Best Day</span>
          </div>
          <div className="text-lg font-bold text-white mt-1 truncate">
            {bestDayName}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {bestDayPercentage >= 0 ? `${bestDayPercentage}% completion` : 'No data yet'}
          </p>
        </div>
      </div>

      {/* 7-Day Completion Chart (FR-046) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-neutral-900">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neutral-300" />
              7-Day Completion Rate
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Daily mandatory task completion against the 70% streak benchmark
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-3 h-0.5 bg-emerald-400"></span>
            <span>70% Target Benchmark</span>
          </div>
        </div>

        {/* Bar Chart Visual */}
        <div className="pt-8 pb-3 relative">
          {/* 70% Benchmark Line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-emerald-500/40 z-0 pointer-events-none"
            style={{ bottom: 'calc(70% + 28px)' }}
          >
            <span className="absolute -top-3.5 right-0 text-[10px] font-mono text-emerald-400 bg-neutral-950 px-1">
              70%
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 relative z-10">
            {last7Days.map((d) => {
              const isOverTarget = d.percentage >= 70;
              const heightPercent = Math.max(8, d.percentage);

              return (
                <div key={d.dateKey} className="flex flex-col items-center h-full justify-end group">
                  {/* Hover tooltip label */}
                  <span className="text-[10px] font-mono text-neutral-400 mb-1.5 tabular-nums">
                    {d.percentage}%
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[36px] bg-neutral-900 rounded-t-xl overflow-hidden flex flex-col justify-end h-32 relative">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isOverTarget
                          ? 'bg-emerald-400 shadow-md shadow-emerald-950/30'
                          : d.percentage > 0
                          ? 'bg-amber-400'
                          : 'bg-neutral-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Day label */}
                  <div className="text-center mt-2.5">
                    <span
                      className={`text-xs block font-semibold ${
                        d.isToday ? 'text-white' : 'text-neutral-400'
                      }`}
                    >
                      {d.dayName}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {d.doneCount}/{d.totalCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Category Performance & Most Skipped Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category-Wise Performance (FR-047) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-neutral-900">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-300" />
              Category Performance
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Completion consistency broken down by life area
            </p>
          </div>

          {categoryStats.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs italic">
              No category history logged yet.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200">{cat.category}</span>
                    <span className="tabular-nums font-mono text-neutral-400">
                      {cat.completed}/{cat.total} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.percentage >= 70
                          ? 'bg-emerald-400'
                          : cat.percentage > 40
                          ? 'bg-amber-400'
                          : 'bg-neutral-700'
                      }`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Skipped or Missed Tasks (FR-048) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-neutral-900">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Friction Habits
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tasks most frequently skipped or missed
            </p>
          </div>

          {problemTasks.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs italic">
              No skipped or missed tasks found. Clean consistency!
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {problemTasks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-white truncate block">
                      {item.taskTitle}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {item.skippedCount} skipped · {item.missedCount} missed
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/40 font-mono text-[11px]">
                      {item.totalProblems} times
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
