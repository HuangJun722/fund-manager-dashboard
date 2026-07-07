# 资金管理面板（GitHub Pages 公开壳）

这是资金管理面板的 GitHub Pages 发布仓库。

## 安全边界

这个仓库是 public，用于解决 GitHub Pages 访问问题，但只发布：

- 静态网页壳子
- 公共行情/指数估值缓存
- 自动更新脚本

不要提交真实持仓、责任人资产明细、导出的备份 JSON、Excel 原始数据或任何个人隐私数据。

真实资产数据可以保存在浏览器 `localStorage`，也可以加密为 `data/portfolio.encrypted.json` 后发布。加密文件只允许是 AES-GCM 密文，不要提交明文备份或 Excel 原始数据。

## 访问地址

```text
https://huangjun722.github.io/fund-manager-dashboard/
```

加密原型：

```text
https://huangjun722.github.io/fund-manager-dashboard/crypto-prototype.html
```

## 自动更新

GitHub Actions 会在交易日 18:30（北京时间）同步行情缓存并重新生成 `/docs`。

本地命令：

```bash
npm run check
npm run sync:quotes
npm run build
```

## 加密原型

`crypto-prototype.html` 用于验证资产数据加密导出和解密还原流程：

- AES-GCM 256 位加密
- PBKDF2-SHA-256，600000 次迭代
- 每次加密使用随机 salt 和 IV
- 明文和主密码只在浏览器本地处理

加密文件可以命名为 `portfolio.encrypted.json`。不要提交明文资产数据。

## 加密资产同步

主面板已支持自动检测 `data/portfolio.encrypted.json`：

- 打开 GitHub Pages 后，页面会先加载每日行情缓存。
- 如果发现 `portfolio.encrypted.json`，会要求输入主密码并在浏览器本地解密。
- 解密后的资产数据和行情缓存会在本地合并计算市值。
- 设置页可以导出新的 `portfolio.encrypted.json`，用于手动提交到仓库。

主密码不会写入代码、仓库或行情缓存。
