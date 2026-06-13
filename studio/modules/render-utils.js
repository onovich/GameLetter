export function createToast(toastElement) {
  const showToast = (message, type = 'info') => {
    if (!toastElement) {
      return;
    }
    toastElement.textContent = message;
    toastElement.classList.remove('hidden');
    toastElement.style.background = type === 'error' ? '#7f1d1d' : '#0f172a';
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toastElement.classList.add('hidden'), 2600);
  };

  return showToast;
}
