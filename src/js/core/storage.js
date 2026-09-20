export const STORAGE_KEYS = {
  HABITS: 'hard_study_habits_data',
  TIMER: 'hard_study_timer_data',
};

export function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] Ошибка чтения "${key}":`, e);
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[storage] Ошибка сохранения "${key}":`, e);
    return false;
  }
}

export function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayKey() {
  const now = new Date();
  return getDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
