import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { CompletionLog, Routine, Task } from '../types/index.ts';
import {
  formatDateKey,
  formatTime12h,
  getTasksForDate,
  calculateDailyProgress,
} from '../utils/routineCalculations.ts';

interface CalendarViewProps {
  routines: Routine[];
  tasks: Task[];
  logs: CompletionLog[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  routines,
  tasks,
  logs,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    formatDateKey(new Date())
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayJump = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Selected date object
  const selectedDateParts = selectedDateKey.split('-').map(Number);
  const selectedDate = new Date(
    selectedDateParts[0],
    selectedDateParts[1] - 1,
    selectedDateParts[2]
  );

  // Selected day's tasks & logs
  const selectedTasks = getTasksForDate(selectedDate, routines, tasks);
  const selectedLogs = logs.filter((l) => l.date === selectedDateKey);
  const selectedProgress = calculateDailyProgress(selectedTasks, selectedLogs);

  const selectedLogMap = new Map<string, CompletionLog>();
  selectedLogs.forEach((l) => selectedLogMap.set(l.task_id, l));

  // Build grid days
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = formatDateKey(dateObj);
    const dayTasks = getTasksForDate(dateObj, routines, tasks);
    const dayLogs = logs.filter((l) => l.date === dateKey);
    const dayProgress = calculateDailyProgress(dayTasks, dayLogs);

    calendarCells.push({
      day,
      dateKey,
      progress: dayProgress,
      isToday: dateKey === formatDateKey(new Date()),
      isSelected: dateKey === selectedDateKey,
    });
  }

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            History & Calendar
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Review past routine consistency and track completion over time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTodayJump}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-xl transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-white px-3 min-w-[110px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-neutral-500 pb-3 border-b border-neutral-900">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-3">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty_${idx}`} className="h-12 sm:h-16" />;
            }

            const { day, dateKey, progress, isToday, isSelected } = cell;

            // Determine color code per FR-051:
            // Successful (>= 70% mandatory completed) -> Green / Emerald
            // Partial (< 70% and > 0%) -> Amber
            // Missed (0% completed when mandatory tasks scheduled on a past/today day) -> Rose / Red
            // Future scheduled days / No-task days -> Neutral / Gray
            let dotColor = 'bg-neutral-800';
            let statusLabel = 'No tasks';
            const isFuture = dateKey > formatDateKey(new Date());

            if (progress.mandatoryTotal > 0 || progress.optionalTotal > 0) {
              if (progress.isSuccessful) {
                dotColor = 'bg-emerald-400';
                statusLabel = 'Successful (≥70%)';
              } else if (progress.doneCount > 0) {
                dotColor = 'bg-amber-400';
                statusLabel = 'Partial (<70%)';
              } else if (isFuture) {
                dotColor = 'bg-neutral-700';
                statusLabel = 'Scheduled';
              } else if (isToday) {
                dotColor = 'bg-neutral-600';
                statusLabel = 'In Progress';
              } else {
                dotColor = 'bg-rose-500';
                statusLabel = 'Missed';
              }
            }

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDateKey(dateKey)}
                className={`h-12 sm:h-16 rounded-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all relative ${
                  isSelected
                    ? 'bg-neutral-800 border-2 border-white shadow-lg'
                    : isToday
                    ? 'bg-neutral-900/80 border border-neutral-700'
                    : 'bg-neutral-950/60 border border-neutral-900 hover:border-neutral-700 hover:bg-neutral-900/40'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : isToday ? 'text-white' : 'text-neutral-300'
                  }`}
                >
                  {day}
                </span>

                {/* Status Indicator Dot or Ring */}
                <div className="flex items-center gap-1">
                  <div
                    title={statusLabel}
                    className={`w-2 h-2 rounded-full ${dotColor}`}
                  />
                  {progress.totalCount > 0 && (
                    <span className="text-[10px] text-neutral-400 tabular-nums hidden sm:inline">
                      {isFuture ? `${progress.totalCount} tasks` : `${progress.percentage}%`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-5 mt-5 border-t border-neutral-900 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Successful (&ge;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Partial (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800"></span>
            <span>No tasks scheduled</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details Card (FR-052) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-neutral-400" />
              <h2 className="text-base font-bold text-white">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Task breakdown and logged completion record for this date
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white tabular-nums">
              {selectedProgress.percentage}% Completed
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 tabular-nums">
              {selectedProgress.doneCount} of {selectedProgress.totalCount} tasks
            </span>
          </div>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs italic">
            No routines or tasks were scheduled for this day.
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {selectedTasks.map((t) => {
              const log = selectedLogMap.get(t.id);
              const status = log ? log.status : 'pending';

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : status === 'skipped'
                          ? 'bg-neutral-800 text-neutral-400'
                          : status === 'missed'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}
                    >
                      {status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : status === 'skipped' ? (
                        <span className="text-[10px] font-bold">S</span>
                      ) : status === 'missed' ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{t.title}</span>
                        {t.is_optional && (
                          <span className="text-[10px] text-neutral-400">(optional)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {t.scheduled_time ? formatTime12h(t.scheduled_time) : 'All Day'}
                        {t.duration_minutes ? ` · ${t.duration_minutes}m` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`font-semibold capitalize ${
                        status === 'done'
                          ? 'text-emerald-400'
                          : status === 'skipped'
                          ? 'text-neutral-400'
                          : status === 'missed'
                          ? 'text-rose-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {status}
                    </span>
                    {log?.completed_at && (
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {new Date(log.completed_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
