---
title: GitHub Actions 自动部署 Pages 的完整实践
date: 2026-11-15
category: 工程化
tags: [GitHub Actions, CI/CD, GitHub Pages, 部署]
cover: 🚀
excerpt: 从 push 到上线全自动：官方 Pages 部署动作、base 路径自适应、SPA 深链接回退，一次配置长期省心。
---

## 为什么不用 gh-pages 分支

老教程常让你把 `dist/` 强推到 `gh-pages` 分支。能跑，但会污染提交历史，还要维护额外的构建脚本。现在 GitHub 提供了官方的 Pages 部署动作，直接从构建产物上传 artifact，仓库里只保留源码。

整个 workflow 只需三个官方 action：

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
- run: npm ci && npm run build
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
- uses: actions/deploy-pages@v4
```

## 最容易踩的坑：base 路径

如果仓库名不是 `username.github.io`，站点会挂在 `https://username.github.io/<repo>/` 下。Vite 默认的 `base: '/'` 会让所有资源 404。

解决办法是在 workflow 里根据仓库名动态计算，通过环境变量传给 Vite：

```yaml
- name: Resolve base path
  run: |
    REPO="${GITHUB_REPOSITORY##*/}"
    if [[ "$REPO" == *.github.io ]]; then
      echo "VITE_BASE=/" >> $GITHUB_ENV
    else
      echo "VITE_BASE=/$REPO/" >> $GITHUB_ENV
    fi
```

```ts
// vite.config.ts
export default defineConfig(() => ({
  base: process.env.VITE_BASE || '/',
}))
```

这样同一份代码，推到用户页仓库或项目页仓库都能正常工作。

## SPA 深链接回退

vue-router 的 history 模式会生成 `/post/hello-aurora` 这样的干净 URL，但 GitHub Pages 是纯静态托管，直接访问深层路径会返回 404。

官方支持的技巧是：把 `index.html` 复制一份命名为 `404.html`。Pages 在找不到文件时返回它，浏览器加载 SPA 后由前端路由接管。我们在 Vite 插件的 `closeBundle` 阶段自动完成：

```ts
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}
```

顺带记得在仓库根目录放一个空的 `.nojekyll`，避免 Jekyll 忽略下划线开头的资源目录。

## 权限与触发条件

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false
```

`id-token: write` 是 `deploy-pages` 必需的 OIDC 权限；`concurrency` 保证同时触发的部署不会互相打架，但不取消正在进行的部署，避免把站点留在半更新状态。

触发条件建议同时包含 `push` 和 `workflow_dispatch`，后者方便在 GitHub 网页上手动重跑。

## 后台发布如何串起来

最有趣的一环：后台管理系统通过 GitHub Contents API 直接提交 `.md` 文件。这次提交本身就是一次 `push`，于是会触发上面这条 workflow —— 写作、提交、构建、上线形成闭环，全程不需要打开终端。

```
编辑器 → PUT /repos/{owner}/{repo}/contents/... → push 事件
       → Actions 构建 → Pages 部署 → 新文章上线
```

## 小结

| 项目 | 处理方式 |
| --- | --- |
| 资源路径 | `VITE_BASE` 按仓库名自动注入 |
| 深链接 | 构建时生成 `404.html` |
| 构建产物 | `upload-pages-artifact` 而非强推分支 |
| 缓存 | `setup-node` 的 `cache: npm` |
| 手动重跑 | `workflow_dispatch` |

配置一次，之后只需要专心写字。
