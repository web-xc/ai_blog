# ✦ Aurora Blog

一个基于 **Vue 3 最新技术栈** 的现代化静态博客：Hexo 式的 Markdown 写作流程、GitHub Actions 自动部署到 GitHub Pages、Twikoo 评论，以及一个可以直接发布文章的后台管理系统。

> 内容即文件，发布即提交。没有服务器、没有数据库、没有运维。

---

## ✨ 功能一览

**前台**

- 极光玻璃风设计系统，亮 / 暗双主题、可自定义强调色
- 粒子连线背景、渐变光晕、滚动揭示、页面转场、卡片跟随光晕、打字机、数字滚动等动效
- 首页（置顶大卡 + 分页）、文章详情（目录联动 / 代码高亮一键复制 / 上下篇 / 相关文章 / 分享）
- 归档时间轴、标签星图与标签详情、本地全文搜索（`Ctrl + K` 唤起）、关于页、404
- 阅读进度条、返回顶部、Toast 通知、Markdown 完整排版（表格 / 引用 / 代码块 / 外链）
- Twikoo 评论，未配置时显示三步部署引导
- 响应式适配、`prefers-reduced-motion` 无障碍降级

**后台管理系统**

- 首次设置管理员密码、会话级登录（界面锁）
- 概览：统计卡、7 日浏览趋势、热门文章、发布流水线状态、快捷入口
- 文章管理：本地草稿 / 已上线文章 / 远程仓库文件三个视图
- Markdown 编辑器：元数据面板、语法工具条、**分屏实时预览**、自动保存、`Ctrl + S`、字数统计
- 一键发布：通过 GitHub Contents API 提交 `.md` → 触发 Actions → 自动部署
- 站点设置：品牌信息、亮暗主题、强调色、分页数量、粒子开关、Twikoo、GitHub 仓库与 Token、社交链接、配置导出
- 评论管理：Twikoo 状态、部署方式、审核指引、FAQ

---

## 🧱 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` + Composition API） |
| 构建 | Vite 8 + TypeScript 5.9 + `vue-tsc` |
| 路由 | vue-router 5（history 模式 + `404.html` 回退） |
| 状态 | Pinia 4 |
| 内容 | `import.meta.glob` 构建时扫描 + 轻量 frontmatter 解析 + markdown-it 15 |
| 代码高亮 | highlight.js |
| 图标 | `@lucide/vue` |
| 评论 | Twikoo（按需从 CDN 加载） |
| 部署 | GitHub Actions → GitHub Pages |

---

## 🚀 本地运行

需要 Node.js ≥ 20.19（推荐 22）。

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 类型检查 + 生产构建，产物在 dist/
npm run preview      # 本地预览构建产物 http://localhost:4173
```

---

## ✍️ 写作（Hexo 模式）

在 `src/content/posts/` 新建一个 `.md` 文件即可，**不需要改任何代码或路由**。构建时会被自动扫描并收录。

```markdown
---
title: 我的第一篇文章
date: 2026-11-24
category: 前端工程
tags: [Vue 3, Vite, 随笔]
cover: 🌌
excerpt: 一句话摘要，留空会自动截取正文。
pinned: false
---

## 正文标题

用 Markdown 写下内容……
```

| 字段 | 说明 | 默认值 |
| --- | --- | --- |
| `title` | 文章标题 | 文件名 |
| `date` | 发布日期（YYYY-MM-DD） | 当天 |
| `category` | 分类 | `随笔` |
| `tags` | 标签，支持 `[a, b]` 或 `a, b` | 空 |
| `cover` | 封面 Emoji | `✦` |
| `excerpt` | 摘要 | 自动截取 |
| `pinned` | 是否置顶（首页大卡） | `false` |
| `draft` | `true` 时不参与构建 | `false` |

也可以在后台 `/admin/editor/new` 里可视化写作，填写同样的元数据，编辑器会帮你生成这段 frontmatter。

---

## 🔗 部署到 GitHub Pages

### 1. 创建仓库并推送

```bash
git init
git add .
git commit -m "✨ init Aurora Blog"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

仓库名有两种情况，workflow 会自动适配：

- `<用户名>.github.io` → 访问 `https://<用户名>.github.io/`
- 其他名字（如 `aurora-blog`）→ 访问 `https://<用户名>.github.io/aurora-blog/`

