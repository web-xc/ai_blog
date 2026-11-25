import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, readBody } from './_lib/core'
import { STATS_PATH, kv, kvEnabled, mutateStore, readStore, storageReady } from './_lib/data'

interface StatsData {
  views: Record<string, number>
  likes: Record<string, number>
  daily: Record<string, number>
}

function empty(): StatsData {
  return { views: {}, likes: {}, daily: {} }
}

function toMap(raw: unknown): Record<string, number> {
  const result: Record<string, number> = {}
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) result[String(raw[i])] = Number(raw[i + 1]) || 0
  } else if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) result[key] = Number(value) || 0
  }
  return result
}

function dayKey(offset = 0): string {
  const d = new Date(Date.now() - offset * 86400000)
  return d.toISOString().slice(0, 10)
}

function dailySeries(daily: Record<string, number>): { label: string; count: number }[] {
  const result: { label: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(i)
    const [, month, day] = key.split('-')
    result.push({ label: `${Number(month)}/${Number(day)}`, count: daily[key] || 0 })
  }
  return result
}

async function current(): Promise<StatsData> {
  if (kvEnabled()) {
    const [views, likes, daily] = await Promise.all([
      kv<unknown>(['HGETALL', 'aurora:views']),
      kv<unknown>(['HGETALL', 'aurora:likes']),
      kv<unknown>(['HGETALL', 'aurora:daily']),
    ])
    return { views: toMap(views), likes: toMap(likes), daily: toMap(daily) }
  }
  const snapshot = await readStore<StatsData>(STATS_PATH, empty())
  return { ...empty(), ...snapshot.data }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['GET', 'POST'])) return
  res.setHeader('Cache-Control', 'no-store')
  if (!storageReady()) {
    res.status(503).json({ error: '云端存储未配置（需要 GITHUB_TOKEN 或 KV 环境变量）' })
    return
  }

  try {
    if ((req.method || 'GET').toUpperCase() === 'GET') {
      const stats = await current()
      res.status(200).json({
        views: stats.views,
        likes: stats.likes,
        daily: dailySeries(stats.daily),
        total: Object.values(stats.views).reduce((sum, n) => sum + n, 0),
      })
      return
    }

    const body = readBody(req)
    const type = String(body.type || '')
    const slug = String(body.slug || '')
    if (!/^[\w\u4e00-\u9fa5-]{1,120}$/.test(slug)) {
      res.status(400).json({ error: '文章标识不合法' })
      return
    }
    if (!['view', 'like', 'unlike'].includes(type)) {
      res.status(400).json({ error: '未知统计类型' })
      return
    }

    let value = 0
    if (kvEnabled()) {
      const field = type === 'view' ? 'aurora:views' : 'aurora:likes'
      value = await kv<number>(['HINCRBY', field, slug, type === 'unlike' ? -1 : 1])
      if (type === 'view') await kv(['HINCRBY', 'aurora:daily', dayKey(), 1])
    } else {
      const next = await mutateStore<StatsData>(STATS_PATH, empty(), (data) => {
        const copy: StatsData = { views: { ...data.views }, likes: { ...data.likes }, daily: { ...data.daily } }
        if (type === 'view') {
          copy.views[slug] = (copy.views[slug] || 0) + 1
          const key = dayKey()
          copy.daily[key] = (copy.daily[key] || 0) + 1
        } else {
          copy.likes[slug] = Math.max(0, (copy.likes[slug] || 0) + (type === 'unlike' ? -1 : 1))
        }
        return copy
      }, 'chore: update site stats')
      value = type === 'view' ? next.views[slug] : next.likes[slug]
    }
    res.status(200).json({ ok: true, value })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : '统计写入失败' })
  }
}
