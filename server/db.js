import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'agencia.sqlite');

let db;

export function initDB() {
  db = new Database(dbPath, { verbose: console.log });
  db.pragma('journal_mode = WAL'); // Mejor rendimiento y seguridad
  
  // Crear tabla si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      telefono TEXT,
      mensaje TEXT NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Base de datos SQLite lista.');
}

export function guardarLead(data) {
  if (!db) throw new Error('Base de datos no inicializada');
  const stmt = db.prepare(`
    INSERT INTO leads (nombre, email, telefono, mensaje)
    VALUES (@nombre, @email, @telefono, @mensaje)
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}