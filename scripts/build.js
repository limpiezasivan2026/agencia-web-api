import { build as esbuild } from 'esbuild';
import * as sass from 'sass';
import pug from 'pug';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import critical from 'critical';
import { generarEntryJS } from './generar-entry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'public');
const DATA = join(ROOT, 'data');

const args = process.argv.slice(2);
const WATCH = args.includes('--watch');
const CRITICAL = args.includes('--critical');

// Leer configuración global
async function getSiteData() {
  try {
    const raw = await fs.readFile(join(DATA, 'site.json'), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('⚠️ No se encontró data/site.json, usando valores por defecto.');
    return { domain: { url: 'http://localhost:3000' } };
  }
}

async function clean() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });
}

async function compileSass() {
  const result = sass.compile(join(SRC, 'scss/main.scss'), {
    style: WATCH ? 'expanded' : 'compressed',
    sourceMap: WATCH,
  });
  await fs.mkdir(join(OUT, 'css'), { recursive: true });
  await fs.writeFile(join(OUT, 'css/main.css'), result.css);
  if (result.sourceMap) {
    await fs.writeFile(join(OUT, 'css/main.css.map'), JSON.stringify(result.sourceMap));
  }
  console.log('✔ SCSS → public/css/main.css');
}

async function compileJs() {
  const entryPath = await generarEntryJS(SRC);

  await esbuild({
    entryPoints: [entryPath],
    bundle: true,
    minify: !WATCH,
    sourcemap: WATCH ? 'inline' : false,
    format: 'esm',
    target: ['es2020'],
    outfile: join(OUT, 'js/main.js'),
    logLevel: 'silent',
  });
  
  await fs.rm(entryPath, { force: true });
  console.log(`✔ JS → public/js/main.js (${!WATCH ? 'Minificado' : 'Desarrollo'})`);
}

async function compilePug() {
  const site = await getSiteData();
  const SITE_URL = site.domain.url;
  
  const pagesData = JSON.parse(await fs.readFile(join(SRC, 'pug/pages/pages.json'), 'utf8'));
  const pagesDir = join(SRC, 'pug/pages');

  let blogData = [];
  try {
    const rawBlog = await fs.readFile(join(pagesDir, 'blog.json'), 'utf8');
    blogData = JSON.parse(rawBlog);
  } catch (e) {}

  // Función recursiva para buscar .pug en subcarpetas
  async function procesarDirectorio(dir, rutaRelativa = '') {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      const relPath = rutaRelativa ? `${rutaRelativa}/${item.name}` : item.name;

      if (item.isDirectory()) {
        // Si es una carpeta, entramos recursivamente
        await procesarDirectorio(fullPath, relPath);
      } else if (item.name.endsWith('.pug')) {
        // Si es un archivo .pug, lo compilamos
        const name = basename(item.name, '.pug');
        if (name === 'articulo' || name.startsWith('_')) continue; // Ignorar plantillas base
        
        const meta = pagesData[name] || {};
        const canonical = meta.canonical 
          ? `${SITE_URL.replace(/\/$/, '')}${meta.canonical}` 
          : `${SITE_URL}/${relPath.replace('.pug', '')}`;

        const outDir = join(OUT, dirname(relPath));
        const outPath = join(OUT, `${relPath.replace('.pug', '.html')}`);

        const html = pug.renderFile(fullPath, {
          ...meta,
          canonical,
          siteUrl: SITE_URL,
          site,
          articulos: blogData,
          pretty: WATCH,
          basedir: join(SRC, 'pug'),
        });

        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(outPath, html);
        console.log(`✔ Pug → ${relPath.replace('.pug', '.html')}`);
      }
    }
  }

  await procesarDirectorio(pagesDir);

  // Generar artículos del blog
  try {
    await fs.mkdir(join(OUT, 'blog'), { recursive: true });
    for (const articulo of blogData) {
      const html = pug.renderFile(join(pagesDir, 'articulo.pug'), {
        ...articulo, siteUrl: SITE_URL, site,
        canonical: `${SITE_URL}/blog/${articulo.slug}`,
        pretty: WATCH, basedir: join(SRC, 'pug'),
      });
      await fs.writeFile(join(OUT, 'blog', `${articulo.slug}.html`), html);
      console.log(`✔ Pug → blog/${articulo.slug}.html`);
    }
  } catch (e) {}
}

async function copyAssets() {
  const srcAssets = join(SRC, 'assets');
  const outAssets = join(OUT, 'assets');
  await fs.cp(srcAssets, outAssets, { recursive: true });
  console.log('✔ Assets copiados');
}

async function generateSitemap() {
  const site = await getSiteData();
  const SITE_URL = site.domain.url;
  const pagesData = JSON.parse(await fs.readFile(join(SRC, 'pug/pages/pages.json'), 'utf8'));
  const urls = Object.values(pagesData)
    .map((p) => `  <url><loc>${SITE_URL}${p.canonical}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  await fs.writeFile(join(OUT, 'sitemap.xml'), xml);
  console.log('✔ sitemap.xml');
}

async function generateRobots() {
  const site = await getSiteData();
  const txt = `User-agent: *\nAllow: /\nSitemap: ${site.domain.url}/sitemap.xml\n`;
  await fs.writeFile(join(OUT, 'robots.txt'), txt);
  console.log('✔ robots.txt');
}

async function runCritical() {
  if (!CRITICAL) return;
  console.log('⏭ Critical CSS: desactivado temporalmente para evitar conflictos.');
}

async function buildAll() {
  if (!WATCH) await clean();
  await fs.mkdir(OUT, { recursive: true });
  await Promise.all([compileSass(), compileJs()]);
  await compilePug();
  await copyAssets();
  if (!WATCH) {
    await generateSitemap();
    await generateRobots();
  }
  await runCritical();
  console.log('\n✅ Build completado\n');
}

buildAll().catch((err) => {
  console.error('❌ Build falló:', err);
  process.exit(1);
});