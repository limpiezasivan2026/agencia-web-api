const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Uso: node optimizar-imagenes.js <carpeta_origen> <carpeta_destino>
const origen = process.argv[2];
const destino = process.argv[3];

if (!origen || !destino) {
  console.error('❌ Uso: node optimizar-imagenes.js ./src/assets/img ./public/assets/img');
  process.exit(1);
}

const TAMANOS = { movil: 400, tablet: 800, web: 1200 };

async function procesarCarpeta(carpetaActual, rutaRelativa = '') {
  const archivos = fs.readdirSync(carpetaActual);
  const destinoActual = path.join(destino, rutaRelativa);

  if (!fs.existsSync(destinoActual)) fs.mkdirSync(destinoActual, { recursive: true });

  for (const archivo of archivos) {
    const rutaOriginal = path.join(carpetaActual, archivo);
    const stat = fs.statSync(rutaOriginal);

    if (stat.isDirectory()) {
      await procesarCarpeta(rutaOriginal, path.join(rutaRelativa, archivo));
      continue;
    }

    if (!/\.(jpg|jpeg|png|webp|tiff|bmp)$/i.test(archivo)) continue;

    const id = path.parse(archivo).name;
    console.log(`🖼️ Procesando: ${rutaRelativa}/${archivo}`);

    for (const [disp, ancho] of Object.entries(TAMANOS)) {
      // AVIF
      await sharp(rutaOriginal)
        .resize({ width: ancho, withoutEnlargement: true })
        .toFormat('avif', { quality: 80, effort: 6 })
        .toFile(path.join(destinoActual, `${id}-${disp}.avif`));
        
      // WebP (por si el navegador es viejo)
      await sharp(rutaOriginal)
        .resize({ width: ancho, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(destinoActual, `${id}-${disp}.webp`));
    }
  }
}

console.log('🚀 Iniciando optimización...');
procesarCarpeta(origen).then(() => console.log('✅ Imágenes optimizadas correctamente.'));