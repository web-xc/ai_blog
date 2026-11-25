/**
 * Hexo-style content layer.
 *
 * Every `src/content/posts/*.md` file is picked up at BUILD TIME by Vite's
 * import.meta.glob. Dropping a new Markdown file into that folder is all it
 * takes to publish a post — no database, no runtime fetch, no server.
 */
export interface TocItem {
  id: string
  text: string
  level: number
}

export interface Post {
  slug: string
  title: string
  date: string
  updated: string
  category: string
  tags: string[]
  cover: string
  excerpt: string
  /** Static AI summary from frontmatter; shown before the article body. */
  aiSummary: string
  pinned: boolean
  draft: boolean
  author: string
  content: string
  wordCount: number
  readingTime: number
  year: number
  timestamp: number
}

export interface TagStat {
  name: string
  count: number
}

export interface ArchiveGroup {
  year: number
  posts: Post[]
}

type Frontmatter = Record<string, string | number | boolean | string[]>

const rawFiles = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** A deliberately small YAML subset: scalars, inline arrays and block lists. */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data: Frontmatter = {}
  const lines = match[1].split(/\r?\n/)
  let currentKey = ''

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const listItem = /^\s+-\s+(.*)$/.exec(line)
    if (listItem && currentKey) {
      const existing = data[currentKey]
      const arr = Array.isArray(existing) ? existing : []
      arr.push(parseValue(listItem[1]) as string)
      data[currentKey] = arr
      continue
    }
    const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(line)
    if (!kv) continue
    currentKey = kv[1]
    const value = kv[2].trim()
    data[currentKey] = value === '' ? [] : (parseValue(value) as string | number | boolean | string[])
  }

  return { data, body: raw.slice(match[0].length) }
}

function parseValue(value: string): string | number | boolean | string[] {
  const v = value.trim()
  if (/^["'].*["']$/.test(v)) return v.slice(1, -1)
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (/^\[.*\]$/.test(v)) {
    return v
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }
  return v
}

function str(v: Frontmatter[string] | undefined, fallback = ''): string {
  if (v === undefined || v === null) return fallback
  return String(v)
}

function arr(v: Frontmatter[string] | undefined): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string' && v) return v.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  return []
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function timestampOf(date: string): number {
  const t = new Date(date.replace(/-/g, '/')).getTime()
  return Number.isNaN(t) ? 0 : t
}

function buildPost(path: string, raw: string): Post {
  const { data, body } = parseFrontmatter(raw)
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  const text = plainText(body)
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = (text.match(/[a-zA-Z0-9]+/g) || []).length
  const wordCount = cjk + words
  const date = str(data.date, '2026-01-01').slice(0, 10)
  const ts = timestampOf(date)
  const excerpt = str(data.excerpt) || text.slice(0, 110) + (text.length > 110 ? '…' : '')

  return {
    slug,
    title: str(data.title, slug),
    date,
    updated: str(data.updated, date).slice(0, 10),
    category: str(data.category, '随笔'),
    tags: arr(data.tags),
    cover: str(data.cover, '✦'),
    excerpt,
    aiSummary: str(data.ai_summary),
    pinned: data.pinned === true || data.pinned === 'true',
    draft: data.draft === true || data.draft === 'true',
    author: str(data.author),
    content: body,
    wordCount,
    readingTime: Math.max(1, Math.ceil(cjk / 350 + words / 220)),
    year: ts ? new Date(ts).getFullYear() : 2026,
    timestamp: ts,
  }
}

const allPosts: Post[] = Object.entries(rawFiles)
  .map(([path, raw]) => buildPost(path, raw))
  .filter((post) => !post.draft)
  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.timestamp - a.timestamp)

export function getPosts(): Post[] {
  return allPosts
}

export function getPost(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug)
}

export function getNeighbours(slug: string): { prev?: Post; next?: Post } {
  const i = allPosts.findIndex((p) => p.slug === slug)
  if (i < 0) return {}
  return { prev: allPosts[i + 1], next: allPosts[i - 1] }
}

export function getTags(): TagStat[] {
  const map = new Map<string, number>()
  allPosts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function getCategories(): TagStat[] {
  const map = new Map<string, number>()
  allPosts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1))
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function getArchives(): ArchiveGroup[] {
  const map = new Map<number, Post[]>()
  allPosts.forEach((p) => {
    const list = map.get(p.year) || []
    list.push(p)
    map.set(p.year, list)
  })
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, posts]) => ({ year, posts }))
}

export function searchPosts(query: string): Post[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return allPosts.filter((p) => {
    const haystack = [p.title, p.excerpt, p.category, p.tags.join(' '), p.content].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export function getRelated(post: Post, limit = 3): Post[] {
  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score: (p.category === post.category ? 3 : 0) + p.tags.filter((t) => post.tags.includes(t)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || b.p.timestamp - a.p.timestamp)
    .slice(0, limit)
    .map((x) => x.p)
}

const gradients = [
  'linear-gradient(135deg,#6366f1 0%,#a855f7 100%)',
  'linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)',
  'linear-gradient(135deg,#f472b6 0%,#a855f7 100%)',
  'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
  'linear-gradient(135deg,#10b981 0%,#06b6d4 100%)',
  'linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%)',
]

export function gradientFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return gradients[hash % gradients.length]
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${y}.${m}.${d}`
}

export function humanDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`
}
