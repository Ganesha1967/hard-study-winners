import { formatHMS, getTimerSessions, updateTimerStats } from './timer.js';

let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

export function getCalendarState() {
  return { month: currentCalMonth, year: currentCalYear };
}

export function renderTimerCalendar() {
  const grid = document.getElementById('timer-calendar-grid');
  const title = document.getElementById('timer-calendar-title');
  if (!grid) return;

  const monthNames = [
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
  if (title) title.textContent = `Календарь за ${monthNames[currentCalMonth]} ${currentCalYear}`;

  const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
  const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  let html = dayHeaders
    .map((d) => `<div class="font-bold text-white/40 py-1.5 text-xs">${d}</div>`)
    .join('');

  let firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  for (let i = 0; i < firstDayIndex; i++) html += `<div></div>`;

  const sessions = getTimerSessions();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySec = sessions
      .filter((s) => s.date === dateKey)
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    let bg = 'bg-white/5 text-white/40';
    if (daySec > 0 && daySec < 3600) {
      bg = 'bg-purple-500/20 text-purple-200 border border-purple-500/30';
    } else if (daySec >= 3600 && daySec < 10800) {
      bg =
        'bg-purple-500/50 text-white font-bold border border-purple-400 shadow-lg shadow-purple-500/20';
    } else if (daySec >= 10800) {
      bg =
        'bg-emerald-500/50 text-emerald-100 font-bold border border-emerald-400 shadow-lg shadow-emerald-500/20';
    }

    html += `
      <div class="p-2 rounded-xl ${bg} flex flex-col items-center justify-center min-h-[56px] transition-all hover:scale-105 hover:z-10 cursor-default" title="${dateKey}: ${formatHMS(daySec)}">
        <span class="text-sm font-bold">${d}</span>
        ${daySec > 0 ? `<span class="text-[10px] font-mono opacity-90 mt-0.5">${formatHMS(daySec)}</span>` : ''}
      </div>`;
  }

  grid.innerHTML = html;
}

export function changeTimerCalendarMonth(delta) {
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
