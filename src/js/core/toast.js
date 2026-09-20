export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-red-950/90 border-red-500/40 text-red-200',
    info: 'bg-purple-950/90 border-purple-500/40 text-purple-200',
  };

  const icon =
    type === 'success'
      ? 'fa-check-circle'
      : type === 'error'
        ? 'fa-exclamation-circle'
        : 'fa-info-circle';

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2 ${colors[type] || colors.info}`;
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

  container.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
