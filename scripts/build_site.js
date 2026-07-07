const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'docs');
const dataDir = path.join(site, 'data');

fs.rmSync(site, {recursive: true, force: true});
fs.mkdirSync(dataDir, {recursive: true});

fs.copyFileSync(path.join(root, 'fund_manager_v4.html'), path.join(site, 'index.html'));
fs.copyFileSync(path.join(root, 'data', 'quotes_cache_latest.json'), path.join(dataDir, 'quotes_cache_latest.json'));
fs.copyFileSync(path.join(root, 'quotes_cache_template.json'), path.join(site, 'quotes_cache_template.json'));

console.log(`built GitHub Pages site: ${site}`);
