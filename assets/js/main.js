let isArchiveLoaded = false;

async function showTab(tabId) {
  const tabs = ['info', 'habits', 'marathon', 'results', 'timer'];
  tabs.forEach(t => {
    const btn = document.getElementById('btn-' + t);
    if (btn) {
      btn.classList.remove('tab-active');
      btn.classList.add('text-white/50');
      btn.setAttribute('aria-selected', 'false');
    }
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
      const monthSel = document.getElementById('habit-month-select');
      const yearInp = document.getElementById('habit-year-input');
      if (monthSel) monthSel.value = currentHabitMonth;
      if (yearInp) yearInp.value = currentHabitYear;
      
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
    console.error("Не удалось загрузить компонент:", error);
    contentArea.innerHTML = `<div class="text-center text-red-400 py-12">Ошибка загрузки контента. Проверьте соединение.</div>`;
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMarathonSubTab(subTabId) {
  const activeSection = document.getElementById('marathon-active');
  const archiveSection = document.getElementById('marathon-archive');
  const activeBtn = document.getElementById('sub-btn-active');
  const archiveBtn = document.getElementById('sub-btn-archive');

  if (!activeSection || !archiveSection || !activeBtn || !archiveBtn) return;

  if (subTabId === 'active') {
    activeSection.classList.remove('hidden');
    archiveSection.classList.add('hidden');
    activeBtn.className = "sub-tab-active text-white cursor-pointer relative";
    archiveBtn.className = "text-white/50 hover:text-white transition-all cursor-pointer relative";
    activeBtn.setAttribute('aria-selected', 'true');
    archiveBtn.setAttribute('aria-selected', 'false');
  } else {
    activeSection.classList.add('hidden');
    archiveSection.classList.remove('hidden');
    archiveBtn.className = "sub-tab-active text-white cursor-pointer relative";
    activeBtn.className = "text-white/50 hover:text-white transition-all cursor-pointer relative";
    archiveBtn.setAttribute('aria-selected', 'true');
    activeBtn.setAttribute('aria-selected', 'false');
    closeArchiveMarathon();

    if (!isArchiveLoaded) {
      fetch('./components/archive.html') 
        .then(response => {
          if (!response.ok) throw new Error('Ошибка загрузки файла архива');
          return response.text();
        })
        .then(html => {
          const placeholder = document.getElementById('archive-placeholder');
          if (placeholder) {
            placeholder.className = "space-y-6"; 
            placeholder.innerHTML = html;
            isArchiveLoaded = true;
          }
        })
        .catch(err => {
          console.error(err);
          const placeholder = document.getElementById('archive-placeholder');
          if (placeholder) {
            placeholder.innerHTML = 
              '<p class="text-red-400 font-mono text-xs py-4">Не удалось загрузить архив. Пожалуйста, обновите страницу.</p>';
          }
        });
    }
  }
}

async function openArchiveMarathon(marathonId) {
  const listView = document.getElementById('archive-list-view');
  const detailView = document.getElementById('archive-detail-view');
  const dataContainer = document.getElementById('marathon-data-container');

  if (!listView || !detailView || !dataContainer) return;

  dataContainer.innerHTML = '<p class="text-white/50 text-sm font-mono animate-pulse">Загрузка данных архива...</p>';
  listView.classList.add('hidden');
  detailView.classList.remove('hidden');

  try {
    const response = await fetch(`./components/archive/${marathonId}.html`);
    if (!response.ok) throw new Error(`Марафон не найден: ${response.status}`);
    const html = await response.text();
    dataContainer.innerHTML = html;
  } catch (error) {
    console.error(error);
    dataContainer.innerHTML = `
      <div class="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p class="text-red-400 font-bold font-mono text-sm">Не удалось загрузить данные марафона.</p>
      </div>
    `;
  }
}

function closeArchiveMarathon() {
  const listView = document.getElementById('archive-list-view');
  const detailView = document.getElementById('archive-detail-view');
  const dataContainer = document.getElementById('marathon-data-container');

  if (listView && detailView) {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    if (dataContainer) dataContainer.innerHTML = '';
  }
}

function updateMarathonTimer() {
  const timerElement = document.getElementById('marathon-timer');
  if (!timerElement) return;

  const now = new Date();
  const mskOffset = 3 * 60 * 60 * 1000;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
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

// ========== HABITS TRACKER ==========

const HABITS_STORAGE_KEY = 'hard_study_habits_data';
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                     'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function getDefaultHabitsData() {
  return {
    habits: [],
    entries: {},
    burnout: {},
    lastId: 0
  };
}

let habitsData = null;
let currentHabitMonth = new Date().getMonth();
let currentHabitYear = new Date().getFullYear();

function loadHabitsData() {
  try {
    const stored = localStorage.getItem(HABITS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.entries !== undefined) {
        habitsData = parsed;
        if (!habitsData.burnout) habitsData.burnout = {};
        if (!habitsData.habits) habitsData.habits = [];
        if (habitsData.lastId === undefined) habitsData.lastId = 0;
        
        let migrated = false;
        habitsData.habits.forEach(h => {
          if (h.month === undefined || h.year === undefined) {
            h.month = currentHabitMonth;
            h.year = currentHabitYear;
            migrated = true;
          }
        });
        if (migrated) saveHabitsData();
        return;
      }
    }
  } catch (e) {
    console.warn('Ошибка загрузки данных привычек:', e);
  }
  habitsData = getDefaultHabitsData();
  saveHabitsData();
}

function saveHabitsData() {
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habitsData));
  } catch (e) {
    console.warn('Ошибка сохранения данных привычек:', e);
  }
}

