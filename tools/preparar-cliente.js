const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

console.log('\n🚀 INICIANDO PREPARACIÓN PARA CLIENTE (BUILD DE PRODUCCIÓN)...\n');

function ejecutar(comando, mensaje) {
  console.log(`\n▶️ ${mensaje}`);
  try {
    execSync(comando, { cwd: ROOT, stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error en: ${mensaje}`);
    process.exit(1);
  }
}

// 1. Compilar el proyecto (Pug + Sass + JS)
ejecutar('npm run build:prod', 'Compilando HTML, CSS y JS...');

// 2. Optimizar imágenes desde src/assets/img a public/assets/img
ejecutar('node tools/optimizar-imagenes.js src/assets/img public/assets/img', 'Optimizando imágenes (AVIF/WebP)...');

// 3. Minificar el HTML/CSS/JS generado
ejecutar('node tools/minificar.js public', 'Minificando archivos finales...');

// 4. Crear el ZIP para subir
ejecutar('node tools/empaquetar.js', 'Generando ZIP final...');

console.log('\n✅ ¡ENTREGABLE LISTO! El archivo ZIP está en la raíz de tu proyecto.\n');