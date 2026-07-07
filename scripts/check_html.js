const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', 'fund_manager_v4.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);

for (let i = 0; i < scripts.length; i += 1) {
  // eslint-disable-next-line no-new-func
  new Function(scripts[i]);
}

console.log(`syntax OK: ${scripts.length} inline script(s) checked`);
