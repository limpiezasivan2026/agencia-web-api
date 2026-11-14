import { initNav } from './modules/nav.js';
import { initCookies } from './modules/cookies.js';
import { initReveal } from './modules/reveal.js';
import { initProgress } from './modules/progress.js';
import { initForm } from './modules/form.js';

// Iniciar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCookies();
  initReveal();
  initProgress();
  initForm();
  
  console.log('🚀 Agencia Web cargada correctamente');
});