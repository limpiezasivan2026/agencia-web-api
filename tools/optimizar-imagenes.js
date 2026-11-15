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

// Tamaños optimizados para responsive
const TAMANOS = {
  movil: { ancho: 400, calidad: 75 },
  tablet: { ancho: 800, calidad: 80 },
  web: { ancho: 1200, calidad: 85 }
};

async function procesarCarpeta(carpetaActual, rutaRelativa = '') {
  if (!fs.existsSync(carpetaActual)) return;
  
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

    // Ignoramos SVGs o archivos que no sean imágenes
    if (!/\.(jpg|jpeg|png|webp|tiff|bmp)$/i.test(archivo)) continue;

    const id = path.parse(archivo).name;
    console.log(`🖼️ Procesando: ${rutaRelativa}/${archivo}`);

    for (const [disp, config] of Object.entries(TAMANOS)) {
      // 1. Generar AVIF
      await sharp(rutaOriginal)
        .resize({ width: config.ancho, withoutEnlargement: true }) // No agranda si la original es más pequeña
        .toFormat('avif', { quality: config.calidad, effort: 6 })
        .toFile(path.join(destinoActual, `${id}-${disp}.avif`));
        
      // 2. Generar WebP (Fallback para navegadores viejos)
      await sharp(rutaOriginal)
        .resize({ width: config.ancho, withoutEnlargement: true })
        .webp({ quality: config.calidad })
        .toFile(path.join(destinoActual, `${id}-${disp}.webp`));
    }
  }
}

console.log('🚀 Iniciando optimización de imágenes responsive...');
procesarCarpeta(origen).then(() => console.log('✅ Imágenes optimizadas (AVIF + WebP) en 3 tamaños.'));