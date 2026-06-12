let isArchiveLoaded = false;

async function showTab(tabId) {
  const tabs = ['info', 'marathon', 'results'];
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
    const response = await fetch(`./components/${tabId}.html`);
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    
    const html = await response.text();
    contentArea.innerHTML = html;
    
    if (tabId === 'marathon') {
      isArchiveLoaded = false; 
      updateP6Countdown();
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

function updateP6Countdown() {
  const timerElement = document.getElementById('countdown-timer-6');
  if (!timerElement) return; 
  
  try {
    const now = new Date();
    const targetTargetMSK = new Date('2026-06-15T00:00:00+03:00'); 
    
    let diff = targetTargetMSK - now;
    if (diff < 0) {
      timerElement.textContent = "00:00:00";
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    timerElement.textContent = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  } catch (e) {
    timerElement.textContent = "00:00:00";
  }
}

setInterval(updateP6Countdown, 1000);

document.addEventListener('DOMContentLoaded', () => {
  showTab('info');
});
