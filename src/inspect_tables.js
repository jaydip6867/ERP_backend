import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.jsx')) results.push(full);
  });
  return results;
}

const files = walk('frontend/src/pages');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  
  const hasDataTable = content.includes('<DataTable');
  const hasActions = content.includes('actions=');
  const hasOnRowClick = content.includes('onRowClick=');
  
  if (hasDataTable) {
    // Extract actions prop
    const actionsMatch = content.match(/actions=\{([^\n}]+|[^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/);
    console.log(`[${base}] DataTable: actions=${hasActions}, onRowClick=${hasOnRowClick}`);
  }
});
