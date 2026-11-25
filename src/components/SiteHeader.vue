<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home, Archive, Tags, User, Sun, Moon, Search, Menu, X, LayoutDashboard, ArrowRight,
  ChevronRight, Shuffle, Bookmark, Link2, CircleHelp, Megaphone, Sparkles,
} from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { useExtrasStore } from '@/stores/extras'
import { getPosts } from '@/lib/posts'
import { notify } from '@/lib/toast'

const site = useSiteStore()
const extras = useExtrasStore()
const route = useRoute()
const router = useRouter()

const links = [
  { label: '首页', to: '/', icon: Home, hint: '最新文章' },
  { label: '归档', to: '/archive', icon: Archive, hint: '按时间浏览' },
  { label: '标签', to: '/tags', icon: Tags, hint: '按主题探索' },
  { label: '关于', to: '/about', icon: User, hint: '认识作者' },
]

const extraLinks = [
  { label: '稍后读', to: '/bookmarks', icon: Bookmark },
  { label: '友链', to: '/links', icon: Link2 },
]

const shortcuts = [
  { keys: ['Ctrl', 'K'], label: '打开搜索' },
  { keys: ['/'], label: '快速搜索' },
  { keys: ['T'], label: '切换亮暗主题' },
  { keys: ['R'], label: '随机读一篇' },
  { keys: ['?'], label: '快捷键说明' },
  { keys: ['Esc'], label: '关闭弹层 / 抽屉' },
]

const scrolled = ref(false)
const searchOpen = ref(false)
const drawerOpen = ref(false)
const helpOpen = ref(false)
const announcementClosed = ref(sessionStorage.getItem('aurora-announcement-closed') === '1')
const keyword = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const touchStartX = ref(0)

const showAnnouncement = computed(() =>
  site.config.showAnnouncement && Boolean(site.config.announcement.trim()) && !announcementClosed.value,
)
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

function onScroll() { scrolled.value = window.scrollY > 12 }
function isTyping(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
}
function randomPost() {
  const posts = getPosts()
  if (!posts.length) return
  const pick = posts[Math.floor(Math.random() * posts.length)]
  drawerOpen.value = false
  void router.push(`/post/${pick.slug}`)
  notify(`手气不错：${pick.title}`, 'info')
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    searchOpen.value = false
    drawerOpen.value = false
    helpOpen.value = false
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    drawerOpen.value = false
    searchOpen.value = !searchOpen.value
    return
  }
  if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === '/') { e.preventDefault(); searchOpen.value = true }
  else if (e.key === '?') { helpOpen.value = !helpOpen.value }
  else if (e.key.toLowerCase() === 't') { site.toggleTheme() }
  else if (e.key.toLowerCase() === 'r') { randomPost() }
}
function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  void router.push({ path: '/search', query: { q } })
  searchOpen.value = false
  keyword.value = ''
}
function onTouchStart(e: TouchEvent) { touchStartX.value = e.touches[0]?.clientX || 0 }
function onTouchEnd(e: TouchEvent) {
  const delta = (e.changedTouches[0]?.clientX || 0) - touchStartX.value
  if (delta > 64) drawerOpen.value = false
}
function closeAnnouncement() {
  announcementClosed.value = true
  sessionStorage.setItem('aurora-announcement-closed', '1')
}

