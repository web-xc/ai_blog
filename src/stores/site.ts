import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { CONFIG_KEY, THEME_KEY, HERO_KEY, defaultSiteConfig, type SiteConfig } from '@/config/site'
import { readJSON, writeJSON } from '@/lib/storage'
import { cloudApi, cloudHealth, cloudMode, detectCloud, capability } from '@/lib/cloud'

type Theme = 'light' | 'dark'
type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'offline'

function mergeConfig(saved: Partial<SiteConfig> | null): SiteConfig {
  if (!saved) return structuredClone(defaultSiteConfig)
  return {
    ...defaultSiteConfig,
    ...saved,
    links: Array.isArray(saved.links) ? saved.links : defaultSiteConfig.links,
    social: Array.isArray(saved.social) ? saved.social : defaultSiteConfig.social,
    github: { ...defaultSiteConfig.github, ...(saved.github || {}) },
    cloud: { ...defaultSiteConfig.cloud, ...(saved.cloud || {}) },
  }
}

function hexToRgb(hex: string): string {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())
  if (!m) return '99, 102, 241'
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`
}

function detectTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useSiteStore = defineStore('site', () => {
  const config = ref<SiteConfig>(mergeConfig(readJSON<Partial<SiteConfig> | null>(CONFIG_KEY, null)))
  const theme = ref<Theme>(detectTheme())
  const isDark = computed(() => theme.value === 'dark')

  /** null = follow the site default; boolean = this visitor's own choice. */
  const heroOverride = ref<boolean | null>(readJSON<boolean | null>(HERO_KEY, null))
  const showHero = computed(() =>
    config.value.allowHeroToggle && heroOverride.value !== null ? heroOverride.value : config.value.showHero,
  )
  const syncStatus = ref<SyncStatus>('idle')
  const cloudEnabled = computed(() => capability('config'))
  const cloudLabel = computed(() =>
    cloudMode.value === 'cloud'
      ? `${cloudHealth.value?.storage === 'kv' ? 'Vercel KV' : 'GitHub 仓库'} · 云端`
      : cloudMode.value === 'local' ? '本地模式' : '检测中…',
  )

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme.value === 'dark' ? '#0a0d18' : '#f7f8fd',
    )
  }

  function applyAccent() {
    document.documentElement.style.setProperty('--accent', config.value.accent)
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(config.value.accent))
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function toggleHero() {
    heroOverride.value = !showHero.value
    writeJSON(HERO_KEY, heroOverride.value)
  }

  function resetHeroOverride() {
    heroOverride.value = null
    localStorage.removeItem(HERO_KEY)
  }

  /** Pull the shared config from Vercel. Never overwrites the local PAT. */
  async function hydrate() {
    const health = await detectCloud()
    if (!health || !capability('config')) {
      syncStatus.value = 'offline'
      return
    }
    try {
      const { config: remote } = await cloudApi.getConfig()
      if (!remote || typeof remote !== 'object') return
      const patch = { ...(remote as Partial<SiteConfig>) }
      delete patch.github
      config.value = mergeConfig({ ...config.value, ...patch })
      writeJSON(CONFIG_KEY, config.value)
      applyAccent()
      syncStatus.value = 'saved'
    } catch {
      syncStatus.value = 'error'
    }
  }

  /** Push admin changes. The token is deliberately excluded. */
  async function pushConfig(): Promise<boolean> {
    if (!cloudEnabled.value || !config.value.cloud.autoSync) return false
    syncStatus.value = 'syncing'
    try {
      const { github, ...publicConfig } = config.value
      await cloudApi.putConfig({
        ...publicConfig,
        github: { owner: github.owner, repo: github.repo, branch: github.branch },
      })
      syncStatus.value = 'saved'
      return true
    } catch {
      syncStatus.value = 'error'
      return false
    }
  }

  function updateConfig(patch: Partial<SiteConfig>) {
    config.value = mergeConfig({ ...config.value, ...patch })
    writeJSON(CONFIG_KEY, config.value)
    applyAccent()
    void pushConfig()
  }

  function resetConfig() {
    config.value = structuredClone(defaultSiteConfig)
    writeJSON(CONFIG_KEY, config.value)
    applyAccent()
    void pushConfig()
  }

  watch(theme, (value) => {
    localStorage.setItem(THEME_KEY, value)
    applyTheme()
  })

  applyTheme()
  applyAccent()

  return {
    config, theme, isDark,
    showHero, heroOverride, toggleHero, resetHeroOverride,
    syncStatus, cloudEnabled, cloudLabel,
    toggleTheme, updateConfig, resetConfig, hydrate, pushConfig,
  }
})
