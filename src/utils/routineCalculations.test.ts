import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyProgress,
  isTimedTaskMissed,
  isWithinQuietHours,
  calculateStreaks,
  formatTime12h,
  calculateMostSkippedOrMissed,
} from './routineCalculations.ts';
import type { Task, CompletionLog } from '../types/index.ts';

test('calculateDailyProgress computes percentage based on mandatory tasks only (BR-004, BR-005, FR-035)', () => {
  const tasks: Task[] = [
    { id: '1', routine_id: 'r1', title: 'Task 1', priority: 'high', is_optional: false },
    { id: '2', routine_id: 'r1', title: 'Task 2', priority: 'medium', is_optional: false },
    { id: '3', routine_id: 'r1', title: 'Task 3', priority: 'low', is_optional: false },
    { id: '4', routine_id: 'r1', title: 'Task 4', priority: 'low', is_optional: true }, // Optional
  ];

  // 2 out of 3 mandatory done = 66.7% (rounds to 67%), below 70% threshold
  const logs1: CompletionLog[] = [
    { id: 'l1', task_id: '1', date: '2026-10-20', status: 'done' },
    { id: 'l2', task_id: '2', date: '2026-10-20', status: 'done' },
    { id: 'l3', task_id: '3', date: '2026-10-20', status: 'pending' },
    { id: 'l4', task_id: '4', date: '2026-10-20', status: 'skipped' }, // Skipped optional
  ];

  const res1 = calculateDailyProgress(tasks, logs1);
  assert.equal(res1.mandatoryTotal, 3);
  assert.equal(res1.mandatoryDone, 2);
  assert.equal(res1.optionalTotal, 1);
  assert.equal(res1.percentage, 67);
  assert.equal(res1.isSuccessful, false);

  // Mark 3rd task done -> 3 of 3 mandatory done = 100% -> isSuccessful: true
  const logs2: CompletionLog[] = [
    { id: 'l1', task_id: '1', date: '2026-10-20', status: 'done' },
    { id: 'l2', task_id: '2', date: '2026-10-20', status: 'done' },
    { id: 'l3', task_id: '3', date: '2026-10-20', status: 'done' },
    { id: 'l4', task_id: '4', date: '2026-10-20', status: 'skipped' },
  ];

  const res2 = calculateDailyProgress(tasks, logs2);
  assert.equal(res2.mandatoryDone, 3);
  assert.equal(res2.percentage, 100);
  assert.equal(res2.isSuccessful, true);
});

test('isTimedTaskMissed respects 30 minute grace period after duration (BR-003, FR-029)', () => {
  // Task scheduled at 08:00 with 30 min duration
  // End time is 08:30
  // Grace period 30 mins -> Deadline is 09:00
  const taskDate = new Date(2026, 9, 20);

  // At 08:50 (within grace period) -> NOT missed
  const timeBeforeDeadline = new Date(2026, 9, 20, 8, 50);
  assert.equal(isTimedTaskMissed('08:00', 30, timeBeforeDeadline, taskDate), false);

  // At 09:05 (past deadline) -> Missed
  const timeAfterDeadline = new Date(2026, 9, 20, 9, 5);
  assert.equal(isTimedTaskMissed('08:00', 30, timeAfterDeadline, taskDate), true);

  // Untimed task is never auto-missed by this rule
  assert.equal(isTimedTaskMissed(undefined, 30, timeAfterDeadline, taskDate), false);
});

test('isWithinQuietHours suppresses notifications across midnight (FR-042)', () => {
  const wakeTime = '07:00';
  const sleepTime = '23:00';

  // 23:30 is quiet hours
  const nightTime = new Date(2026, 9, 20, 23, 30);
  assert.equal(isWithinQuietHours(nightTime, wakeTime, sleepTime), true);

  // 05:00 is quiet hours
  const earlyMorning = new Date(2026, 9, 20, 5, 0);
  assert.equal(isWithinQuietHours(earlyMorning, wakeTime, sleepTime), true);

  // 14:00 is awake hours
  const afternoon = new Date(2026, 9, 20, 14, 0);
  assert.equal(isWithinQuietHours(afternoon, wakeTime, sleepTime), false);
});

test('calculateStreaks handles neutral days and 70% threshold (BR-004, BR-005, BR-006)', () => {
  const history = {
    '2026-10-01': { mandatoryTotal: 4, mandatoryDone: 3, optionalTotal: 1, optionalDone: 0 }, // 75% -> success
    '2026-10-02': { mandatoryTotal: 5, mandatoryDone: 4, optionalTotal: 0, optionalDone: 0 }, // 80% -> success
    '2026-10-03': { mandatoryTotal: 0, mandatoryDone: 0, optionalTotal: 0, optionalDone: 0 }, // Neutral day -> doesn't break
    '2026-10-04': { mandatoryTotal: 3, mandatoryDone: 3, optionalTotal: 2, optionalDone: 1 }, // 100% -> success
  };

  const streakResult = calculateStreaks(history, '2026-10-04', 0);
  assert.equal(streakResult.current_streak, 3);
  assert.equal(streakResult.best_streak, 3);
});

test('formatTime12h outputs clean 12-hour format', () => {
  assert.equal(formatTime12h('07:30'), '7:30 AM');
  assert.equal(formatTime12h('13:45'), '1:45 PM');
  assert.equal(formatTime12h('00:15'), '12:15 AM');
  assert.equal(formatTime12h(undefined), 'All Day');
});

test('calculateMostSkippedOrMissed identifies problem habits (FR-048)', () => {
  const tasks: Task[] = [
    { id: 't1', routine_id: 'r1', title: 'Morning Jog', priority: 'high', is_optional: false },
    { id: 't2', routine_id: 'r1', title: 'Evening Reading', priority: 'low', is_optional: true },
  ];
  const logs: CompletionLog[] = [
    { id: 'l1', task_id: 't1', date: '2026-10-18', status: 'skipped' },
    { id: 'l2', task_id: 't1', date: '2026-10-19', status: 'missed' },
    { id: 'l3', task_id: 't2', date: '2026-10-19', status: 'done' },
  ];

  const result = calculateMostSkippedOrMissed(tasks, logs);
  assert.equal(result.length, 1);
  assert.equal(result[0].taskTitle, 'Morning Jog');
  assert.equal(result[0].totalProblems, 2);
});
