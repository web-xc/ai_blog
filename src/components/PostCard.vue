<script setup lang="ts">
import { computed } from 'vue'
import { Clock, ArrowUpRight, Pin, CalendarDays, Bookmark, BookmarkCheck } from '@lucide/vue'
import { formatDate, gradientFor, type Post } from '@/lib/posts'
import { useSiteStore } from '@/stores/site'
import { useExtrasStore } from '@/stores/extras'
import { notify } from '@/lib/toast'

const props = withDefaults(defineProps<{ post: Post; featured?: boolean; delay?: number }>(), {
  featured: false,
  delay: 0,
})

const site = useSiteStore()
const extras = useExtrasStore()
const gradient = computed(() => gradientFor(props.post.slug))
const tags = computed(() => props.post.tags.slice(0, 2))
const saved = computed(() => extras.isBookmarked(props.post.slug))

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

function toggleBookmark() {
  const added = extras.toggleBookmark(props.post.slug)
  notify(added ? '已加入稍后读' : '已从稍后读移除', 'info')
}
</script>

<template>
  <article
    v-reveal="delay"
    class="post-card glass card-hover"
    @mousemove="onMove"
  >
    <button
      v-if="site.config.enableBookmarks"
      class="post-card__bookmark"
      :class="{ 'is-saved': saved }"
      :aria-label="saved ? '取消稍后读' : '加入稍后读'"
      @click.stop.prevent="toggleBookmark"
    >
      <BookmarkCheck v-if="saved" :size="14" />
      <Bookmark v-else :size="14" />
    </button>

    <RouterLink :to="`/post/${post.slug}`" class="post-card__cover" :style="{ background: gradient }">
      <span class="post-card__cover-grid" />
      <span class="post-card__cover-ring" />
      <span class="post-card__emoji">{{ post.cover }}</span>
      <span v-if="post.pinned" class="post-card__pin"><Pin :size="11" /> 置顶</span>
      <span class="post-card__date"><CalendarDays :size="11" /> {{ formatDate(post.date) }}</span>
    </RouterLink>

    <div class="post-card__body">
      <div class="post-card__meta">
        <span class="chip chip-accent">{{ post.category }}</span>
        <span class="post-card__read"><Clock :size="11" /> {{ post.readingTime }} 分钟</span>
      </div>

      <RouterLink :to="`/post/${post.slug}`" class="post-card__title">{{ post.title }}</RouterLink>
      <p class="post-card__excerpt">{{ post.excerpt }}</p>

      <div class="post-card__foot">
        <span class="post-card__cat">{{ post.category }}</span>
        <div class="post-card__tags">
          <span v-for="tag in tags" :key="tag" class="post-card__tag">#{{ tag }}</span>
          <span v-if="post.tags.length > 2" class="post-card__tag">+{{ post.tags.length - 2 }}</span>
        </div>
        <span class="post-card__date-m">{{ formatDate(post.date) }}</span>
        <RouterLink :to="`/post/${post.slug}`" class="post-card__go" :aria-label="`阅读 ${post.title}`">
          <ArrowUpRight :size="16" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.post-card { position: relative; display: flex; flex-direction: column; overflow: hidden; isolation: isolate; }
.post-card::before {
  content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--accent-rgb), .13), transparent 68%);
  transition: opacity .4s ease;
}
.post-card:hover::before { opacity: 1; }

