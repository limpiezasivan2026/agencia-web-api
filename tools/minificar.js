const fs = require('fs');
const path = require('path');
const { minify: minifyHtml } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: minifyJs } = require('terser');

const CARPETA = process.argv[2] || path.join(__dirname, '..', 'public');

async function obtenerArchivos(dir) {
  let resultados = [];
  const archivos = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const archivo of archivos) {
    const rutaCompleta = path.join(dir, archivo.name);
    if (archivo.isDirectory()) resultados = resultados.concat(await obtenerArchivos(rutaCompleta));
    else resultados.push(rutaCompleta);
  }
  return resultados;
}

async function minificarTodo() {
  console.log(`🚀 Minificando: ${CARPETA}`);
  const archivos = await obtenerArchivos(CARPETA);
  
  for (const ruta of archivos) {
    const ext = path.extname(ruta).toLowerCase();
    let contenido = await fs.promises.readFile(ruta, 'utf8');
    let resultado = contenido;

    try {
      if (ext === '.html') {
        resultado = await minifyHtml(contenido, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
          ignoreCustomFragments: [/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi]
        });
      } else if (ext === '.css') {
        resultado = new CleanCSS({ level: 2 }).minify(contenido).styles;
      } else if (ext === '.js') {
        const minified = await minifyJs(contenido);
        if (minified.error) throw minified.error;
        resultado = minified.code;
      } else {
        continue;
      }
      await fs.promises.writeFile(ruta, resultado, 'utf8');
      console.log(`✅ ${path.basename(ruta)} minificado.`);
    } catch (e) {
      console.error(`❌ Error con ${ruta}:`, e.message);
    }
  }
  console.log('✨ ¡Minificación completada!');
}

minificarTodo();