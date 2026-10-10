# 资产驾驶舱（GitHub Pages 发布仓库）

网址：https://huangjun722.github.io/fund-manager-dashboard/

## 这是什么

一个纯前端的个人资产工作台：全貌、纪律、信号、定投。旧版「基金管理面板」已于 2026-10-10 下线，内容全部替换为新版。

## 目录

| 路径 | 作用 |
|---|---|
| `docs/index.html` | 站点页面（单文件，零第三方 JS 依赖） |
| `docs/data/quotes.json` | 行情数据，由定时任务每天自动更新，页面自动读取 |
| `config/quotes.json` | 行情抓取清单：要抓哪些指数 / 场内标的 / 场外基金 |
| `scripts/sync_quotes.js` | 抓取脚本：场内走腾讯行情，场外基金净值走天天基金 |
| `.github/workflows/update.yml` | 每天 18:30（北京时间）自动跑一次抓取并提交 |

## 数据源

- 场内（指数 / ETF / 个股）：腾讯行情 `qt.gtimg.cn`
- 场外基金净值：天天基金 `api.fund.eastmoney.com/f10/lsjz`
- 都是公开接口，不登录、不碰任何账户

## 隐私边界

- **页面里的数据只存在打开它的那台设备的浏览器里**，不上传服务器、不进这个仓库。
- 仓库里只有页面代码、行情清单和行情数据。清单里只有标的名称和代码，**没有任何金额、份额、账户信息**。
- 想改抓什么，改 `config/quotes.json` 即可。