watch(searchOpen, async (open) => {
  if (open) { await nextTick(); searchInput.value?.focus() }
})
watch(() => route.fullPath, () => { drawerOpen.value = false; helpOpen.value = false })
watch(drawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled }">
    <div class="container header-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">✦</span>
        <span>{{ site.config.title }}</span>
      </RouterLink>

      <nav class="nav-links" aria-label="主导航">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'is-active': isActive(link.to) }"
        >
          <component :is="link.icon" :size="15" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="spacer" />

      <button class="btn btn-icon btn-ghost btn-sm header-action desktop-random" aria-label="随机文章" title="随机读一篇 (R)" @click="randomPost">
        <Shuffle :size="17" />
      </button>
      <button class="btn btn-icon btn-ghost btn-sm header-action" aria-label="搜索" title="搜索 (Ctrl+K)" @click="searchOpen = true">
        <Search :size="17" />
      </button>
      <button class="btn btn-icon btn-ghost btn-sm header-action" :aria-label="site.isDark ? '切换亮色' : '切换暗色'" title="切换主题 (T)" @click="site.toggleTheme()">
        <Transition name="spin-fade" mode="out-in">
          <Sun v-if="site.isDark" :key="'sun'" :size="17" />
          <Moon v-else :key="'moon'" :size="17" />
        </Transition>
      </button>
      <RouterLink to="/admin" class="btn btn-ghost btn-sm header-admin">
        <LayoutDashboard :size="15" /> <span>后台</span>
      </RouterLink>
      <button class="btn btn-icon btn-ghost btn-sm menu-trigger" aria-label="打开菜单" :aria-expanded="drawerOpen" @click="drawerOpen = true">
        <Menu :size="20" />
      </button>
    </div>

    <div v-if="showAnnouncement" class="announcement">
      <div class="container announcement__inner">
        <Megaphone :size="14" />
        <a v-if="site.config.announcementUrl" :href="site.config.announcementUrl" target="_blank" rel="noopener">{{ site.config.announcement }}</a>
        <span v-else>{{ site.config.announcement }}</span>
        <button aria-label="关闭公告" @click="closeAnnouncement"><X :size="14" /></button>
      </div>
    </div>
  </header>

  <!-- right-side mobile drawer -->
  <Teleport to="body">
    <Transition name="mask">
      <div v-if="drawerOpen" class="drawer-mask" @click="drawerOpen = false" />
    </Transition>
    <Transition name="slide">
      <aside
        v-if="drawerOpen"
        class="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="站点导航"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <div class="nav-drawer__head">
          <RouterLink to="/" class="brand" @click="drawerOpen = false">
            <span class="brand-mark">✦</span><span>{{ site.config.title }}</span>
          </RouterLink>
          <button class="drawer-close" aria-label="关闭菜单" @click="drawerOpen = false"><X :size="20" /></button>
        </div>

        <div class="nav-drawer__hint"><Sparkles :size="12" /> 向右滑动可关闭</div>

        <nav class="nav-drawer__links" aria-label="抽屉导航">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="drawer-link"
            :class="{ 'is-active': isActive(link.to) }"
            @click="drawerOpen = false"
          >
            <span class="drawer-link__icon"><component :is="link.icon" :size="18" /></span>
            <span class="drawer-link__text"><strong>{{ link.label }}</strong><small>{{ link.hint }}</small></span>
            <ChevronRight :size="16" class="drawer-link__arrow" />
          </RouterLink>
        </nav>

        <div class="drawer-divider" />
        <div class="nav-drawer__section-title">探索</div>
        <div class="drawer-quick">
          <button class="drawer-quick__item" @click="drawerOpen = false; searchOpen = true"><Search :size="17" /><span>搜索文章</span></button>
          <button class="drawer-quick__item" @click="randomPost"><Shuffle :size="17" /><span>随机一篇</span></button>
          <RouterLink v-for="item in extraLinks" :key="item.to" :to="item.to" class="drawer-quick__item" @click="drawerOpen = false">
            <component :is="item.icon" :size="17" /><span>{{ item.label }}</span>
            <em v-if="item.to === '/bookmarks' && extras.bookmarkCount">{{ extras.bookmarkCount }}</em>
          </RouterLink>
          <button class="drawer-quick__item" @click="helpOpen = true; drawerOpen = false"><CircleHelp :size="17" /><span>快捷键</span></button>
        </div>

        <div class="nav-drawer__foot">
          <button class="drawer-theme" @click="site.toggleTheme()">
            <Sun v-if="site.isDark" :size="17" /><Moon v-else :size="17" />
            <span>{{ site.isDark ? '切换亮色' : '切换暗色' }}</span>
          </button>
          <RouterLink to="/admin" class="drawer-admin" @click="drawerOpen = false">
            <LayoutDashboard :size="16" /><span>后台管理</span><ArrowRight :size="15" />
          </RouterLink>
          <span class="nav-drawer__mode">{{ site.cloudLabel }}</span>
        </div>
      </aside>
    </Transition>
  </Teleport>

  <!-- command-style search overlay -->
  <Transition name="overlay">
    <div v-if="searchOpen" class="search-overlay" @click.self="searchOpen = false">
      <div class="search-panel glass">
        <div class="search-panel__row">
          <Search :size="20" class="search-panel__icon" />
          <input
            ref="searchInput"
            v-model="keyword"
            class="search-panel__input"
            placeholder="搜索文章标题、标签或正文…"
            @keydown.enter="submitSearch"
          />
          <button class="btn btn-primary btn-sm" @click="submitSearch"><ArrowRight :size="15" /></button>
        </div>
        <div class="search-panel__hint">
          <span><kbd>Enter</kbd> 搜索</span>
          <span><kbd>Esc</kbd> 关闭</span>
          <span><kbd>Ctrl</kbd> + <kbd>K</kbd> 快捷唤起</span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- keyboard shortcuts -->
  <Transition name="overlay">
    <div v-if="helpOpen" class="search-overlay" @click.self="helpOpen = false">
      <div class="help-panel glass">
        <div class="help-panel__head"><strong>键盘快捷键</strong><button aria-label="关闭" @click="helpOpen = false"><X :size="17" /></button></div>
        <div v-for="item in shortcuts" :key="item.label" class="help-row">
          <span>{{ item.label }}</span>
          <span class="help-keys"><kbd v-for="key in item.keys" :key="key">{{ key }}</kbd></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.header-action { color: var(--text-soft); }
