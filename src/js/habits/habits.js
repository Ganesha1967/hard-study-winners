import { showToast } from '../core/toast.js';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  getDateKey,
  getDaysInMonth,
} from '../core/storage.js';

export const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

/* ===================== STATE ===================== */

let habitsData = null;
let currentHabitMonth = new Date().getMonth();
let currentHabitYear = new Date().getFullYear();

export function getHabitState() {
  return { month: currentHabitMonth, year: currentHabitYear };
}

export function setHabitState(month, year) {
  if (Number.isInteger(month)) currentHabitMonth = month;
  if (Number.isInteger(year)) currentHabitYear = year;
}

export function getHabitsData() {
  return habitsData;
}

function getDefaultHabitsData() {
  return { habits: [], entries: {}, burnout: {}, lastId: 0 };
}

/* ===================== PERSISTENCE ===================== */

export function loadHabitsData() {
  const parsed = loadFromStorage(STORAGE_KEYS.HABITS, null);

  if (parsed && parsed.entries !== undefined) {
    habitsData = parsed;
    if (!habitsData.burnout) habitsData.burnout = {};
    if (!habitsData.habits) habitsData.habits = [];
    if (habitsData.lastId === undefined) habitsData.lastId = 0;

    let migrated = false;
    habitsData.habits.forEach((h) => {
      if (h.month === undefined || h.year === undefined) {
        h.month = currentHabitMonth;
        h.year = currentHabitYear;
        migrated = true;
      }
    });
    if (migrated) saveHabitsData();
    return;
  }

  habitsData = getDefaultHabitsData();
  saveHabitsData();
}

export function saveHabitsData() {
  saveToStorage(STORAGE_KEYS.HABITS, habitsData);
}

/* ===================== SELECTORS ===================== */

export function getHabitsForCurrentMonth() {
  if (!habitsData) return [];
  return habitsData.habits.filter(
    (h) => h.month === currentHabitMonth && h.year === currentHabitYear,
  );
}

export function isHabitCompleted(habitId, year, month, day) {
  const dateKey = getDateKey(year, month, day);
  return habitsData?.entries?.[dateKey]?.[habitId] === true;
}

export function getHabitCompletionCount(habitId, year, month) {
  const days = getDaysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (isHabitCompleted(habitId, year, month, d)) count++;
  }
  return count;
}

export function getHabitCompletionPercent(habitId, year, month) {
  const days = getDaysInMonth(year, month);
  return Math.round((getHabitCompletionCount(habitId, year, month) / days) * 100);
}

/* ===================== MUTATIONS ===================== */

export function toggleHabitDay(habitId, year, month, day) {
  const dateKey = getDateKey(year, month, day);
  if (!habitsData.entries[dateKey]) habitsData.entries[dateKey] = {};
  habitsData.entries[dateKey][habitId] = !habitsData.entries[dateKey][habitId];

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
}

/* ===================== DRAG & DROP ===================== */

let draggedHabitId = null;

export function handleDragStart(e) {
  const row = e.currentTarget;
  draggedHabitId = row.dataset.habitId;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedHabitId);

  row.classList.add('dragging');
}

export function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

export function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

export function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const targetRow = e.currentTarget;
  targetRow.classList.remove('drag-over');

  const targetHabitId = targetRow.dataset.habitId;
  if (draggedHabitId === targetHabitId || !draggedHabitId) return;

  const monthHabits = getHabitsForCurrentMonth();
  const fromIndex = monthHabits.findIndex((h) => h.id === draggedHabitId);
  const toIndex = monthHabits.findIndex((h) => h.id === targetHabitId);
  if (fromIndex === -1 || toIndex === -1) return;

  const habitToMove = habitsData.habits.find((h) => h.id === draggedHabitId);
  if (!habitToMove) return;

  const currentGlobalIndex = habitsData.habits.indexOf(habitToMove);
  habitsData.habits.splice(currentGlobalIndex, 1);

  const targetHabit = habitsData.habits.find((h) => h.id === targetHabitId);
  const targetGlobalIndex = habitsData.habits.indexOf(targetHabit);
  habitsData.habits.splice(targetGlobalIndex, 0, habitToMove);

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Порядок привычек изменён', 'success');
}

