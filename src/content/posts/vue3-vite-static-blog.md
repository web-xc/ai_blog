---
title: 用 Vue 3 + Vite 搭建静态博客的内容层
date: 2026-11-18
category: 前端工程
tags: [Vue 3, Vite, TypeScript, 架构]
cover: ⚡️
excerpt: 不引入 CMS、不请求接口，用 import.meta.glob 在构建时把 Markdown 变成文章数据，这是 Hexo 模式在 Vite 里的现代写法。
---

## 目标：像 Hexo 一样写作

Hexo 最舒服的一点是「文件即内容」：把 `.md` 丢进 `source/_posts/`，跑一次 `hexo generate`，文章就出现了。我们想在 Vue 3 里复刻这种体验，同时保留 SPA 的交互能力。

关键工具是 Vite 的 `import.meta.glob`。它在**构建期**展开成一个静态映射，把匹配到的文件以原始字符串打进产物：

```ts
const rawFiles = import.meta.glob('../content/posts/*.md', {
  query: '?raw',        // 以字符串形式引入，而不是当模块执行
  import: 'default',
  eager: true,          // 同步打包，无需运行时异步请求
}) as Record<string, string>
```

这样做有三个直接好处：

1. 部署后不需要额外请求 `.md` 文件，首屏更快；
2. 文章数据跟着 bundle 走，天然适配 CDN；
3. 新增文章不需要改任何路由或索引代码。

## 解析 Frontmatter

每篇文章开头是一段 YAML 风格的元数据。我们没有引入 `gray-matter`（它在浏览器端依赖 Node 的 `Buffer`），而是写了一个只支持标量与数组的小型解析器：

```ts
function parseValue(value: string) {
  const v = value.trim()
  if (/^["'].*["']$/.test(v)) return v.slice(1, -1)
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map(s => s.trim())
  return v
}
```

够用就好。博客的元数据无非是标题、日期、分类、标签、封面、摘要，为一个简单场景拖进一整套 YAML 解析器并不划算。

## 渲染与目录

正文交给 `markdown-it`，并覆写几条渲染规则：

- `heading_open`：生成带计数的 slug 锚点，顺便收集目录数据；
- `fence`：自定义代码块结构，带语言标签和复制按钮；
- `link_open`：外链自动加 `target="_blank"` 与 `rel="noopener"`；
- `image`：统一懒加载与样式类。

一个小坑是**目录 ID 必须和标题 ID 来自同一次渲染**。如果先 `parse` 一遍收集目录、再 `render` 一遍生成 HTML，重复标题会拿到不一致的编号。我们把计数器放进 `env`，在渲染规则里同时写入两者，问题就消失了。

```ts
const env: MdEnv = {}
const html = md.render(source, env as unknown as Env)
return { html, toc: env.toc ?? [] }
```

## 派生数据

有了文章数组，其余功能全部是纯计算：

- `getTags()` / `getCategories()` — 聚合计数；
- `getArchives()` — 按年份分组；
- `searchPosts()` — 标题、正文、标签的本地全文匹配；
- `getRelated()` — 同分类 +3 分、同标签 +2 分的简易相关度排序。

因为是纯静态站点，搜索完全在浏览器里完成，零延迟，也不会把查询内容发给任何服务器。

## 取舍

这套方案不适合每天更新上千篇的媒体站——所有文章会被打进同一个 chunk。但对个人博客来说，几十到几百篇文章的体积完全可以接受，换来的是极致的简单：**没有后端，没有数据库，没有运维**。

下一篇聊聊怎么让每次 `git push` 自动完成构建和发布。
