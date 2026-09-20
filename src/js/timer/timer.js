import { showToast } from '../core/toast.js';
import { STORAGE_KEYS, loadFromStorage, saveToStorage, getTodayKey } from '../core/storage.js';

let timerData = { sessions: [] };
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

/* ===================== PERSISTENCE ===================== */

export function loadTimerData() {
  const parsed = loadFromStorage(STORAGE_KEYS.TIMER, null);
  if (parsed?.sessions) timerData = parsed;
}

export function saveTimerData() {
  saveToStorage(STORAGE_KEYS.TIMER, timerData);
}

export function getTimerSessions() {
  return timerData.sessions;
}

export function replaceTimerData(newData) {
  timerData = newData;
  saveTimerData();
}

/* ===================== INIT ===================== */

export function initTimerTab() {
  loadTimerData();
  updateTimerStats();
  // calendar импортируется ниже во избежание цикла
  import('./calendar.js').then(({ renderTimerCalendar }) => {
    renderTimerCalendar();
  });
}

/* ===================== CONTROLS ===================== */

export function toggleStudyTimer() {
  const btnText = document.getElementById('timer-btn-text');
  const btnIcon = document.getElementById('timer-btn-icon');

  if (!isTimerRunning) {
    isTimerRunning = true;
    if (btnText) btnText.textContent = 'Пауза';
    if (btnIcon) btnIcon.className = 'fas fa-pause';

    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  } else {
    isTimerRunning = false;
    clearInterval(timerInterval);
    if (btnText) btnText.textContent = 'Продолжить';
    if (btnIcon) btnIcon.className = 'fas fa-play';
  }
}

export function resetStudyTimer() {
  if (timerSeconds >= 5) {
    const dateKey = getTodayKey();
    const existing = timerData.sessions.findIndex((s) => s.date === dateKey);

    if (existing !== -1) {
      timerData.sessions[existing].durationSeconds += timerSeconds;
    } else {
      timerData.sessions.push({ date: dateKey, durationSeconds: timerSeconds });
    }

    saveTimerData();
    showToast(`Учебная сессия сохранена! (${formatTimeHMS(timerSeconds)})`, 'success');
  }

  isTimerRunning = false;
  clearInterval(timerInterval);
  timerSeconds = 0;

  const btnText = document.getElementById('timer-btn-text');
  const btnIcon = document.getElementById('timer-btn-icon');
  if (btnText) btnText.textContent = 'Старт';
  if (btnIcon) btnIcon.className = 'fas fa-play';

  updateTimerDisplay();
  updateTimerStats();
  import('./calendar.js').then(({ renderTimerCalendar }) => renderTimerCalendar());
}

/* ===================== FORMAT HELPERS ===================== */

export function formatHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatTimeHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) return `${h}ч ${pad(m)}м ${pad(s)}с`;
  if (m > 0) return `${m}м ${pad(s)}с`;
  return `${s}с`;
}

export function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (display) display.textContent = formatHMS(timerSeconds);
}

export function updateTimerStats() {
  const todayKey = getTodayKey();
  // префикс текущего месяца берётся из calendar-модуля — сделаем через динамический импорт,
  // но чтобы не плодить async, просто считаем по всем сессиям с date начинающимся на YYYY-MM текущего месяца
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let todaySec = 0,
    monthSec = 0,
    totalSec = 0;

  timerData.sessions.forEach((s) => {
    totalSec += s.durationSeconds;
    if (s.date === todayKey) todaySec += s.durationSeconds;
    if (s.date.startsWith(monthPrefix)) monthSec += s.durationSeconds;
  });

  const elToday = document.getElementById('study-time-today');
  const elMonth = document.getElementById('study-time-month');
  const elTotal = document.getElementById('study-time-total');
  const elSessions = document.getElementById('study-sessions-total');

  if (elToday) elToday.textContent = formatHMS(todaySec);
  if (elMonth) elMonth.textContent = formatHMS(monthSec);
  if (elTotal) elTotal.textContent = formatHMS(totalSec);
  if (elSessions) elSessions.textContent = timerData.sessions.length;
}

