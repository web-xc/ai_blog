import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { CONFIG_KEY, THEME_KEY, defaultSiteConfig, type SiteConfig } from '@/config/site'
import { readJSON, writeJSON } from '@/lib/storage'

type Theme = 'light' | 'dark'

function mergeConfig(saved: Partial<SiteConfig> | null): SiteConfig {
  if (!saved) return structuredClone(defaultSiteConfig)
  return {
    ...defaultSiteConfig,
    ...saved,
    social: Array.isArray(saved.social) ? saved.social : defaultSiteConfig.social,
    github: { ...defaultSiteConfig.github, ...(saved.github || {}) },
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

  function updateConfig(patch: Partial<SiteConfig>) {
    config.value = mergeConfig({ ...config.value, ...patch })
    writeJSON(CONFIG_KEY, config.value)
    applyAccent()
  }

  function resetConfig() {
    config.value = structuredClone(defaultSiteConfig)
    writeJSON(CONFIG_KEY, config.value)
    applyAccent()
  }

  watch(theme, (value) => {
    localStorage.setItem(THEME_KEY, value)
    applyTheme()
  })

  applyTheme()
  applyAccent()

  return { config, theme, isDark, toggleTheme, updateConfig, resetConfig }
})
