<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, FileText, PenLine, MessageCircle, Settings, ExternalLink,
  Sun, Moon, LogOut, Menu, X, ChevronRight, Sparkles, ShieldCheck,
} from '@lucide/vue'
import { useAdminStore } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import { notify } from '@/lib/toast'

const admin = useAdminStore()
const site = useSiteStore()
const route = useRoute()
const router = useRouter()

const navGroups = [
  {
    label: '工作台',
    items: [{ label: '概览', to: '/admin', icon: LayoutDashboard, exact: true }],
  },
  {
    label: '内容',
    items: [
      { label: '文章管理', to: '/admin/posts', icon: FileText, exact: false },
      { label: '写文章', to: '/admin/editor/new', icon: PenLine, exact: false },
    ],
  },
  {
    label: '站点',
    items: [
      { label: '评论管理', to: '/admin/comments', icon: MessageCircle, exact: false },
      { label: '站点设置', to: '/admin/settings', icon: Settings, exact: false },
    ],
  },
]

const mobileOpen = ref(false)
const now = ref(new Date())
let timer = 0
const clock = computed(() =>
  now.value.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit' }),
)
const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const pageTitle = computed(() => (route.meta.title as string) || '概览')

function isActive(to: string, exact: boolean) {
  if (exact) return route.path === to
  if (to === '/admin/editor/new') return route.path.startsWith('/admin/editor')
  return route.path === to || route.path.startsWith(to)
}
function logout() {
  admin.logout()
  notify('已退出后台', 'info')
  router.replace('/admin/login')
}

