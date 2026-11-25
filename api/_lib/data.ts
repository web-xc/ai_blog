/**
 * Storage layer. Prefers Upstash / Vercel KV for high-frequency counters and
 * falls back to JSON files in the GitHub repository (the repo is the database,
 * so no paid service is required). All secrets live in Vercel env vars.
 */
export const CONFIG_PATH = 'content/data/site.json'
export const DRAFTS_PATH = 'content/data/drafts.json'
export const STATS_PATH = 'content/data/stats.json'

export interface Snapshot<T> {
  data: T
  sha?: string
  fromKv: boolean
}

export function githubInfo() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
  const owner = process.env.VERCEL_GIT_REPO_OWNER || ''
  const slug = process.env.VERCEL_GIT_REPO_SLUG || ''
  const repo = process.env.GITHUB_REPO || (owner && slug ? `${owner}/${slug}` : '')
  const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main'
  return { token, repo, branch }
}

export function githubEnabled(): boolean {
  const { token, repo } = githubInfo()
  return Boolean(token && repo)
}

export function kvInfo() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
  }
}

export function kvEnabled(): boolean {
  const { url, token } = kvInfo()
  return Boolean(url && token)
}

export function storageKind(): 'github' | 'kv' | 'memory' {
  if (kvEnabled()) return 'kv'
  if (githubEnabled()) return 'github'
  return 'memory'
}

export const storageReady = () => storageKind() !== 'memory'

export async function kv<T = unknown>(command: (string | number)[]): Promise<T> {
  const { url, token } = kvInfo()
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`KV ${res.status}`)
  const payload = (await res.json()) as { result?: T }
  return payload.result as T
}

function ghHeaders(): Record<string, string> {
  const { token } = githubInfo()
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'aurora-blog-serverless',
  }
}

/** Commit a JSON / text file into the repository using the Contents API. */
export async function putGithubFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const { repo, branch } = githubInfo()
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
      committer: { name: 'Aurora Cloud', email: 'aurora-bot@users.noreply.github.com' },
    }),
  })
  if (!res.ok) {
    const detail = ((await res.json().catch(() => ({}))) as { message?: string }).message || ''
    throw new Error(`GitHub ${res.status}${detail ? `：${detail}` : ''}`)
  }
}

export async function getGithubFile(path: string): Promise<{ content: string; sha: string } | null> {
  const { repo, branch } = githubInfo()
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: ghHeaders() },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { content?: string; sha?: string }
  if (!data.content) return null
  return { content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha || '' }
}

export async function readStore<T>(path: string, fallback: T): Promise<Snapshot<T>> {
  if (kvEnabled()) {
    const raw = await kv<string | null>(['GET', `aurora:${path}`])
    if (!raw) return { data: fallback, fromKv: true }
    try {
      return { data: JSON.parse(raw) as T, fromKv: true }
    } catch {
      return { data: fallback, fromKv: true }
    }
  }
  const file = await getGithubFile(path)
  if (!file) return { data: fallback, fromKv: false }
  try {
    return { data: JSON.parse(file.content) as T, sha: file.sha, fromKv: false }
  } catch {
    return { data: fallback, sha: file.sha, fromKv: false }
  }
}

export async function writeStore<T>(path: string, data: T, snapshot?: Snapshot<T>, message = 'chore: update Aurora data'): Promise<void> {
  const payload = JSON.stringify(data, null, 2)
  if (kvEnabled() || snapshot?.fromKv) {
    await kv(['SET', `aurora:${path}`, payload])
    return
  }
  await putGithubFile(path, `${payload}\n`, `${message} [skip ci]`, snapshot?.sha)
}

/** Read-modify-write with a small retry loop for GitHub sha conflicts. */
export async function mutateStore<T>(
  path: string,
  fallback: T,
  mutator: (current: T) => T,
  message?: string,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    const snapshot = await readStore<T>(path, fallback)
    const next = mutator(snapshot.data)
    try {
      await writeStore(path, next, snapshot, message)
      return next
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('写入失败')
}
