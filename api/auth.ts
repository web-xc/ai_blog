import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, authEnabled, isAuthed, readBody, sessionCookie, verifyPassword } from './_lib/core'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['GET', 'POST'])) return
  res.setHeader('Cache-Control', 'no-store')

  if ((req.method || 'GET').toUpperCase() === 'GET') {
    res.status(200).json({ authenticated: isAuthed(req), mode: authEnabled() ? 'cloud' : 'local' })
    return
  }

  const body = readBody(req)
  const action = String(body.action || '')

  if (action === 'logout') {
    res.setHeader('Set-Cookie', sessionCookie(false))
    res.status(200).json({ ok: true })
    return
  }

  if (action !== 'login') {
    res.status(400).json({ error: '未知操作' })
    return
  }
  if (!authEnabled()) {
    res.status(503).json({ error: '服务端未配置 ADMIN_PASSWORD' })
    return
  }
  const password = String(body.password || '')
  if (!password || !verifyPassword(password)) {
    res.status(401).json({ error: '密码不正确' })
    return
  }
  res.setHeader('Set-Cookie', sessionCookie(true))
  res.status(200).json({ ok: true })
}
