export async function openArchiveMarathon(marathonId) {
  const listView = document.getElementById('archive-list-view');
  const detailView = document.getElementById('archive-detail-view');
  const dataContainer = document.getElementById('marathon-data-container');

  if (!listView || !detailView || !dataContainer) return;

  dataContainer.innerHTML =
    '<p class="text-white/50 text-sm font-mono animate-pulse">Загрузка данных архива...</p>';
  listView.classList.add('hidden');
  detailView.classList.remove('hidden');

  try {
    const response = await fetch(`./src/components/archive/${marathonId}.html`);
    if (!response.ok) throw new Error(`Марафон не найден: ${response.status}`);
    dataContainer.innerHTML = await response.text();
  } catch (error) {
    console.error('[archive] Ошибка загрузки марафона:', error);
    dataContainer.innerHTML = `
      <div class="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p class="text-red-400 font-bold font-mono text-sm">Не удалось загрузить данные марафона.</p>
      </div>`;
  }
}

export function closeArchiveMarathon() {
  const listView = document.getElementById('archive-list-view');
  const detailView = document.getElementById('archive-detail-view');
  const dataContainer = document.getElementById('marathon-data-container');

  if (listView && detailView) {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    if (dataContainer) dataContainer.innerHTML = '';
  }
}
