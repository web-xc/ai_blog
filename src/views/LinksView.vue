<script setup lang="ts">
import { computed } from 'vue'
import { Link2, ArrowUpRight, Sparkles, Mail } from '@lucide/vue'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()
const links = computed(() => site.config.links || [])
const mailLink = computed(() => site.config.social.find((s) => s.href.startsWith('mailto:'))?.href || '')
</script>

<template>
  <div class="container links-page">
    <header v-reveal class="page-hero">
      <span class="section-kicker">Friendly Links</span>
      <h1 class="section-title">一起<span class="gradient-text">照亮</span>彼此</h1>
      <p class="page-hero__sub">一些值得常去看看的地方，也是这条路上同行的朋友。</p>
    </header>

    <section v-if="links.length" class="links-grid">
      <a
        v-for="(link, i) in links"
        :key="link.url"
        v-reveal="i * 60"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="link-card glass card-hover"
      >
        <span class="link-card__avatar">{{ link.avatar || '✦' }}</span>
        <span class="link-card__body">
          <strong>{{ link.name }}</strong>
          <small>{{ link.desc }}</small>
        </span>
        <ArrowUpRight :size="17" class="link-card__arrow" />
      </a>
    </section>

    <div v-else v-reveal class="empty-state glass">
      <div class="empty-state__icon"><Link2 :size="26" /></div>
      <h2>还没有友链</h2>
      <p>在后台「站点设置 → 友链管理」里添加你的朋友们。</p>
      <RouterLink to="/admin/settings" class="btn btn-primary btn-sm">去添加</RouterLink>
    </div>

    <section v-reveal class="apply-card glass">
      <div class="apply-card__icon"><Sparkles :size="20" /></div>
      <div>
        <h2>想交换友链？</h2>
        <p>在评论区留言，或通过上述方式联系我。请附上站点名称、地址与一句话简介。</p>
      </div>
      <a v-if="mailLink" :href="mailLink" class="btn btn-ghost btn-sm"><Mail :size="15" /> 联系我</a>
    </section>
  </div>
</template>

<style scoped>
.links-page { padding-top: 48px; padding-bottom: 80px; }
.page-hero { text-align: center; margin-bottom: 42px; }
.page-hero__sub { margin: 14px 0 0; font-size: 14px; color: var(--text-muted); }
.links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.link-card { display: flex; align-items: center; gap: 14px; padding: 18px; min-height: 96px; }
.link-card__avatar { width: 48px; height: 48px; flex: none; display: grid; place-items: center; border-radius: 15px; background: rgba(var(--accent-rgb), .1); font-size: 24px; }
.link-card__body { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.link-card__body strong { font-size: 14.5px; font-weight: 720; }
.link-card__body small { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
.link-card__arrow { margin-left: auto; flex: none; color: var(--text-muted); transition: all .3s var(--ease); }
.link-card:hover .link-card__arrow { color: var(--accent); transform: translate(3px, -3px); }
.apply-card { display: flex; align-items: center; gap: 18px; margin-top: 42px; padding: 24px 26px; }
.apply-card__icon { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.apply-card h2 { margin: 0 0 6px; font-size: 16px; }
.apply-card p { margin: 0; font-size: 12.5px; color: var(--text-muted); line-height: 1.7; }
.apply-card > .btn { margin-left: auto; flex: none; }
@media (max-width: 900px) { .links-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 620px) {
  .links-page { padding-top: 30px; }
  .links-grid { grid-template-columns: 1fr; gap: 12px; }
  .apply-card { flex-wrap: wrap; padding: 20px 18px; }
  .apply-card > .btn { margin-left: 0; }
}
</style>
