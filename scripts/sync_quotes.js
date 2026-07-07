const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config', 'market_watch.json');
const outputPath = path.join(root, 'data', 'quotes_cache_latest.json');

function todayInShanghai() {
  return new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Shanghai'}));
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

async function fetchTencentQuotes(codes) {
  if (!codes.length) return {};
  const url = `https://qt.gtimg.cn/q=${codes.join(',')}&_=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'fund-manager-daily-cache/0.1'
    }
  });
  if (!response.ok) {
    throw new Error(`Tencent quote request failed: ${response.status}`);
  }
  const text = await response.text();
  const quotes = {};
  for (const code of codes) {
    const match = text.match(new RegExp(`v_${code}="([^"]*)"`));
    if (!match) continue;
    const parts = match[1].split('~');
    quotes[code] = {
      name: parts[1] || code,
      price: Number.parseFloat(parts[3]) || 0,
      chgPct: Number.parseFloat(parts[32]) || 0
    };
  }
  return quotes;
}

async function main() {
  const now = todayInShanghai();
  const asOf = now.toISOString().slice(0, 10);
  const force = process.env.FORCE_SYNC === '1';

  if (!force && !isWeekday(now)) {
    console.log(`skip quote sync on non-weekday: ${asOf}`);
    return;
  }

  const config = readJson(configPath, {benchmarks: [], securities: [], funds: {}});
  const previous = readJson(outputPath, {funds: {}, benchmarks: {}, securities: {}});
  const benchmarkList = Array.isArray(config.benchmarks) ? config.benchmarks : [];
  const securityList = Array.isArray(config.securities) ? config.securities : [];
  const codes = [...new Set([...benchmarkList, ...securityList].map(item => item.code).filter(Boolean))];
  const quotes = await fetchTencentQuotes(codes);

  const latest = {
    asOf,
    source: 'tencent-qt.gtimg.cn',
    generatedAt: now.toISOString(),
    funds: {...(previous.funds || {}), ...(config.funds || {})},
    benchmarks: {},
    securities: {}
  };

  for (const item of benchmarkList) {
    const quote = quotes[item.code];
    if (quote) {
      latest.benchmarks[item.name] = {
        name: item.name,
        price: quote.price,
        chgPct: quote.chgPct,
        asOf
      };
    } else if (previous.benchmarks && previous.benchmarks[item.name]) {
      latest.benchmarks[item.name] = previous.benchmarks[item.name];
    }
  }

  for (const item of securityList) {
    const code = String(item.code || '').trim().toLowerCase();
    const quote = quotes[code];
    if (quote) {
      latest.securities[code] = {
        name: item.name || quote.name || code,
        price: quote.price,
        chgPct: quote.chgPct,
        asOf
      };
    } else if (previous.securities && previous.securities[code]) {
      latest.securities[code] = previous.securities[code];
    }
  }

  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, `${JSON.stringify(latest, null, 2)}\n`, 'utf8');
  console.log(`updated quote cache: ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