onMounted(() => {
  if (!admin.authenticated) router.replace('/admin/login')
  timer = window.setInterval(() => (now.value = new Date()), 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="admin-shell" :class="{ 'is-mobile-open': mobileOpen }">
    <!-- sidebar -->
    <aside class="admin-sidebar">
      <RouterLink to="/admin" class="admin-brand">
        <span class="brand-mark">✦</span>
        <span class="admin-brand__text"><strong>{{ site.config.title }}</strong><small>Admin Console</small></span>
      </RouterLink>

      <nav class="admin-nav">
        <div v-for="group in navGroups" :key="group.label" class="admin-nav__group">
          <span class="admin-nav__label">{{ group.label }}</span>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="admin-nav__item"
            :class="{ 'is-active': isActive(item.to, item.exact) }"
            @click="mobileOpen = false"
          >
            <component :is="item.icon" :size="17" />
            <span>{{ item.label }}</span>
            <ChevronRight :size="14" class="admin-nav__chevron" />
          </RouterLink>
        </div>
      </nav>

      <div class="admin-sidebar__foot">
        <div class="deploy-badge"><span /> GitHub Actions 已就绪</div>
        <RouterLink to="/" class="admin-nav__item"><ExternalLink :size="16" /> <span>查看站点</span></RouterLink>
        <button class="admin-nav__item" @click="site.toggleTheme()">
          <Sun v-if="site.isDark" :size="16" /><Moon v-else :size="16" />
          <span>{{ site.isDark ? '切换亮色' : '切换暗色' }}</span>
        </button>
        <button class="admin-nav__item is-danger" @click="logout"><LogOut :size="16" /> <span>退出登录</span></button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="sidebar-mask" @click="mobileOpen = false" />

    <!-- main -->
    <div class="admin-main">
      <header class="admin-topbar">
        <button class="btn btn-icon btn-ghost btn-sm admin-menu-btn" aria-label="菜单" @click="mobileOpen = !mobileOpen">
          <X v-if="mobileOpen" :size="19" /><Menu v-else :size="19" />
        </button>
        <div class="admin-topbar__title">
          <span class="admin-crumb">后台 /</span>
          <strong>{{ pageTitle }}</strong>
        </div>
        <div class="spacer" />
        <span class="admin-clock">{{ clock }}</span>
        <span class="chip chip-accent admin-greet"><Sparkles :size="12" /> {{ greeting }}</span>
        <span class="admin-avatar">{{ site.config.avatar }}</span>
      </header>

      <div class="admin-content">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="viewRoute.fullPath" />
          </Transition>
        </RouterView>
      </div>

      <footer class="admin-footer">
        <span><ShieldCheck :size="13" /> 本地界面锁已启用</span>
        <span>Aurora Admin · Vue 3 · Static First</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.admin-shell { display: grid; grid-template-columns: 244px 1fr; min-height: 100vh; }
.admin-sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 22px 14px; background: var(--surface); backdrop-filter: blur(20px); border-right: 1px solid var(--border); z-index: 50; }
.admin-brand { display: flex; align-items: center; gap: 11px; padding: 4px 10px 24px; }
.admin-brand__text { display: flex; flex-direction: column; gap: 2px; }
.admin-brand__text strong { font-size: 16px; font-weight: 780; letter-spacing: -.02em; }
.admin-brand__text small { font: 600 10px var(--font-mono); letter-spacing: .08em; color: var(--text-muted); text-transform: uppercase; }
.admin-nav { flex: 1; display: flex; flex-direction: column; gap: 22px; overflow-y: auto; }
.admin-nav__group { display: flex; flex-direction: column; gap: 4px; }
.admin-nav__label { padding: 0 12px 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
.admin-nav__item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 12px; border: 0; border-radius: 11px; background: transparent; color: var(--text-soft); font-size: 13.5px; font-weight: 600; text-align: left; transition: all .3s var(--ease); }
.admin-nav__item:hover { color: var(--accent); background: rgba(var(--accent-rgb), .08); transform: translateX(3px); }
.admin-nav__item.is-active { color: #fff; background: linear-gradient(110deg, var(--accent), var(--accent-2)); box-shadow: 0 8px 20px rgba(var(--accent-rgb), .28); }
.admin-nav__chevron { margin-left: auto; opacity: 0; transition: opacity .25s ease; }
.admin-nav__item.is-active .admin-nav__chevron { opacity: .8; }
.admin-nav__item.is-danger:hover { color: var(--danger); background: rgba(239,68,68,.08); }
.admin-sidebar__foot { display: flex; flex-direction: column; gap: 3px; padding-top: 16px; border-top: 1px solid var(--border); }
.deploy-badge { display: flex; align-items: center; gap: 8px; margin: 0 8px 12px; padding: 9px 11px; border-radius: 10px; background: rgba(16,185,129,.08); color: var(--success); font: 600 11px var(--font-mono); }
.deploy-badge span { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(16,185,129,.15); animation: pulse-glow 2s ease-in-out infinite; }

.admin-main { min-width: 0; display: flex; flex-direction: column; }
.admin-topbar { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 14px; height: 64px; padding: 0 28px; background: var(--surface); backdrop-filter: blur(18px); border-bottom: 1px solid var(--border); }
.admin-topbar__title { display: flex; align-items: baseline; gap: 8px; }
.admin-topbar__title strong { font-size: 15.5px; font-weight: 720; }
.admin-crumb { font-size: 12px; color: var(--text-muted); }
.admin-clock { font: 600 11.5px var(--font-mono); color: var(--text-muted); }
.admin-greet { font-size: 11px; }
.admin-avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; color: #fff; font-size: 17px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 6px 16px rgba(var(--accent-rgb), .3); }
.admin-menu-btn { display: none; }
.admin-content { flex: 1; padding: 28px; min-width: 0; }
.admin-footer { display: flex; justify-content: space-between; gap: 12px; padding: 16px 28px; border-top: 1px solid var(--border); font-size: 11.5px; color: var(--text-muted); }
.admin-footer span { display: inline-flex; align-items: center; gap: 6px; }
.sidebar-mask { display: none; }

@media (max-width: 900px) {
  .admin-shell { grid-template-columns: 1fr; }
  .admin-sidebar { position: fixed; left: 0; top: 0; width: 244px; transform: translateX(-100%); transition: transform .38s var(--ease); box-shadow: var(--shadow-lg); }
  .admin-shell.is-mobile-open .admin-sidebar { transform: none; }
  .admin-shell.is-mobile-open .sidebar-mask { display: block; position: fixed; inset: 0; z-index: 45; background: rgba(8,11,22,.45); backdrop-filter: blur(3px); }
  .admin-menu-btn { display: inline-flex; }
  .admin-content { padding: 20px 16px; }
  .admin-topbar { padding: 0 16px; }
  .admin-clock { display: none; }
}
@media (max-width: 560px) { .admin-greet { display: none; } .admin-footer { flex-direction: column; padding: 14px 16px; } }
</style>
