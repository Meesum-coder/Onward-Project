import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, Clock, Compass } from 'lucide-react';
import { Profile, Routine, Task } from '../types/index.ts';
import { BUILT_IN_TEMPLATES } from '../data/templates.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: { profile: Profile; selectedRoutines: Routine[]; tasks: Task[] }) => void;
}

const AVAILABLE_CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Work',
  'Personal',
  'Mindfulness',
  'Creative',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [wakeTime, setWakeTime] = useState<string>('07:00');
  const [sleepTime, setSleepTime] = useState<string>('23:00');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Health',
    'Work',
    'Personal',
  ]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([
    'template_morning_vitality',
  ]);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleFinish = (skipTemplates: boolean = false) => {
    const profileName = name.trim() || 'Friend';
    const profile: Profile = {
      name: profileName,
      wake_time: wakeTime,
      sleep_time: sleepTime,
      categories: selectedCategories.length > 0 ? selectedCategories : ['General'],
      created_at: new Date().toISOString(),
    };

    const newRoutines: Routine[] = [];
    const newTasks: Task[] = [];

    if (!skipTemplates && selectedTemplateIds.length > 0) {
      selectedTemplateIds.forEach((tId) => {
        const tmpl = BUILT_IN_TEMPLATES.find((t) => t.id === tId);
        if (tmpl) {
          const routineId = `routine_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          newRoutines.push({
            id: routineId,
            name: tmpl.name,
            category: tmpl.category,
            days: tmpl.days,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          tmpl.tasks.forEach((t, idx) => {
            newTasks.push({
              ...t,
              id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
              routine_id: routineId,
            });
          });
        }
      });
    }

    onComplete({ profile, selectedRoutines: newRoutines, tasks: newTasks });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-neutral-100 my-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-900 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Setup {step} of 3
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-neutral-600' : 'w-2 bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Name and Sleeping Hours */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0e0e11] border border-[#23232a] flex items-center justify-center shrink-0 shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7"
                  >
                    <path d="M5.5 6.5L10 12L5.5 17.5" stroke="#4d7c1b" />
                    <path d="M12.5 6.5L17 12L12.5 17.5" stroke="#84cc16" />
                  </svg>
                </div>
                <div>
                  <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight text-white leading-none">
                    Onward
                  </h2>
                  <span className="text-[11px] tracking-wider uppercase text-neutral-400 font-medium block mt-1">
                    One routine at a time
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                Build high-leverage habits without friction. Clean, distraction-free, and stored locally on your device.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="user-name" className="block text-xs font-medium text-neutral-300 mb-2">
                  What is your name?
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wake-time" className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    Wake-Up Time
                  </label>
                  <input
                    id="wake-time"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="sleep-time" className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    Sleep Time
                  </label>
                  <input
                    id="sleep-time"
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  />
                </div>
              </div>
              <p className="text-[12px] text-neutral-400">
                Quiet hours automatically silence routine reminders while you are sleeping.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Compass className="w-6 h-6 text-neutral-300" />
                Select Focus Categories
              </h2>
              <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
                What areas of your daily routine would you like to prioritize?
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-neutral-800 border-neutral-600 text-white shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                Choose Templates
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Starter Routine Templates */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-neutral-300" />
                Starter Routines
              </h2>
              <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
                Pick curated routine templates to get started, or skip to build your own from scratch.
              </p>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {BUILT_IN_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateIds.includes(tmpl.id);
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => toggleTemplate(tmpl.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-600 text-white'
                        : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                    }`}
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
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-white border-white text-black' : 'border-neutral-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-neutral-900">
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="text-xs text-neutral-400 hover:text-white underline underline-offset-4 py-2"
              >
                Skip templates, start empty
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  className="px-6 py-3 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 transition-colors shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
