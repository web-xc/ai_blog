<script setup lang="ts">
import { computed } from 'vue'
import { Heart, ArrowUpRight, Sparkles, LayoutDashboard } from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { resolveIcon } from '@/lib/icons'

const site = useSiteStore()
const year = new Date().getFullYear()
const social = computed(() => site.config.social)

const tech = ['Vue 3', 'Vite', 'TypeScript', 'GitHub Actions', 'Twikoo']
const quickLinks = [
  { label: '文章归档', to: '/archive' },
  { label: '标签云', to: '/tags' },
  { label: '关于我', to: '/about' },
  { label: '站内搜索', to: '/search' },
]
</script>

<template>
  <footer class="site-footer">
    <div class="footer-glow" aria-hidden="true" />
    <div class="container footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <RouterLink to="/" class="brand">
            <span class="brand-mark">✦</span>
            <span>{{ site.config.title }}</span>
          </RouterLink>
          <p class="footer-desc">{{ site.config.description }}</p>
          <div class="footer-social">
            <a
              v-for="item in social"
              :key="item.label + item.href"
              :href="item.href"
              :title="item.label"
              :aria-label="item.label"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <component :is="resolveIcon(item.icon)" :size="17" />
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4>快速导航</h4>
          <RouterLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="footer-link">
            <ArrowUpRight :size="13" /> {{ link.label }}
          </RouterLink>
        </div>

        <div class="footer-col">
          <h4>构建技术</h4>
          <div class="tech-tags">
            <span v-for="t in tech" :key="t" class="chip">{{ t }}</span>
          </div>
          <div class="status-pill"><span class="status-dot" /> All systems operational</div>
        </div>
      </div>

      <hr class="hairline" />

      <div class="footer-bottom">
        <p>© {{ year }} {{ site.config.author }} · {{ site.config.footerNote }}</p>
        <div class="footer-bottom__right">
          <span class="made-with"><Sparkles :size="13" /> Made with <Heart :size="12" class="heart" fill="currentColor" /> &amp; Vue</span>
          <RouterLink to="/admin" class="footer-admin"><LayoutDashboard :size="13" /> 后台</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer { position: relative; margin-top: 80px; padding: 58px 0 26px; border-top: 1px solid var(--border); background: var(--surface); backdrop-filter: blur(18px); overflow: hidden; }
.footer-glow { position: absolute; top: -160px; left: 50%; transform: translateX(-50%); width: 620px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .2), transparent 70%); filter: blur(40px); pointer-events: none; animation: pulse-glow 8s ease-in-out infinite; }
.footer-inner { position: relative; }
.footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1.2fr; gap: 40px; }
.footer-desc { max-width: 340px; margin: 16px 0 22px; font-size: 13.5px; line-height: 1.85; color: var(--text-muted); }
.footer-social { display: flex; gap: 10px; }
.social-btn { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-soft); transition: all .35s var(--ease); }
.social-btn:hover { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--accent), var(--accent-2)); transform: translateY(-4px) rotate(-6deg); box-shadow: 0 10px 24px rgba(var(--accent-rgb), .35); }
.footer-col h4 { font-size: 13px; font-weight: 700; margin: 4px 0 18px; color: var(--text); letter-spacing: .02em; }
.footer-link { display: flex; align-items: center; gap: 7px; padding: 7px 0; font-size: 13.5px; color: var(--text-muted); transition: color .25s ease, transform .25s var(--ease); }
.footer-link:hover { color: var(--accent); transform: translateX(4px); }
.tech-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.tech-tags .chip { font-size: 11px; padding: 4px 10px; }
.status-pill { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-solid); font: 500 11px var(--font-mono); color: var(--text-muted); }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(16,185,129,.16); animation: pulse-glow 2s ease-in-out infinite; }
.hairline { margin: 40px 0 22px; }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
.footer-bottom p { margin: 0; font-size: 12.5px; color: var(--text-muted); }
.footer-bottom__right { display: flex; align-items: center; gap: 18px; }
.made-with { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-muted); }
.heart { color: #f43f5e; animation: pulse-glow 1.8s ease-in-out infinite; }
.footer-admin { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-muted); transition: color .25s ease; }
.footer-admin:hover { color: var(--accent); }
@media (max-width: 860px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 30px; } .footer-brand { grid-column: 1 / -1; } }
@media (max-width: 560px) { .footer-grid { grid-template-columns: 1fr; } .footer-bottom { flex-direction: column; align-items: flex-start; } }
</style>
