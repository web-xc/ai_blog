/**
 * Article summarisation. Uses an OpenAI-compatible LLM when AI_API_KEY is
 * configured, otherwise produces an honest local extractive summary so the
 * feature still works on a zero-config deployment.
 */
export interface AiResult {
  summary: string
  bullets: string[]
  tags: string[]
  source: 'llm' | 'local'
}

const STOP = new Set([
  '的', '了', '和', '是', '在', '也', '就', '都', '而', '及', '与', '或', '一个', '我们', '可以', '这个', '那个',
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'are', 'from', 'have', 'has', 'not', '但', '把', '被', '对',
  '通过', '使用', '需要', '进行', '以及', '如果', '因为', '所以', '这些', '一些', '自己', '如何', '什么',
])

export function llmConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
}

export function aiKind(): 'llm' | 'local' {
  return llmConfigured() ? 'llm' : 'local'
}

function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[>*_~|]/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?；;])\s*|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && s.length <= 180)
}

function keywords(text: string, title: string): string[] {
  const freq = new Map<string, number>()
  const chunks = (title + ' ' + text).match(/[\u4e00-\u9fa5]{2,6}|[A-Za-z][A-Za-z0-9+#.]{2,}/g) || []
  for (const raw of chunks) {
    const word = raw.toLowerCase()
    if (STOP.has(word) || word.length < 2) continue
    freq.set(word, (freq.get(word) || 0) + (title.includes(raw) ? 3 : 1))
  }
  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

export function extractive(title: string, markdown: string): AiResult {
  const text = plain(markdown)
  const list = sentences(text)
  const scored = list.map((sentence, i) => {
    const hasTitleWord = title.split(/[\s,，、]+/).some((w) => w.length > 1 && sentence.includes(w))
    const lengthScore = Math.min(sentence.length, 90) / 90
    const positionScore = Math.max(0, 1 - i / Math.max(list.length, 1) / 2)
    const techScore = /[A-Za-z0-9+#.]|配置|实现|原理|性能|设计|方法|步骤|优化/.test(sentence) ? 0.25 : 0
    return { sentence, score: lengthScore * 0.4 + positionScore * 0.35 + (hasTitleWord ? 0.3 : 0) + techScore }
  })
  const picked = [...scored].sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.sentence)
  const ordered = scored.filter((x) => picked.includes(x.sentence)).map((x) => x.sentence)
  const first = ordered[0] || text.slice(0, 110)
  const summary = first.replace(/[。；;]$/, '') + '。'
  return {
    summary,
    bullets: ordered.length ? ordered.filter((s) => s !== first) : [text.slice(0, 110)],
    tags: keywords(text, title),
    source: 'local',
  }
}

async function callLLM(title: string, markdown: string): Promise<AiResult> {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  const body = {
    model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: '你是中文技术博客编辑。只输出 JSON，格式为 {"summary":"一段不超过120字的摘要","bullets":["要点1","要点2","要点3"],"tags":["标签1","标签2","标签3"]}。不要输出 Markdown 代码块。',
      },
      { role: 'user', content: `标题：${title}\n\n正文：\n${plain(markdown).slice(0, 9000)}` },
    ],
  }
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`LLM ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const raw = data.choices?.[0]?.message?.content || ''
    const cleaned = raw.replace(/^```(?:json)?\s*|```$/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<AiResult>
    if (!parsed.summary) throw new Error('empty summary')
    return {
      summary: String(parsed.summary).slice(0, 300),
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 4).map(String) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map(String) : [],
      source: 'llm',
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function summarize(title: string, markdown: string): Promise<AiResult> {
  if (llmConfigured()) {
    try {
      return await callLLM(title, markdown)
    } catch {
      /* graceful degradation to the local extractive summary */
    }
  }
  return extractive(title, markdown)
}