.header-admin { gap: 7px; }
.menu-trigger { display: none; }
.spin-fade-enter-active, .spin-fade-leave-active { transition: opacity .2s ease, transform .3s var(--ease); }
.spin-fade-enter-from { opacity: 0; transform: rotate(-90deg) scale(.6); }
.spin-fade-leave-to { opacity: 0; transform: rotate(90deg) scale(.6); }

.announcement { border-top: 1px solid var(--border); background: rgba(var(--accent-rgb), .07); }
.announcement__inner { display: flex; align-items: center; gap: 9px; padding: 8px 0; font-size: 12px; font-weight: 600; color: var(--text-soft); }
.announcement__inner > svg { color: var(--accent); flex: none; }
.announcement__inner a:hover { color: var(--accent); }
.announcement__inner button { margin-left: auto; display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 8px; background: transparent; color: var(--text-muted); }
.announcement__inner button:hover { background: rgba(var(--accent-rgb), .12); color: var(--accent); }

.drawer-mask { position: fixed; inset: 0; z-index: 110; background: rgba(8, 11, 22, .42); backdrop-filter: blur(3px); }
.nav-drawer {
  position: fixed; top: 0; right: 0; z-index: 111;
  width: min(88vw, 340px); height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  padding: 20px 18px calc(18px + env(safe-area-inset-bottom, 0px));
  background: var(--surface-solid);
  border-left: 1px solid var(--border);
  box-shadow: -20px 0 60px rgba(10, 14, 30, .18);
  overflow-y: auto; overscroll-behavior: contain;
}
.nav-drawer__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.drawer-close { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-soft); }
.drawer-close:hover { color: var(--accent); border-color: rgba(var(--accent-rgb), .4); }
.nav-drawer__hint { display: flex; align-items: center; gap: 6px; margin: 14px 2px 12px; font-size: 11px; color: var(--text-muted); }
.nav-drawer__hint svg { color: var(--accent); }
.nav-drawer__links { display: flex; flex-direction: column; gap: 5px; }
.drawer-link { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 9px 12px; border-radius: 14px; border: 1px solid transparent; background: var(--bg-2); transition: all .3s var(--ease); }
.drawer-link__icon { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 11px; background: var(--surface-solid); color: var(--text-soft); }
.drawer-link__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.drawer-link__text strong { font-size: 14px; font-weight: 700; color: var(--text); }
.drawer-link__text small { font-size: 11px; color: var(--text-muted); }
.drawer-link__arrow { margin-left: auto; color: var(--text-muted); flex: none; }
.drawer-link.is-active { border-color: rgba(var(--accent-rgb), .32); background: rgba(var(--accent-rgb), .09); }
.drawer-link.is-active .drawer-link__icon { background: var(--accent); color: #fff; }
.drawer-link.is-active .drawer-link__text strong, .drawer-link.is-active .drawer-link__arrow { color: var(--accent); }
.drawer-divider { height: 1px; background: var(--border); margin: 18px 2px 14px; }
.nav-drawer__section-title { padding: 0 4px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
.drawer-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.drawer-quick__item { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 11px; border-radius: 11px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-soft); font-size: 12.5px; font-weight: 600; text-align: left; }
.drawer-quick__item svg { color: var(--accent); flex: none; }
.drawer-quick__item:hover { color: var(--accent); border-color: rgba(var(--accent-rgb), .4); }
.drawer-quick__item em { margin-left: auto; font-style: normal; font-size: 10px; padding: 1px 6px; border-radius: 99px; background: rgba(var(--accent-rgb), .14); color: var(--accent); }
.nav-drawer__foot { margin-top: auto; padding-top: 20px; display: flex; flex-direction: column; gap: 9px; }
.drawer-theme { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 13px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-soft); font-size: 13px; font-weight: 600; }
.drawer-theme svg { color: var(--accent); }
.drawer-admin { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 10px 14px; border-radius: 12px; background: linear-gradient(110deg, var(--accent), var(--accent-2)); color: #fff; font-size: 13px; font-weight: 650; }
.drawer-admin svg:last-child { margin-left: auto; }
.nav-drawer__mode { text-align: center; font-size: 11px; color: var(--text-muted); padding-top: 4px; }

.slide-enter-active, .slide-leave-active { transition: transform .4s var(--ease); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.mask-enter-active, .mask-leave-active { transition: opacity .35s ease; }
.mask-enter-from, .mask-leave-to { opacity: 0; }

.search-overlay { position: fixed; inset: 0; z-index: 120; display: flex; justify-content: center; align-items: flex-start; padding: 14vh 20px 20px; background: rgba(10, 13, 24, .38); backdrop-filter: blur(6px); }
.search-panel { width: min(620px, 100%); padding: 16px; border-radius: 20px; box-shadow: var(--shadow-lg); }
.search-panel__row { display: flex; align-items: center; gap: 12px; }
.search-panel__icon { color: var(--accent); flex: none; }
.search-panel__input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 16px; padding: 8px 0; }
.search-panel__input::placeholder { color: var(--text-muted); }
.search-panel__hint { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
kbd { font: 600 11px var(--font-mono); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--border-strong); background: var(--surface-solid); color: var(--text-soft); }
.help-panel { width: min(420px, 100%); padding: 18px 20px; border-radius: 20px; box-shadow: var(--shadow-lg); }
.help-panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
.help-panel__head button { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 9px; background: var(--bg-2); color: var(--text-muted); }
.help-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-soft); }
.help-keys { display: inline-flex; gap: 4px; }
.overlay-enter-active, .overlay-leave-active { transition: opacity .3s ease; }
.overlay-enter-active .search-panel, .overlay-leave-active .search-panel, .overlay-enter-active .help-panel, .overlay-leave-active .help-panel { transition: transform .4s var(--ease); }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-from .search-panel, .overlay-leave-to .search-panel, .overlay-enter-from .help-panel, .overlay-leave-to .help-panel { transform: translateY(-20px) scale(.96); }

@media (max-width: 860px) {
  .menu-trigger { display: inline-flex; width: 40px; height: 40px; }
  .header-admin, .nav-links, .desktop-random { display: none; }
  .header-inner { gap: 10px; }
  .brand { font-size: 16px; }
  .brand-mark { width: 30px; height: 30px; font-size: 16px; border-radius: 9px; }
  .search-overlay { padding-top: 10vh; }
}
@media (max-width: 380px) {
  .header-inner { gap: 6px; }
  .header-action { width: 34px; height: 34px; }
  .drawer-quick { grid-template-columns: 1fr; }
}
</style>
