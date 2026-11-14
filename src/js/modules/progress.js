export function initProgress() {
  const barra = document.getElementById('progressBar');
  if (!barra) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = `${(scrollTop / alturaTotal) * 100}%`;
  }, { passive: true });
}