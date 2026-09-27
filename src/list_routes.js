import fs from 'fs';

const appRoutesCode = fs.readFileSync('frontend/src/routes/AppRoutes.jsx', 'utf8');
const routeMatches = appRoutesCode.matchAll(/path=["']([^"']+)["']/g);
const routes = [];
for (const m of routeMatches) {
  routes.push(m[1]);
}

console.log('=== DEFINED ROUTES IN AppRoutes.jsx (' + routes.length + ') ===');
routes.sort().forEach(r => console.log(r));