function getHabitsForCurrentMonth() {
  return habitsData.habits.filter(h => 
    h.month === currentHabitMonth && h.year === currentHabitYear
  );
}

function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toggleHabitDay(habitId, year, month, day) {
  const dateKey = getDateKey(year, month, day);
  if (!habitsData.entries[dateKey]) {
    habitsData.entries[dateKey] = {};
  }
  habitsData.entries[dateKey][habitId] = !habitsData.entries[dateKey][habitId];
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
}

function isHabitCompleted(habitId, year, month, day) {
  const dateKey = getDateKey(year, month, day);
  return habitsData.entries[dateKey] && habitsData.entries[dateKey][habitId] === true;
}

function getHabitCompletionCount(habitId, year, month) {
  const days = getDaysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (isHabitCompleted(habitId, year, month, d)) count++;
  }
  return count;
}

function getHabitCompletionPercent(habitId, year, month) {
  const days = getDaysInMonth(year, month);
  const completed = getHabitCompletionCount(habitId, year, month);
  return Math.round((completed / days) * 100);
}

// ========== ПЕРЕТАСКИВАНИЕ ПРИВЫЧЕК ==========

let draggedHabitId = null;

function handleDragStart(e) {
  const row = e.currentTarget;
  draggedHabitId = row.dataset.habitId;
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedHabitId);
  
  row.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault(); 
  e.dataTransfer.dropEffect = 'move';
  
  const row = e.currentTarget;
  row.classList.add('drag-over');
}

function handleDragLeave(e) {
  const row = e.currentTarget;
  row.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const targetRow = e.currentTarget;
  targetRow.classList.remove('drag-over');
  
  const targetHabitId = targetRow.dataset.habitId;
  
  if (draggedHabitId === targetHabitId || !draggedHabitId) {
    return;
  }
  
  const monthHabits = getHabitsForCurrentMonth();
  
  const fromIndex = monthHabits.findIndex(h => h.id === draggedHabitId);
  const toIndex = monthHabits.findIndex(h => h.id === targetHabitId);
  
  if (fromIndex === -1 || toIndex === -1) {
    return;
  }
  
  const habitToMove = habitsData.habits.find(h => h.id === draggedHabitId);
  if (!habitToMove) return;
  
  const currentGlobalIndex = habitsData.habits.indexOf(habitToMove);
  habitsData.habits.splice(currentGlobalIndex, 1);
  
  const targetHabit = habitsData.habits.find(h => h.id === targetHabitId);
  const targetGlobalIndex = habitsData.habits.indexOf(targetHabit);
  
  habitsData.habits.splice(targetGlobalIndex, 0, habitToMove);
  
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Порядок привычек изменён', 'success');
}

function handleDragEnd(e) {
  const row = e.currentTarget;
  row.classList.remove('dragging');
  
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  draggedHabitId = null;
}

// ========== РЕНДЕРИНГ ТАБЛИЦЫ ==========

