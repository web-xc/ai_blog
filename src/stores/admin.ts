import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AUTH_KEY, DRAFTS_KEY, STATS_KEY } from '@/config/site'
import { readJSON, writeJSON } from '@/lib/storage'
import { cloudApi, cloudHealth, cloudMode, detectCloud, capability, type CloudStats } from '@/lib/cloud'
import type { MarkdownDocument } from '@/lib/github'

export interface Draft extends MarkdownDocument {
  id: string
  updatedAt: number
  published: boolean
}

interface ViewEvent {
  slug: string
  t: number
}

interface AuthRecord {
  hash: string
}

async function hashPassword(password: string): Promise<string> {
  try {
    const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`aurora::${password}`))
    return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback for non-secure contexts (still only a UI lock, not a security boundary).
    let h = 5381
    for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i)
    return `fallback-${(h >>> 0).toString(16)}`
  }
}

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function createDraft(): Draft {
  return {
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug: `new-post-${Date.now().toString(36).slice(-5)}`,
    title: '未命名文章',
    date: today(),
    category: '随笔',
    tags: '',
    cover: '✦',
    excerpt: '',
    pinned: false,
    aiSummary: '',
    content: '## 从这里开始\n\n用 Markdown 写下你的想法吧。\n',
    updatedAt: Date.now(),
    published: false,
  }
}

export const useAdminStore = defineStore('admin', () => {
  const auth = ref<AuthRecord | null>(readJSON<AuthRecord | null>(AUTH_KEY, null))
  const authenticated = ref(sessionStorage.getItem('aurora-admin-session') === '1')
  const drafts = ref<Draft[]>(readJSON<Draft[]>(DRAFTS_KEY, []))
  const views = ref<ViewEvent[]>(readJSON<ViewEvent[]>(STATS_KEY, []))
  const cloudStats = ref<CloudStats | null>(null)

  const cloudAuth = computed(() => capability('auth'))
  const cloudModeLabel = computed(() =>
    cloudMode.value === 'cloud' ? `${cloudHealth.value?.storage === 'kv' ? 'Vercel KV' : 'GitHub 仓库'} · 已连接` : '本地静态模式',
  )
  const hasPassword = computed(() => (cloudAuth.value ? true : Boolean(auth.value?.hash)))
  const totalViews = computed(() => cloudStats.value?.total ?? views.value.length)

  let draftSyncTimer = 0
  function scheduleDraftSync() {
    if (!capability('drafts')) return
    window.clearTimeout(draftSyncTimer)
    draftSyncTimer = window.setTimeout(() => {
      void cloudApi.putDrafts(drafts.value).catch(() => {})
    }, 700)
  }

  async function hydrate() {
    const health = await detectCloud()
    if (!health) return
    if (capability('auth')) {
      try {
        const status = await cloudApi.authStatus()
        authenticated.value = Boolean(status.authenticated)
        if (status.authenticated) sessionStorage.setItem('aurora-admin-session', '1')
        else sessionStorage.removeItem('aurora-admin-session')
      } catch {
        /* keep local session state */
      }
    }
    if (capability('drafts')) {
      try {
        const result = await cloudApi.getDrafts()
        if (Array.isArray(result.drafts)) {
          drafts.value = result.drafts as Draft[]
          writeJSON(DRAFTS_KEY, drafts.value)
        }
      } catch {
        /* keep local drafts */
      }
    }
    await refreshStats()
  }

  async function refreshStats() {
    if (!capability('stats')) return
    try {
      cloudStats.value = await cloudApi.getStats()
    } catch {
      /* offline */
    }
  }

  async function setupPassword(password: string) {
    auth.value = { hash: await hashPassword(password) }
    writeJSON(AUTH_KEY, auth.value)
    grant()
  }

  async function login(password: string): Promise<boolean> {
    if (cloudAuth.value) {
      try {
        const result = await cloudApi.login(password)
        if (result.ok) {
          grant()
          return true
        }
        return false
      } catch {
        return false
      }
    }
    const hash = await hashPassword(password)
    if (!auth.value || hash !== auth.value.hash) return false
    grant()
    return true
  }

  function grant() {
    authenticated.value = true
    sessionStorage.setItem('aurora-admin-session', '1')
  }

  function logout() {
    authenticated.value = false
    sessionStorage.removeItem('aurora-admin-session')
    if (cloudAuth.value) void cloudApi.logout().catch(() => {})
  }

  async function changePassword(oldPwd: string, newPwd: string): Promise<boolean> {
    if (cloudAuth.value) return false
    const ok = await login(oldPwd)
    if (!ok) return false
    await setupPassword(newPwd)
    return true
  }

  function newDraft(): Draft {
    const draft = createDraft()
    drafts.value.unshift(draft)
    persistDrafts()
    return draft
  }

  function saveDraft(draft: Draft) {
    draft.updatedAt = Date.now()
    const i = drafts.value.findIndex((d) => d.id === draft.id)
    if (i >= 0) drafts.value[i] = { ...draft }
    else drafts.value.unshift({ ...draft })
    persistDrafts()
  }

  function deleteDraft(id: string) {
    drafts.value = drafts.value.filter((d) => d.id !== id)
    persistDrafts()
  }

  function getDraft(id: string): Draft | undefined {
    return drafts.value.find((d) => d.id === id)
  }

  function markPublished(id: string) {
    const draft = getDraft(id)
    if (draft) {
      draft.published = true
      persistDrafts()
    }
  }

  function persistDrafts() {
    writeJSON(DRAFTS_KEY, drafts.value)
    scheduleDraftSync()
  }

  function recordView(slug: string) {
    views.value.push({ slug, t: Date.now() })
    if (views.value.length > 800) views.value = views.value.slice(-800)
    writeJSON(STATS_KEY, views.value)
    if (capability('stats')) void cloudApi.track('view', slug).catch(() => {})
  }

  function viewsByDay(days = 7): { label: string; count: number }[] {
    if (cloudStats.value?.daily?.length) return cloudStats.value.daily.slice(-days)
    const now = new Date()
    const result: { label: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const start = d.getTime()
      const end = start + 86400000
      result.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: views.value.filter((v) => v.t >= start && v.t < end).length,
      })
    }
    return result
  }

  function topViewed(limit = 5): { slug: string; count: number }[] {
    if (cloudStats.value?.views) {
      return Object.entries(cloudStats.value.views)
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    }
    const map = new Map<string, number>()
    views.value.forEach((v) => map.set(v.slug, (map.get(v.slug) || 0) + 1))
    return [...map.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  return {
    authenticated, hasPassword, drafts, views, totalViews,
    cloudStats, cloudAuth, cloudModeLabel,
    setupPassword, login, logout, changePassword,
    newDraft, saveDraft, deleteDraft, getDraft, markPublished,
    recordView, viewsByDay, topViewed, hydrate, refreshStats,
  }
})
