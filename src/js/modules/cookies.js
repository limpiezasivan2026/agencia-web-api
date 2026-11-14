export function initCookies() {
  const banner = document.getElementById('cookiesBanner');
  if (!banner) return;
  
  if (localStorage.getItem('cookiesAceptadas')) return;

  setTimeout(() => banner.classList.add('visible'), 1000);

  const btnAceptar = document.getElementById('cookiesAceptar');
  if (btnAceptar) {
    btnAceptar.addEventListener('click', () => {
      localStorage.setItem('cookiesAceptadas', 'true');
      banner.classList.remove('visible');
    });
  }
}