function renderHabitsTable() {
  const container = document.getElementById('habits-table-container');
  if (!container) return;

  const year = currentHabitYear;
  const month = currentHabitMonth;
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
      </div>
    `;
    return;
  }

  let html = `<table>
    <thead>
      <tr>
        <th class="sticky-col" style="min-width:220px; text-align:left; padding-left:12px;">
          <span class="text-[#D8B2FE]/40 text-[9px] uppercase font-bold tracking-widest">Привычка</span>
          <span class="text-[#D8B2FE]/20 text-[8px] font-normal ml-2">(перетащите для сортировки)</span>
        </th>`;
  
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isToday = (year === today.getFullYear() && month === today.getMonth() && d === today.getDate());
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    html += `
      <th class="${isWeekend ? 'text-red-400/40' : ''} ${isToday ? 'text-purple-300' : ''}" style="text-align:center; min-width:38px;">
        <div class="day-header">
          <span class="day-name">${dayNames[dayOfWeek]}</span>
          <span class="day-number">${d}</span>
        </div>
      </th>
    `;
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
        <!-- Первая колонка -->
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
        </td>
    `;
    
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const completed = isHabitCompleted(habit.id, year, month, d);
      const isToday = (year === today.getFullYear() && month === today.getMonth() && d === today.getDate());
      const isFuture = (year > today.getFullYear()) || 
                       (year === today.getFullYear() && month > today.getMonth()) || 
                       (year === today.getFullYear() && month === today.getMonth() && d > today.getDate());
      
      let btnClass = 'habit-day-btn';
      if (completed) btnClass += ' completed';
      if (isToday) btnClass += ' today';
      if (isWeekend) btnClass += ' weekend';
      if (isFuture) btnClass += ' opacity-30 cursor-not-allowed';
      
      html += `
        <td style="text-align:center; ${isWeekend ? 'background: rgba(255,0,80,0.03);' : ''} ${isToday ? 'background: rgba(125,87,191,0.10); border-radius:10px;' : ''}">
          <button 
            onclick="toggleHabitDay('${habit.id}', ${year}, ${month}, ${d})"
            class="${btnClass}"
            ${isFuture ? 'disabled' : ''}
          >
            ${completed ? '<i class="fas fa-check" style="font-size:12px;"></i>' : ''}
          </button>
        </td>
      `;
    }
    
    html += `
        <td style="text-align:right; padding-right:8px;">
          <div class="actions-cell">
            <button onclick="deleteHabit('${habit.id}')" class="delete-btn" title="Удалить привычку">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ========== РЕНДЕРИНГ ПРОГРЕСС-БАРОВ ==========

function renderHabitsProgress() {
  const container = document.getElementById('habits-progress-container');
  if (!container) return;

  const year = currentHabitYear;
  const month = currentHabitMonth;
  const monthHabits = getHabitsForCurrentMonth();
  
  if (monthHabits.length === 0) {
    container.innerHTML = `<p class="text-white/40 text-sm col-span-full text-center py-4">Нет привычек в ${MONTH_NAMES[month].toLowerCase()}е ${year}. Добавьте первую!</p>`;
    return;
  }

  let html = '';
  monthHabits.forEach(habit => {
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
                onclick="renameHabit('${habit.id}')" 
                title="Нажмите для переименования">
            <span>${habit.name}</span>
            <i class="fas fa-pen text-[9px] opacity-40 hover:opacity-100"></i>
          </span>
          <span class="${textClass} font-bold font-mono whitespace-nowrap">${percent}% <span class="text-white/40 font-normal">(${count}/${totalDays})</span></span>
        </div>
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full ${bgClass} habit-progress-bar rounded-full" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ========== УПРАВЛЕНИЕ МЕСЯЦАМИ ==========

function changeHabitMonth(delta) {
  currentHabitMonth += delta;
  if (currentHabitMonth < 0) {
    currentHabitMonth = 11;
    currentHabitYear--;
  } else if (currentHabitMonth > 11) {
    currentHabitMonth = 0;
    currentHabitYear++;
  }
  
  const monthSel = document.getElementById('habit-month-select');
  const yearInp = document.getElementById('habit-year-input');
  if (monthSel) monthSel.value = currentHabitMonth;
  if (yearInp) yearInp.value = currentHabitYear;
  
  updateHabitsView();
}

function updateHabitsView() {
  const monthSel = document.getElementById('habit-month-select');
  const yearInp = document.getElementById('habit-year-input');
  if (monthSel) currentHabitMonth = parseInt(monthSel.value, 10);
  if (yearInp) currentHabitYear = parseInt(yearInp.value, 10);
  
  renderHabitsTable();
  renderHabitsProgress();
  renderBurnoutChart();
}

function resetCurrentMonth() {
  const year = currentHabitYear;
  const month = currentHabitMonth;
  
  if (!confirm(`Сбросить все отметки за ${MONTH_NAMES[month]} ${year}? Привычки останутся, но все галочки будут удалены.`)) return;
  
  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const dateKey = getDateKey(year, month, d);
    if (habitsData.entries[dateKey]) {
      delete habitsData.entries[dateKey];
    }
  }
  
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Данные за месяц сброшены', 'info');
}

function copyHabitsFromPreviousMonth() {
  let prevMonth = currentHabitMonth - 1;
  let prevYear = currentHabitYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }
  
  const prevHabits = habitsData.habits.filter(h => 
    h.month === prevMonth && h.year === prevYear
  );
  
  if (prevHabits.length === 0) {
    showToast(`В ${MONTH_NAMES[prevMonth].toLowerCase()}е ${prevYear} нет привычек для копирования`, 'error');
    return;
  }
  
  const currentHabits = getHabitsForCurrentMonth();
  if (currentHabits.length > 0) {
    if (!confirm(`В ${MONTH_NAMES[currentHabitMonth].toLowerCase()}е уже есть ${currentHabits.length} привычек. Добавить ещё ${prevHabits.length} из ${MONTH_NAMES[prevMonth].toLowerCase()}я ${prevYear}?`)) {
      return;
    }
  }
  
  let copiedCount = 0;
  prevHabits.forEach(h => {
    habitsData.lastId = (habitsData.lastId || 0) + 1;
    habitsData.habits.push({
      id: `habit_${habitsData.lastId}`,
      name: h.name,
      month: currentHabitMonth,
      year: currentHabitYear
    });
    copiedCount++;
  });
  
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast(`Скопировано ${copiedCount} привычек из ${MONTH_NAMES[prevMonth].toLowerCase()}я ${prevYear}`, 'success');
}

// ========== УПРАВЛЕНИЕ ПРИВЫЧКАМИ ==========

function addNewHabit() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 modal-animate';
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
      <p class="text-white/60 text-xs mb-4">Добавление для ${MONTH_NAMES[currentHabitMonth]} ${currentHabitYear}</p>
      
      <input type="text" id="habit-name-input" placeholder="Например: Чтение 20 минут" 
             class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 mb-6 transition-colors">
      
      <div class="flex justify-end gap-3">
        <button onclick="document.getElementById('habit-modal').remove()" 
                class="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all">
          Отмена
        </button>
        <button id="confirm-add-habit" 
                class="action-btn px-5 py-2 rounded-xl text-sm font-bold">
          Добавить
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  const input = document.getElementById('habit-name-input');
  input.focus();

  const handleSave = () => {
    const name = input.value.trim();
    if (!name) {
      showToast('Введите название привычки', 'error');
      return;
    }

    habitsData.lastId = (habitsData.lastId || 0) + 1;
    const newHabit = {
      id: `habit_${habitsData.lastId}`,
      name: name,
      month: currentHabitMonth,
      year: currentHabitYear
    };

    habitsData.habits.push(newHabit);
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

function renameHabit(habitId) {
  const habit = habitsData.habits.find(h => h.id === habitId);
  if (!habit) return;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 modal-animate';
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
        <button id="confirm-rename-habit" 
                class="action-btn px-5 py-2 rounded-xl text-sm font-bold">
          Сохранить
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('habit-rename-input');
  input.focus();
  input.select();

  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      showToast('Введите название', 'error');
      return;
    }
    if (newName === habit.name) {
      modal.remove();
      return;
    }

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

function deleteHabit(habitId) {
  if (!confirm('Удалить эту привычку? Все данные по ней будут потеряны.')) return;
  
  habitsData.habits = habitsData.habits.filter(h => h.id !== habitId);
  
  Object.keys(habitsData.entries).forEach(dateKey => {
    delete habitsData.entries[dateKey][habitId];
  });
  
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast('Привычка удалена', 'info');
}

// ========== УДАЛЕНИЕ ВСЕХ ПРИВЫЧЕК ==========

function deleteAllHabits() {
  const monthHabits = getHabitsForCurrentMonth();
  if (monthHabits.length === 0) {
    showToast('Нет привычек для удаления', 'info');
    return;
  }
  
  if (!confirm(`Удалить ВСЕ привычки (${monthHabits.length} шт.) за ${MONTH_NAMES[currentHabitMonth]} ${currentHabitYear}? Это действие нельзя отменить.`)) {
    return;
  }
  
  const habitIds = monthHabits.map(h => h.id);
  
  habitsData.habits = habitsData.habits.filter(h => 
    !(h.month === currentHabitMonth && h.year === currentHabitYear)
  );
  
  habitIds.forEach(habitId => {
    Object.keys(habitsData.entries).forEach(dateKey => {
      delete habitsData.entries[dateKey][habitId];
    });
  });
  
  saveHabitsData();
  renderHabitsTable();
  renderHabitsProgress();
  showToast(`Удалено ${habitIds.length} привычек`, 'info');
}

// ========== ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ПО ESC ==========

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const habitModal = document.getElementById('habit-modal');
    if (habitModal) {
      habitModal.remove();
    }
    
    const burnoutModal = document.getElementById('burnout-modal');
    if (burnoutModal) {
      burnoutModal.remove();
    }
    
    const resultModal = document.querySelector('.fixed.inset-0.z-\\[100\\].overflow-y-auto');
    if (resultModal && resultModal.id !== 'habit-modal' && resultModal.id !== 'burnout-modal') {
      resultModal.remove();
    }
  }
});

// ========== УВЕДОМЛЕНИЯ ==========

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-red-950/90 border-red-500/40 text-red-200',
    info: 'bg-purple-950/90 border-purple-500/40 text-purple-200'
  };

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2 ${colors[type] || colors.info}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ========== БЭКАП И ВОССТАНОВЛЕНИЕ ПРИВЫЧЕК ==========

function exportHabitsData() {
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

function importHabitsData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.entries !== undefined) {
        habitsData = data;
        if (!habitsData.burnout) habitsData.burnout = {};
        if (!habitsData.habits) habitsData.habits = [];
        if (habitsData.lastId === undefined) habitsData.lastId = 0;
        
        habitsData.habits.forEach(h => {
          if (h.month === undefined || h.year === undefined) {
            h.month = currentHabitMonth;
            h.year = currentHabitYear;
          }
        });
        
        saveHabitsData();
        renderHabitsTable();
        renderHabitsProgress();
        renderBurnoutChart();
        showToast('Данные привычек успешно восстановлены!', 'success');
      } else {
        showToast('Неверный формат файла.', 'error');
      }
    } catch (err) {
      showToast('Ошибка чтения файла: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ========== ТЕСТ НА ВЫГОРАНИЕ ==========

const BURNOUT_QUESTIONS = [
  'Чувствуете физическое истощение даже после полноценного ночного сна?',
  'Чувствуете эмоциональное истощение или «пустоту» к концу дня?',
  'Трудно ли сосредоточиться или удерживать внимание на задачах?',
  'Чувствуете раздражение, нетерпение или фрустрацию из-за работы или обязанностей?',
  'Становится труднее сохранять интерес к работе - появляется цинизм, отстраненность или безразличие?',
  'Чувствуете, что вы стали менее продуктивны или эффективны, чем раньше?',
  'Испытываете трудности со сном из-за переживаний о задачах или списке дел?',
  'Отсутствует чувство удовлетворения или достижения после завершения задачи?',
  'Чувствуете перегруженность из-за большого количества обязанностей?',
  'Пренебрегаете собственными потребностями (отдыхом, физической активностью, питанием) из-за давления работы?'
];

const BURNOUT_ANSWERS = [
  { label: 'Никогда', value: 0 },
  { label: 'Редко', value: 1 },
  { label: 'Иногда', value: 2 },
  { label: 'Часто', value: 3 }
];

function takeBurnoutTest() {
  const today = new Date();
  const dateKey = getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (habitsData.burnout && habitsData.burnout[dateKey] !== undefined) {
    if (!confirm(`Вы уже проходили тест сегодня (результат: ${habitsData.burnout[dateKey]} баллов). Пройти заново?`)) {
      return;
    }
  }

  let currentQuestion = 0;
  let totalScore = 0;
  
  function showQuestion() {
    if (currentQuestion >= BURNOUT_QUESTIONS.length) {
      if (!habitsData.burnout) habitsData.burnout = {};
      habitsData.burnout[dateKey] = totalScore;
      saveHabitsData();
      renderBurnoutChart();
      showBurnoutResult(totalScore);
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4';
    modal.id = 'burnout-modal';
    modal.innerHTML = `
      <div class="glass-card p-6 md:p-10 max-w-md w-full border border-purple-500/30 shadow-2xl">
        <div class="mb-4">
          <span class="text-white/40 text-xs font-mono">Вопрос ${currentQuestion + 1} из ${BURNOUT_QUESTIONS.length}</span>
          <div class="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div class="h-full bg-purple-400 rounded-full transition-all duration-300" style="width: ${((currentQuestion) / BURNOUT_QUESTIONS.length) * 100}%"></div>
          </div>
        </div>
        <p class="text-white text-base md:text-lg font-medium mb-6">${BURNOUT_QUESTIONS[currentQuestion]}</p>
        <div class="grid grid-cols-2 gap-3">
          ${BURNOUT_ANSWERS.map(ans => `
            <button onclick="answerBurnoutQuestion(${ans.value})" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 hover:bg-purple-500/20 transition-all text-white text-sm font-medium">
              ${ans.label}
            </button>
          `).join('')}
        </div>
        <p class="text-white/30 text-xs text-center mt-4">Выберите ответ, который лучше всего описывает ваше состояние</p>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  window.answerBurnoutQuestion = function(value) {
    totalScore += value;
    currentQuestion++;
    const modal = document.getElementById('burnout-modal');
    if (modal) modal.remove();
    showQuestion();
  };
  
  showQuestion();
}

