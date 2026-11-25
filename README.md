# ✦ Aurora Blog

一个基于 **Vue 3 最新技术栈** 的现代化静态博客：Hexo 式的 Markdown 写作、GitHub Actions / Vercel 自动部署、Twikoo 评论、可选的真云端后台，以及一整套移动端优先的交互设计。

> 内容即文件，发布即提交。纯静态部署时零后端；接入 Vercel 后，配置、草稿、统计与 AI 全部变成跨设备的云端数据。

---

## ✨ 功能一览

**前台**

- 极光玻璃风设计系统，亮 / 暗双主题、可自定义强调色
- 粒子连线背景、渐变光晕、滚动揭示、页面转场、卡片跟随光晕、打字机、数字滚动
- 首页：桌面 **3 栏紧凑卡片**（平板 2 栏 / 手机 1 栏横排小卡）、分页、标签云、分类
- **Hero 可隐藏**：后台设置默认是否显示，访客也能自己收起 / 展开（偏好存本机）
- 文章详情：目录联动、代码高亮一键复制、**AI 摘要**、点赞、稍后读、分享、字号调节、图片灯箱、上下篇、相关文章
- 归档时间轴、标签星图与标签详情、本地全文搜索（`Ctrl + K` / `/`）、关于、**友链**、**稍后读**、404
- 阅读进度条、返回顶部、Toast、站点公告条、随机文章（`R`）、主题切换（`T`）、快捷键帮助（`?`）
- **移动端右侧滑出导航抽屉**：遮罩、ESC / 点击遮罩 / 右滑关闭、滚动锁、刘海屏安全区、大触摸区域
- 移动端目录底部抽屉、横排紧凑文章卡、`prefers-reduced-motion` 无障碍降级
- Twikoo 评论，未配置时显示三步部署引导

**后台管理系统**

- 本地界面锁 或 **Vercel 服务端会话鉴权**（HttpOnly Cookie）
- 概览：统计卡、7 日浏览趋势、热门文章、发布流水线状态（云端模式下为全站真实统计）
- 文章管理：本地草稿 / 已上线文章 / 远程仓库文件
- Markdown 编辑器：元数据面板、语法工具条、**AI 一键生成摘要**、分屏实时预览、自动保存、`Ctrl + S`
- 一键发布：浏览器直连 GitHub Contents API，或走 **Vercel 服务端发布**（Token 不出浏览器）
- 站点设置：品牌、外观、Hero、AI / 点赞 / 书签 / 公告开关、强调色、Twikoo、GitHub、社交链接、**友链管理**、云端连接状态
- 评论管理：Twikoo 状态、部署方式、审核指引、FAQ

**云端能力（可选）**

| 能力 | 说明 |
| --- | --- |
| `auth` | `ADMIN_PASSWORD` 校验 + HMAC 签名会话 Cookie |
| `config` | 站点配置存仓库 `content/data/site.json`，所有访客即时生效 |
| `drafts` | 草稿跨设备同步，存 `content/data/drafts.json` |
| `stats` | 全站浏览量 / 点赞 / 7 日趋势，优先 KV，否则仓库 JSON |
| `ai` | AI 摘要，接 OpenAI 兼容模型；未配置时自动降级为离线提取式 |
| `publish` | 服务端用 GitHub Token 提交 `.md` 并触发 Vercel 重新构建 |

---

## 🧱 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` + Composition API） |
| 构建 | Vite 8 + TypeScript 5.9 + `vue-tsc` |
| 路由 / 状态 | vue-router 5（history / hash 自动切换）+ Pinia 4 |
| 内容 | `import.meta.glob` 构建时扫描 + 轻量 frontmatter + markdown-it 15 |
| 代码高亮 / 图标 | highlight.js（按需语言）/ `@lucide/vue` |
| 评论 | Twikoo（按需 CDN 加载） |
| 后端（可选） | Vercel Serverless Functions（`api/`）+ GitHub Contents API / Upstash KV |
| 部署 | GitHub Actions → GitHub Pages，或 GitHub → Vercel |

---

## 🚀 本地运行

