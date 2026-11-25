import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, readBody, requireAuth } from './_lib/core'
import { DRAFTS_PATH, readStore, writeStore } from './_lib/data'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['GET', 'PUT'])) return
  res.setHeader('Cache-Control', 'no-store')
  if (!requireAuth(req, res)) return

  try {
    if ((req.method || 'GET').toUpperCase() === 'GET') {
      const snapshot = await readStore<unknown[]>(DRAFTS_PATH, [])
      res.status(200).json({ drafts: Array.isArray(snapshot.data) ? snapshot.data : [] })
      return
    }
    const body = readBody(req)
    if (!Array.isArray(body.drafts)) {
      res.status(400).json({ error: '草稿列表格式不正确' })
      return
    }
    const drafts = (body.drafts as unknown[]).slice(0, 200)
    const snapshot = await readStore<unknown[]>(DRAFTS_PATH, [])
    await writeStore(DRAFTS_PATH, drafts, snapshot, 'chore: sync admin drafts')
    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : '同步草稿失败' })
  }
}
