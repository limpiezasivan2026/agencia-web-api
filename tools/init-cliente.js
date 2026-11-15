const fs = require('fs');
const path = require('path');

// Uso: node tools/init-cliente.js nombre-del-cliente
const nombreCliente = process.argv[2];

if (!nombreCliente) {
  console.error('❌ Uso: node tools/init-cliente.js <nombre-del-cliente>');
  console.error('Ejemplo: node tools/init-cliente.js clinica-dental-madrid');
  process.exit(1);
}

const slugCliente = nombreCliente.toLowerCase().replace(/[^a-z0-9]/g, '-');
const RAIZ_AGENCIA = path.join(__dirname, '..');
const CARPETA_CLIENTES = path.join(RAIZ_AGENCIA, '..', 'clientes'); // Asumiendo que 'clientes' está al mismo nivel que 'agencia-web'
const RUTA_NUEVO_CLIENTE = path.join(CARPETA_CLIENTES, slugCliente);

console.log(`\n🚀 Iniciando proyecto para el cliente: ${nombreCliente}...`);

// 1. Crear carpeta del cliente
if (!fs.existsSync(CARPETA_CLIENTES)) fs.mkdirSync(CARPETA_CLIENTES, { recursive: true });
if (fs.existsSync(RUTA_NUEVO_CLIENTE)) {
  console.error(`❌ La carpeta ${slugCliente} ya existe.`);
  process.exit(1);
}
fs.mkdirSync(RUTA_NUEVO_CLIENTE);

// 2. Función para copiar carpetas (ignorando node_modules, public, .git, etc)
function copiarCarpeta(origen, destino) {
  const IGNORAR = ['node_modules', 'public', '.git', 'agencia.sqlite'];
  if (!fs.existsSync(origen)) return;
  
  fs.mkdirSync(destino, { recursive: true });
  const archivos = fs.readdirSync(origen);

  for (const archivo of archivos) {
    if (IGNORAR.includes(archivo)) continue;
    const rutaOrigen = path.join(origen, archivo);
    const rutaDestino = path.join(destino, archivo);
    const stat = fs.statSync(rutaOrigen);

    if (stat.isDirectory()) {
      copiarCarpeta(rutaOrigen, rutaDestino);
    } else {
      fs.copyFileSync(rutaOrigen, rutaDestino);
    }
  }
}

// 3. Copiar la estructura base de agencia-web
console.log('📁 Copiando estructura base...');
copiarCarpeta(path.join(RAIZ_AGENCIA, 'src'), path.join(RUTA_NUEVO_CLIENTE, 'src'));
copiarCarpeta(path.join(RAIZ_AGENCIA, 'scripts'), path.join(RUTA_NUEVO_CLIENTE, 'scripts'));
copiarCarpeta(path.join(RAIZ_AGENCIA, 'server'), path.join(RUTA_NUEVO_CLIENTE, 'server'));
copiarCarpeta(path.join(RAIZ_AGENCIA, 'tools'), path.join(RUTA_NUEVO_CLIENTE, 'tools'));
['package.json', 'Dockerfile', '.dockerignore', '.gitignore'].forEach(archivo => {
  const origen = path.join(RAIZ_AGENCIA, archivo);
  if (fs.existsSync(origen)) fs.copyFileSync(origen, path.join(RUTA_NUEVO_CLIENTE, archivo));
});

// 4. Modificar package.json con el nuevo nombre
console.log('📝 Configurando package.json...');
const pkgPath = path.join(RUTA_NUEVO_CLIENTE, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = slugCliente;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// 5. Modificar site.json con el nuevo nombre
console.log('⚙️ Configurando site.json...');
const sitePath = path.join(RUTA_NUEVO_CLIENTE, 'data', 'site.json');
if (fs.existsSync(sitePath)) {
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
  site.brand.name = nombreCliente;
  site.brand.email = `hola@${slugCliente}.com`;
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2));
}

console.log(`\n✅ ¡Proyecto creado con éxito!`);
console.log(`📁 Ubicación: ${RUTA_NUEVO_CLIENTE}`);
console.log(`\n👉 Siguientes pasos:`);
console.log(`   1. cd ../clientes/${slugCliente}`);
console.log(`   2. npm install`);
console.log(`   3. npm run preparar-cliente\n`);