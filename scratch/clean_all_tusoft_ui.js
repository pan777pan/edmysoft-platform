const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// 1. QuotationWizard.tsx
replaceInFile('components/public/QuotationWizard.tsx', [
  ['y el equipo de ingeniería de TuSoft', 'y el equipo de ingeniería de EDMYSOFT'],
  ['respaldo TuSoft.', 'respaldo de alta ingeniería EDMYSOFT.'],
  ['célula multidesarrollador TuSoft.', 'célula de ingeniería y soporte de EDMYSOFT.']
]);

// 2. Footer.tsx
replaceInFile('components/public/Footer.tsx', [
  ['Backed by TuSoft', 'Tecnología & IA'],
  ['con el respaldo multidesarrollador de <strong>TuSoft</strong> en Colombia', 'con el respaldo de ingeniería y soporte de <strong>EDMYSOFT</strong> en Colombia'],
  ['Liderazgo & TuSoft', 'Liderazgo EDMYSOFT'],
  ['Backed by TuSoft.', 'Tecnología & Software por EDMYSOFT.']
]);

// 3. app/page.tsx
replaceInFile('app/page.tsx', [
  ['Alianza Oficial TuSoft', 'Tecnología & Software de Alto Nivel'],
  ['infraestructura multidesarrollador de <strong className="text-cyan-400 font-semibold">TuSoft</strong>', 'infraestructura multidesarrollador de <strong className="text-cyan-400 font-semibold">EDMYSOFT</strong>'],
  ['<p className="text-3xl font-extrabold text-indigo-400">TuSoft</p>', '<p className="text-3xl font-extrabold text-cyan-400">EDMYSOFT</p>'],
  ['Agilidad de Autor con la Solidez Corporativa de <span className="text-cyan-400">TuSoft</span>', 'Agilidad de Autor con la Solidez Corporativa de <span className="text-cyan-400">EDMYSOFT</span>'],
  ['<h3 className="font-bold text-white text-base">Respaldo TuSoft</h3>', '<h3 className="font-bold text-white text-base">Respaldo y Soporte EDMYSOFT</h3>'],
  ['EDMYSOFT • Backed by TuSoft Colombia', 'EDMYSOFT • Soluciones Digitales Colombia'],
  ['arquitectura de respaldo de TuSoft.', 'arquitectura de respaldo de EDMYSOFT.']
]);

// 4. app/portal/page.tsx
replaceInFile('app/portal/page.tsx', [
  ['Backed by <strong className="text-cyan-400">TuSoft</strong>', 'Desarrollado por <strong className="text-cyan-400">EDMYSOFT</strong>']
]);

// 5. app/layout.tsx
replaceInFile('app/layout.tsx', [
  ['Backed by TuSoft', 'Tecnología, Software & Automatización'],
  ["    'TuSoft',", "    'EDMYSOFT',"]
]);

// 6. app/asistente-ia/page.tsx
replaceInFile('app/asistente-ia/page.tsx', [
  ['Backed by TuSoft', 'Inteligencia Artificial'],
  ['integración con TuSoft o', 'nuestras soluciones en Colombia o']
]);

// 7. app/admin/login/page.tsx
replaceInFile('app/admin/login/page.tsx', [
  ['Backed by <strong className="text-cyan-400">TuSoft</strong>', 'Plataforma Oficial <strong className="text-cyan-400">EDMYSOFT</strong>']
]);

// 8. app/admin/conocimiento/page.tsx
replaceInFile('app/admin/conocimiento/page.tsx', [
  ['TuSoft & Casos de Éxito', 'EDMYSOFT & Casos de Éxito']
]);

// 9. app/api/portal/projects/route.ts
replaceInFile('app/api/portal/projects/route.ts', [
  ['(Backed by TuSoft)', '(Director Técnico EDMYSOFT)']
]);

// 10. app/api/portal/documents/[id]/download/route.ts
replaceInFile('app/api/portal/documents/[id]/download/route.ts', [
  ['EDMYSOFT - Backed by TuSoft', 'EDMYSOFT Technologies']
]);

console.log('Finished updating all residual TuSoft branding across all components and pages.');
