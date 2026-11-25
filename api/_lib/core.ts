import { createHmac, timingSafeEqual } from 'node:crypto'

/** Minimal Vercel-shaped types so the API needs no extra runtime dependency. */
export interface ApiRequest {
  method?: string
  url?: string
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
  cookies?: Record<string, string>
  body?: unknown
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(body?: string): void
}

const COOKIE = 'aurora_session'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

export function fail(res: ApiResponse, status: number, error: string): void {
  res.status(status).json({ error })
}

export function method(req: ApiRequest): string {
  return (req.method || 'GET').toUpperCase()
}

export function allow(req: ApiRequest, res: ApiResponse, methods: string[]): boolean {
  if (methods.includes(method(req))) return true
  res.setHeader('Allow', methods.join(', '))
  fail(res, 405, `仅支持 ${methods.join(' / ')} 请求`)
  return false
}

export function readBody(req: ApiRequest): Record<string, unknown> {
  const body = req.body
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>
    } catch {
      /* ignore */
    }
  }
  return {}
}

function header(req: ApiRequest, name: string): string {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()]
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

function cookies(req: ApiRequest): Record<string, string> {
  if (req.cookies && Object.keys(req.cookies).length) return req.cookies
  const raw = header(req, 'cookie')
  const result: Record<string, string> = {}
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) result[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return result
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || 'aurora-local-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function authEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH)
}

export function verifyPassword(input: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (hash) return safeEqual(createHmac('sha256', 'aurora').update(input).digest('hex'), hash.toLowerCase())
  const expected = process.env.ADMIN_PASSWORD || ''
  return Boolean(expected) && safeEqual(input, expected)
}

export function isAuthed(req: ApiRequest): boolean {
  const raw = cookies(req)[COOKIE]
  if (!raw) return false
  const dot = raw.lastIndexOf('.')
  if (dot < 0) return false
  const payload = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!safeEqual(sign(payload), signature)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
    return Boolean(data.exp && data.exp > Date.now())
  } catch {
    return false
  }
}

export function requireAuth(req: ApiRequest, res: ApiResponse): boolean {
  if (!authEnabled()) {
    fail(res, 503, '服务端未配置 ADMIN_PASSWORD，云端写入已禁用')
    return false
  }
  if (!isAuthed(req)) {
    fail(res, 401, '登录已失效，请重新登录后台')
    return false
  }
  return true
}

export function sessionCookie(active: boolean): string {
  const secure = process.env.VERCEL ? '; Secure' : ''
  if (!active) return `${COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secure}`
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL })).toString('base64url')
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Max-Age=${SESSION_TTL / 1000}; SameSite=Lax${secure}`
}

export function clientIp(req: ApiRequest): string {
  return header(req, 'x-forwarded-for').split(',')[0].trim() || header(req, 'x-real-ip') || 'anonymous'
}
