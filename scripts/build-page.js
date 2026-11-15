import pug from 'pug';
import * as sass from 'sass';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'public');

const args = process.argv.slice(2);
const target = args[0]; // Ejemplo: "catalogos/restaurantes"

if (!target) {
  console.error('❌ Uso: node scripts/build-page.js catalogos/restaurantes');
  process.exit(1);
}

async function buildSinglePage() {
  console.log(`\n🏗️  Compilando página individual: ${target}...`);

  // 1. Compilar el Pug específico
  const pugPath = join(SRC, 'pug/pages', `${target}.pug`);
  const outDir = join(OUT, dirname(target));
  const outPath = join(OUT, `${target}.html`);

  try {
    // Cargamos los datos globales
    const site = JSON.parse(await fs.readFile(join(ROOT, 'data/site.json'), 'utf8'));
    const SITE_URL = site.domain.url;

    const html = pug.renderFile(pugPath, {
      site,
      siteUrl: SITE_URL,
      canonical: `${SITE_URL}/${target}`,
      pretty: true,
      basedir: join(SRC, 'pug'),
    });

    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, html);
    console.log(`✔ Pug → public/${target}.html`);
  } catch (error) {
    console.error('❌ Error compilando Pug:', error.message);
    return;
  }

  // 2. Compilar SCSS (para que los estilos se apliquen rápido)
  const result = sass.compile(join(SRC, 'scss/main.scss'), { style: 'expanded' });
  await fs.writeFile(join(OUT, 'css/main.css'), result.css);
  console.log('✔ SCSS → public/css/main.css');

  console.log('\n✅ Página compilada. Recarga el navegador.\n');
}

buildSinglePage();