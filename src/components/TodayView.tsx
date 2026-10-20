import React, { useState } from 'react';
import {
  Check,
  SkipForward,
  RotateCcw,
  Clock,
  Plus,
  Flame,
  CheckCircle2,
  CalendarDays,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Task, CompletionLog, Routine, StreakState, Priority } from '../types/index.ts';
import {
  calculateDailyProgress,
  formatTime12h,
  getNextUpcomingTask,
  isTimedTaskMissed,
} from '../utils/routineCalculations.ts';
import { QuickAddModal } from './QuickAddModal.tsx';

interface TodayViewProps {
  tasks: Task[];
  routines: Routine[];
  logs: CompletionLog[];
  streak: StreakState;
  userName: string;
  onUpdateTaskStatus: (taskId: string, status: 'done' | 'skipped' | 'pending') => void;
  onAddAdhocTask: (task: Task) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  routines,
  logs,
  streak,
  userName,
  onUpdateTaskStatus,
  onAddAdhocTask,
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

  const now = new Date();
  const progress = calculateDailyProgress(tasks, logs);
  const nextTask = getNextUpcomingTask(tasks, logs, now);

  const logMap = new Map<string, CompletionLog>();
  logs.forEach((l) => logMap.set(l.task_id, l));

  const routineMap = new Map<string, Routine>();
  routines.forEach((r) => routineMap.set(r.id, r));

  // Determine tasks with current statuses
  const taskItemsWithStatus = tasks.map((task) => {
    const existingLog = logMap.get(task.id);
    let currentStatus = existingLog ? existingLog.status : 'pending';

    // Auto-detect missed if pending & timed & past 30m grace period (FR-029)
    if (currentStatus === 'pending' && task.scheduled_time) {
      if (isTimedTaskMissed(task.scheduled_time, task.duration_minutes || 15, now, now)) {
        currentStatus = 'missed';
      }
    }

    return {
      task,
      status: currentStatus,
      routine: task.routine_id === 'adhoc_today' ? null : routineMap.get(task.routine_id),
    };
  });

