/**
 * Cloud API client for the optional Vercel backend.
 *
 * The blog works as a pure static site when /api is absent (GitHub Pages,
 * local dev). When Vercel Serverless Functions are present we detect them once
 * at startup and switch config / drafts / stats / AI to the shared backend.
 * There is no hard dependency: every caller falls back to localStorage.
 */
import { computed, ref } from 'vue'

export interface CloudCapabilities {
  auth: boolean
  config: boolean
  drafts: boolean
  stats: boolean
  ai: boolean
  publish: boolean
}

export interface CloudHealth {
  ok: boolean
  version: string
  storage: 'github' | 'kv' | 'memory'
  ai: 'llm' | 'local' | 'none'
  repo: string
  capabilities: CloudCapabilities
}

export interface CloudStats {
  views: Record<string, number>
  likes: Record<string, number>
  daily: { label: string; count: number }[]
  total: number
}

export interface AiResult {
  summary: string
  bullets: string[]
  tags: string[]
  source: 'llm' | 'local'
}

export type CloudMode = 'unknown' | 'cloud' | 'local'

export const cloudMode = ref<CloudMode>('unknown')
export const cloudHealth = ref<CloudHealth | null>(null)
export const isCloud = computed(() => cloudMode.value === 'cloud')

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...((init.headers as Record<string, string>) || {}) },
  })
  if (!res.ok) {
    let message = `云端接口返回 ${res.status}`
    try {
      message = ((await res.json()) as { error?: string }).error || message
    } catch {
      /* non-JSON error page */
    }
    throw new Error(message)
  }
  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

/** Probe once. A static host answers with HTML (SPA fallback) → local mode. */
export async function detectCloud(): Promise<CloudHealth | null> {
  if (cloudMode.value !== 'unknown') return cloudHealth.value
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${apiBase()}/health`, { signal: controller.signal, credentials: 'same-origin' })
    clearTimeout(timer)
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) throw new Error('no api')
    const data = (await res.json()) as CloudHealth
    if (!data?.ok || !data.capabilities) throw new Error('invalid health payload')
    cloudHealth.value = data
    cloudMode.value = 'cloud'
  } catch {
    cloudHealth.value = null
    cloudMode.value = 'local'
  }
  return cloudHealth.value
}

export interface PublishPayload {
  slug: string
  title: string
  date: string
  category: string
  tags: string
  cover: string
  excerpt: string
  pinned: boolean
  content: string
  aiSummary?: string
}

export const cloudApi = {
  authStatus: () => request<{ authenticated: boolean; mode: string }>('/auth'),
  login: (password: string) =>
    request<{ ok: boolean }>('/auth', { method: 'POST', body: JSON.stringify({ action: 'login', password }) }),
  logout: () => request<{ ok: boolean }>('/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }),

  getConfig: () => request<{ config: Record<string, unknown>; updatedAt: number }>('/config'),
  putConfig: (config: unknown) =>
    request<{ ok: boolean; updatedAt: number }>('/config', { method: 'PUT', body: JSON.stringify({ config }) }),

  getDrafts: () => request<{ drafts: unknown[] }>('/drafts'),
  putDrafts: (drafts: unknown[]) =>
    request<{ ok: boolean }>('/drafts', { method: 'PUT', body: JSON.stringify({ drafts }) }),

  getStats: () => request<CloudStats>('/stats'),
  track: (type: 'view' | 'like' | 'unlike', slug: string) =>
    request<{ ok: boolean; value?: number }>('/stats', { method: 'POST', body: JSON.stringify({ type, slug }) }),

  ai: (action: 'summary' | 'tags', payload: { title: string; content: string; lang?: string }) =>
    request<AiResult>('/ai', { method: 'POST', body: JSON.stringify({ action, ...payload }) }),

  publish: (doc: PublishPayload) =>
    request<{ ok: boolean; path: string }>('/publish', { method: 'POST', body: JSON.stringify(doc) }),
}

export function capability(name: keyof CloudCapabilities): boolean {
  return cloudMode.value === 'cloud' && Boolean(cloudHealth.value?.capabilities[name])
}