### 2. 开启 Pages

仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

### 3. 等待部署

`push` 会自动触发 `.github/workflows/deploy.yml`：安装依赖 → 计算 base → 类型检查 + 构建 → 上传 artifact → 部署 Pages。约 1 分钟后在 Actions 页面可以看到绿色勾和访问链接。之后每次 `git push`（包括后台发布文章）都会自动重新部署。

也可以在 Actions 页面用 **Run workflow** 手动重跑。

### 4. 自定义站点

- 默认值在 `src/config/site.ts`（改这里需要重新构建）
- 运行时覆盖：进入 `/admin` → **站点设置**，改完点保存，立即生效（保存在浏览器 localStorage）
- 可选的编译期变量见 `.env.example`；Actions 中还可设置仓库变量 `TWIKOO_ENV_ID`

---

## 💬 启用 Twikoo 评论

1. 按 [官方文档](https://twikoo.js.org/quick-start.html) 把云函数部署到腾讯云 CloudBase、Vercel 或自建服务；
2. 得到 `envId`（环境 ID 或云函数地址）；
3. 在 **后台 → 站点设置 → 评论设置** 粘贴并保存，刷新文章页即可。

后台的「评论管理」页内有三种部署方式的说明与审核评论的步骤。未配置时前台会显示引导卡片而不是空白。

---

## 🔐 后台发布闭环

```
编辑器写 Markdown
  → 保存为浏览器本地草稿
  → 点「发布上线」
  → GitHub Contents API PUT /repos/{owner}/{repo}/contents/src/content/posts/<slug>.md
  → 产生一次 commit (push)
  → GitHub Actions 自动构建
  → GitHub Pages 上线
```

配置方法：**后台 → 站点设置 → GitHub 自动部署**，填写 owner、repo、分支与 Personal Access Token，点「测试连接」确认无误。

Token 建议用 **fine-grained PAT**，只授予该仓库的 `Contents: read & write`。它只保存在本机浏览器 `localStorage`，不会写进源码或构建产物。

> ⚠️ 后台登录密码只是**界面锁**，用于避免在共用设备上误操作，不构成服务端鉴权；真正的写入权限来自 GitHub Token。请不要把它当作安全边界，也不要在公开电脑上保存 Token。

---

## 📁 目录结构

```
.
├── .github/workflows/deploy.yml   # 自动构建 + 部署 Pages
├── public/favicon.svg
├── src/
│   ├── content/posts/*.md         # ← 你的文章都放这里
│   ├── components/                # 背景、导航、页脚、卡片、评论、Toast…
│   ├── views/                     # 前台页面
│   │   └── admin/                 # 后台页面（登录/概览/文章/编辑器/设置/评论）
│   ├── lib/                       # posts / markdown / github API / storage / toast / icons
│   ├── stores/                    # site（主题与配置）、admin（草稿与统计）
│   ├── styles/                    # main.css 设计系统、markdown.css 排版
│   ├── config/site.ts             # 站点默认配置
│   ├── router/ App.vue / main.ts
├── index.html
├── vite.config.ts                 # base 自适应 + SPA 404 回退插件
├── .env.example
└── README.md
```

---

## ❓ 常见问题

**资源 404 / 样式丢失？** 说明 base 不对。Actions 会按仓库名自动注入 `VITE_BASE`；本地构建如需指定，用 `VITE_BASE=/repo/ npm run build`。

**直接打开 `/post/xxx` 显示 404？** 构建插件会把 `dist/index.html` 复制成 `dist/404.html` 作为 SPA 回退，请确认部署产物里存在该文件，且 Pages 的 Source 是 GitHub Actions。

**发布提示 401 / 403 / 404？** 依次检查 Token 是否过期、是否具备 Contents 读写权限、owner/repo/分支是否拼写正确。后台已把错误翻译成中文提示。

**改了站点标题但没生效？** 后台修改只保存在当前浏览器；想让所有访客生效，请改 `src/config/site.ts` 后重新推送。

**评论脚本加载慢？** Twikoo 从 jsDelivr 按需加载，组件内置备用 CDN 重试；国内网络首次可能需要几秒。

---

## 📄 License

MIT · 随心取用，改造成你自己的样子就好。✦
