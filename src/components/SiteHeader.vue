<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, Archive, Tags, User, Sun, Moon, Search, Menu, X, LayoutDashboard, ArrowRight } from '@lucide/vue'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()
const route = useRoute()
const router = useRouter()

const links = [
  { label: '首页', to: '/', icon: Home },
  { label: '归档', to: '/archive', icon: Archive },
  { label: '标签', to: '/tags', icon: Tags },
  { label: '关于', to: '/about', icon: User },
]

const scrolled = ref(false)
const searchOpen = ref(false)
const mobileOpen = ref(false)
const keyword = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

function onScroll() { scrolled.value = window.scrollY > 12 }
function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
  if (e.key === 'Escape') { searchOpen.value = false; mobileOpen.value = false }
}
function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchOpen.value = false
  keyword.value = ''
}

watch(searchOpen, async (open) => {
  if (open) { await nextTick(); searchInput.value?.focus() }
})
watch(() => route.fullPath, () => { mobileOpen.value = false })

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
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

      <button class="btn btn-icon btn-ghost btn-sm header-action" aria-label="搜索" @click="searchOpen = true">
        <Search :size="17" />
      </button>
      <button class="btn btn-icon btn-ghost btn-sm header-action" :aria-label="site.isDark ? '切换亮色' : '切换暗色'" @click="site.toggleTheme()">
        <Transition name="spin-fade" mode="out-in">
          <Sun v-if="site.isDark" :key="'sun'" :size="17" />
          <Moon v-else :key="'moon'" :size="17" />
        </Transition>
      </button>
      <RouterLink to="/admin" class="btn btn-ghost btn-sm header-admin">
        <LayoutDashboard :size="15" /> <span>后台</span>
      </RouterLink>
      <button class="btn btn-icon btn-ghost btn-sm menu-trigger" aria-label="菜单" @click="mobileOpen = !mobileOpen">
        <X v-if="mobileOpen" :size="19" />
        <Menu v-else :size="19" />
      </button>
    </div>

    <!-- mobile drawer -->
    <Transition name="drawer">
      <div v-if="mobileOpen" class="mobile-drawer glass">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="mobile-link" :class="{ 'is-active': isActive(link.to) }">
          <component :is="link.icon" :size="16" /> {{ link.label }}
        </RouterLink>
        <RouterLink to="/search" class="mobile-link"><Search :size="16" /> 搜索</RouterLink>
        <RouterLink to="/admin" class="mobile-link"><LayoutDashboard :size="16" /> 后台管理</RouterLink>
      </div>
    </Transition>
  </header>

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

</template>

<style scoped>
.header-action { color: var(--text-soft); }
.header-admin { gap: 7px; }
.menu-trigger { display: none; }
.spin-fade-enter-active, .spin-fade-leave-active { transition: opacity .2s ease, transform .3s var(--ease); }
.spin-fade-enter-from { opacity: 0; transform: rotate(-90deg) scale(.6); }
.spin-fade-leave-to { opacity: 0; transform: rotate(90deg) scale(.6); }

.mobile-drawer {
  position: absolute; top: calc(var(--header-h) + 6px); left: 14px; right: 14px;
  padding: 12px; display: flex; flex-direction: column; gap: 4px;
}
.mobile-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; font-size: 14px; font-weight: 600; color: var(--text-soft); transition: all .25s ease; }
.mobile-link:hover, .mobile-link.is-active { background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.drawer-enter-active, .drawer-leave-active { transition: opacity .3s ease, transform .35s var(--ease); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(-12px) scale(.98); }

.search-overlay { position: fixed; inset: 0; z-index: 120; display: flex; justify-content: center; align-items: flex-start; padding: 14vh 20px 20px; background: rgba(10, 13, 24, .38); backdrop-filter: blur(6px); }
.search-panel { width: min(620px, 100%); padding: 16px; border-radius: 20px; box-shadow: var(--shadow-lg); }
.search-panel__row { display: flex; align-items: center; gap: 12px; }
.search-panel__icon { color: var(--accent); flex: none; }
.search-panel__input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 16px; padding: 8px 0; }
.search-panel__input::placeholder { color: var(--text-muted); }
.search-panel__hint { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
kbd { font: 600 11px var(--font-mono); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--border-strong); background: var(--surface-solid); color: var(--text-soft); }
.overlay-enter-active, .overlay-leave-active { transition: opacity .3s ease; }
.overlay-enter-active .search-panel, .overlay-leave-active .search-panel { transition: transform .4s var(--ease); }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-from .search-panel, .overlay-leave-to .search-panel { transform: translateY(-20px) scale(.96); }

@media (max-width: 860px) {
  .menu-trigger { display: inline-flex; }
  .header-admin { display: none; }
  .hidden { display: none; }
}
</style>
