import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Routine, Task } from '../types/index.ts';
import { BUILT_IN_TEMPLATES } from '../data/templates.ts';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import { formatTime12h } from '../utils/routineCalculations.ts';

interface RoutinesViewProps {
  routines: Routine[];
  tasks: Task[];
  availableCategories: string[];
  onSaveRoutine: (routine: Routine, tasks: Task[]) => void;
  onDeleteRoutine: (routineId: string) => void;
  onDuplicateRoutine: (routineId: string) => void;
  onToggleActive: (routineId: string) => void;
  onApplyTemplate: (templateId: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  tasks,
  availableCategories,
  onSaveRoutine,
  onDeleteRoutine,
  onDuplicateRoutine,
  onToggleActive,
  onApplyTemplate,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const handleOpenCreate = () => {
    setEditingRoutine(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsEditorOpen(true);
  };

  const editingTasks = editingRoutine
    ? tasks.filter((t) => t.routine_id === editingRoutine.id)
    : [];

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Routines
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage your daily systems, schedule days, and sequenced tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Templates</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-neutral-950/60 border border-neutral-900">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-white">No routines configured yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Create your first routine or choose from our battle-tested starter templates.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl border border-neutral-800 transition-colors"
            >
              Browse Templates
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors"
            >
              Create Routine
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {routines.map((routine) => {
            const routineTasks = tasks
              .filter((t) => t.routine_id === routine.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div
                key={routine.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  routine.is_active
                    ? 'bg-neutral-950 border-neutral-800/90 hover:border-neutral-700'
                    : 'bg-neutral-950/40 border-neutral-900 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Routine info */}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {routine.name}
                      </h2>
                      <span className="text-xs text-neutral-400 font-medium">
                        · {routine.category || 'General'}
                      </span>
                    </div>

                    {/* Days of week display */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const isScheduled = routine.days.includes(dayIndex);
                        return (
                          <div
                            key={dayIndex}
                            className={`w-6 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center ${
                              isScheduled
                                ? 'bg-neutral-800 text-white border border-neutral-700'
                                : 'bg-neutral-950 text-neutral-600 border border-neutral-900'
                            }`}
                          >
                            {DAY_LABELS[dayIndex]}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Toggle active and management icons */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-[11px] font-medium text-neutral-400 hidden xs:inline">
                        {routine.is_active ? 'Active' : 'Paused'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={routine.is_active}
                          onChange={() => onToggleActive(routine.id)}
                          aria-label={`Toggle active status for ${routine.name}`}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                      </label>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(routine)}
                      title="Edit routine"
                      aria-label={`Edit ${routine.name}`}
                      className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Duplicate button (FR-014) */}
                    <button
                      onClick={() => onDuplicateRoutine(routine.id)}
                      title="Duplicate routine"
                      aria-label={`Duplicate ${routine.name}`}
                      className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete button (FR-013) */}
                    <button
                      onClick={() => setRoutineToDelete(routine.id)}
                      title="Delete routine"
                      aria-label={`Delete ${routine.name}`}
                      className="p-2 text-red-400 hover:text-red-300 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Task preview strip inside routine card */}
                <div className="mt-4 pt-4 border-t border-neutral-900">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    {routineTasks.length} {routineTasks.length === 1 ? 'Task' : 'Tasks'} in sequence
                  </div>
                  <div className="space-y-1.5">
                    {routineTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-neutral-900/40 text-neutral-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-neutral-500 font-mono text-[10px]">
                            {idx + 1}.
                          </span>
                          <span className="truncate">{t.title}</span>
                          {t.is_optional && (
                            <span className="text-[10px] text-neutral-400 italic">
                              (optional)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400 text-[11px] shrink-0 font-mono">
                          {t.scheduled_time && <span>{formatTime12h(t.scheduled_time)}</span>}
                          {t.duration_minutes && <span>· {t.duration_minutes}m</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Routine Editor Modal */}
      <RoutineEditorModal
        isOpen={isEditorOpen}
        routineToEdit={editingRoutine}
        tasksToEdit={editingTasks}
        availableCategories={availableCategories}
        onClose={() => setIsEditorOpen(false)}
        onSave={onSaveRoutine}
      />

      {/* Delete Confirmation Modal (FR-013) */}
      <ConfirmModal
        isOpen={Boolean(routineToDelete)}
        title="Delete Routine"
        message="Are you sure you want to delete this routine? Past completion logs and streaks will be preserved for analytics."
        confirmLabel="Delete Routine"
        isDestructive={true}
        onConfirm={() => {
          if (routineToDelete) {
            onDeleteRoutine(routineToDelete);
            setRoutineToDelete(null);
          }
        }}
        onCancel={() => setRoutineToDelete(null)}
      />

      {/* Apply Templates Modal (FR-015) */}
      {showTemplatesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative text-neutral-100 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
              <div>
                <h3 id="templates-title" className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-neutral-300" />
                  Built-in Routine Templates
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Choose a template to add to your routines. You can customize all tasks after adding.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
              {BUILT_IN_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{tmpl.name}</span>
                        <span className="text-xs text-neutral-400">· {tmpl.category}</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {tmpl.description}
                      </p>
                      <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                        {tmpl.tasks.length} tasks included
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onApplyTemplate(tmpl.id);
                        setShowTemplatesModal(false);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-900 flex justify-end">
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
