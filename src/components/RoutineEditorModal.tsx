import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Routine, Task, Priority } from '../types/index.ts';

interface RoutineEditorModalProps {
  isOpen: boolean;
  routineToEdit?: Routine | null;
  tasksToEdit?: Task[];
  onClose: () => void;
  onSave: (routine: Routine, tasks: Task[]) => void;
  availableCategories: string[];
}

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  isOpen,
  routineToEdit,
  tasksToEdit = [],
  onClose,
  onSave,
  availableCategories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Personal');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(true);
  const [routineTasks, setRoutineTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<{ name?: string; tasks?: string }>({});

  useEffect(() => {
    if (routineToEdit) {
      setName(routineToEdit.name);
      setCategory(routineToEdit.category || 'Personal');
      setSelectedDays(routineToEdit.days || [1, 2, 3, 4, 5]);
      setIsActive(routineToEdit.is_active);
      setRoutineTasks([...tasksToEdit]);
    } else {
      setName('');
      setCategory('Health');
      setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
      setIsActive(true);
      setRoutineTasks([]);
    }
    setErrors({});
  }, [routineToEdit, tasksToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      routine_id: routineToEdit?.id || 'temp',
      title: '',
      scheduled_time: '08:00',
      duration_minutes: 15,
      priority: 'medium',
      is_optional: false,
      reminder_offset: 10,
      order: routineTasks.length + 1,
    };
    setRoutineTasks([...routineTasks, newTask]);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setRoutineTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setRoutineTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routineTasks.length) return;

    const updated = [...routineTasks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setRoutineTasks(updated);
  };

  const handleSave = () => {
    const errs: { name?: string; tasks?: string } = {};
    if (!name.trim()) {
      errs.name = 'Routine name is required';
    }
    if (routineTasks.length === 0) {
      errs.tasks = 'Add at least one task to this routine';
    } else {
      const emptyTitle = routineTasks.some((t) => !t.title.trim());
      if (emptyTitle) {
        errs.tasks = 'All tasks must have a title';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const routineId =
      routineToEdit?.id || `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const savedRoutine: Routine = {
      id: routineId,
      name: name.trim(),
      category: category.trim() || 'General',
      days: selectedDays,
      is_active: isActive,
      created_at: routineToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const finalTasks = routineTasks.map((t, idx) => ({
      ...t,
      routine_id: routineId,
      order: idx + 1,
    }));

    onSave(savedRoutine, finalTasks);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="routine-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-neutral-100 max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900 shrink-0">
          <div>
            <h2 id="routine-editor-title" className="text-xl font-bold tracking-tight text-white">
              {routineToEdit ? 'Edit Routine' : 'Create New Routine'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure scheduled days, categories, and routine tasks.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Routine Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="routine-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Routine Name *
              </label>
              <input
                id="routine-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Morning Vitality or Deep Work Session"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 text-sm transition-colors"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="routine-category" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                id="routine-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-neutral-500"
              >
                {Array.from(new Set([...availableCategories, 'Health', 'Fitness', 'Work', 'Study', 'Personal', 'Mindfulness'])).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Days of Week Assignment (FR-010) */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Assigned Days of the Week (FR-010)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(({ day, label }) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-11 h-11 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white text-black shadow-md'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active status toggle (FR-011) */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-white block">Routine Status</span>
              <span className="text-[11px] text-neutral-400">
                {isActive ? 'Active (tasks will appear in Today view on scheduled days)' : 'Inactive (paused)'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
            </label>
          </div>

          {/* Tasks Builder (FR-016 - FR-023) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-neutral-400" />
                  Routine Tasks ({routineTasks.length})
                </h3>
                {errors.tasks && (
                  <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.tasks}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {routineTasks.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-neutral-900/40 border border-neutral-900 text-neutral-400 text-xs">
                No tasks added yet. Click &ldquo;Add Task&rdquo; to build your routine sequence.
              </div>
            ) : (
              <div className="space-y-3">
                {routineTasks.map((t, idx) => {
                  const hasTime = Boolean(t.scheduled_time);

                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Task Title */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={t.title}
                            onChange={(e) => handleUpdateTask(t.id, { title: e.target.value })}
                            placeholder="Task name (e.g. Morning 10m walk)"
                            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                          />
                        </div>

                        {/* Reorder and Delete Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveTask(idx, 'up')}
                            disabled={idx === 0}
                            aria-label="Move task up"
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTask(idx, 'down')}
                            disabled={idx === routineTasks.length - 1}
                            aria-label="Move task down"
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            aria-label="Delete task"
                            className="p-1 text-red-400 hover:text-red-300 transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Time and Properties Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        {/* Fixed time toggle / input */}
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Scheduled Time
                          </label>
                          <input
                            type="time"
                            value={t.scheduled_time || ''}
                            onChange={(e) =>
                              handleUpdateTask(t.id, {
                                scheduled_time: e.target.value || undefined,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            min="5"
                            step="5"
                            value={t.duration_minutes || 15}
                            onChange={(e) =>
                              handleUpdateTask(t.id, {
                                duration_minutes: parseInt(e.target.value, 10) || 15,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500"
                          />
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Priority
                          </label>
                          <select
                            value={t.priority}
                            onChange={(e) =>
                              handleUpdateTask(t.id, { priority: e.target.value as Priority })
                            }
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>

                        {/* Reminder Offset */}
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Reminder Offset
                          </label>
                          <select
                            value={t.reminder_offset || 10}
                            disabled={!hasTime}
                            onChange={(e) =>
                              handleUpdateTask(t.id, {
                                reminder_offset: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500 disabled:opacity-40"
                          >
                            <option value={5}>5m before</option>
                            <option value={10}>10m before</option>
                            <option value={15}>15m before</option>
                            <option value={30}>30m before</option>
                          </select>
                        </div>
                      </div>

                      {/* Optional task checkbox and description */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                        <input
                          type="text"
                          value={t.description || ''}
                          onChange={(e) =>
                            handleUpdateTask(t.id, { description: e.target.value })
                          }
                          placeholder="Optional notes or instructions..."
                          className="w-full sm:w-2/3 px-2.5 py-1 bg-transparent border-0 text-neutral-400 text-xs placeholder-neutral-600 focus:outline-none"
                        />

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300 shrink-0">
                          <input
                            type="checkbox"
                            checked={t.is_optional}
                            onChange={(e) =>
                              handleUpdateTask(t.id, { is_optional: e.target.checked })
                            }
                            className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-950 text-white focus:ring-0"
                          />
                          <span>Optional (no streak penalty)</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors shadow-md"
          >
            Save Routine
          </button>
        </div>
      </div>
    </div>
  );
};
