---
title: 给静态博客接上 Twikoo 评论
date: 2026-11-10
category: 工程化
tags: [Twikoo, 评论系统, Serverless]
cover: 💬
excerpt: 纯静态站点也能有评论：一个云函数、一个 envId、一段按需加载的脚本，不需要注册账号，也不追踪访客。
---

## 静态站点的评论难题

博客是纯静态文件，没有服务端，自然也没地方存评论。常见的替代方案有两类：

- **基于 GitHub Issues**：把评论存成 issue，优点是完全免费，缺点是访客必须登录 GitHub。
- **第三方 SaaS**：接入快，但数据不在自己手里，多数还带统计脚本。

Twikoo 属于第三种思路：自带一个极轻量的云函数后端 + 数据库，前端只加载一段脚本。访客无需注册，可以匿名评论，数据存在自己的云环境里。

## 三步接入

### 1. 部署云函数

最省事的是腾讯云 CloudBase：在云开发控制台新建环境，部署 Twikoo 云函数，得到一串环境 ID。也可以用 Vercel / Netlify 部署 Serverless 函数，此时 `envId` 填函数地址。

> 无论哪种方式，数据库凭据都只留在云端环境变量里，前端拿到的只是一个公开标识。

### 2. 动态加载脚本

不要在 `index.html` 里硬编码 script 标签——首页、归档页根本用不到评论，白白多一个请求。我们在组件挂载时按需注入：

```ts
async function ensureTwikoo() {
  if (window.twikoo) return
  await injectScript(
    'https://cdn.jsdelivr.net/npm/twikoo@1/dist/twikoo.all.min.js'
  )
}
```

再加一个备用 CDN，主站失败时自动重试，国内网络环境下很有用。

### 3. 初始化

```ts
twikoo.init({
  envId: config.twikooEnvId,
  el: container,
  path: `/post/${slug}`,
  lang: 'zh-CN',
})
```

`path` 要传稳定的文章标识，别用完整 URL，否则换域名后评论会全部丢失。

## 配置放在哪里

把 `envId` 写死在源码里意味着每次换环境都要重新构建。更好的做法是：编译进一份默认值，同时允许后台在运行时覆盖（存 localStorage），组件监听配置变化后重新初始化。

```ts
watch(envId, () => init())
```

这样在后台「站点设置 → 评论设置」里粘贴 ID、保存、刷新文章页，评论就出现了，整个过程不需要 commit。

## 别留一片空白

未配置时，评论区不要显示一个空容器。我们渲染一张引导卡片，写清楚三步该做什么，并给出跳转后台设置的按钮。对第一次部署博客的人来说，这比一句「评论加载失败」友好得多。

## 主题适配

本站支持亮暗双主题，切换时评论区的输入框颜色容易对不上。除了给容器加 `data-theme`，还可以覆盖 Twikoo 的几个 Element UI 类名：

```css
:deep(.twikoo-container .el-textarea__inner) {
  background: var(--surface-solid) !important;
  color: var(--text) !important;
}
```

主题切换时重新 `init` 一次，视觉就统一了。

## 管理评论

评论区右下角有个「管理」小齿轮，首次点击设置管理密码，之后可以审核、置顶、删除评论。密码走的是 Twikoo 自己的鉴权，与本站后台的界面锁完全是两回事。

至此，一个没有服务器、没有追踪、数据自主的评论系统就接好了。
