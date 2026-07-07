# 资金管理面板（GitHub Pages 公开壳）

这是资金管理面板的 GitHub Pages 发布仓库。

## 安全边界

这个仓库是 public，用于解决 GitHub Pages 访问问题，但只发布：

- 静态网页壳子
- 公共行情/指数估值缓存
- 自动更新脚本

不要提交真实持仓、责任人资产明细、导出的备份 JSON、Excel 原始数据或任何个人隐私数据。

真实资产数据只保存在浏览器 `localStorage` 中。也就是说，同一设备同一浏览器再次打开页面会保留数据；换设备需要重新导入。

## 访问地址

```text
https://huangjun722.github.io/fund-manager-dashboard/
```

## 自动更新

GitHub Actions 会在交易日 18:30（北京时间）同步行情缓存并重新生成 `/docs`。

本地命令：

```bash
npm run check
npm run sync:quotes
npm run build
```

