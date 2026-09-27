import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.jsx') || full.endsWith('.js')) results.push(full);
  });
  return results;
}

const files = walk('frontend/src/pages');
const links = new Set();
const navs = new Set();

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  
  const linkMatches = code.match(/to=['"][^'"]+['"]/g) || [];
  linkMatches.forEach(m => links.add(m + ' in ' + base));

  const linkTpl = code.match(/to=\{`[^`]+`\}/g) || [];
  linkTpl.forEach(m => links.add(m + ' in ' + base));

  const navMatches = code.match(/navigate\(['"][^'"]+['"]\)/g) || [];
  navMatches.forEach(m => navs.add(m + ' in ' + base));

  const navTpl = code.match(/navigate\(`[^`]+`\)/g) || [];
  navTpl.forEach(m => navs.add(m + ' in ' + base));
});

console.log('=== LINKS (' + links.size + ') ===');
Array.from(links).sort().forEach(l => console.log(l));
console.log('\n=== NAVIGATES (' + navs.size + ') ===');
Array.from(navs).sort().forEach(n => console.log(n));
