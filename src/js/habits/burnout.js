import { showToast } from '../core/toast.js';
import { getDateKey, getDaysInMonth } from '../core/storage.js';
import { getHabitsData, saveHabitsData, getHabitState } from './habits.js';

const BURNOUT_QUESTIONS = [
  'Чувствуете физическое истощение даже после полноценного ночного сна?',
  'Чувствуете эмоциональное истощение или «пустоту» к концу дня?',
  'Трудно ли сосредоточиться или удерживать внимание на задачах?',
  'Чувствуете раздражение, нетерпение или фрустрацию из-за работы или обязанностей?',
  'Становится труднее сохранять интерес к работе — появляется цинизм, отстраненность или безразличие?',
  'Чувствуете, что вы стали менее продуктивны или эффективны, чем раньше?',
  'Испытываете трудности со сном из-за переживаний о задачах или списке дел?',
  'Отсутствует чувство удовлетворения или достижения после завершения задачи?',
  'Чувствуете перегруженность из-за большого количества обязанностей?',
  'Пренебрегаете собственными потребностями (отдыхом, физической активностью, питанием) из-за давления работы?',
];

const BURNOUT_ANSWERS = [
  { label: 'Никогда', value: 0 },
  { label: 'Редко', value: 1 },
  { label: 'Иногда', value: 2 },
  { label: 'Часто', value: 3 },
];

export function takeBurnoutTest() {
  const habitsData = getHabitsData();
  if (!habitsData) return;

  const today = new Date();
  const dateKey = getDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  if (habitsData.burnout?.[dateKey] !== undefined) {
    const ok = confirm(
      `Вы уже проходили тест сегодня (результат: ${habitsData.burnout[dateKey]} баллов). Пройти заново?`,
    );
    if (!ok) return;
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
    modal.className =
      'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4';
    modal.id = 'burnout-modal';
    modal.innerHTML = `
      <div class="glass-card p-6 md:p-10 max-w-md w-full border border-purple-500/30 shadow-2xl">
        <div class="mb-4">
          <span class="text-white/40 text-xs font-mono">Вопрос ${currentQuestion + 1} из ${BURNOUT_QUESTIONS.length}</span>
          <div class="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div class="h-full bg-purple-400 rounded-full transition-all duration-300"
                 style="width: ${(currentQuestion / BURNOUT_QUESTIONS.length) * 100}%"></div>
          </div>
        </div>
        <p class="text-white text-base md:text-lg font-medium mb-6">${BURNOUT_QUESTIONS[currentQuestion]}</p>
        <div class="grid grid-cols-2 gap-3">
          ${BURNOUT_ANSWERS.map(
            (ans) => `
            <button onclick="answerBurnoutQuestion(${ans.value})"
                    class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 hover:bg-purple-500/20 transition-all text-white text-sm font-medium">
              ${ans.label}
            </button>`,
          ).join('')}
        </div>
        <p class="text-white/30 text-xs text-center mt-4">Выберите ответ, который лучше всего описывает ваше состояние</p>
      </div>`;
    document.body.appendChild(modal);
  }

  window.answerBurnoutQuestion = function (value) {
    totalScore += value;
    currentQuestion++;
    document.getElementById('burnout-modal')?.remove();
    showQuestion();
  };

  showQuestion();
}

function showBurnoutResult(score) {
  let level, emoji, description;

  if (score <= 7) {
    level = 'Минимальная';
    emoji = '😊';
    description = 'Вы хорошо справляетесь со стрессом и поддерживаете здоровый жизненный баланс.';
  } else if (score <= 15) {
    level = 'Легкая';
    emoji = '🙂';
    description =
      'Проявляются первые симптомы выгорания. Время задуматься об отдыхе и поставить его в приоритет.';
  } else if (score <= 23) {
    level = 'Умеренная';
    emoji = '😐';
    description = 'Умеренные симптомы выгорания. Необходимо пересмотреть рабочую нагрузку.';
  } else {
    level = 'Выраженная';
    emoji = '😰';
    description =
      'Выгорание высокого уровня. Настоятельно рекомендуется немедленно отдохнуть и обратиться к специалисту.';
  }

  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto modal-animate';
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
    </div>`;
  document.body.appendChild(modal);
}

export function renderBurnoutChart() {
  const container = document.getElementById('burnout-bars');
  const datesContainer = document.getElementById('burnout-dates');
  if (!container || !datesContainer) return;

  const habitsData = getHabitsData();
  if (!habitsData) return;

  const { month, year } = getHabitState();
  const days = getDaysInMonth(year, month);

  let minimal = 0,
    light = 0,
    moderate = 0,
    severe = 0;
  let barsHtml = '';
  let datesHtml = '';

  for (let d = 1; d <= days; d++) {
    const dateKey = getDateKey(year, month, d);
    const score = habitsData.burnout?.[dateKey] ?? null;

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
        ${
          hasTest
            ? `
          <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded-lg font-mono whitespace-nowrap z-30 border border-purple-500/40 pointer-events-none shadow-lg">
            <div class="font-bold text-purple-300">День ${d}</div>
            <div>${score} / 30 баллов</div>
          </div>
          <div class="absolute -top-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>`
            : ''
        }
        <div class="w-full max-w-[18px] rounded-t transition-all ${color} ${opacity}" style="height: ${height}%;"></div>
      </div>`;

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
