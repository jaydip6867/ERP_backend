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
  
  const match = content.match(/actions=\{\(row\)\s*=>\s*([\s\S]*?)\}\s*\/>/);
  if (match) {
    console.log(`\n=== [${base}] ===`);
    console.log(match[1].trim().split('\n').slice(0, 15).join('\n'));
  }
});
