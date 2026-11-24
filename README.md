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

> 已经有一个 `https://<用户名>.github.io/<仓库名>/` 站点、不想动旧仓库？**直接看下一节**，最省事的做法是新建一个仓库，旧仓库和旧站点一个字节都不用改。

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

## 🧩 已有仓库怎么办（不替换旧站点）

GitHub Pages 的规则是：**一个仓库 = 一个站点，一个站点 = 一个部署来源**；而一个账号可以有 1 个用户页 + 任意多个项目页。所以你原来的 `https://<用户名>.github.io/<仓库名>/` 完全可以原样保留，两条路都不需要「替换」它。

### 路线 A · 新建一个仓库（推荐，零风险）

旧仓库不用碰，博客拥有自己的地址 `https://<用户名>.github.io/<新仓库名>/`。本目录已经是 git 仓库并有提交记录，只需：

```bash
cd C:/Users/Administrator/Music/Blog
git remote add origin https://github.com/<用户名>/<新仓库名>.git   # ← 新仓库，不是旧仓库
git branch -M main
git push -u origin main
```

然后在**新仓库** Settings → Pages → Source 选 **GitHub Actions**。旧仓库的文件、Pages 配置和访问地址全部不变，两个站点同时在线。

> ⚠️ 不要在旧仓库目录下执行这些命令，也不要把 `origin` 指向旧仓库地址 —— 那才会把内容推到旧仓库里。

### 路线 B · 复用同一个仓库，新旧站点共存

博客挂在 `https://<用户名>.github.io/<仓库名>/blog/`，旧站点继续留在 `https://<用户名>.github.io/<仓库名>/`，源码、旧静态文件、博客产物同处一个仓库，互不覆盖。

**前提**：`actions/deploy-pages` 每次会用 artifact **整包替换**该仓库的 Pages 站点，所以必须把旧站点的静态文件一起打进 artifact（靠 `PAGES_LEGACY_DIR`），否则旧页面会消失。旧分支里的数据不会被删除，随时可以把 Pages Source 改回原分支回退。

**1. 克隆旧仓库（不要先删任何文件）**

```bash
git clone https://github.com/<用户名>/<仓库名>.git old-repo
cd old-repo
git checkout -b integrate-blog   # 建议先开分支验证，最后合并回默认分支才会触发部署
```

**2. 把博客源码放进 `blog/` 子目录**

```bash
BLOG_SRC="/c/Users/Administrator/Music/Blog"
mkdir -p blog
cp -r "$BLOG_SRC"/src "$BLOG_SRC"/public "$BLOG_SRC"/index.html \
      "$BLOG_SRC"/package.json "$BLOG_SRC"/package-lock.json \
      "$BLOG_SRC"/tsconfig.json "$BLOG_SRC"/vite.config.ts \
      "$BLOG_SRC"/.env.example "$BLOG_SRC"/.gitignore "$BLOG_SRC"/README.md blog/
```

**3. workflow 必须放在仓库根**（GitHub 只识别根目录的 `.github/workflows/`；改名避免与旧 workflow 撞名）

```bash
mkdir -p .github/workflows
cp "$BLOG_SRC/.github/workflows/deploy.yml" .github/workflows/aurora-blog.yml
```

**4. 把旧站点的静态文件放进 `legacy/`** —— 按旧仓库原来的 Pages 来源选一种：

| 旧站点来源 | 操作 |
| --- | --- |
| `gh-pages` 分支 | `git fetch origin gh-pages && mkdir -p legacy && git archive origin/gh-pages \| tar -x -C legacy` |
| 默认分支的 `/docs` | 不用复制，直接把变量 `PAGES_LEGACY_DIR` 设为 `docs` |
| 根目录就是静态 HTML | 把旧文件挑出来放进 `legacy/`（注意别把新加的 `blog/` 和 `.github/` 复制进去） |
| 另一套 GitHub Actions 生成 | 需要把旧的构建步骤合并进同一个 workflow；**这种情况更建议用路线 A** |

**5. 设置仓库变量** —— Settings → Secrets and variables → Actions → Variables → New repository variable

| 变量 | 值 | 作用 |
| --- | --- | --- |
| `BLOG_DIR` | `blog` | 源码在子目录，安装 / 构建时进入该目录 |
| `PAGES_SUBPATH` | `blog` | 博客产物放到站点的 `/blog/` 下 |
| `PAGES_LEGACY_DIR` | `legacy`（或 `docs`） | 旧站点文件合并到站点根 |

`VITE_POSTS_DIR` 会自动推导成 `blog/src/content/posts`，后台发布文章会写进正确目录，无需手填。

**6. 合并到默认分支，并把 Pages Source 改成 GitHub Actions**。约 1 分钟后：

- 旧站点：`https://<用户名>.github.io/<仓库名>/`（不变）
- 博客：`https://<用户名>.github.io/<仓库名>/blog/`

**7. 后台**：站点设置里 owner / repo 填**这个旧仓库**，分支填默认分支，Token 用具备该仓库 `Contents: read & write` 的 PAT。

几个注意点：

- 共存模式自动启用 hash 路由，博客链接形如 `/<仓库名>/blog/#/post/xxx`。因为站点根 `404.html` 归旧站点所有，hash 路由不依赖它，深链接才不会落到旧站点的 404。想强制关掉就把变量 `VITE_HASH_ROUTER` 设为 `false`。
- workflow 默认监听 `main` / `master`；旧仓库默认分支不叫这两个的话，改 `on.push.branches`。
- 只想覆盖站点根、不要子路径？不设 `PAGES_SUBPATH` 即可，但此时整站会变成博客，等于替换旧站点 —— 不符合你的目标。
- 想回退：Pages Source 改回原来的分支即可，旧分支文件从未被删除。

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

**会覆盖我已有的仓库 / 站点吗？** 不会，除非你主动把 `origin` 指向旧仓库并 push。推荐直接新建一个仓库（见「已有仓库怎么办」路线 A）；若坚持复用同一个仓库，务必配置 `PAGES_LEGACY_DIR` 把旧站点文件一起打包，因为 Actions 部署是整包替换 Pages 站点。

**共存模式下博客深链接跳到旧站点的 404？** 该模式默认启用 hash 路由（`#/post/xxx`）规避此问题；确认部署产物中 `blog/index.html` 存在，且仓库变量 `PAGES_SUBPATH` 已设置。

**改了站点标题但没生效？** 后台修改只保存在当前浏览器；想让所有访客生效，请改 `src/config/site.ts` 后重新推送。

**评论脚本加载慢？** Twikoo 从 jsDelivr 按需加载，组件内置备用 CDN 重试；国内网络首次可能需要几秒。

---

## 📄 License

MIT · 随心取用，改造成你自己的样子就好。✦
