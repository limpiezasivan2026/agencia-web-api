import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDB, guardarLead } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 1. Seguridad y CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors()); // <-- AÑADIDO: Permite que Cloudflare envíe datos aquí
app.use(express.json());

// 2. Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Demasiadas peticiones. Inténtalo más tarde.' }
});
app.use('/api/', limiter);

// 3. Servir archivos estáticos (por si acaso lo pruebas en local)
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// 4. Ruta del Formulario
app.post('/api/contacto', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }

    const id = guardarLead({ nombre, email, telefono, mensaje });
    console.log(`📩 Nuevo lead guardado (ID: ${id}): ${nombre} - ${email}`);

    res.json({ ok: true, message: 'Mensaje guardado correctamente' });
  } catch (error) {
    console.error('Error en /api/contacto:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// 5. Arrancar servidor
initDB();
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en el puerto ${PORT}`);
});