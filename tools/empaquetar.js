const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ZIP_FILE = path.join(ROOT, 'agencia-web-cloudflare.zip');

console.log('📦 Preparando paquete para Cloudflare...');

// 1. Borrar zip anterior si existe
if (fs.existsSync(ZIP_FILE)) {
  fs.unlinkSync(ZIP_FILE);
}

// 2. Crear el stream de escritura
const output = fs.createWriteStream(ZIP_FILE);
const archive = archiver('zip', {
  zlib: { level: 9 } // Máxima compresión
});

// 3. Eventos
output.on('close', function() {
  console.log(`\n✅ ¡ZIP creado con éxito!`);
  console.log(`📁 Archivo: ${ZIP_FILE}`);
  console.log(`📏 Tamaño: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`👉 Ve a Cloudflare Pages > "Upload assets" y sube este archivo.\n`);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// 4. Añadir la carpeta public al zip (sin incluir la carpeta "public" en sí, solo su contenido)
archive.directory(PUBLIC_DIR, false);

// 5. Finalizar
archive.finalize();