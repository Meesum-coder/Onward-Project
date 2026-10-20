import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { Priority, Task } from '../types/index.ts';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Task) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [isTimed, setIsTimed] = useState(true);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('15');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isOptional, setIsOptional] = useState(false);
  const [reminderOffset, setReminderOffset] = useState<number>(10);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    const newTask: Task = {
      id: `task_adhoc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      routine_id: 'adhoc_today',
      title: title.trim(),
      scheduled_time: isTimed ? time : undefined,
      duration_minutes: isTimed ? parseInt(duration, 10) || 15 : undefined,
      priority,
      is_optional: isOptional,
      reminder_offset: isTimed ? reminderOffset : undefined,
      order: 999,
    };

    onAdd(newTask);
    setTitle('');
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <h3 id="quick-add-title" className="text-base font-semibold text-white">
            Add Task for Today
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Task Title *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Call dentist or Review PR"
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 text-sm transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-y border-neutral-900">
            <span className="text-xs font-medium text-neutral-300">Set scheduled time</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
            </label>
          </div>

          {isTimed && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label htmlFor="task-time" className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Time
                </label>
                <input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label htmlFor="task-duration" className="block text-xs font-medium text-neutral-400 mb-1">
                  Duration (min)
                </label>
                <input
                  id="task-duration"
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-neutral-400 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {isTimed && (
              <div>
                <label htmlFor="task-reminder" className="block text-xs font-medium text-neutral-400 mb-1">
                  Reminder Offset
                </label>
                <select
                  id="task-reminder"
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-500"
                >
                  <option value={5}>5 min before</option>
                  <option value={10}>10 min before</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="is-optional"
              type="checkbox"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
            />
            <label htmlFor="is-optional" className="text-xs text-neutral-300">
              Optional task (does not affect daily streak calculation)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors"
            >
              Add to Today
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
