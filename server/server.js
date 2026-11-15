import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDB, guardarLead, obtenerLeads } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 1. Seguridad y CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// 2. Rate Limit (Evitar spam en el formulario)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Demasiadas peticiones. Inténtalo más tarde.' }
});
app.use('/api/', limiter);

// 3. Servir archivos estáticos (solo para local)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
}

// 4. Ruta del Formulario
app.post('/api/contacto', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }

    // Guardar en Base de Datos (Turso)
    const id = await guardarLead({ nombre, email, telefono, mensaje });
    console.log(`📩 Nuevo lead guardado (ID: ${id}): ${nombre} - ${email}`);

    res.json({ ok: true, message: 'Mensaje guardado correctamente' });
  } catch (error) {
    console.error('Error en /api/contacto:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// 5. Mini-CRM (Panel de administración)
app.get('/admin/leads', async (req, res) => {
  if (req.query.pass !== 'admin123') {
    return res.status(401).send('No autorizado. Necesitas la contraseña.');
  }

  try {
    const leads = await obtenerLeads();
    
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Panel de Leads - Agencia Web</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; background: #F8FAFC; color: #0B1F3A; }
          h1 { margin-bottom: 1rem; }
          table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; }
          th { background: #0B1F3A; color: white; }
          tr:nth-child(even) { background: #F1F5F9; }
        </style>
      </head>
      <body>
        <h1>📩 Leads Recibidos (${leads.length})</h1>
        <table>
          <tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Mensaje</th></tr>
    `;
    
    leads.forEach(l => {
      html += `<tr>
        <td>${l.fecha}</td>
        <td><strong>${l.nombre}</strong></td>
        <td><a href="mailto:${l.email}">${l.email}</a></td>
        <td>${l.telefono || '-'}</td>
        <td>${l.mensaje}</td>
      </tr>`;
    });
    
    html += `</table></body></html>`;
    res.send(html);
  } catch (error) {
    console.error('Error obteniendo leads:', error);
    res.status(500).send('Error al cargar los leads');
  }
});

// 6. Arrancar servidor (Solo en local) y exportar para Vercel
// Esto es lo que permite que funcione en tu ordenador y en Vercel a la vez
if (process.env.NODE_ENV !== 'production') {
  initDB(); // Iniciamos la BD localmente
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos de: ${PUBLIC_DIR}\n`);
  });
}

// Exportación para Vercel (Serverless)
export default app;