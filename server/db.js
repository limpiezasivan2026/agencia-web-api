import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Función interna para asegurar que la tabla existe
async function asegurarTabla() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        telefono TEXT,
        mensaje TEXT NOT NULL,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Error asegurando tabla:", error);
  }
}

export async function initDB() {
  await asegurarTabla();
  console.log('✅ Base de datos Turso lista (initDB).');
}

export async function guardarLead(data) {
  try {
    // Nos aseguramos de que la tabla exista antes de insertar
    await asegurarTabla();

    console.log("🔍 Intentando insertar en Turso...");
    const result = await db.execute({
      sql: `INSERT INTO leads (nombre, email, telefono, mensaje) VALUES (?, ?, ?, ?)`,
      args: [data.nombre, data.email, data.telefono, data.mensaje]
    });
    console.log("✅ Insertado con ID:", result.lastInsertRowid);
    return result.lastInsertRowid;
  } catch (error) {
    console.error("❌ ERROR REAL DE TURSO:", error.message); // Esto nos dirá exactamente qué falla
    throw error;
  }
}

export async function obtenerLeads() {
  await asegurarTabla();
  const result = await db.execute('SELECT * FROM leads ORDER BY fecha DESC');
  return result.rows;
}