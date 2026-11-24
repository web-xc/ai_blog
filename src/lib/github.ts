/**
 * GitHub Contents API adapter.
 *
 * This is what makes the admin dashboard "real" on a serverless static site:
 * a publish action commits a Markdown file straight into the repository,
 * which triggers the GitHub Actions workflow and redeploys the blog.
 */
const API = 'https://api.github.com'
/**
 * Folder the admin commits Markdown into. When the blog source is nested in an
 * existing repository (e.g. `blog/`), the workflow injects the matching prefix
 * so published posts land in the folder that `import.meta.glob` scans.
 */
export const POSTS_DIR = (import.meta.env.VITE_POSTS_DIR || 'src/content/posts').replace(/^\/+|\/+$/g, '')

export interface MarkdownDocument {
  slug: string
  title: string
  date: string
  category: string
  /** Comma separated tag list in the editor. */
  tags: string
  cover: string
  excerpt: string
  pinned: boolean
  content: string
}

export interface GithubTarget {
  owner: string
  repo: string
  branch: string
  token: string
}

export interface RemoteFile {
  name: string
  path: string
  sha: string
}

function yamlString(value: string): string {
  const v = value.replace(/\r?\n/g, ' ').trim()
  if (/[:#\[\]{}'",]|^\s*$/.test(v)) return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  return v
}

export function toMarkdown(doc: MarkdownDocument): string {
  const tags = doc.tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const lines = [
    '---',
    `title: ${yamlString(doc.title)}`,
    `date: ${doc.date}`,
    `category: ${yamlString(doc.category || '随笔')}`,
    `tags: [${tags.join(', ')}]`,
    `cover: ${yamlString(doc.cover || '✦')}`,
    `excerpt: ${yamlString(doc.excerpt || doc.content.replace(/[#*`>\[\]()]/g, '').slice(0, 100).trim())}`,
    `pinned: ${doc.pinned ? 'true' : 'false'}`,
    '---',
    '',
    doc.content.trim(),
    '',
  ]
  return lines.join('\n')
}

export function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `post-${Date.now().toString(36)}`
  )
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function friendlyError(status: number, detail: string): string {
  const map: Record<number, string> = {
    401: 'GitHub Token 无效或已过期，请重新填写',
    403: '没有权限或触发速率限制，请确认 Token 具备 Contents 读写权限',
    404: '仓库 / 分支不存在，或 Token 无权访问该仓库',
    409: '文件版本冲突，请稍后重试',
    422: '提交校验失败，请检查分支名与文件内容',
  }
  return map[status] ? `${map[status]}${detail ? `（${detail}）` : ''}` : detail || `GitHub API 请求失败 (${status})`
}

function headers(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, cfg: GithubTarget, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, { ...init, headers: { ...headers(cfg.token), ...(init.headers || {}) } })
  } catch {
    throw new Error('无法连接 GitHub API，请检查网络或代理设置')
  }
  if (!res.ok) {
    let detail = ''
    try {
      detail = ((await res.json()) as { message?: string }).message || ''
    } catch {
      /* ignore */
    }
    throw new Error(friendlyError(res.status, detail))
  }
  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

function assertConfig(cfg: GithubTarget) {
  if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.token) {
    throw new Error('请先在「站点设置」中完整填写 GitHub 仓库信息与 Token')
  }
}

export async function verifyRepo(cfg: GithubTarget): Promise<{ full_name: string; private: boolean; default_branch: string }> {
  assertConfig(cfg)
  return request(`/repos/${cfg.owner}/${cfg.repo}`, cfg)
}

export async function getFileSha(cfg: GithubTarget, path: string): Promise<string | undefined> {
  assertConfig(cfg)
  const res = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`,
    { headers: headers(cfg.token) },
  )
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error(friendlyError(res.status, ''))
  return ((await res.json()) as { sha: string }).sha
}

export async function publishPost(
  cfg: GithubTarget,
  doc: MarkdownDocument,
): Promise<{ created: boolean; path: string; htmlUrl: string }> {
  assertConfig(cfg)
  const path = `${POSTS_DIR}/${slugify(doc.slug)}.md`
  const sha = await getFileSha(cfg, path)
  const result = await request<{ content?: { html_url?: string } }>(
    `/repos/${cfg.owner}/${cfg.repo}/contents/${path}`,
    cfg,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `${sha ? '📝 更新' : '✨ 发布'}文章：${doc.title}`,
        content: toBase64(toMarkdown(doc)),
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
        committer: { name: 'Aurora Admin', email: 'aurora-bot@users.noreply.github.com' },
      }),
    },
  )
  return { created: !sha, path, htmlUrl: result.content?.html_url || '' }
}

export async function listRemotePosts(cfg: GithubTarget): Promise<RemoteFile[]> {
  assertConfig(cfg)
  const res = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${POSTS_DIR}?ref=${encodeURIComponent(cfg.branch)}`,
    { headers: headers(cfg.token) },
  )
  if (res.status === 404) return []
  if (!res.ok) throw new Error(friendlyError(res.status, ''))
  const data = (await res.json()) as RemoteFile[]
  return Array.isArray(data) ? data.filter((f) => f.name.endsWith('.md')) : []
}

export async function deleteRemotePost(cfg: GithubTarget, file: RemoteFile): Promise<void> {
  assertConfig(cfg)
  await request(`/repos/${cfg.owner}/${cfg.repo}/contents/${file.path}`, cfg, {
    method: 'DELETE',
    body: JSON.stringify({ message: `🗑️ 删除文章：${file.name}`, sha: file.sha, branch: cfg.branch }),
  })
}
