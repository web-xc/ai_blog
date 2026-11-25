<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, Clock, Hash, ArrowLeft, ArrowRight, ChevronRight, Link2, User, FileText, List, BookOpen, Copy, X } from '@lucide/vue'
import { getPost, getNeighbours, getRelated, gradientFor, humanDate } from '@/lib/posts'
import { renderMarkdown } from '@/lib/markdown'
import { useSiteStore } from '@/stores/site'
import { useAdminStore } from '@/stores/admin'
import { useExtrasStore } from '@/stores/extras'
import { notify } from '@/lib/toast'
import PostCard from '@/components/PostCard.vue'
import CommentThread from '@/components/CommentThread.vue'
import AiSummary from '@/components/AiSummary.vue'
import PostActions from '@/components/PostActions.vue'

const route = useRoute()
const site = useSiteStore()
const admin = useAdminStore()
const extras = useExtrasStore()
const lightboxSrc = ref('')
const slug = computed(() => String(route.params.slug || ''))
const post = computed(() => getPost(slug.value))
const rendered = computed(() => (post.value ? renderMarkdown(post.value.content) : { html: '', toc: [], headings: 0 }))
const neighbours = computed(() => getNeighbours(slug.value))
const related = computed(() => (post.value ? getRelated(post.value) : []))
const gradient = computed(() => gradientFor(slug.value))

const activeId = ref('')
function updateToc() {
  let current = rendered.value.toc[0]?.id || ''
  for (const item of rendered.value.toc) {
    const el = document.getElementById(item.id)
    if (el && el.getBoundingClientRect().top <= 150) current = item.id
  }
  activeId.value = current
}
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleBodyClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.matches('[data-copy]')) {
    const code = target.closest('.code-block')?.querySelector('code')?.textContent || ''
    navigator.clipboard?.writeText(code).then(
      () => {
        target.textContent = '已复制 ✓'
        notify('代码已复制到剪贴板')
        window.setTimeout(() => (target.textContent = '复制'), 1800)
      },
      () => notify('复制失败，请手动选择代码', 'error'),
    )
    return
  }
  if (target.tagName === 'IMG') {
    lightboxSrc.value = (target as HTMLImageElement).src
  }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') lightboxSrc.value = ''
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    notify('文章链接已复制')
  } catch {
    notify('复制失败，请手动复制地址栏链接', 'error')
  }
}

