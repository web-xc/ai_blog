/**
 * Central site configuration.
 *
 * The defaults below are compiled into the bundle. At runtime the site first
 * applies a localStorage override, then (when the Vercel API is reachable)
 * hydrates the shared cloud copy from the repository. That means an admin
 * change is visible to every visitor without rebuilding the site.
 */
export interface SocialLink {
  label: string
  href: string
  icon: string
}

export interface FriendLink {
  name: string
  url: string
  desc: string
  avatar: string
}

export interface GithubConfig {
  owner: string
  repo: string
  branch: string
  /** Fine-grained PAT with "Contents: read & write". Local mode only. */
  token: string
}

export interface CloudSettings {
  /** Base path of the Vercel Serverless API. */
  apiBase: string
  /** Push admin changes to the cloud automatically. */
  autoSync: boolean
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
  /** Homepage hero is shown by default. */
  showHero: boolean
  /** Allow each visitor to collapse / expand the hero for themselves. */
  allowHeroToggle: boolean
  showAiSummary: boolean
  enableLikes: boolean
  enableBookmarks: boolean
  showAnnouncement: boolean
  announcement: string
  announcementUrl: string
  links: FriendLink[]
  social: SocialLink[]
  github: GithubConfig
  cloud: CloudSettings
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
  postsPerPage: 9,
  showParticles: true,
  showHero: true,
  allowHeroToggle: true,
  showAiSummary: true,
  enableLikes: true,
  enableBookmarks: true,
  showAnnouncement: false,
  announcement: '✨ 新站点已上线，欢迎到处逛逛',
  announcementUrl: '',
  links: [
    { name: 'Vue.js', url: 'https://vuejs.org', desc: '渐进式 JavaScript 框架', avatar: '🟢' },
    { name: 'Vite', url: 'https://vite.dev', desc: '下一代前端构建工具', avatar: '⚡' },
    { name: 'Twikoo', url: 'https://twikoo.js.org', desc: '简洁安全的静态评论系统', avatar: '💬' },
  ],
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
  cloud: {
    apiBase: env.VITE_API_BASE || '/api',
    autoSync: true,
  },
}

export const CONFIG_KEY = 'aurora-site-config'
export const THEME_KEY = 'aurora-theme'
export const AUTH_KEY = 'aurora-admin-auth'
export const DRAFTS_KEY = 'aurora-drafts'
export const STATS_KEY = 'aurora-stats'
export const HERO_KEY = 'aurora-hero-visible'
export const BOOKMARKS_KEY = 'aurora-bookmarks'
export const LIKES_KEY = 'aurora-likes'
export const READING_KEY = 'aurora-reading'
export const AI_CACHE_KEY = 'aurora-ai-summaries'
