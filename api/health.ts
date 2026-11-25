import type { ApiRequest, ApiResponse } from './_lib/core'
import { allow, authEnabled } from './_lib/core'
import { githubEnabled, githubInfo, storageKind, storageReady } from './_lib/data'
import { aiKind } from './_lib/summary'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allow(req, res, ['GET'])) return
  const ready = storageReady()
  const auth = authEnabled()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    ok: true,
    version: '1.0.0',
    storage: storageKind(),
    ai: aiKind(),
    repo: githubEnabled() ? githubInfo().repo : '',
    capabilities: {
      auth,
      config: auth && ready,
      drafts: auth && ready,
      stats: ready,
      ai: true,
      publish: auth && githubEnabled(),
    },
  })
}
