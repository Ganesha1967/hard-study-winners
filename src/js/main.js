/**
 * Hard Study Winners — точка входа.
 */

import * as Tabs from './core/tabs.js';
import * as Toast from './core/toast.js';
import * as Archive from './archive/archive.js';

import * as Habits from './habits/habits.js';
import * as Months from './habits/months.js';
import * as Burnout from './habits/burnout.js';

import * as Timer from './timer/timer.js';
import * as Calendar from './timer/calendar.js';

Object.assign(window, {
  // core
  showTab: Tabs.showTab,
  showMarathonSubTab: Tabs.showMarathonSubTab,
  updateMarathonTimer: Tabs.updateMarathonTimer,
  showToast: Toast.showToast,

  // archive
  openArchiveMarathon: Archive.openArchiveMarathon,
  closeArchiveMarathon: Archive.closeArchiveMarathon,

  // habits
  loadHabitsData: Habits.loadHabitsData,
  saveHabitsData: Habits.saveHabitsData,
  toggleHabitDay: Habits.toggleHabitDay,
  addNewHabit: Habits.addNewHabit,
  renameHabit: Habits.renameHabit,
  deleteHabit: Habits.deleteHabit,
  deleteAllHabits: Habits.deleteAllHabits,
  exportHabitsData: Habits.exportHabitsData,
  importHabitsData: Habits.importHabitsData,
  handleDragStart: Habits.handleDragStart,
  handleDragOver: Habits.handleDragOver,
  handleDragLeave: Habits.handleDragLeave,
  handleDrop: Habits.handleDrop,
  handleDragEnd: Habits.handleDragEnd,

  // months
  changeHabitMonth: Months.changeHabitMonth,
  updateHabitsView: Months.updateHabitsView,
  resetCurrentMonth: Months.resetCurrentMonth,
  copyHabitsFromPreviousMonth: Months.copyHabitsFromPreviousMonth,

  // burnout
  takeBurnoutTest: Burnout.takeBurnoutTest,
  renderBurnoutChart: Burnout.renderBurnoutChart,

  // timer
  toggleStudyTimer: Timer.toggleStudyTimer,
  resetStudyTimer: Timer.resetStudyTimer,
  exportTimerData: Timer.exportTimerData,
  importTimerData: Timer.importTimerData,
  deleteTodayTimerData: Timer.deleteTodayTimerData,
  deleteMonthTimerData: Timer.deleteMonthTimerData,
  deleteAllTimerData: Timer.deleteAllTimerData,

  // calendar
  changeTimerCalendarMonth: Calendar.changeTimerCalendarMonth,
});

/* ---- Глобальное закрытие модалок по Esc ---- */

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  document.getElementById('habit-modal')?.remove();
  document.getElementById('burnout-modal')?.remove();

  const resultModal = document.querySelector('.fixed.inset-0.z-\\[100\\].overflow-y-auto');
  if (resultModal && resultModal.id !== 'habit-modal' && resultModal.id !== 'burnout-modal') {
    resultModal.remove();
  }
});

/* ---- Кастомные события между модулями ---- */

window.addEventListener('habits:imported', () => {
  Burnout.renderBurnoutChart();
});

/* ---- Инициализация ---- */

document.addEventListener('DOMContentLoaded', () => {
  Habits.loadHabitsData();
  Tabs.showTab('info');
});
