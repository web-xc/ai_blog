import MarkdownIt, { type Env } from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import type { LanguageFn } from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import markdownLang from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import diff from 'highlight.js/lib/languages/diff'
import type { TocItem } from './posts'

/** Only the languages a tech blog actually needs — keeps the bundle small. */
const languages: Record<string, LanguageFn> = {
  javascript, typescript, json, css, xml, bash, python, markdown: markdownLang,
  yaml, sql, go, rust, java, diff,
  js: javascript, ts: typescript, html: xml, sh: bash, shell: bash,
  py: python, md: markdownLang, yml: yaml,
}
Object.entries(languages).forEach(([name, fn]) => hljs.registerLanguage(name, fn))

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  )
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})

interface MdEnv {
  toc?: TocItem[]
  counters?: Map<string, number>
  headings?: number
  [key: string]: unknown
}

const defaultHeading = md.renderer.rules.heading_open
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const e = env as MdEnv
  if (!e.counters) e.counters = new Map()
  if (!e.toc) e.toc = []
  e.headings = (e.headings || 0) + 1

  const text = tokens[idx + 1]?.content || ''
  const level = Number(tokens[idx].tag.slice(1))
  let id = slugify(text)
  const count = e.counters.get(id) || 0
  e.counters.set(id, count + 1)
  if (count > 0) id = `${id}-${count}`

  tokens[idx].attrSet('id', id)
  tokens[idx].attrJoin('class', 'md-heading')
  if (level <= 3) e.toc.push({ id, text, level })
  if (defaultHeading) return defaultHeading(tokens, idx, options, env, self)
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = String(tokens[idx].attrGet('href') || '')
  if (/^https?:\/\//.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  tokens[idx].attrJoin('class', 'md-link')
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy')
  tokens[idx].attrJoin('class', 'md-image')
  return self.renderToken(tokens, idx, options)
}

/** Fully custom fence renderer: language bar + copy button + highlighted code. */
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const info = token.info.trim()
  const lang = info.split(/\s+/)[0] || 'text'
  const label = lang.toUpperCase()
  let code: string
  try {
    code = lang && hljs.getLanguage(lang)
      ? hljs.highlight(token.content, { language: lang, ignoreIllegals: true }).value
      : escapeHtml(token.content)
  } catch {
    code = escapeHtml(token.content)
  }
  return `<div class="code-block" data-lang="${escapeHtml(label)}">
  <div class="code-block__bar"><span class="code-block__dots"><i></i><i></i><i></i></span><span class="code-block__lang">${escapeHtml(label)}</span><button class="code-block__copy" type="button" data-copy>复制</button></div>
  <pre><code class="hljs">${code}</code></pre>
</div>\n`
}

export interface RenderedMarkdown {
  html: string
  toc: TocItem[]
  headings: number
}

export function renderMarkdown(source: string): RenderedMarkdown {
  const env: MdEnv = {}
  const html = md.render(source, env as unknown as Env)
  return { html, toc: env.toc || [], headings: env.headings || 0 }
}

/** Lightweight preview renderer for the admin editor (no heading-id pass). */
export function renderPreview(source: string): string {
  return md.render(source)
}
