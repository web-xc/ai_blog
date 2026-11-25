import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, readBody, requireAuth } from './_lib/core'
import { CONFIG_PATH, readStore, writeStore } from './_lib/data'

type JsonObject = Record<string, unknown>

/** Never persist a GitHub token in the shared config file. */
function sanitize(input: JsonObject): JsonObject {
  const output: JsonObject = { ...input }
  const github = output.github
  if (github && typeof github === 'object') {
    const { owner, repo, branch } = github as JsonObject
    output.github = { owner: owner ?? '', repo: repo ?? '', branch: branch ?? 'main' }
  }
  delete output.token
  return output
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['GET', 'PUT'])) return
  res.setHeader('Cache-Control', 'no-store')

  if ((req.method || 'GET').toUpperCase() === 'GET') {
    try {
      const snapshot = await readStore<JsonObject>(CONFIG_PATH, {})
      res.status(200).json({ config: snapshot.data, updatedAt: Date.now() })
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : '读取配置失败' })
    }
    return
  }

  if (!requireAuth(req, res)) return
  const body = readBody(req)
  const config = body.config
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    res.status(400).json({ error: '配置格式不正确' })
    return
  }
  try {
    const snapshot = await readStore<JsonObject>(CONFIG_PATH, {})
    await writeStore(CONFIG_PATH, sanitize(config as JsonObject), snapshot, 'chore: update site config')
    res.status(200).json({ ok: true, updatedAt: Date.now() })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : '保存配置失败' })
  }
}