export function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
  draggedHabitId = null;
}

/* ===================== RENDER: TABLE ===================== */

export function renderHabitsTable() {
  const container = document.getElementById('habits-table-container');
  if (!container) return;

  const { month, year } = getHabitState();
  const days = getDaysInMonth(year, month);
  const today = new Date();
  const monthHabits = getHabitsForCurrentMonth();

  if (monthHabits.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center">
        <div class="text-4xl mb-3">📝</div>
        <p class="text-white/60 text-sm mb-4">В ${MONTH_NAMES[month].toLowerCase()}е ${year} года пока нет привычек</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button onclick="addNewHabit()" class="action-btn px-4 py-2 rounded-xl text-sm">
            <i class="fas fa-plus mr-2"></i>Добавить привычку
          </button>
          <button onclick="copyHabitsFromPreviousMonth()" class="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:border-purple-400/50 hover:bg-purple-500/10 text-white/70 hover:text-purple-400 transition-all">
            <i class="fas fa-copy mr-2"></i>Копировать из прошлого месяца
          </button>
        </div>
      </div>`;
    return;
  }

  let html = `<table>
    <thead>
      <tr>
        <th class="sticky-col" style="min-width:220px; text-align:left; padding-left:12px;">
          <span class="text-[#D8B2FE]/40 text-[9px] uppercase font-bold tracking-widest">Привычка</span>
          <span class="text-[#D8B2FE]/20 text-[8px] font-normal ml-2">(перетащите для сортировки)</span>
        </th>`;

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday =
      year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

    html += `
      <th class="${isWeekend ? 'text-red-400/40' : ''} ${isToday ? 'text-purple-300' : ''}" style="text-align:center; min-width:38px;">
        <div class="day-header">
          <span class="day-name">${dayNames[dow]}</span>
          <span class="day-number">${d}</span>
        </div>
      </th>`;
  }

  html += `
        <th style="text-align:center; padding-right:12px; min-width:70px;">
          <span class="text-[#D8B2FE]/40 text-[9px] uppercase font-bold tracking-widest">✕</span>
        </th>
      </tr>
    </thead>
    <tbody>`;

  monthHabits.forEach((habit, index) => {
    const percent = getHabitCompletionPercent(habit.id, year, month);
    const count = getHabitCompletionCount(habit.id, year, month);
    const totalDays = getDaysInMonth(year, month);

    let colorClass = 'red';
    let percentClass = 'text-red-400';
    if (percent >= 80) {
      colorClass = 'emerald';
      percentClass = 'text-emerald-400';
    } else if (percent >= 50) {
      colorClass = 'amber';
      percentClass = 'text-amber-400';
    }

    html += `
      <tr draggable="true"
          data-habit-id="${habit.id}"
          data-index="${index}"
          ondragstart="handleDragStart(event)"
          ondragover="handleDragOver(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleDrop(event)"
          ondragend="handleDragEnd(event)"
          class="habit-row">
        <td class="sticky-col" style="padding:6px 0;">
          <div class="habit-name-cell">
            <div class="name" onclick="renameHabit('${habit.id}')" title="${habit.name} (нажмите для переименования)">
              <i class="fas fa-grip-vertical drag-handle mr-1.5 opacity-20 group-hover:opacity-60 cursor-grab text-[11px]"></i>
              <span class="habit-title-text">${habit.name}</span>
              <i class="fas fa-pen text-[9px] opacity-0 group-hover:opacity-40 transition-opacity ml-auto"></i>
            </div>
            <div class="meta">
              <span class="percent ${percentClass}">${percent}%</span>
              <span class="count">${count}/${totalDays} дн</span>
            </div>
            <div class="habit-row-progress">
              <div class="fill ${colorClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        </td>`;

    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const completed = isHabitCompleted(habit.id, year, month, d);
      const isToday =
        year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
      const isFuture =
        year > today.getFullYear() ||
        (year === today.getFullYear() && month > today.getMonth()) ||
        (year === today.getFullYear() && month === today.getMonth() && d > today.getDate());

      let btnClass = 'habit-day-btn';
      if (completed) btnClass += ' completed';
      if (isToday) btnClass += ' today';
      if (isWeekend) btnClass += ' weekend';
      if (isFuture) btnClass += ' opacity-30 cursor-not-allowed';

      html += `
        <td style="text-align:center; ${isWeekend ? 'background: rgba(255,0,80,0.03);' : ''} ${isToday ? 'background: rgba(125,87,191,0.10); border-radius:10px;' : ''}">
          <button onclick="toggleHabitDay('${habit.id}', ${year}, ${month}, ${d})" class="${btnClass}" ${isFuture ? 'disabled' : ''}>
            ${completed ? '<i class="fas fa-check" style="font-size:12px;"></i>' : ''}
          </button>
        </td>`;
    }

    html += `
        <td style="text-align:right; padding-right:8px;">
          <div class="actions-cell">
            <button onclick="deleteHabit('${habit.id}')" class="delete-btn" title="Удалить привычку">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* ===================== RENDER: PROGRESS CARDS ===================== */

export function renderHabitsProgress() {
  const container = document.getElementById('habits-progress-container');
  if (!container) return;

  const { month, year } = getHabitState();
  const monthHabits = getHabitsForCurrentMonth();

  if (monthHabits.length === 0) {
    container.innerHTML = `<p class="text-white/40 text-sm col-span-full text-center py-4">Нет привычек в ${MONTH_NAMES[month].toLowerCase()}е ${year}. Добавьте первую!</p>`;
    return;
  }

  let html = '';
  monthHabits.forEach((habit) => {
    const percent = getHabitCompletionPercent(habit.id, year, month);
    const count = getHabitCompletionCount(habit.id, year, month);
    const totalDays = getDaysInMonth(year, month);

    let textClass = 'text-red-400';
    let bgClass = 'bg-red-400';
    let borderHoverClass = 'hover:border-red-400/40';

    if (percent >= 80) {
      textClass = 'text-emerald-400';
      bgClass = 'bg-emerald-400';
      borderHoverClass = 'hover:border-emerald-400/40';
    } else if (percent >= 50) {
      textClass = 'text-amber-400';
      bgClass = 'bg-amber-400';
      borderHoverClass = 'hover:border-amber-400/40';
    }

    html += `
      <div class="bg-white/5 p-3.5 rounded-2xl border border-white/5 ${borderHoverClass} transition-all">
        <div class="flex justify-between items-center text-xs mb-2 gap-2">
          <span class="text-white/90 font-medium truncate cursor-pointer hover:text-glow-lavender transition-colors flex items-center gap-1.5"
                onclick="renameHabit('${habit.id}')" title="Нажмите для переименования">
            <span>${habit.name}</span>
            <i class="fas fa-pen text-[9px] opacity-40 hover:opacity-100"></i>
          </span>
          <span class="${textClass} font-bold font-mono whitespace-nowrap">${percent}% <span class="text-white/40 font-normal">(${count}/${totalDays})</span></span>
        </div>
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full ${bgClass} habit-progress-bar rounded-full" style="width: ${percent}%"></div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

/* ===================== CRUD: ADD / RENAME / DELETE ===================== */

export function addNewHabit() {
  const { month, year } = getHabitState();
  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 modal-animate';
  modal.id = 'habit-modal';

  modal.innerHTML = `
    <div class="glass-card p-6 md:p-8 max-w-md w-full border border-purple-500/30 shadow-2xl relative">
      <button onclick="document.getElementById('habit-modal').remove()"
              class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Закрыть">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <h3 class="text-xl font-bold text-white mb-1">Новая привычка</h3>
      <p class="text-white/60 text-xs mb-4">Добавление для ${MONTH_NAMES[month]} ${year}</p>
      <input type="text" id="habit-name-input" placeholder="Например: Чтение 20 минут"
             class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 mb-6 transition-colors">
      <div class="flex justify-end gap-3">
        <button onclick="document.getElementById('habit-modal').remove()"
                class="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all">
          Отмена
        </button>
        <button id="confirm-add-habit" class="action-btn px-5 py-2 rounded-xl text-sm font-bold">
          Добавить
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const input = document.getElementById('habit-name-input');
  input.focus();

  const handleSave = () => {
    const name = input.value.trim();
    if (!name) return showToast('Введите название привычки', 'error');

    habitsData.lastId = (habitsData.lastId || 0) + 1;
    habitsData.habits.push({
      id: `habit_${habitsData.lastId}`,
      name,
      month: currentHabitMonth,
      year: currentHabitYear,
    });

    saveHabitsData();
    renderHabitsTable();
    renderHabitsProgress();
    showToast('Привычка добавлена!', 'success');
    modal.remove();
  };

  document.getElementById('confirm-add-habit').onclick = handleSave;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  });
}

export function renameHabit(habitId) {
  const habit = habitsData.habits.find((h) => h.id === habitId);
  if (!habit) return;

  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 modal-animate';
  modal.id = 'habit-modal';

  modal.innerHTML = `
    <div class="glass-card p-6 md:p-8 max-w-md w-full border border-purple-500/30 shadow-2xl relative">
      <button onclick="document.getElementById('habit-modal').remove()"
              class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Закрыть">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <h3 class="text-xl font-bold text-white mb-4">Переименовать привычку</h3>
      <input type="text" id="habit-rename-input" value="${habit.name.replace(/"/g, '&quot;')}"
             class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 mb-6 transition-colors">
      <div class="flex justify-end gap-3">
        <button onclick="document.getElementById('habit-modal').remove()"
                class="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all">
          Отмена
        </button>
        <button id="confirm-rename-habit" class="action-btn px-5 py-2 rounded-xl text-sm font-bold">
          Сохранить
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const input = document.getElementById('habit-rename-input');
  input.focus();
  input.select();

  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) return showToast('Введите название', 'error');
    if (newName === habit.name) return modal.remove();

    habit.name = newName;
    saveHabitsData();
    renderHabitsTable();
    renderHabitsProgress();
    showToast('Привычка переименована!', 'success');
    modal.remove();
  };

  document.getElementById('confirm-rename-habit').onclick = handleSave;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  });
}

