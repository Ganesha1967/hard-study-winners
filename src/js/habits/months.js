import { showToast } from '../core/toast.js';
import { getDateKey, getDaysInMonth } from '../core/storage.js';
import {
  getHabitsData,
  saveHabitsData,
  getHabitsForCurrentMonth,
  getHabitState,
  setHabitState,
  renderHabitsTable,
  renderHabitsProgress,
  MONTH_NAMES,
} from './habits.js';
import { renderBurnoutChart } from './burnout.js';

export function changeHabitMonth(delta) {
  let { month, year } = getHabitState();
  month += delta;

  if (month < 0) {
    month = 11;
    year--;
  } else if (month > 11) {
    month = 0;
    year++;
  }

  setHabitState(month, year);

  const monthSel = document.getElementById('habit-month-select');
  const yearInp = document.getElementById('habit-year-input');
  if (monthSel) monthSel.value = month;
  if (yearInp) yearInp.value = year;

  updateHabitsView();
}

export function updateHabitsView() {
  const monthSel = document.getElementById('habit-month-select');
  const yearInp = document.getElementById('habit-year-input');

  const month = monthSel ? parseInt(monthSel.value, 10) : undefined;
  const year = yearInp ? parseInt(yearInp.value, 10) : undefined;
  setHabitState(month, year);

  renderHabitsTable();
  renderHabitsProgress();
  renderBurnoutChart();
}

export function resetCurrentMonth() {
  const { month, year } = getHabitState();
  const habitsData = getHabitsData();

  if (
    !confirm(
      `Сбросить все отметки за ${MONTH_NAMES[month]} ${year}? Привычки останутся, но все галочки будут удалены.`,
    )
  )
    return;

  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const dateKey = getDateKey(year, month, d);
    if (habitsData.entries[dateKey]) delete habitsData.entries[dateKey];
  }

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Данные за месяц сброшены', 'info');
}

export function copyHabitsFromPreviousMonth() {
  const { month: curMonth, year: curYear } = getHabitState();
  const habitsData = getHabitsData();

  let prevMonth = curMonth - 1;
  let prevYear = curYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }

  const prevHabits = habitsData.habits.filter((h) => h.month === prevMonth && h.year === prevYear);

  if (prevHabits.length === 0) {
    showToast(
      `В ${MONTH_NAMES[prevMonth].toLowerCase()}е ${prevYear} нет привычек для копирования`,
      'error',
    );
    return;
  }

  const currentHabits = getHabitsForCurrentMonth();
  if (currentHabits.length > 0) {
    const ok = confirm(
      `В ${MONTH_NAMES[curMonth].toLowerCase()}е уже есть ${currentHabits.length} привычек. ` +
        `Добавить ещё ${prevHabits.length} из ${MONTH_NAMES[prevMonth].toLowerCase()}я ${prevYear}?`,
    );
    if (!ok) return;
  }

  let copiedCount = 0;
  prevHabits.forEach((h) => {
    habitsData.lastId = (habitsData.lastId || 0) + 1;
    habitsData.habits.push({
      id: `habit_${habitsData.lastId}`,
      name: h.name,
      month: curMonth,
      year: curYear,
    });
    copiedCount++;
  });

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast(
    `Скопировано ${copiedCount} привычек из ${MONTH_NAMES[prevMonth].toLowerCase()}я ${prevYear}`,
    'success',
  );
}
