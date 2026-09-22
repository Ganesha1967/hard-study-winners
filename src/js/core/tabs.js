import { closeArchiveMarathon } from '../archive/archive.js';
import {
  loadHabitsData,
  renderHabitsTable,
  renderHabitsProgress,
  getHabitState,
} from '../habits/habits.js';
import { renderBurnoutChart } from '../habits/burnout.js';
import { initTimerTab } from '../timer/timer.js';

let isArchiveLoaded = false;

export async function showTab(tabId) {
  const tabs = ['info', 'habits', 'marathon', 'results', 'timer'];

  tabs.forEach((t) => {
    const btn = document.getElementById('btn-' + t);
    if (!btn) return;
    btn.classList.remove('tab-active');
    btn.classList.add('text-white/50');
    btn.setAttribute('aria-selected', 'false');
  });

  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.add('tab-active');
    activeBtn.classList.remove('text-white/50');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  try {
    let html;

    if (tabId === 'habits') {
      const response = await fetch(`./components/habits.html`);
      if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
      html = await response.text();
      contentArea.innerHTML = html;

      loadHabitsData();

      const { month, year } = getHabitState();
      const monthSel = document.getElementById('habit-month-select');
      const yearInp = document.getElementById('habit-year-input');
      if (monthSel) monthSel.value = month;
      if (yearInp) yearInp.value = year;

      renderHabitsTable();
      renderHabitsProgress();
      renderBurnoutChart();
    } else {
      const response = await fetch(`./components/${tabId}.html`);
      if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
      html = await response.text();
      contentArea.innerHTML = html;

      if (tabId === 'marathon') {
        isArchiveLoaded = false;
        updateMarathonTimer();
      } else if (tabId === 'timer') {
        initTimerTab();
      }
    }
  } catch (error) {
    console.error(`[tabs] Ошибка загрузки вкладки "${tabId}":`, error);
    contentArea.innerHTML = `
      <div class="text-center text-red-400 py-12">
        <div class="font-bold mb-2">Ошибка загрузки вкладки "${tabId}"</div>
        <div class="text-xs text-white/60 font-mono">${error.message}</div>
      </div>`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showMarathonSubTab(subTabId) {
  const activeSection = document.getElementById('marathon-active');
  const archiveSection = document.getElementById('marathon-archive');
  const activeBtn = document.getElementById('sub-btn-active');
  const archiveBtn = document.getElementById('sub-btn-archive');

  if (!activeSection || !archiveSection || !activeBtn || !archiveBtn) return;

  if (subTabId === 'active') {
    activeSection.classList.remove('hidden');
    archiveSection.classList.add('hidden');

    activeBtn.className = 'sub-tab-active text-white cursor-pointer relative';
    archiveBtn.className = 'text-white/50 hover:text-white transition-all cursor-pointer relative';
    activeBtn.setAttribute('aria-selected', 'true');
    archiveBtn.setAttribute('aria-selected', 'false');
  } else {
    activeSection.classList.add('hidden');
    archiveSection.classList.remove('hidden');

    archiveBtn.className = 'sub-tab-active text-white cursor-pointer relative';
    activeBtn.className = 'text-white/50 hover:text-white transition-all cursor-pointer relative';
    archiveBtn.setAttribute('aria-selected', 'true');
    activeBtn.setAttribute('aria-selected', 'false');

    closeArchiveMarathon();

    if (!isArchiveLoaded) {
      fetch('./components/archive.html')
        .then((response) => {
          if (!response.ok) throw new Error('Ошибка загрузки файла архива');
          return response.text();
        })
        .then((html) => {
          const placeholder = document.getElementById('archive-placeholder');
          if (placeholder) {
            placeholder.className = 'space-y-6';
            placeholder.innerHTML = html;
            isArchiveLoaded = true;
          }
        })
        .catch((err) => {
          console.error('[tabs] Ошибка загрузки архива:', err);
          const placeholder = document.getElementById('archive-placeholder');
          if (placeholder) {
            placeholder.innerHTML =
              '<p class="text-red-400 font-mono text-xs py-4">Не удалось загрузить архив. Пожалуйста, обновите страницу.</p>';
          }
        });
    }
  }
}

export function updateMarathonTimer() {
  const timerElement = document.getElementById('marathon-timer');
  if (!timerElement) return;

  const now = new Date();
  const mskOffset = 3 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const mskNow = new Date(utc + mskOffset);
  const mskDeadline = new Date(mskNow);
  mskDeadline.setHours(23, 59, 0, 0);

  if (mskNow >= mskDeadline) {
    mskDeadline.setDate(mskDeadline.getDate() + 1);
  }

  const diff = mskDeadline - mskNow;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (num) => String(num).padStart(2, '0');

  timerElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

setInterval(updateMarathonTimer, 1000);
