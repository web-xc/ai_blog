/**
 * Zero-dependency smoke test for the Vercel serverless API.
 *
 * It compiles `api/**\/*.ts` in memory with the TypeScript compiler already
 * installed in the project, then drives every handler with Vercel-shaped
 * request/response objects and a mocked GitHub Contents API. No network calls,
 * no Vercel account and no extra packages required.
 *
 * Usage: npm run test:api
 */
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const ROOT = path.resolve(__dirname, '..')
const projectRequire = Module.createRequire(path.join(ROOT, 'package.json'))
const ts = projectRequire('typescript')

// ---------------------------------------------------------------- environment
process.env.ADMIN_PASSWORD = 'test-secret-123'
process.env.AUTH_SECRET = 'unit-test-secret'
process.env.GITHUB_TOKEN = 'fake-token'
process.env.GITHUB_REPO = 'owner/repo'
process.env.GITHUB_BRANCH = 'main'
process.env.POSTS_DIR = 'src/content/posts'
for (const key of [
  'AI_API_KEY',
  'OPENAI_API_KEY',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'VERCEL',
  'VERCEL_GIT_REPO_OWNER',
  'VERCEL_GIT_REPO_SLUG',
  'VERCEL_GIT_COMMIT_REF',
]) delete process.env[key]

// ------------------------------------------------------------- in-memory TS loader
require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
  })
  mod._compile(outputText, filename)
}

const handlerPath = (name) => path.join(ROOT, 'api', `${name}.ts`)

// ------------------------------------------------------------------ GitHub mock
const files = new Map()
const writes = []
let shaSeq = 0
let llmCalls = 0

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

global.fetch = async (url, init = {}) => {
  const u = String(url)
  const method = (init.method || 'GET').toUpperCase()
  if (u.includes('/chat/completions')) {
    llmCalls += 1
    return response(500, { error: 'LLM must not be called without AI_API_KEY' })
  }
  if (u.includes('api.github.com/repos/') && u.includes('/contents/')) {
    const p = decodeURIComponent(u.split('/contents/')[1].split('?')[0])
    if (method === 'PUT') {
      const body = JSON.parse(init.body)
      shaSeq += 1
      files.set(p, {
        content: Buffer.from(body.content, 'base64').toString('utf8'),
        sha: `sha-${shaSeq}`,
        message: body.message,
        branch: body.branch,
        hadSha: Boolean(body.sha),
      })
      writes.push({ path: p, message: body.message })
      return response(201, { content: { path: p } })
    }
    const rec = files.get(p)
    if (!rec) return response(404, { message: 'Not Found' })
    return response(200, { content: Buffer.from(rec.content).toString('base64'), sha: rec.sha })
  }
  return response(404, { message: `unexpected URL: ${u}` })
}

// -------------------------------------------------------------- Vercel-shaped I/O
function makeRes() {
  const r = { code: 200, body: null, headers: {} }
  r.status = (code) => { r.code = code; return r }
  r.json = (body) => { r.body = body }
  r.setHeader = (key, value) => { r.headers[key] = value }
  r.end = () => {}
  return r
}

async function call(name, method, body, cookie) {
  // Clear the module cache so each handler re-reads env in an isolated way.
  const handler = require(handlerPath(name)).default
  const req = {
    method,
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
    query: {},
  }
  const res = makeRes()
  await handler(req, res)
  return res
}

