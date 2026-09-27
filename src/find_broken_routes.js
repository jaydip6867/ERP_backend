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

const files = walk('frontend/src');

// Read all routes from AppRoutes.jsx
const appRoutesCode = fs.readFileSync('frontend/src/routes/AppRoutes.jsx', 'utf8');
const routeMatches = [...appRoutesCode.matchAll(/path=["']([^"']+)["']/g)].map(m => m[1]);

console.log('AppRoutes defines ' + routeMatches.length + ' paths.');

// Find all navigate(...) and to="..." in all files
const targets = [];
files.forEach(f => {
  if (f.includes('AppRoutes.jsx')) return;
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative('frontend/src', f);

  // static string links
  const links = [...content.matchAll(/(?:to|href)=["'](\/[^"']+)["']/g)];
  links.forEach(m => targets.push({ path: m[1], file: rel, line: m[0] }));

  // navigate('...')
  const navs = [...content.matchAll(/navigate\(["'](\/[^"']+)["']/g)];
  navs.forEach(m => targets.push({ path: m[1], file: rel, line: m[0] }));

  // template literals: navigate(`/foo/${...}`) or to={`/foo/${...}`}
  const tplLinks = [...content.matchAll(/(?:to|navigate)\(`(\/[^`]+)`\)/g)];
  tplLinks.forEach(m => {
    // replace ${...} with :param
    const generalized = m[1].replace(/\$\{[^}]+\}/g, ':id');
    targets.push({ path: generalized, file: rel, line: m[0], raw: m[1] });
  });
});

console.log('Found ' + targets.length + ' navigation targets.');

// Check which targets don't match any route
function normalizeRoute(r) {
  return r.startsWith('/') ? r.slice(1) : r;
}

const definedRoutes = new Set(routeMatches.map(normalizeRoute));

function matchesDefined(targetPath) {
  let p = normalizeRoute(targetPath.split('?')[0]); // strip query params
  if (definedRoutes.has(p)) return true;

  // Check parameterized match
  for (const r of definedRoutes) {
    const rParts = r.split('/');
    const pParts = p.split('/');
    if (rParts.length !== pParts.length) continue;
    let match = true;
    for (let i = 0; i < rParts.length; i++) {
      if (rParts[i].startsWith(':')) continue;
      if (rParts[i] !== pParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

const unmatched = [];
targets.forEach(t => {
  if (!matchesDefined(t.path)) {
    unmatched.push(t);
  }
});

console.log('\n=== UNMATCHED TARGETS (' + unmatched.length + ') ===');
unmatched.forEach(u => {
  console.log(`Path: "${u.path}" in ${u.file} (${u.line})`);
});