需要 Node.js ≥ 20.19（推荐 22）。

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # vue-tsc --noEmit（同时检查 api/ 下的 TS）
npm run build        # 类型检查 + 生产构建，产物在 dist/
npm run preview      # 本地预览构建产物
npm run test:api     # 离线跑通全部 Serverless Functions（无需 Vercel / 网络）
```

`test:api` 用项目内已安装的 TypeScript 在内存中编译 `api/*.ts`，配合模拟的 GitHub Contents API 驱动全部 7 个接口，覆盖登录会话与签名校验、密钥过滤、草稿读写、统计计数、AI 降级、服务端发布与退出登录等 48 项断言；新增接口后可直接在 `scripts/smoke-api.cjs` 里补断言。

本地没有 `/api` 时会自动进入**本地模式**：配置 / 草稿 / 统计存 localStorage，AI 摘要使用离线提取算法，功能不中断。

---

## ✍️ 写作（Hexo 模式）

在 `src/content/posts/` 新建 `.md` 即可，**不需要改任何代码或路由**。

```markdown
---
title: 我的第一篇文章
date: 2026-11-24
category: 前端工程
tags: [Vue 3, Vite, 随笔]
cover: 🌌
excerpt: 一句话摘要，留空会自动截取正文。
ai_summary: 可选，编辑器「AI 生成」会写入这一行。
pinned: false
---

## 正文标题

用 Markdown 写下内容……
```

| 字段 | 说明 | 默认值 |
| --- | --- | --- |
| `title` / `date` | 标题 / 发布日期 | 文件名 / 当天 |
| `category` / `tags` | 分类 / 标签（支持 `[a, b]` 或 `a, b`） | `随笔` / 空 |
| `cover` / `excerpt` | 封面 Emoji / 摘要 | `✦` / 自动截取 |
| `ai_summary` | 文章页 AI 摘要卡片的内容 | 空（前台可按需生成） |
| `pinned` / `draft` | 置顶 / 草稿不参与构建 | `false` |

也可以在后台 `/admin/editor/new` 可视化写作，编辑器会生成同样的 frontmatter。

---

## ☁️ 云端模式（Vercel，真·后台数据）

你的 **GitHub → Vercel** 链路天然适合这套方案：Vercel 继续托管静态站点，`api/` 下的 Serverless Functions 提供后端接口。密钥全部放在 Vercel 环境变量，浏览器不再持有 GitHub Token 或 AI Key。

```
浏览器 ──► Vercel 静态站点 (dist)
   │
   └──► /api/* Serverless Functions ──► GitHub 仓库 content/data/*.json（配置 / 草稿 / 统计）
                                  ├──► Upstash / Vercel KV（可选，高频计数）
                                  └──► OpenAI 兼容模型（可选，AI 摘要）
```

### 1. 部署

把仓库导入 Vercel（Framework 会自动识别为 Vite；仓库里的 `vercel.json` 已配置 SPA 回退与资源缓存）。GitHub push 会自动触发构建。

### 2. 配置环境变量

在 **Vercel → Project Settings → Environment Variables** 添加，完整清单见 `.env.vercel.example`：

| 变量 | 是否必需 | 作用 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 必需 | 后台登录密码；不填则云端写入能力关闭 |
| `AUTH_SECRET` | 推荐 | 会话签名密钥，任意长随机串 |
| `GITHUB_TOKEN` | 推荐 | fine-grained PAT，仅目标仓库 `Contents: read & write` |
| `GITHUB_REPO` / `GITHUB_BRANCH` | 可选 | 通常 Vercel 自动注入仓库信息，无需手填 |
| `POSTS_DIR` | 可选 | 源码在子目录时填 `blog/src/content/posts` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 可选 | Upstash / Vercel KV，高频计数 |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | 可选 | 任何 OpenAI 兼容接口；不填自动用离线摘要 |
| `VITE_TWIKOO_ENV_ID` | 可选 | Twikoo 环境 ID（也可在后台填） |

### 3. 验证

部署后访问 `/api/health`，会返回当前存储类型与能力矩阵：

```json
{
  "ok": true, "storage": "github", "ai": "local",
  "capabilities": { "auth": true, "config": true, "drafts": true, "stats": true, "ai": true, "publish": true }
}
```

后台「站点设置 → 云端数据连接」会显示同样的状态与「立即同步配置」按钮。

上线前也可先在本地执行 `npm run test:api`：它用内存编译 + 模拟 GitHub API 完整跑一遍登录、配置、草稿、统计、AI、发布、退出登录链路，不需要 Vercel 账号或真实 Token，适合改完环境变量 / 接口后回归。

### 4. 双模式与降级

前端启动时探测一次 `/api/health`：

- **探测成功** → 云端模式：登录走服务端会话、配置 / 草稿双向同步、统计与点赞走全站计数、AI 走模型
- **探测失败**（GitHub Pages、本地 dev、Vercel 未配变量）→ 本地模式：一切回退 localStorage + 离线摘要，界面不会报错

配置写入会过滤掉 `github.token`，即使误填也不会写进仓库。云端保存配置 / 草稿的 commit 带 `[skip ci]`，不会触发无意义的重新构建；发布文章不带该标记，会正常触发部署。

---

## 🔗 部署到 GitHub Pages（纯静态）

> 已经有 `https://<用户名>.github.io/<仓库名>/` 站点、不想动旧仓库？**看下一节**。

```bash
git remote add origin https://github.com/<用户名>/<新仓库名>.git
git branch -M main
git push -u origin main
```

仓库 **Settings → Pages → Source** 选 **GitHub Actions**。`.github/workflows/deploy.yml` 会按仓库名自动注入 `VITE_BASE`，生成 `404.html` 做 SPA 深链接回退，约 1 分钟上线。

- `<用户名>.github.io` → `https://<用户名>.github.io/`
- 其他名字 → `https://<用户名>.github.io/<仓库名>/`

纯静态部署没有 `/api`，因此后台是本地模式 + 浏览器直连 GitHub 发布，这是设计内的行为。

---

## 🧩 已有仓库怎么办（不替换旧站点）

GitHub Pages 的规则是**一个仓库 = 一个站点、一个部署来源**，但一个账号可以有多个项目页。两条路都不需要「替换」旧仓库。

### 路线 A · 新建一个仓库（推荐，零风险）

旧仓库完全不用碰，博客拥有自己的地址 `https://<用户名>.github.io/<新仓库名>/`。当前目录已是 git 仓库并有提交记录，只需把 `origin` 指向**新**仓库：

```bash
cd C:/Users/Administrator/Music/Blog
git remote add origin https://github.com/<用户名>/<新仓库名>.git   # ← 新仓库，不是旧仓库
git branch -M main && git push -u origin main
```

### 路线 B · 复用同一个仓库，新旧站点共存

博客挂在 `https://<用户名>.github.io/<仓库名>/blog/`，旧站点继续在根路径。**前提**：`actions/deploy-pages` 是整包替换站点，所以必须用 `PAGES_LEGACY_DIR` 把旧静态文件一起打进 artifact。

1. 克隆旧仓库（建议先开分支 `integrate-blog`），把博客源码放进 `blog/` 子目录；
2. workflow 必须放在仓库根：复制 `.github/workflows/deploy.yml` 到 `.github/workflows/aurora-blog.yml`（改名避免与旧 workflow 冲突）；
3. 把旧站点文件放进 `legacy/`：`gh-pages` 分支用 `git fetch origin gh-pages && git archive origin/gh-pages | tar -x -C legacy`；若旧站点在 `/docs`，直接把变量设为 `docs`；
4. 仓库变量：`BLOG_DIR=blog`、`PAGES_SUBPATH=blog`、`PAGES_LEGACY_DIR=legacy`；
5. 合并到默认分支，Pages Source 改成 GitHub Actions；后台 owner / repo 填这个旧仓库。

`VITE_POSTS_DIR` 会自动推导为 `blog/src/content/posts`；共存模式自动启用 hash 路由，因为站点根 `404.html` 归旧站点所有。旧分支数据从未删除，把 Pages Source 改回原分支即可回退。若旧站点本身也由另一套 Actions 生成，需要把它的构建步骤合并进同一 workflow —— 这种情况更建议用路线 A。

---

## 💬 启用 Twikoo 评论

1. 按 [官方文档](https://twikoo.js.org/quick-start.html) 把云函数部署到腾讯云 CloudBase、Vercel 或自建服务；
2. 得到 `envId`；
3. 在 **后台 → 站点设置 → 评论设置** 粘贴并保存（或设 Vercel 变量 `VITE_TWIKOO_ENV_ID`），刷新文章页即可。

未配置时前台显示引导卡片而不是空白。

---

## 🔐 后台发布闭环

```
编辑器写 Markdown（可一键生成 AI 摘要）
  → 保存草稿（本地 / 云端）
  → 点「发布上线」
  → 云端模式：POST /api/publish → 服务端用 GITHUB_TOKEN 提交 .md
    静态模式：浏览器直连 GitHub Contents API PUT .md
  → 产生 commit → GitHub Actions / Vercel 自动构建 → 上线
```

静态模式需在「站点设置 → GitHub 自动部署」填 owner / repo / 分支与 fine-grained PAT（只存浏览器）。云端模式不需要在浏览器填 Token。

> ⚠️ 本地模式的密码只是**界面锁**，不构成服务端鉴权；真正的写入权限来自 GitHub Token。云端模式的密码由服务端校验，请不要在公开电脑保存任何凭据。

---

## 📱 移动端与交互

- 导航：桌面顶部导航；≤860px 改为**右侧全高抽屉**（遮罩 / ESC / 右滑关闭 / 滚动锁 / 安全区）
- 卡片：桌面 3 栏紧凑卡、平板 2 栏、手机横排小卡（缩略图 + 摘要），触摸目标 ≥ 40px
- 后台侧栏同样从右侧滑出；表单、表格、保存条均做了窄屏适配
- 快捷键：`Ctrl/⌘ + K` 或 `/` 搜索、`T` 主题、`R` 随机文章、`?` 帮助、`Esc` 关闭
- 全部动效尊重 `prefers-reduced-motion`；触摸设备自动关闭 hover 位移

---

## 📁 目录结构

```
.
├── api/                            # Vercel Serverless Functions（可选后端）
│   ├── _lib/                       # core(鉴权) / data(存储) / summary(AI)，下划线前缀不会部署成函数
│   ├── health.ts auth.ts config.ts drafts.ts stats.ts ai.ts publish.ts
├── vercel.json                     # SPA 回退（显式排除 /api 与 /assets）+ 资源缓存
├── scripts/smoke-api.cjs           # 离线跑通全部 Serverless Functions
├── .env.vercel.example             # Vercel 环境变量清单
├── .github/workflows/deploy.yml    # GitHub Pages 自动部署
├── src/
│   ├── content/posts/*.md          # ← 文章都放这里
│   ├── components/                 # Header 抽屉 / 卡片 / AI 摘要 / 互动工具条 / 评论…
│   ├── views/                      # 前台（含 links、bookmarks）
│   │   └── admin/                  # 后台（登录/概览/文章/编辑器/设置/评论）
│   ├── lib/                        # posts / markdown / cloud / github / summary / storage
│   ├── stores/                     # site（配置+云同步）、admin（草稿+统计）、extras（互动）
│   ├── styles/                     # main.css 设计系统、markdown.css 排版
│   ├── config/site.ts              # 站点默认配置（含新增开关）
│   └── router/ App.vue / main.ts
└── README.md
```

---

## ❓ 常见问题

**后台显示「本地模式」？** 说明 `/api/health` 没返回 JSON。用浏览器直接打开这个地址看返回的是 HTML 还是 JSON：

- 返回 HTML → SPA 回退规则把 API 请求吞了。`vercel.json` 的 rewrite 必须是 `"/((?!api/|assets/).*)"`；如果改成了 `"/(.*)"` 这类全量 catch-all，`/api/*` 会被送回 `index.html`，前端探测失败就会降级。改回排除规则并重新部署。
- 返回 404 / 500 → 检查 Vercel 项目是否识别了 `api/` 下的函数、环境变量是否配齐，函数日志里是否有模块加载错误（`api/_lib/` 是下划线前缀的共享库，Vercel 不会把它当成独立函数）。
- GitHub Pages 与本地 `npm run dev` 本来就是本地模式，属正常现象。

改完可先跑 `npm run test:api` 确认接口逻辑本身没问题，再排查部署层。

**云端配置改了但访客看不到？** 站点启动时拉取一次云端配置；后台保存会立即推送。确认 `capabilities.config` 为 true，且 `GITHUB_TOKEN` 有 Contents 写权限。

**AI 摘要显示「本地提取」？** 未配置 `AI_API_KEY`，或模型接口不可达（会自动降级）。配好后重新生成即可；也可以把结果通过编辑器写进 `ai_summary` 随文章发布。

**资源 404 / 样式丢失？** base 不对。Actions 按仓库名自动注入 `VITE_BASE`；Vercel 根域名部署保持 `/`。本地指定用 `VITE_BASE=/repo/ npm run build`（Windows Git Bash 建议用 Node 注入环境变量）。

**直接打开 `/post/xxx` 显示 404？** 构建会生成 `dist/404.html` 做 SPA 回退；Vercel 用 `vercel.json` 的 rewrite。共存子路径模式请用 hash 路由（自动启用）。

**会覆盖已有仓库 / 站点吗？** 不会，除非你主动把 `origin` 指向旧仓库并 push。详见「已有仓库怎么办」。

---

## 📄 License

MIT · 随心取用，改造成你自己的样子就好。✦
