/**
 * Client-side extractive summary. Used when the site is deployed as a pure
 * static build (no /api functions), so the AI-summary feature still works.
 */
import type { AiResult } from './cloud'

const STOP = new Set([
  '的', '了', '和', '是', '在', '也', '就', '都', '而', '及', '与', '或', '一个', '我们', '可以', '这个',
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'are', 'from', 'have', 'has', 'not',
  '通过', '使用', '需要', '进行', '以及', '如果', '因为', '所以', '这些', '一些', '自己',
])

function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[>*_~|]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function localSummary(title: string, markdown: string): AiResult {
  const text = plain(markdown)
  const list = text
    .split(/(?<=[。！？!?；;])\s*|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && s.length <= 180)

  const scored = list.map((sentence, i) => {
    const inTitle = title.split(/[\s,，、]+/).some((w) => w.length > 1 && sentence.includes(w))
    return {
      sentence,
      score: (Math.min(sentence.length, 90) / 90) * 0.4
        + Math.max(0, 1 - i / Math.max(list.length, 1) / 2) * 0.35
        + (inTitle ? 0.3 : 0)
        + (/[A-Za-z0-9+#.]|配置|实现|原理|性能|设计|方法|步骤|优化/.test(sentence) ? 0.25 : 0),
    }
  })
  const picked = new Set([...scored].sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.sentence))
  const ordered = scored.filter((x) => picked.has(x.sentence)).map((x) => x.sentence)
  const first = ordered[0] || text.slice(0, 110)

  const freq = new Map<string, number>()
  for (const word of (title + ' ' + text).match(/[\u4e00-\u9fa5]{2,6}|[A-Za-z][A-Za-z0-9+#.]{2,}/g) || []) {
    const key = word.toLowerCase()
    if (STOP.has(key) || key.length < 2) continue
    freq.set(key, (freq.get(key) || 0) + (title.includes(word) ? 3 : 1))
  }
  const tags = [...freq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w)

  return {
    summary: first.replace(/[。；;]$/, '') + '。',
    bullets: ordered.length ? ordered : [text.slice(0, 110)],
    tags,
    source: 'local',
  }
}
