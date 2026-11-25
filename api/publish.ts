import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, readBody, requireAuth } from './_lib/core'
import { getGithubFile, githubEnabled, githubInfo, putGithubFile } from './_lib/data'

function yaml(value: string): string {
  const v = value.replace(/\r?\n/g, ' ').trim()
  if (/[:#\[\]{}'",]|^\s*$/.test(v)) return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  return v
}

function toMarkdown(doc: Record<string, unknown>): string {
  const tags = String(doc.tags || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const excerpt = String(doc.excerpt || '') || String(doc.content || '').replace(/[#*`>\[\]()]/g, '').slice(0, 100).trim()
  const lines = [
    '---',
    `title: ${yaml(String(doc.title || '未命名文章'))}`,
    `date: ${String(doc.date || new Date().toISOString().slice(0, 10))}`,
    `category: ${yaml(String(doc.category || '随笔'))}`,
    `tags: [${tags.join(', ')}]`,
    `cover: ${yaml(String(doc.cover || '✦'))}`,
    `excerpt: ${yaml(excerpt)}`,
    `pinned: ${doc.pinned ? 'true' : 'false'}`,
    ...(doc.aiSummary ? [`ai_summary: ${yaml(String(doc.aiSummary))}`] : []),
    '---',
    '',
    String(doc.content || '').trim(),
    '',
  ]
  return lines.join('\n')
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['POST'])) return
  if (!requireAuth(req, res)) return
  if (!githubEnabled()) {
    res.status(503).json({ error: '服务端未配置 GITHUB_TOKEN / GITHUB_REPO' })
    return
  }

  const doc = readBody(req)
  const raw = String(doc.slug || '').trim()
  // Reject path-like input before normalising, then require at least one
  // alnum/CJK character. Otherwise "!!!" used to become the file "---.md".
  if (!raw || /[/\\]/.test(raw) || raw.includes('..')) {
    res.status(400).json({ error: '文章 slug 不合法' })
    return
  }
  const slug = raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '')
  if (!/^[\w\u4e00-\u9fa5][\w\u4e00-\u9fa5-]{0,119}$/.test(slug)) {
    res.status(400).json({ error: '文章 slug 不合法（仅支持字母、数字、下划线、中文与连字符）' })
    return
  }
  const dir = (process.env.POSTS_DIR || 'src/content/posts').replace(/^\/+|\/+$/g, '')
  const path = `${dir}/${slug}.md`

  try {
    const existing = await getGithubFile(path)
    // No [skip ci] here: this commit must trigger a Vercel rebuild.
    await putGithubFile(path, toMarkdown(doc), `📝 ${existing ? '更新' : '发布'}文章：${String(doc.title || slug)}`, existing?.sha)
    res.status(200).json({ ok: true, path, repo: githubInfo().repo })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : '发布失败' })
  }
}
