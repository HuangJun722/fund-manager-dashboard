// 每天抓一次公开行情：场内用腾讯行情，场外基金净值用天天基金。
// 输出 docs/data/quotes.json，页面自动读取。不碰任何账户，不需要登录。
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config', 'quotes.json');
const outputPath = path.join(root, 'docs', 'data', 'quotes.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function todayInShanghai() {
  const s = new Date().toLocaleString('sv-SE', {timeZone: 'Asia/Shanghai'});
  return s.slice(0, 10);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function decodeBody(buffer) {
  try {
    return new TextDecoder('gbk').decode(buffer);
  } catch (e) {
    return Buffer.from(buffer).toString('utf8');
  }
}

async function get(url, headers) {
  const res = await fetch(url, {headers: Object.assign({'User-Agent': UA}, headers || {})});
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res;
}

// 腾讯行情：一次可以查多个代码，返回 GBK 文本
async function fetchTencent(codes) {
  if (!codes.length) return {};
  const res = await get('https://qt.gtimg.cn/q=' + codes.join(',') + '&_=' + Date.now(), {Referer: 'https://gu.qq.com/'});
  const text = decodeBody(Buffer.from(await res.arrayBuffer()));
  const out = {};
  const re = /v_([a-zA-Z0-9_]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(text))) {
    const parts = m[2].split('~');
    const price = parseFloat(parts[3]);
    if (!isNaN(price) && price > 0) {
      out[m[1]] = {
        name: parts[1] || m[1],
        price: price,
        chgPct: parseFloat(parts[32]) || 0,
        asOf: (parts[30] || '').slice(0, 8)
      };
    }
  }
  return out;
}

// 天天基金历史净值：取最新一天的单位净值
async function fetchFund(code) {
  const url = 'https://api.fund.eastmoney.com/f10/lsjz?fundCode=' + code + '&pageIndex=1&pageSize=1';
  const res = await get(url, {Referer: 'http://fundf10.eastmoney.com/'});
  const j = await res.json();
  const item = j && j.Data && j.Data.LSJZList && j.Data.LSJZList[0];
  if (!item) return null;
  const price = parseFloat(item.DWJZ);
  if (isNaN(price) || price <= 0) return null;
  return {price: price, asOf: item.FSRQ};
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const asOf = todayInShanghai();
  const config = readJson(configPath, {benchmarks: [], securities: [], funds: []});
  const previous = readJson(outputPath, {quotes: {}, benchmarks: {}});
  const quotes = Object.assign({}, previous.quotes || {});
  const benchmarks = Object.assign({}, previous.benchmarks || {});

  // 1) 场内（指数基准 + ETF/股票）
  const marketCodes = [].concat(
    (config.benchmarks || []).map(x => x.code),
    (config.securities || []).map(x => x.code)
  ).filter(Boolean);
  let market = {};
  try {
    market = await fetchTencent(marketCodes);
  } catch (e) {
    console.log('腾讯行情抓取失败：' + e.message);
  }
  (config.benchmarks || []).forEach(b => {
    const q = market[b.code];
    if (q) benchmarks[b.name] = {name: b.name, price: q.price, chgPct: q.chgPct, asOf: q.asOf || asOf};
  });
  (config.securities || []).forEach(s => {
    const q = market[s.code];
    if (!q) return;
    const bare = String(s.code).replace(/^(sh|sz|hk|us)/i, ''); // 页面里的持仓代码不带前缀
    quotes[bare] = {name: s.name, price: q.price, chgPct: q.chgPct, asOf: q.asOf || asOf};
  });

  // 2) 场外基金净值（串行，避免被限流）
  let ok = 0;
  for (const f of (config.funds || [])) {
    // 货币基金净值恒为 1，收益体现为份额增加；接口返回的值不可信，直接按 1 处理
    if (f.type === 'money') {
      quotes[f.code] = {name: f.name, price: 1, asOf: asOf};
      ok++;
      continue;
    }
    try {
      const q = await fetchFund(f.code);
      if (!q) {
        console.log('无净值：' + f.code + ' ' + f.name);
        await sleep(300);
        continue;
      }
      const prev = quotes[f.code];
      // 异常保护：与上次相比涨跌超过 50%，多半是接口脏数据，保留上次的值
      if (prev && prev.price > 0 && Math.abs(q.price - prev.price) / prev.price > 0.5) {
        console.log('净值异常，保留上次：' + f.code + ' ' + f.name + ' 新=' + q.price + ' 旧=' + prev.price);
      } else {
        quotes[f.code] = {name: f.name, price: q.price, asOf: q.asOf};
        ok++;
      }
    } catch (e) {
      console.log('基金抓取失败 ' + f.code + '：' + e.message);
    }
    await sleep(300);
  }

  const result = {date: asOf, generatedAt: new Date().toISOString(), quotes: quotes, benchmarks: benchmarks};
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('行情已更新 ' + asOf + '：场内 ' + Object.keys(market).length + ' 条，基金 ' + ok + ' 条，quotes 合计 ' + Object.keys(quotes).length);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