function showBurnoutResult(score) {
  let level, color, emoji, description;
  
  if (score <= 7) {
    level = 'Минимальная';
    color = 'emerald';
    emoji = '😊';
    description = 'Вы хорошо справляетесь со стрессом и поддерживаете здоровый жизненный баланс.';
  } else if (score <= 15) {
    level = 'Легкая';
    color = 'blue';
    emoji = '🙂';
    description = 'Проявляются первые симптомы выгорания. Время задуматься об отдыхе и поставить его в приоритет.';
  } else if (score <= 23) {
    level = 'Умеренная';
    color = 'amber';
    emoji = '😐';
    description = 'Умеренные симптомы выгорания. Необходимо пересмотреть рабочую нагрузку.';
  } else {
    level = 'Выраженная';
    color = 'red';
    emoji = '😰';
    description = 'Выгорание высокого уровня. Настоятельно рекомендуется немедленно отдохнуть и обратиться к специалисту.';
  }
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto modal-animate';
  modal.innerHTML = `
    <div class="glass-card p-6 md:p-10 max-w-2xl w-full border border-purple-500/30">
      <div class="text-center">
        <div class="text-6xl mb-4">${emoji}</div>
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-1 uppercase tracking-wider">${level} СТЕПЕНЬ</h2>
        <p class="text-4xl font-bold text-purple-300 mb-4">${score}/30</p>
        <p class="text-white/80 text-sm max-w-lg mx-auto mb-6">${description}</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 mb-6">
        <div class="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center ${score <= 7 ? 'ring-2 ring-emerald-400' : ''}">
          <span class="text-emerald-400 font-bold text-xs block">Минимальная</span>
          <span class="text-white/40 text-[10px]">0-7</span>
        </div>
        <div class="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-center ${score > 7 && score <= 15 ? 'ring-2 ring-blue-400' : ''}">
          <span class="text-blue-400 font-bold text-xs block">Легкая</span>
          <span class="text-white/40 text-[10px]">8-15</span>
        </div>
        <div class="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center ${score > 15 && score <= 23 ? 'ring-2 ring-amber-400' : ''}">
          <span class="text-amber-400 font-bold text-xs block">Умеренная</span>
          <span class="text-white/40 text-[10px]">16-23</span>
        </div>
        <div class="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center ${score > 23 ? 'ring-2 ring-red-400' : ''}">
          <span class="text-red-400 font-bold text-xs block">Выраженная</span>
          <span class="text-white/40 text-[10px]">24-30</span>
        </div>
      </div>
      
      <div class="flex justify-center mt-6">
        <button onclick="this.closest('.fixed').remove()" class="action-btn px-8 py-2.5 rounded-xl text-sm font-bold">
          Закрыть
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ========== РЕНДЕРИНГ ГРАФИКА ВЫГОРАНИЯ ==========

function renderBurnoutChart() {
  const container = document.getElementById('burnout-bars');
  const datesContainer = document.getElementById('burnout-dates');
  if (!container || !datesContainer) return;

  const year = currentHabitYear;
  const month = currentHabitMonth;
  const days = getDaysInMonth(year, month);
  
  let minimal = 0, light = 0, moderate = 0, severe = 0;
  let barsHtml = '';
  let datesHtml = '';
  
  for (let d = 1; d <= days; d++) {
    const dateKey = getDateKey(year, month, d);
    const score = habitsData.burnout && habitsData.burnout[dateKey] !== undefined ? habitsData.burnout[dateKey] : null;
    
    if (score !== null) {
      if (score <= 7) minimal++;
      else if (score <= 15) light++;
      else if (score <= 23) moderate++;
      else severe++;
    }
    
    const height = score !== null ? Math.max(8, (score / 30) * 100) : 4;
    let color = 'bg-white/5';
    
    if (score !== null) {
      if (score <= 7) color = 'bg-emerald-400';
      else if (score <= 15) color = 'bg-blue-400';
      else if (score <= 23) color = 'bg-amber-400';
      else color = 'bg-red-400';
    }
    
    const opacity = score !== null ? 'opacity-100' : 'opacity-20';
    const hasTest = score !== null;
    
    barsHtml += `
      <div class="flex-1 flex flex-col items-center justify-end h-full group relative">
        ${hasTest ? `
          <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded-lg font-mono whitespace-nowrap z-30 border border-purple-500/40 pointer-events-none shadow-lg">
            <div class="font-bold text-purple-300">День ${d}</div>
            <div>${score} / 30 баллов</div>
          </div>
          <div class="absolute -top-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        ` : ''}
        <div class="w-full max-w-[18px] rounded-t transition-all ${color} ${opacity}" style="height: ${height}%;"></div>
      </div>
    `;
    
    if (d === 1 || d === 5 || d === 10 || d === 15 || d === 20 || d === 25 || d === days) {
      datesHtml += `<span class="${hasTest ? 'text-purple-300 font-bold' : ''}">${d}</span>`;
    }
  }
  
  container.innerHTML = barsHtml;
  datesContainer.innerHTML = datesHtml;
  
  const lowEl = document.getElementById('burnout-low');
  const mediumEl = document.getElementById('burnout-medium');
  const highEl = document.getElementById('burnout-high');
  
  if (lowEl) lowEl.textContent = minimal + light;
  if (mediumEl) mediumEl.textContent = moderate;
  if (highEl) highEl.textContent = severe;
}

// ========== STUDY TIMER LOGIC ==========

const TIMER_STORAGE_KEY = 'hard_study_timer_data';

let timerData = {
  sessions: [],
};

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

function loadTimerData() {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.sessions) timerData = parsed;
    }
  } catch (e) {
    console.warn('Ошибка чтения таймера из LocalStorage', e);
  }
}

function saveTimerData() {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
  } catch (e) {
    console.warn('Ошибка сохранения таймера', e);
  }
}

function initTimerTab() {
  loadTimerData();
  updateTimerStats();
  renderTimerCalendar();
}

function toggleStudyTimer() {
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

function resetStudyTimer() {
  if (timerSeconds > 0 && timerSeconds >= 5) {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const existingSessionIndex = timerData.sessions.findIndex(s => s.date === dateKey);
    if (existingSessionIndex !== -1) {
      timerData.sessions[existingSessionIndex].durationSeconds += timerSeconds;
    } else {
      timerData.sessions.push({
        date: dateKey,
        durationSeconds: timerSeconds
      });
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
  renderTimerCalendar();
}

// ========== ФОРМАТИРОВАНИЕ ВРЕМЕНИ ==========

function formatHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatTimeHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  
  if (h > 0) {
    return `${h}ч ${pad(m)}м ${pad(s)}с`;
  } else if (m > 0) {
    return `${m}м ${pad(s)}с`;
  } else {
    return `${s}с`;
  }
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (!display) return;
  display.textContent = formatHMS(timerSeconds);
}

function updateTimerStats() {
  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const currentMonthPrefix = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}`;

  let todaySec = 0;
  let monthSec = 0;
  let totalSec = 0;

  timerData.sessions.forEach(s => {
    totalSec += s.durationSeconds;
    if (s.date === todayKey) todaySec += s.durationSeconds;
    if (s.date.startsWith(currentMonthPrefix)) monthSec += s.durationSeconds;
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

function renderTimerCalendar() {
  const grid = document.getElementById('timer-calendar-grid');
  const title = document.getElementById('timer-calendar-title');
  if (!grid) return;

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  if (title) title.textContent = `Календарь за ${monthNames[currentCalMonth]} ${currentCalYear}`;

  const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
  const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  let html = dayHeaders.map(d => `<div class="font-bold text-white/40 py-1.5 text-xs">${d}</div>`).join('');

  let firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySec = timerData.sessions
      .filter(s => s.date === dateKey)
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    let bg = 'bg-white/5 text-white/40';
    if (daySec > 0 && daySec < 3600) {
      bg = 'bg-purple-500/20 text-purple-200 border border-purple-500/30';
    } else if (daySec >= 3600 && daySec < 10800) {
      bg = 'bg-purple-500/50 text-white font-bold border border-purple-400 shadow-lg shadow-purple-500/20';
    } else if (daySec >= 10800) {
      bg = 'bg-emerald-500/50 text-emerald-100 font-bold border border-emerald-400 shadow-lg shadow-emerald-500/20';
    }

    html += `
      <div class="p-2 rounded-xl ${bg} flex flex-col items-center justify-center min-h-[56px] transition-all hover:scale-105 hover:z-10 cursor-default" title="${dateKey}: ${formatHMS(daySec)}">
        <span class="text-sm font-bold">${d}</span>
        ${daySec > 0 ? `<span class="text-[10px] font-mono opacity-90 mt-0.5">${formatHMS(daySec)}</span>` : ''}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function changeTimerCalendarMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth < 0) {
    currentCalMonth = 11;
    currentCalYear--;
  } else if (currentCalMonth > 11) {
    currentCalMonth = 0;
    currentCalYear++;
  }
  renderTimerCalendar();
  updateTimerStats();
}

// ========== ЭКСПОРТ И ИМПОРТ ДАННЫХ ТАЙМЕРА ==========

function exportTimerData() {
  loadTimerData();
  
  if (!timerData.sessions || timerData.sessions.length === 0) {
    showToast('Нет данных для экспорта. Сначала запишите несколько сессий.', 'info');
    return;
  }
  
  try {
    const dataStr = JSON.stringify(timerData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `study_timer_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    showToast(`Данные таймера успешно скачаны (${timerData.sessions.length} сессий)`, 'success');
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    showToast('Ошибка при экспорте данных', 'error');
  }
}

function importTimerData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && Array.isArray(imported.sessions)) {
        if (timerData.sessions.length > 0) {
          if (!confirm(`Восстановить данные из файла? Текущие данные (${timerData.sessions.length} сессий) будут заменены.`)) {
            return;
          }
        }
        timerData = imported;
        saveTimerData();
        updateTimerStats();
        renderTimerCalendar();
        showToast(`Данные таймера успешно восстановлены! (${timerData.sessions.length} сессий)`, 'success');
      } else {
        showToast('Неверный формат файла JSON', 'error');
      }
    } catch (err) {
      showToast('Ошибка чтения файла: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ========== УДАЛЕНИЕ ДАННЫХ ТАЙМЕРА ==========

function deleteTodayTimerData() {
  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  
  const todaySessionIndex = timerData.sessions.findIndex(s => s.date === todayKey);
  if (todaySessionIndex === -1) {
    showToast('Нет данных за сегодня для удаления', 'info');
    return;
  }
  
  const todaySeconds = timerData.sessions[todaySessionIndex].durationSeconds;
  
  if (!confirm(`Удалить все записи за сегодня (${formatHMS(todaySeconds)})? Это действие нельзя отменить.`)) {
    return;
  }
  
  timerData.sessions.splice(todaySessionIndex, 1);
  saveTimerData();
  updateTimerStats();
  renderTimerCalendar();
  showToast(`Данные за сегодня (${formatHMS(todaySeconds)}) удалены`, 'success');
}

function deleteMonthTimerData() {
  const currentMonthPrefix = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}`;
  
  const monthSessions = timerData.sessions.filter(s => s.date.startsWith(currentMonthPrefix));
  
  if (monthSessions.length === 0) {
    showToast('Нет данных за текущий месяц для удаления', 'info');
    return;
  }
  
  const monthSeconds = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const sessionCount = monthSessions.length;
  
  if (!confirm(`Удалить все записи за ${MONTH_NAMES[currentCalMonth]} ${currentCalYear} (${formatHMS(monthSeconds)}, ${sessionCount} сессий)? Это действие нельзя отменить.`)) {
    return;
  }
  
  timerData.sessions = timerData.sessions.filter(s => !s.date.startsWith(currentMonthPrefix));
  saveTimerData();
  updateTimerStats();
  renderTimerCalendar();
  showToast(`Данные за ${MONTH_NAMES[currentCalMonth]} ${currentCalYear} (${formatHMS(monthSeconds)}) удалены`, 'success');
}

function deleteAllTimerData() {
  if (timerData.sessions.length === 0) {
    showToast('Нет данных для удаления', 'info');
    return;
  }
  
  const totalSeconds = timerData.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const sessionCount = timerData.sessions.length;
  
  if (!confirm(`Удалить ВСЕ данные таймера (${formatHMS(totalSeconds)}, ${sessionCount} сессий)? Это действие нельзя отменить.`)) {
    return;
  }
  
  timerData.sessions = [];
  saveTimerData();
  updateTimerStats();
  renderTimerCalendar();
  showToast('Все данные таймера удалены', 'success');
}

// ========== АВТОСОХРАНЕНИЕ ПРИ ЗАКРЫТИИ ВКЛАДКИ ==========

window.addEventListener('beforeunload', function() {
  if (isTimerRunning && timerSeconds > 5) {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const existingSessionIndex = timerData.sessions.findIndex(s => s.date === dateKey);
    if (existingSessionIndex !== -1) {
      timerData.sessions[existingSessionIndex].durationSeconds += timerSeconds;
    } else {
      timerData.sessions.push({
        date: dateKey,
        durationSeconds: timerSeconds
      });
    }
    saveTimerData();
  }
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  loadHabitsData();
  showTab('info');
});
