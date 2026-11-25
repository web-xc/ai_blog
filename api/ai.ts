import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, readBody } from './_lib/core'
import { summarize } from './_lib/summary'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['POST'])) return
  const body = readBody(req)
  const title = String(body.title || '').slice(0, 200)
  const content = String(body.content || '').slice(0, 30000)
  if (!title && !content.trim()) {
    res.status(400).json({ error: '请提供文章标题或正文' })
    return
  }
  try {
    const result = await summarize(title, content)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(result)
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : '生成摘要失败' })
  }
}