export function deleteHabit(habitId) {
  if (!confirm('Удалить эту привычку? Все данные по ней будут потеряны.')) return;

  habitsData.habits = habitsData.habits.filter((h) => h.id !== habitId);
  Object.keys(habitsData.entries).forEach((dateKey) => {
    delete habitsData.entries[dateKey][habitId];
  });

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Привычка удалена', 'info');
}

export function deleteAllHabits() {
  const { month, year } = getHabitState();
  const monthHabits = getHabitsForCurrentMonth();

  if (monthHabits.length === 0) {
    showToast('Нет привычек для удаления', 'info');
    return;
  }

  if (
    !confirm(
      `Удалить ВСЕ привычки (${monthHabits.length} шт.) за ${MONTH_NAMES[month]} ${year}? Это действие нельзя отменить.`,
    )
  )
    return;

  const habitIds = monthHabits.map((h) => h.id);

  habitsData.habits = habitsData.habits.filter(
    (h) => !(h.month === currentHabitMonth && h.year === currentHabitYear),
  );

  habitIds.forEach((habitId) => {
    Object.keys(habitsData.entries).forEach((dateKey) => {
      delete habitsData.entries[dateKey][habitId];
    });
  });

  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast(`Удалено ${habitIds.length} привычек`, 'info');
}

/* ===================== BACKUP ===================== */

export function exportHabitsData() {
  const dataStr = JSON.stringify(habitsData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habits_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Бэкап привычек успешно скачан!', 'success');
}

export function importHabitsData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.entries === undefined) {
        showToast('Неверный формат файла.', 'error');
        return;
      }

      habitsData = data;
      if (!habitsData.burnout) habitsData.burnout = {};
      if (!habitsData.habits) habitsData.habits = [];
      if (habitsData.lastId === undefined) habitsData.lastId = 0;

      habitsData.habits.forEach((h) => {
        if (h.month === undefined || h.year === undefined) {
          h.month = currentHabitMonth;
          h.year = currentHabitYear;
        }
      });

      saveHabitsData();
      renderHabitsTable();
      renderHabitsProgress();
      window.dispatchEvent(new CustomEvent('habits:imported'));
      showToast('Данные привычек успешно восстановлены!', 'success');
    } catch (err) {
      showToast('Ошибка чтения файла: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
