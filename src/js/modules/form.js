export function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const msg = document.getElementById('formMessage');
    
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const data = Object.fromEntries(new FormData(form));

    try {
      // AQUÍ ESTÁ LA MAGIA: Apuntamos a tu API en Vercel
      const res = await fetch('https://agencia-web-api.vercel.app/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      
      if (json.ok) {
        msg.textContent = '✅ Mensaje enviado. Te contactaremos pronto.';
        msg.className = 'form__msg form__msg--ok';
        form.reset();
      } else {
        throw new Error('Error al enviar');
      }
    } catch (err) {
      msg.textContent = '❌ Hubo un error. Inténtalo de nuevo.';
      msg.className = 'form__msg form__msg--error';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Pedir auditoría gratis';
    }
  });
}