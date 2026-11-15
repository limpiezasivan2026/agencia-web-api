import { promises as fs } from 'fs';
import { join } from 'path';

export async function generarEntryJS(SRC) {
  const jsDir = join(SRC, 'js');
  const entryPath = join(jsDir, '_entry.js');
  
  const items = await fs.readdir(jsDir, { withFileTypes: true });
  
  // Filtramos SOLO archivos .js que estén en la raíz de src/js (ignoramos carpetas como /modules)
  const jsFiles = items
    .filter(item => item.isFile() && item.name.endsWith('.js') && item.name !== '_entry.js')
    .map(item => item.name);
  
  let content = '// Archivo generado automáticamente por generar-entry.js\n\n';
  
  for (const file of jsFiles) {
    const filePath = join(jsDir, file);
    let fileContent = await fs.readFile(filePath, 'utf8');
    
    const esModulo = fileContent.includes('export') || fileContent.includes('import');
    
    if (!esModulo) {
      // Envolvemos en IIFE los scripts sueltos para evitar conflictos globales
      fileContent = `(function() {\n${fileContent}\n})();`;
      await fs.writeFile(filePath, fileContent, 'utf8');
      console.log(`🛡️  ${file} envuelto en IIFE (protegido).`);
    }
    
    // Importamos el archivo en el entry
    content += `import './${file}';\n`;
  }
  
  await fs.writeFile(entryPath, content, 'utf8');
  console.log(`📦 Generado _entry.js con ${jsFiles.length} archivos JS.`);
  
  return entryPath;
}