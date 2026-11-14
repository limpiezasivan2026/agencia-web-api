import { build as esbuild } from 'esbuild';
import * as sass from 'sass';
import pug from 'pug';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

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
  await esbuild({
    entryPoints: [join(SRC, 'js/main.js')],
    bundle: true,
    minify: !WATCH,
    sourcemap: WATCH ? 'inline' : false,
    format: 'esm',
    target: ['es2020'],
    outfile: join(OUT, 'js/main.js'),
    logLevel: 'silent',
  });
  console.log('✔ JS → public/js/main.js');
}

async function compilePug() {
  const site = await getSiteData();
  const SITE_URL = site.domain.url;
  
  const pagesData = JSON.parse(await fs.readFile(join(SRC, 'pug/pages/pages.json'), 'utf8'));
  const pagesDir = join(SRC, 'pug/pages');
  const files = await fs.readdir(pagesDir);
  
  for (const file of files) {
    if (!file.endsWith('.pug')) continue;
    const name = basename(file, '.pug');
    const meta = pagesData[name] || {};
    
    const canonical = meta.canonical
      ? `${SITE_URL.replace(/\/$/, '')}${meta.canonical}`
      : `${SITE_URL}/`;
      
    const html = pug.renderFile(join(pagesDir, file), {
      ...meta,
      canonical,
      siteUrl: SITE_URL,
      site,          // <-- AHORA PUG TIENE ACCESO A site.brand.name, site.brand.email, etc.
      pretty: WATCH,
      basedir: join(SRC, 'pug'),
    });
    
    await fs.writeFile(join(OUT, `${name}.html`), html);
    console.log(`✔ Pug → public/${name}.html`);
  }
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
  console.log('⏭ Critical CSS: pendiente de implementar');
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