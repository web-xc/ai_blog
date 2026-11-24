<script setup lang="ts">
import { computed } from 'vue'
import { Clock, ArrowUpRight, Pin, CalendarDays } from '@lucide/vue'
import { formatDate, gradientFor, type Post } from '@/lib/posts'

const props = withDefaults(defineProps<{ post: Post; featured?: boolean; delay?: number }>(), {
  featured: false,
  delay: 0,
})

const gradient = computed(() => gradientFor(props.post.slug))
const tags = computed(() => props.post.tags.slice(0, 3))

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}
</script>

<template>
  <article
    v-reveal="delay"
    class="post-card glass card-hover"
    :class="{ 'post-card--featured': featured }"
    @mousemove="onMove"
  >
    <RouterLink :to="`/post/${post.slug}`" class="post-card__cover" :style="{ background: gradient }">
      <span class="post-card__cover-grid" />
      <span class="post-card__cover-ring" />
      <span class="post-card__cover-ring post-card__cover-ring--2" />
      <span class="post-card__emoji">{{ post.cover }}</span>
      <span v-if="post.pinned" class="post-card__pin"><Pin :size="12" /> 置顶</span>
      <span class="post-card__date"><CalendarDays :size="12" /> {{ formatDate(post.date) }}</span>
    </RouterLink>

    <div class="post-card__body">
      <div class="post-card__meta">
        <span class="chip chip-accent">{{ post.category }}</span>
        <span class="post-card__read"><Clock :size="12" /> {{ post.readingTime }} 分钟阅读</span>
      </div>

      <RouterLink :to="`/post/${post.slug}`" class="post-card__title">{{ post.title }}</RouterLink>
      <p class="post-card__excerpt">{{ post.excerpt }}</p>

      <div class="post-card__foot">
        <div class="post-card__tags">
          <RouterLink v-for="tag in tags" :key="tag" :to="`/tag/${encodeURIComponent(tag)}`" class="post-card__tag">#{{ tag }}</RouterLink>
          <span v-if="post.tags.length > 3" class="post-card__tag">+{{ post.tags.length - 3 }}</span>
        </div>
        <RouterLink :to="`/post/${post.slug}`" class="post-card__go" :aria-label="`阅读 ${post.title}`">
          <ArrowUpRight :size="18" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.post-card { position: relative; display: flex; flex-direction: column; overflow: hidden; isolation: isolate; }
.post-card::before {
  content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0;
  background: radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--accent-rgb), .13), transparent 68%);
  transition: opacity .4s ease;
}
.post-card:hover::before { opacity: 1; }

.post-card__cover { position: relative; display: block; height: 178px; overflow: hidden; }
.post-card__cover-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px); background-size: 26px 26px; mask-image: linear-gradient(135deg, #000, transparent 75%); }
.post-card__cover-ring { position: absolute; width: 190px; height: 190px; border: 1px solid rgba(255,255,255,.34); border-radius: 50%; top: -70px; right: -50px; transition: transform .8s var(--ease); }
.post-card__cover-ring--2 { width: 130px; height: 130px; top: auto; bottom: -60px; right: 40px; border-color: rgba(255,255,255,.22); }
.post-card:hover .post-card__cover-ring { transform: scale(1.18) rotate(18deg); }
.post-card__emoji { position: absolute; inset: 0; display: grid; place-items: center; font-size: 62px; filter: drop-shadow(0 10px 18px rgba(0,0,0,.22)); animation: float-y 5s ease-in-out infinite; transition: transform .5s var(--ease); }
.post-card:hover .post-card__emoji { transform: scale(1.12) rotate(-8deg); }
.post-card__date, .post-card__pin { position: absolute; bottom: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(10, 14, 30, .32); backdrop-filter: blur(10px); color: #fff; font-size: 11px; font-weight: 650; border: 1px solid rgba(255,255,255,.22); }
.post-card__date { left: 14px; }
.post-card__pin { right: 14px; }

.post-card__body { display: flex; flex-direction: column; flex: 1; padding: 20px 22px 18px; }
.post-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.post-card__read { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-muted); }
.post-card__title { font-size: 19px; font-weight: 730; line-height: 1.4; color: var(--text); letter-spacing: -.02em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .25s ease; }
.post-card__title:hover { color: var(--accent); }
.post-card__excerpt { flex: 1; margin: 10px 0 18px; font-size: 13.5px; line-height: 1.8; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-card__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border); }
.post-card__tags { display: flex; flex-wrap: wrap; gap: 10px; min-width: 0; }
.post-card__tag { font-size: 12px; font-weight: 600; color: var(--text-muted); transition: color .25s ease; }
a.post-card__tag:hover { color: var(--accent); }
.post-card__go { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--border); color: var(--accent); transition: all .35s var(--ease); }
.post-card:hover .post-card__go { background: var(--accent); border-color: transparent; color: #fff; transform: rotate(45deg); }

/* featured (first post on home) */
.post-card--featured { flex-direction: row; }
.post-card--featured .post-card__cover { width: 44%; height: auto; min-height: 280px; flex: none; }
.post-card--featured .post-card__emoji { font-size: 84px; }
.post-card--featured .post-card__body { padding: 30px 32px; }
.post-card--featured .post-card__title { font-size: 27px; -webkit-line-clamp: 2; }
.post-card--featured .post-card__excerpt { -webkit-line-clamp: 4; font-size: 14px; }
@media (max-width: 760px) {
  .post-card--featured { flex-direction: column; }
  .post-card--featured .post-card__cover { width: 100%; min-height: 190px; }
  .post-card--featured .post-card__body { padding: 20px 22px 18px; }
  .post-card--featured .post-card__title { font-size: 21px; }
  .post-card--featured .post-card__emoji { font-size: 62px; }
}
</style>