onMounted(() => {
  if (post.value) admin.recordView(post.value.slug)
  window.addEventListener('scroll', updateToc, { passive: true })
  window.addEventListener('keydown', onKey)
  updateToc()
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateToc)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div v-if="post" class="post-page">
    <!-- banner -->
    <div class="container post-hero">
      <div class="post-banner" :style="{ background: gradient }">
        <span class="post-banner__grid" />
        <span class="post-banner__ring" />
        <span class="post-banner__emoji">{{ post.cover }}</span>
        <span class="post-banner__category">{{ post.category }}</span>
      </div>

      <div v-reveal class="post-head glass">
        <nav class="post-crumb">
          <RouterLink to="/">首页</RouterLink><ChevronRight :size="13" />
          <RouterLink to="/archive">文章</RouterLink><ChevronRight :size="13" />
          <span>{{ post.title }}</span>
        </nav>
        <h1 class="post-title">{{ post.title }}</h1>
        <p class="post-excerpt">{{ post.excerpt }}</p>
        <div class="post-meta">
          <span><User :size="14" /> {{ post.author || site.config.author }}</span>
          <span><CalendarDays :size="14" /> {{ humanDate(post.date) }}</span>
          <span><Clock :size="14" /> {{ post.readingTime }} 分钟阅读</span>
          <span><FileText :size="14" /> {{ post.wordCount.toLocaleString('zh-CN') }} 字</span>
          <button class="post-share" @click="share"><Link2 :size="14" /> 分享</button>
        </div>
      </div>
    </div>

    <!-- body + toc -->
    <div class="container post-layout">
      <article class="post-main glass">
        <AiSummary
          :slug="post.slug"
          :title="post.title"
          :content="post.content"
          :static-summary="post.aiSummary"
        />

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="md-body"
          :style="{ '--md-font-scale': extras.fontScale }"
          v-html="rendered.html"
          @click="handleBodyClick"
        />

        <PostActions
          :slug="post.slug"
          :title="post.title"
          :toc="rendered.toc"
          :active-id="activeId"
          @scroll-to="scrollTo"
          @share="share"
        />

        <div class="post-tags">
          <RouterLink v-for="tag in post.tags" :key="tag" :to="`/tag/${encodeURIComponent(tag)}`" class="chip chip-accent">
            <Hash :size="12" /> {{ tag }}
          </RouterLink>
        </div>

        <div class="post-end">
          <div class="post-end__line" />
          <span>✦ 感谢阅读，期待你的想法 ✦</span>
          <div class="post-end__line" />
        </div>

        <div class="post-nav">
          <RouterLink v-if="neighbours.prev" :to="`/post/${neighbours.prev.slug}`" class="post-nav__item">
            <span><ArrowLeft :size="13" /> 上一篇</span>
            <strong>{{ neighbours.prev.title }}</strong>
          </RouterLink>
          <span v-else class="post-nav__item is-empty">已经是第一篇了</span>
          <RouterLink v-if="neighbours.next" :to="`/post/${neighbours.next.slug}`" class="post-nav__item is-right">
            <span>下一篇 <ArrowRight :size="13" /></span>
            <strong>{{ neighbours.next.title }}</strong>
          </RouterLink>
          <span v-else class="post-nav__item is-right is-empty">已经是最后一篇了</span>
        </div>

        <CommentThread :slug="post.slug" :title="post.title" />
      </article>

      <aside class="post-aside">
        <div v-if="rendered.toc.length" v-reveal class="toc-panel glass">
          <div class="toc__title"><List :size="14" /> 本文目录</div>
          <nav class="toc">
            <ul class="toc__list">
              <li
                v-for="item in rendered.toc"
                :key="item.id"
                class="toc__item"
                :data-level="item.level"
                :class="{ 'is-active': activeId === item.id }"
              >
                <a class="toc__link" :href="`#${item.id}`" @click.prevent="scrollTo(item.id)">{{ item.text }}</a>
              </li>
            </ul>
          </nav>
        </div>
        <div v-reveal="120" class="aside-card glass">
          <Copy :size="18" />
          <h4>写作于 {{ humanDate(post.date) }}</h4>
          <p>{{ site.config.authorRole }}</p>
          <RouterLink to="/about" class="btn btn-ghost btn-sm"><BookOpen :size="14" /> 了解更多</RouterLink>
        </div>
      </aside>
    </div>

    <!-- related -->
    <section v-if="related.length" class="container section related">
      <div v-reveal class="section-head">
        <div>
          <span class="section-kicker">Keep Reading</span>
          <h2 class="section-title">继续<span class="gradient-text">阅读</span></h2>
        </div>
      </div>
      <div class="post-list">
        <PostCard v-for="(p, i) in related" :key="p.slug" :post="p" :delay="i * 100" />
      </div>
    </section>
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxSrc" class="lightbox" @click="lightboxSrc = ''">
          <button class="lightbox__close" aria-label="关闭图片"><X :size="22" /></button>
          <img :src="lightboxSrc" alt="放大查看" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- missing post -->
  <div v-else class="container missing">
    <div class="empty-state glass">
      <div class="empty-state__icon"><FileText :size="28" /></div>
      <h2>这篇文章不存在</h2>
      <p>可能是链接有误，或文章已被移动到别处。</p>
      <RouterLink to="/archive" class="btn btn-primary btn-sm"><ArrowLeft :size="14" /> 返回归档</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.post-hero { padding-top: 34px; }
.post-banner { position: relative; height: 250px; border-radius: var(--radius-lg); overflow: hidden; }
.post-banner__grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.13) 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(135deg, #000, transparent 80%); }
.post-banner__ring { position: absolute; width: 330px; height: 330px; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; top: -140px; right: 4%; animation: float-y 8s ease-in-out infinite; }
.post-banner__emoji { position: absolute; inset: 0; display: grid; place-items: center; font-size: 94px; filter: drop-shadow(0 14px 24px rgba(0,0,0,.24)); animation: float-y 6s ease-in-out infinite; }
.post-banner__category { position: absolute; left: 26px; bottom: 22px; padding: 7px 16px; border-radius: 999px; background: rgba(10,14,30,.3); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.25); color: #fff; font-size: 12px; font-weight: 650; }
.post-head { position: relative; margin: -54px auto 0; width: calc(100% - 64px); padding: 30px 38px 26px; border-radius: var(--radius); }
.post-crumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin-bottom: 16px; flex-wrap: wrap; }
.post-crumb a:hover { color: var(--accent); }
.post-crumb span:last-child { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-title { font-size: clamp(26px, 3.4vw, 40px); font-weight: 790; line-height: 1.32; margin: 0 0 12px; letter-spacing: -.035em; }
.post-excerpt { margin: 0 0 20px; font-size: 14.5px; line-height: 1.85; color: var(--text-soft); }
.post-meta { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; padding-top: 18px; border-top: 1px solid var(--border); font-size: 12.5px; color: var(--text-muted); }
.post-meta > span { display: inline-flex; align-items: center; gap: 6px; }
.post-meta svg { color: var(--accent); }
.post-share { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-soft); padding: 6px 13px; border-radius: 999px; font-size: 12px; font-weight: 600; transition: all .3s var(--ease); }
.post-share:hover { color: var(--accent); border-color: var(--accent); transform: translateY(-2px); }