// --------------------------------------------------------------------- assertions
let passed = 0
let failed = 0
function assert(condition, label) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label}`)
  }
}
function section(title) {
  console.log(`\n[${title}]`)
}

async function main() {
  section('health / 能力探测')
  const health = await call('health', 'GET')
  assert(health.code === 200 && health.body.ok === true, 'GET /api/health 返回 ok')
  assert(
    health.body.capabilities.auth &&
      health.body.capabilities.config &&
      health.body.capabilities.drafts &&
      health.body.capabilities.stats &&
      health.body.capabilities.ai &&
      health.body.capabilities.publish,
    '能力矩阵完整（auth/config/drafts/stats/ai/publish）',
  )
  assert(health.body.storage === 'github' && health.body.repo === 'owner/repo', '识别为 GitHub 仓库存储')
  assert(health.body.ai === 'local', '未配置大模型时降级为本地摘要')
  const wrongMethod = await call('health', 'POST')
  assert(wrongMethod.code === 405, '不支持的 HTTP 方法返回 405')

  section('auth / 服务端会话')
  const anonymous = await call('auth', 'GET')
  assert(anonymous.body.authenticated === false && anonymous.body.mode === 'cloud', '未登录状态可公开查询')
  const bad = await call('auth', 'POST', { action: 'login', password: 'wrong' })
  assert(bad.code === 401, '错误密码被拒绝')
  const good = await call('auth', 'POST', { action: 'login', password: 'test-secret-123' })
  const setCookie = good.headers['Set-Cookie'] || ''
  const cookie = setCookie.split(';')[0]
  assert(good.code === 200 && cookie.startsWith('aurora_session='), '正确密码下发会话 Cookie')
  assert(setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Lax'), 'Cookie 为 HttpOnly + SameSite=Lax')
  const forged = `${cookie}x`
  const forgedStatus = await call('auth', 'GET', undefined, forged)
  assert(forgedStatus.body.authenticated === false, '伪造签名无法通过校验')
  const status = await call('auth', 'GET', undefined, cookie)
  assert(status.body.authenticated === true, '合法会话可通过校验')

  section('config / 云端配置与密钥过滤')
  const publicConfig = await call('config', 'GET')
  assert(publicConfig.code === 200, '配置可公开读取')
  const denied = await call('config', 'PUT', { config: { title: 'hack' } })
  assert(denied.code === 401, '未登录禁止写配置')
  const put = await call(
    'config',
    'PUT',
    { config: { title: '我的博客', github: { token: 'LEAK', owner: 'o', repo: 'r' } } },
    cookie,
  )
  assert(put.code === 200, '云端写入配置成功')
  const configFile = files.get('content/data/site.json')
  assert(Boolean(configFile) && !configFile.content.includes('LEAK'), 'GitHub Token 不会写入仓库')
  assert(configFile && configFile.message.includes('[skip ci]'), '配置提交跳过重建（避免部署循环）')
  const cfg = await call('config', 'GET')
  assert(cfg.body.config.title === '我的博客', '云端读取配置成功')
  assert(cfg.body.config.github.token === undefined && cfg.body.config.github.owner === 'o', '只保留仓库公开信息')

  section('drafts / 云端草稿')
  const draftsDenied = await call('drafts', 'GET')
  assert(draftsDenied.code === 401, '未登录禁止读草稿')
  const tooMany = Array.from({ length: 205 }, (_, i) => ({ id: `d${i}`, title: `草稿 ${i}` }))
  const draftsPut = await call('drafts', 'PUT', { drafts: tooMany }, cookie)
  const draftsGet = await call('drafts', 'GET', undefined, cookie)
  assert(draftsPut.code === 200 && draftsGet.body.drafts.length === 200, '草稿云端读写成功且最多 200 条')
  assert(draftsGet.body.drafts[0].id === 'd0' && draftsGet.body.drafts[199].id === 'd199', '草稿顺序保持不变')

  section('stats / 全站统计')
  const view = await call('stats', 'POST', { type: 'view', slug: 'hello-aurora' })
  const like = await call('stats', 'POST', { type: 'like', slug: 'hello-aurora' })
  const stats = await call('stats', 'GET')
  assert(view.code === 200 && like.code === 200, '浏览 / 点赞计数写入成功')
  assert(view.body.value === 1 && like.body.value === 1, '返回最新计数值')
  assert(stats.body.total === 1 && stats.body.likes['hello-aurora'] === 1, '统计数据正确')
  assert(Array.isArray(stats.body.daily) && stats.body.daily.length === 7, '生成 7 日趋势')
  assert(stats.body.daily[6].count === 1, '今日浏览量计入趋势')
  const invalidSlug = await call('stats', 'POST', { type: 'view', slug: '../../etc/passwd' })
  assert(invalidSlug.code === 400, '非法 slug 被拒绝')
  const unlike = await call('stats', 'POST', { type: 'unlike', slug: 'never-liked' })
  assert(unlike.code === 200 && unlike.body.value === 0, '取消点赞不会变成负数')

  section('ai / 摘要降级')
  const ai = await call('ai', 'POST', {
    action: 'summary',
    title: 'Vue 3 静态博客',
    content: '# 标题\n\nVue 3 与 Vite 构建静态博客，性能很好。配置 GitHub Actions 后可以自动部署到 Pages。这篇文章介绍实现原理与优化方法。',
  })
  assert(ai.code === 200 && ai.body.summary.length > 10 && ai.body.source === 'local', '离线提取式摘要可用')
  assert(Array.isArray(ai.body.bullets) && ai.body.bullets.length > 0, '摘要包含要点列表')
  assert(llmCalls === 0, '未配置 AI_API_KEY 时不会调用大模型')
  const emptyAi = await call('ai', 'POST', { action: 'summary', title: '', content: '' })
  assert(emptyAi.code === 400, '空内容返回 400')

  section('publish / 服务端安全发布')
  const publishDenied = await call('publish', 'POST', { slug: 'hack', title: 'hack', content: 'x' })
  assert(publishDenied.code === 401, '未登录禁止发布文章')
  const badSlug = await call('publish', 'POST', { slug: '!!!', title: 'x', content: 'x' }, cookie)
  assert(badSlug.code === 400, '纯符号 slug 被拒绝（不会写出 ---.md）')
  const pathLike = await call('publish', 'POST', { slug: '../../etc/passwd', title: 'x', content: 'x' }, cookie)
  assert(pathLike.code === 400, '路径穿越型 slug 被拒绝')
  const cjk = await call('publish', 'POST', { slug: '中文测试', title: '中文', content: '正文' }, cookie)
  assert(cjk.code === 200 && cjk.body.path === 'src/content/posts/中文测试.md', '中文 slug 可用')
  const longSlug = await call('publish', 'POST', { slug: 'a'.repeat(300), title: 'x', content: 'x' }, cookie)
  assert(longSlug.code === 200 && longSlug.body.path.length < 160, '超长 slug 自动截断')
  const pub = await call(
    'publish',
    'POST',
    {
      slug: 'cloud-post',
      title: '云端发布的文章',
      date: '2026-11-25',
      category: '技术',
      tags: 'Vercel, 云端',
      cover: '✦',
      excerpt: '摘要',
      pinned: false,
      content: '## 正文\n\n来自服务端。',
      aiSummary: '这是 AI 摘要。',
    },
    cookie,
  )
  assert(pub.code === 200 && pub.body.path === 'src/content/posts/cloud-post.md', '服务端发布文章成功')
  const md = files.get('src/content/posts/cloud-post.md')
  assert(Boolean(md), '文章写入 Markdown 文件')
  assert(md && md.content.includes('ai_summary: 这是 AI 摘要。'), 'Markdown 含 AI 摘要字段')
  assert(md && md.content.includes('tags: [Vercel, 云端]'), '标签解析为 YAML 数组')
  assert(md && md.content.includes('## 正文'), '正文完整保留')
  assert(md && md.branch === 'main', '写入指定分支')
  assert(md && !md.message.includes('[skip ci]'), '发布 commit 会触发 Vercel 重新构建')
  assert(![...files.keys()].some((p) => p.includes('---.md')), '仓库中不会出现垃圾文件名')
  const update = await call('publish', 'POST', { slug: 'cloud-post', title: '更新', content: '新正文' }, cookie)
  assert(update.code === 200 && files.get('src/content/posts/cloud-post.md').hadSha, '覆盖发布时带上文件 sha')

  section('logout / 会话销毁')
  const logout = await call('auth', 'POST', { action: 'logout' }, cookie)
  assert(logout.headers['Set-Cookie'].includes('Max-Age=0'), '退出登录清除会话')
  const afterLogout = await call('auth', 'GET', undefined, 'aurora_session=')
  assert(afterLogout.body.authenticated === false, '清除后无法访问受保护接口')

  console.log(`\n结果：${passed} 通过，${failed} 失败`)
  console.log(`写入的文件：${[...files.keys()].join(', ')}`)
  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error('FAILED', error)
  process.exit(1)
})
