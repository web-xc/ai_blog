---
title: 后台写作台：让 Markdown 发布闭环
date: 2026-10-28
category: 产品笔记
tags: [Markdown, 后台管理, GitHub API, 写作体验]
cover: ✍️
excerpt: 纯静态站点也能有真正可用的后台：在线编辑、实时预览、草稿自动保存，再通过 GitHub API 一键提交上线。
---

## 一个矛盾

静态博客最大的好处是不需要后端，最大的麻烦也是不需要后端——想写篇新文章，得开终端、建文件、写 frontmatter、`git add`、`git commit`、`git push`。在手机上？基本不可能。

所以问题是：**在没有服务器的前提下，后台管理系统还能做什么？**

答案是：把「写文件」这件事委托给 GitHub。仓库本身就是我们的内容数据库，GitHub Contents API 就是写入接口。

## 界面锁，而不是鉴权

首先要说清楚边界。后台的登录密码只存在浏览器 localStorage，用来锁定管理界面，它不是安全边界——任何人都能直接打开静态资源。真正的权限校验发生在 GitHub API：只有持有有效 Token 的请求才能写入仓库。

```ts
async function hashPassword(password: string) {
  const data = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`aurora::${password}`)
  )
  return [...new Uint8Array(data)]
    .map(b => b.toString(16).padStart(2, '0')).join('')
}
```

登录状态放在 `sessionStorage`，关掉标签页就要重新输入。这样在共用电脑上不至于一直敞着。

## 编辑器

左侧写 Markdown，右侧实时预览，共用同一个渲染器：

```ts
const previewHtml = computed(() => renderPreview(draft.content))
```

细节上做了几件让写作更顺手的事：

- **自动保存**：输入停止 900ms 后落到 localStorage，标题栏显示「保存中 / 已保存」；
- **快捷键**：`Ctrl + S` 立即保存；
- **语法工具条**：标题、加粗、链接、代码块等，按当前选区包裹，保留光标位置；
- **元数据面板**：slug、日期、分类、标签、封面、摘要、置顶，可折叠；
- **草稿与已发布状态分离**：没提交的始终是草稿。

## 发布：把文档变成一次提交

提交的正文由结构化字段拼回标准 Markdown：

```ts
export function toMarkdown(doc: MarkdownDocument) {
  return [
    '---',
    `title: ${yamlString(doc.title)}`,
    `date: ${doc.date}`,
    `tags: [${doc.tags}]`,
    '---',
    '',
    doc.content.trim(),
  ].join('\n')
}
```

写入时先查文件 SHA，存在则带上 `sha` 做更新，否则创建新文件：

```ts
const sha = await getFileSha(cfg, path)
await request(`/repos/${owner}/${repo}/contents/${path}`, cfg, {
  method: 'PUT',
  body: JSON.stringify({
    message: `✨ 发布文章：${doc.title}`,
    content: toBase64(toMarkdown(doc)),
    branch: cfg.branch,
    ...(sha ? { sha } : {}),
  }),
})
```

`content` 必须是 UTF-8 的 base64，直接用 `btoa(str)` 处理中文会抛异常，要先过 `TextEncoder`：

```ts
const bytes = new TextEncoder().encode(text)
let binary = ''
for (let i = 0; i < bytes.length; i += 0x8000) {
  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
}
return btoa(binary)
```

## 错误要说得人话

GitHub API 的状态码很技术，直接抛给用户没有意义。我们把它翻译成可操作的提示：

| 状态 | 提示 |
| --- | --- |
| 401 | Token 无效或已过期，请重新填写 |
| 403 | 权限不足，请确认 Token 具备 Contents 读写权限 |
| 404 | 仓库 / 分支不存在，或 Token 无权访问 |
| 409 | 文件版本冲突，请稍后重试 |

## 闭环

一次提交 = 一次 push = 一次 Actions 构建 = 一次 Pages 部署。后台里点下「发布上线」，约一分钟后文章就出现在前台。

没有服务器，却有一个真正能用的后台——这是整个项目里我最喜欢的部分。