.post-layout { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 26px; align-items: start; margin-top: 30px; }
.post-main { padding: 36px 40px 40px; min-width: 0; }
.post-main :deep(.md-body) { font-size: calc(15.5px * var(--md-font-scale, 1)); }
.post-main :deep(.md-body img) { cursor: zoom-in; }
.lightbox { position: fixed; inset: 0; z-index: 160; display: grid; place-items: center; padding: 5vh 5vw; background: rgba(6, 9, 20, .88); backdrop-filter: blur(8px); }
.lightbox img { max-width: 100%; max-height: 90vh; border-radius: 12px; box-shadow: 0 30px 90px rgba(0,0,0,.5); }
.lightbox__close { position: absolute; top: 18px; right: 18px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.1); color: #fff; }
.lightbox-enter-active, .lightbox-leave-active { transition: opacity .3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
.post-tags { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 42px; padding-top: 24px; border-top: 1px solid var(--border); }
.post-end { display: flex; align-items: center; gap: 16px; margin: 30px 0; font-size: 12px; color: var(--text-muted); letter-spacing: .05em; }
.post-end__line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--border-strong), transparent); }
.post-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.post-nav__item { display: flex; flex-direction: column; gap: 8px; padding: 16px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-solid); transition: all .35s var(--ease); }
.post-nav__item > span { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-muted); }
.post-nav__item strong { font-size: 14px; font-weight: 650; color: var(--text); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
a.post-nav__item:hover { border-color: rgba(var(--accent-rgb), .45); transform: translateY(-3px); box-shadow: var(--shadow); }
a.post-nav__item:hover strong { color: var(--accent); }
.post-nav__item.is-right { text-align: right; }
.post-nav__item.is-right > span { justify-content: flex-end; }
.post-nav__item.is-empty { opacity: .45; justify-content: center; font-size: 12.5px; color: var(--text-muted); }

.post-aside { position: sticky; top: calc(var(--header-h) + 22px); display: flex; flex-direction: column; gap: 16px; }
.toc-panel { padding: 20px 18px; max-height: calc(100vh - var(--header-h) - 60px); overflow-y: auto; }
.aside-card { padding: 22px; text-align: center; }
.aside-card > svg { color: var(--accent); }
.aside-card h4 { font-size: 13.5px; margin: 12px 0 6px; }
.aside-card p { font-size: 12px; color: var(--text-muted); margin: 0 0 16px; line-height: 1.7; }
.missing { padding-top: 90px; padding-bottom: 90px; }
.missing .empty-state { max-width: 520px; margin: auto; border-radius: var(--radius-lg); }
.missing h2 { margin: 0; font-size: 22px; }
.missing p { margin: 0; font-size: 14px; }

@media (max-width: 1000px) {
  .post-layout { grid-template-columns: 1fr; }
  .post-aside { display: none; }
  .aside-card { display: none; }
}
@media (max-width: 700px) {
  .post-banner { height: 190px; }
  .post-banner__emoji { font-size: 68px; }
  .post-head { width: calc(100% - 24px); padding: 22px 20px; }
  .post-main { padding: 24px 20px 28px; }
  .post-meta { gap: 12px; }
  .post-nav { grid-template-columns: 1fr; }
  .post-nav__item.is-right { text-align: left; }
  .post-nav__item.is-right > span { justify-content: flex-start; }
}
</style>
