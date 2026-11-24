/**
 * Central site configuration.
 *
 * The defaults below are compiled into the bundle. The admin dashboard can
 * override most of them at runtime (persisted in localStorage), which means
 * you can rename the blog, change links or set a Twikoo envId without
 * rebuilding the site.
 */
export interface SocialLink {
  label: string
  href: string
  icon: string
}

export interface GithubConfig {
  owner: string
  repo: string
  branch: string
  /** Fine-grained PAT with "Contents: read & write". Stored locally only. */
  token: string
}

export interface SiteConfig {
  title: string
  subtitle: string
  description: string
  author: string
  authorRole: string
  avatar: string
  since: string
  footerNote: string
  accent: string
  twikooEnvId: string
  postsPerPage: number
  showParticles: boolean
  social: SocialLink[]
  github: GithubConfig
}

const env = import.meta.env

export const defaultSiteConfig: SiteConfig = {
  title: 'Aurora',
  subtitle: '在代码与文字之间，记录一束光',
  description: '一个基于 Vue 3 的现代化静态博客，记录技术、设计与生活。',
  author: 'Aurora',
  authorRole: '前端工程师 / 独立创作者',
  avatar: '✦',
  since: '2026',
  footerNote: '用 Vue 3 与一点点热爱构建',
  accent: '#6366f1',
  twikooEnvId: env.VITE_TWIKOO_ENV_ID || '',
  postsPerPage: 6,
  showParticles: true,
  social: [
    { label: 'GitHub', href: 'https://github.com', icon: 'github' },
    { label: '邮箱', href: 'mailto:hello@example.com', icon: 'mail' },
    { label: 'RSS', href: '#/archive', icon: 'rss' },
  ],
  github: {
    owner: env.VITE_GITHUB_OWNER || '',
    repo: env.VITE_GITHUB_REPO || '',
    branch: 'main',
    token: '',
  },
}

export const CONFIG_KEY = 'aurora-site-config'
export const THEME_KEY = 'aurora-theme'
export const AUTH_KEY = 'aurora-admin-auth'
export const DRAFTS_KEY = 'aurora-drafts'
export const STATS_KEY = 'aurora-stats'
