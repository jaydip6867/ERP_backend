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
const actionFindings = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  
  // Look for View, Detail, Edit buttons or icons
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('Eye') ||
      line.includes('view') ||
      line.includes('View') ||
      line.includes('Detail') ||
      line.includes('detail') ||
      line.includes('modal') ||
      line.includes('Modal')
    ) {
      if (line.includes('onClick') || line.includes('to=') || line.includes('<button') || line.includes('<Link') || line.includes('render:')) {
        actionFindings.push(`${base}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});

console.log(`Found ${actionFindings.length} actions:`);
actionFindings.slice(0, 100).forEach(a => console.log(a));
if (actionFindings.length > 100) {
  console.log(`... and ${actionFindings.length - 100} more`);
}