  const filteredTasks = taskItemsWithStatus.filter(({ status }) => {
    if (filterMode === 'pending') return status === 'pending' || status === 'missed';
    if (filterMode === 'completed') return status === 'done' || status === 'skipped';
    return true;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return <span className="text-[11px] font-semibold text-rose-400">High</span>;
      case 'medium':
        return <span className="text-[11px] font-medium text-amber-300">Med</span>;
      case 'low':
        return <span className="text-[11px] font-normal text-neutral-400">Low</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Top Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Today
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {now.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {userName ? ` · Hello, ${userName}` : ''}
          </p>
        </div>

        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Hero Stats Card - Optimized for AMOLED pitch black */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Progress Circular Visual */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  stroke="currentColor"
                  className="text-neutral-900 fill-none"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  className={`fill-none transition-all duration-700 ease-out ${
                    progress.percentage >= 70
                      ? 'text-emerald-400'
                      : progress.percentage > 0
                      ? 'text-amber-400'
                      : 'text-neutral-700'
                  }`}
                  style={{
                    strokeDasharray: `${2 * Math.PI * 40}`,
                    strokeDashoffset: `${
                      2 * Math.PI * 40 * (1 - (progress.percentage || 0) / 100)
                    }`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white tabular-nums tracking-tight">
                  {progress.percentage}%
                </span>
                <span className="text-[10px] uppercase font-medium text-neutral-400 tracking-wider">
                  done
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase font-semibold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-neutral-400" />
                <span>Daily Completion</span>
              </div>
              <div className="text-xl font-semibold text-white mt-1 tabular-nums">
                {progress.mandatoryDone} of {progress.mandatoryTotal} mandatory
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {progress.isSuccessful
                  ? '70% streak goal reached today'
                  : progress.mandatoryTotal > 0
                  ? `${Math.max(0, Math.ceil(progress.mandatoryTotal * 0.7) - progress.mandatoryDone)} more to protect streak`
                  : 'No mandatory tasks scheduled'}
              </p>
            </div>
          </div>

          {/* Current Streak Stat */}
          <div className="flex items-center gap-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
            <div className="p-3 bg-neutral-900 rounded-xl text-amber-500 border border-neutral-800 shrink-0">
              <Flame className="w-6 h-6 fill-amber-500/20" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 font-medium">Daily Streak</div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {streak.current_streak}{' '}
                <span className="text-xs font-normal text-neutral-400">
                  {streak.current_streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Personal Best: <span className="text-neutral-200 tabular-nums">{streak.best_streak} days</span>
              </div>
            </div>
          </div>

          {/* Next Scheduled Task Banner (FR-030) */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next Upcoming</span>
            </div>
            {nextTask ? (
              <div>
                <div className="text-sm font-semibold text-white truncate" title={nextTask.title}>
                  {nextTask.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span>{formatTime12h(nextTask.scheduled_time)}</span>
                  {nextTask.duration_minutes && <span>· {nextTask.duration_minutes}m</span>}
                  {nextTask.is_optional && <span>· optional</span>}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 italic py-1">
                All scheduled tasks completed for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-900">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Tasks ({taskItemsWithStatus.length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'pending'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pending (
            {taskItemsWithStatus.filter((t) => t.status === 'pending' || t.status === 'missed').length}
            )
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'completed'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Done / Skipped (
            {taskItemsWithStatus.filter((t) => t.status === 'done' || t.status === 'skipped').length}
            )
          </button>
        </div>

        <span className="text-xs text-neutral-400 hidden sm:inline">
          {progress.mandatoryTotal} mandatory · {progress.optionalTotal} optional
        </span>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-neutral-950/50 border border-neutral-900">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-white">No tasks match this filter</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {filterMode === 'completed'
              ? 'Mark scheduled tasks as Done or Skipped to see them here.'
              : 'You have caught up with all tasks for this view.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(({ task, status, routine }) => {
            const isDone = status === 'done';
            const isSkipped = status === 'skipped';
            const isMissed = status === 'missed';

            return (
              <div
                key={task.id}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-neutral-950/40 border-neutral-900 text-neutral-400'
                    : isSkipped
                    ? 'bg-neutral-950/30 border-neutral-900/60 text-neutral-500'
                    : isMissed
                    ? 'bg-neutral-950 border-rose-950/60 hover:border-rose-900/60'
                    : 'bg-neutral-950 border-neutral-800/90 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Done Action Button */}
                    <button
                      onClick={() =>
                        onUpdateTaskStatus(task.id, isDone ? 'pending' : 'done')
                      }
                      title={isDone ? 'Undo Done' : 'Mark as Done'}
                      aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'done'}`}
                      className={`min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-950/40'
                          : 'border-neutral-700 bg-neutral-900 hover:border-neutral-500 text-transparent hover:text-neutral-400'
                      }`}
                    >
                      <Check className={`w-5 h-5 stroke-[2.5] ${isDone ? 'text-black' : ''}`} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm sm:text-base font-semibold tracking-tight transition-all ${
                            isDone
                              ? 'line-through text-neutral-500'
                              : isSkipped
                              ? 'line-through text-neutral-500 italic'
                              : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Unboxed Metadata with Typographic Separator */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {getPriorityBadge(task.priority)}
                          {task.is_optional && (
                            <>
                              <span className="text-neutral-600">·</span>
                              <span className="text-neutral-400 text-[11px]">Optional</span>
                            </>
                          )}
                          {isMissed && !isDone && !isSkipped && (
                            <>
                              <span className="text-neutral-600">·</span>
                              <span className="text-rose-400 font-medium text-[11px]">Missed grace period</span>
                            </>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="tabular-nums font-medium text-neutral-300">
                            {formatTime12h(task.scheduled_time)}
                          </span>
                          {task.duration_minutes && (
                            <span className="text-neutral-400">({task.duration_minutes}m)</span>
                          )}
                        </div>

                        {routine && (
                          <>
                            <span className="text-neutral-600">·</span>
                            <span className="text-neutral-400">{routine.name}</span>
                          </>
                        )}

                        {task.routine_id === 'adhoc_today' && (
                          <>
                            <span className="text-neutral-600">·</span>
                            <span className="text-neutral-400">Today only</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Actions (Skip / Undo) */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                    {isDone || isSkipped ? (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'pending')}
                        title="Undo status"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'skipped')}
                        title="Mark as skipped (BR-004)"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={onAddAdhocTask}
      />
    </div>
  );
};