/* ===================== EXPORT / IMPORT ===================== */

export function exportTimerData() {
  loadTimerData();

  if (!timerData.sessions?.length) {
    showToast('Нет данных для экспорта. Сначала запишите несколько сессий.', 'info');
    return;
  }

  try {
    const blob = new Blob([JSON.stringify(timerData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_timer_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Данные таймера успешно скачаны (${timerData.sessions.length} сессий)`, 'success');
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    showToast('Ошибка при экспорте данных', 'error');
  }
}

export function importTimerData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported?.sessions)) {
        showToast('Неверный формат файла JSON', 'error');
        return;
      }

      if (timerData.sessions.length > 0) {
        const ok = confirm(
          `Восстановить данные из файла? Текущие данные (${timerData.sessions.length} сессий) будут заменены.`,
        );
        if (!ok) return;
      }

      replaceTimerData(imported);
      updateTimerStats();
      import('./calendar.js').then(({ renderTimerCalendar }) => renderTimerCalendar());
      showToast(
        `Данные таймера успешно восстановлены! (${timerData.sessions.length} сессий)`,
        'success',
      );
    } catch (err) {
      showToast('Ошибка чтения файла: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ===================== DELETE DATA ===================== */

export function deleteTodayTimerData() {
  const todayKey = getTodayKey();
  const idx = timerData.sessions.findIndex((s) => s.date === todayKey);

  if (idx === -1) {
    showToast('Нет данных за сегодня для удаления', 'info');
    return;
  }

  const sec = timerData.sessions[idx].durationSeconds;
  if (!confirm(`Удалить все записи за сегодня (${formatHMS(sec)})? Это действие нельзя отменить.`))
    return;

  timerData.sessions.splice(idx, 1);
  saveTimerData();
  updateTimerStats();
  import('./calendar.js').then(({ renderTimerCalendar }) => renderTimerCalendar());
  showToast(`Данные за сегодня (${formatHMS(sec)}) удалены`, 'success');
}

export function deleteMonthTimerData() {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthSessions = timerData.sessions.filter((s) => s.date.startsWith(prefix));

  if (!monthSessions.length) {
    showToast('Нет данных за текущий месяц для удаления', 'info');
    return;
  }

  const totalSec = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const count = monthSessions.length;

  if (
    !confirm(
      `Удалить все записи за текущий месяц (${formatHMS(totalSec)}, ${count} сессий)? Это действие нельзя отменить.`,
    )
  )
    return;

  timerData.sessions = timerData.sessions.filter((s) => !s.date.startsWith(prefix));
  saveTimerData();
  updateTimerStats();
  import('./calendar.js').then(({ renderTimerCalendar }) => renderTimerCalendar());
  showToast(`Данные за месяц (${formatHMS(totalSec)}) удалены`, 'success');
}

export function deleteAllTimerData() {
  if (!timerData.sessions.length) {
    showToast('Нет данных для удаления', 'info');
    return;
  }

  const totalSec = timerData.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const count = timerData.sessions.length;

  if (
    !confirm(
      `Удалить ВСЕ данные таймера (${formatHMS(totalSec)}, ${count} сессий)? Это действие нельзя отменить.`,
    )
  )
    return;

  timerData.sessions = [];
  saveTimerData();
  updateTimerStats();
  import('./calendar.js').then(({ renderTimerCalendar }) => renderTimerCalendar());
  showToast('Все данные таймера удалены', 'success');
}

/* ===================== BEFOREUNLOAD AUTOSAVE ===================== */

window.addEventListener('beforeunload', () => {
  if (isTimerRunning && timerSeconds > 5) {
    const dateKey = getTodayKey();
    const idx = timerData.sessions.findIndex((s) => s.date === dateKey);

    if (idx !== -1) {
      timerData.sessions[idx].durationSeconds += timerSeconds;
    } else {
      timerData.sessions.push({ date: dateKey, durationSeconds: timerSeconds });
    }
    saveTimerData();
  }
});
