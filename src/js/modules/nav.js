export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.dataset.open === 'true';
    menu.dataset.open = String(!open);
    toggle.setAttribute('aria-expanded', String(!open));
  });

  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}