.post-card__cover { position: relative; display: block; height: 96px; overflow: hidden; }
.post-card__cover-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px); background-size: 22px 22px; mask-image: linear-gradient(135deg, #000, transparent 75%); }
.post-card__cover-ring { position: absolute; width: 140px; height: 140px; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; top: -70px; right: -40px; transition: transform .8s var(--ease); }
.post-card:hover .post-card__cover-ring { transform: scale(1.18) rotate(18deg); }
.post-card__emoji { position: absolute; inset: 0; display: grid; place-items: center; font-size: 36px; filter: drop-shadow(0 6px 12px rgba(0,0,0,.2)); animation: float-y 5s ease-in-out infinite; transition: transform .5s var(--ease); }
.post-card:hover .post-card__emoji { transform: scale(1.1) rotate(-6deg); }
.post-card__date, .post-card__pin { position: absolute; bottom: 8px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; background: rgba(10, 14, 30, .34); backdrop-filter: blur(10px); color: #fff; font-size: 10px; font-weight: 650; border: 1px solid rgba(255,255,255,.2); }
.post-card__date { left: 9px; }
.post-card__pin { right: 9px; }
.post-card__bookmark { position: absolute; z-index: 3; top: 8px; right: 8px; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; border: 1px solid rgba(255,255,255,.28); background: rgba(10,14,30,.3); backdrop-filter: blur(8px); color: #fff; opacity: 0; transform: translateY(-4px); transition: all .3s var(--ease); }
.post-card:hover .post-card__bookmark, .post-card__bookmark.is-saved { opacity: 1; transform: none; }
.post-card__bookmark.is-saved { background: rgba(255,255,255,.92); color: #4338ca; border-color: transparent; }
.post-card__bookmark:hover { transform: scale(1.1); }

.post-card__body { display: flex; flex-direction: column; flex: 1; padding: 12px 14px 10px; }
.post-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.post-card__meta .chip { padding: 3px 9px; font-size: 10.5px; }
.post-card__read { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--text-muted); white-space: nowrap; }
.post-card__title { font-size: 14.5px; font-weight: 730; line-height: 1.38; color: var(--text); letter-spacing: -.02em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.76em; transition: color .25s ease; }
.post-card__title:hover { color: var(--accent); }
.post-card__excerpt { flex: 1; margin: 6px 0 10px; font-size: 12px; line-height: 1.65; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-card__foot { display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
.post-card__cat { display: none; font-size: 11px; font-weight: 650; color: var(--accent); white-space: nowrap; }
.post-card__cat::after { content: " ·"; color: var(--text-muted); font-weight: 400; }
.post-card__date-m { display: none; font-size: 10.5px; color: var(--text-muted); white-space: nowrap; }
.post-card__tags { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; overflow: hidden; }
.post-card__tag { font-size: 10.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
.post-card__go { width: 26px; height: 26px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--border); color: var(--accent); transition: all .35s var(--ease); }
.post-card:hover .post-card__go { background: var(--accent); border-color: transparent; color: #fff; transform: rotate(45deg); }

@media (hover: none) {
  .post-card__bookmark { opacity: 1; transform: none; }
  .post-card:hover .post-card__go { transform: none; }
}
@media (max-width: 700px) {
  /* Full-bleed list row (shell in main.css): rounded thumbnail on the left,
     one clean text column, inset hairline between rows. */
  .post-card { flex-direction: row; align-items: center; }
  .post-card::before { display: none; }
  .post-card::after {
    content: ""; position: absolute; left: 152px; right: 0; bottom: 0; height: 1px;
    background: var(--border); pointer-events: none;
  }

  .post-card__cover {
    width: 124px; height: 94px; flex: none;
    margin: 10px 0 10px 14px; border-radius: 15px;
    filter: saturate(.75) brightness(1.02);
  }
  .post-card__cover-grid { background-size: 18px 18px; opacity: .5; }
  .post-card__cover-ring { display: none; }
  .post-card__emoji { font-size: 30px; animation: none; filter: drop-shadow(0 4px 8px rgba(0,0,0,.16)); }
  .post-card__date { display: none; }
  .post-card__pin { right: 8px; bottom: 7px; padding: 3px 7px; font-size: 9px; backdrop-filter: none; }
  .post-card__bookmark { top: 16px; left: 20px; right: auto; width: 26px; height: 26px; backdrop-filter: none; background: rgba(10,14,30,.55); }

  .post-card__body { padding: 10px 14px 10px 14px; }
  .post-card__meta { display: none; }
  .post-card__title { font-size: 15px; line-height: 1.42; min-height: 0; margin-top: 1px; }
  .post-card__excerpt { display: none; }
  .post-card__foot { margin-top: 8px; padding-top: 0; border-top: 0; }
  .post-card__cat, .post-card__date-m { display: inline; }
  .post-card__date-m { margin-left: auto; }
  .post-card__tags { flex: 1; gap: 7px; flex-wrap: nowrap; overflow: hidden; }
  .post-card__tags .post-card__tag:nth-child(n+2) { display: none; }
  .post-card__go { display: none; }
}
@media (max-width: 380px) {
  .post-card__cover { width: 112px; height: 88px; margin-left: 12px; }
  .post-card__body { padding-left: 12px; }
  .post-card::after { left: 136px; }
}
</style>
