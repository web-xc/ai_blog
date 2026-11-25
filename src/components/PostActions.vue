<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Heart, Bookmark, BookmarkCheck, Share2, Type, Eye, List, X, ChevronRight } from '@lucide/vue'
import { useExtrasStore } from '@/stores/extras'
import { useAdminStore } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import { notify } from '@/lib/toast'
import type { TocItem } from '@/lib/posts'

const props = defineProps<{
  slug: string
  title: string
  toc?: TocItem[]
  activeId?: string
}>()
const emit = defineEmits<{ (e: 'share'): void; (e: 'scroll-to', id: string): void }>()

const extras = useExtrasStore()
const admin = useAdminStore()
const site = useSiteStore()
const tocOpen = ref(false)

const liked = computed(() => extras.liked(props.slug))
const saved = computed(() => extras.isBookmarked(props.slug))
const likeCount = computed(() => extras.likeCount(props.slug))
const views = computed(() => admin.cloudStats?.views?.[props.slug] ?? 0)
const fontLabel = computed(() => ({ small: '小', normal: '中', large: '大' })[extras.reading.fontSize])

function toggleLike() {
  const next = extras.toggleLike(props.slug)
  notify(next ? '谢谢喜欢 ✦' : '已取消喜欢', 'info')
}
function toggleBookmark() {
  const next = extras.toggleBookmark(props.slug)
  notify(next ? '已加入稍后读' : '已从稍后读移除', 'info')
}
function cycleFont() {
  const order = ['small', 'normal', 'large'] as const
  const i = order.indexOf(extras.reading.fontSize)
  extras.setFontSize(order[(i + 1) % order.length])
}
function openToc(id: string) {
  emit('scroll-to', id)
  tocOpen.value = false
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') tocOpen.value = false }

watch(tocOpen, (open) => { document.body.style.overflow = open ? 'hidden' : '' })
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="post-actions">
    <div class="post-actions__bar glass">
      <button class="action-btn" :class="{ 'is-active': liked }" :aria-pressed="liked" @click="toggleLike">
        <Heart :size="16" :fill="liked ? 'currentColor' : 'none'" />
        <span>{{ liked ? '已喜欢' : '喜欢' }}</span>
        <em v-if="likeCount">{{ likeCount }}</em>
      </button>
      <button v-if="site.config.enableBookmarks" class="action-btn" :class="{ 'is-active': saved }" :aria-pressed="saved" @click="toggleBookmark">
        <BookmarkCheck v-if="saved" :size="16" /><Bookmark v-else :size="16" />
        <span>{{ saved ? '已收藏' : '稍后读' }}</span>
      </button>
      <button class="action-btn" @click="emit('share')"><Share2 :size="16" /><span>分享</span></button>
      <div class="post-actions__spacer" />
      <span v-if="views" class="action-meta"><Eye :size="14" /> {{ views }} 次阅读</span>
      <button class="action-btn action-btn--font" title="正文字号" @click="cycleFont"><Type :size="16" /><em>{{ fontLabel }}</em></button>
      <button v-if="toc?.length" class="action-btn action-btn--toc mobile-only" @click="tocOpen = true"><List :size="16" /><span>目录</span></button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="toc-mask"><div v-if="tocOpen" class="toc-mask" @click="tocOpen = false" /></Transition>
    <Transition name="toc-sheet">
      <div v-if="tocOpen" class="toc-sheet" role="dialog" aria-modal="true" aria-label="本文目录">
        <div class="toc-sheet__handle" />
        <div class="toc-sheet__head">
          <strong>本文目录</strong>
          <button aria-label="关闭目录" @click="tocOpen = false"><X :size="18" /></button>
        </div>
        <nav class="toc-sheet__nav">
          <button
            v-for="item in toc"
            :key="item.id"
            class="toc-sheet__item"
            :class="{ 'is-active': activeId === item.id }"
            :style="{ paddingLeft: `${14 + (item.level - 1) * 14}px` }"
            @click="openToc(item.id)"
          >
            <span>{{ item.text }}</span><ChevronRight :size="14" />
          </button>
        </nav>
        <div class="toc-sheet__safe" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.post-actions { margin: 26px 0 18px; }
.post-actions__bar { display: flex; align-items: center; gap: 6px; padding: 8px 10px; flex-wrap: wrap; }
.post-actions__spacer { flex: 1; }
.action-btn { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 7px 12px; border: 1px solid transparent; border-radius: 11px; background: transparent; color: var(--text-soft); font-size: 12.5px; font-weight: 600; transition: all .28s var(--ease); }
.action-btn:hover { color: var(--accent); background: rgba(var(--accent-rgb), .08); }
.action-btn.is-active { color: var(--accent); background: rgba(var(--accent-rgb), .1); }
.action-btn em { font-style: normal; font: 650 11px var(--font-mono); color: var(--text-muted); }
.action-btn.is-active em { color: var(--accent); }
.action-meta { display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }
.action-btn--toc { border-color: rgba(var(--accent-rgb), .3); color: var(--accent); }

.toc-mask { position: fixed; inset: 0; z-index: 130; background: rgba(8, 11, 22, .44); backdrop-filter: blur(3px); }
.toc-sheet { position: fixed; z-index: 131; left: 0; right: 0; bottom: 0; max-height: 74vh; display: flex; flex-direction: column; background: var(--surface-solid); border-radius: 22px 22px 0 0; box-shadow: 0 -20px 60px rgba(10,14,30,.22); padding-bottom: env(safe-area-inset-bottom, 0px); }
.toc-sheet__handle { width: 38px; height: 4px; border-radius: 99px; background: var(--border-strong); margin: 10px auto 4px; }
.toc-sheet__head { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
.toc-sheet__head button { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 9px; background: var(--bg-2); color: var(--text-muted); }
.toc-sheet__nav { flex: 1; overflow-y: auto; padding: 8px 0 14px; }
.toc-sheet__item { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 44px; padding-right: 18px; border: 0; background: transparent; color: var(--text-soft); font-size: 13px; text-align: left; }
.toc-sheet__item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toc-sheet__item svg { flex: none; color: var(--text-muted); }
.toc-sheet__item.is-active { color: var(--accent); background: rgba(var(--accent-rgb), .07); }
.toc-sheet__safe { height: 10px; }
.toc-mask-enter-active, .toc-mask-leave-active { transition: opacity .3s ease; }
.toc-mask-enter-from, .toc-mask-leave-to { opacity: 0; }
.toc-sheet-enter-active, .toc-sheet-leave-active { transition: transform .38s var(--ease); }
.toc-sheet-enter-from, .toc-sheet-leave-to { transform: translateY(100%); }

@media (max-width: 560px) {
  .action-btn span { display: none; }
  .action-btn--font em { display: inline; }
  .action-btn { padding: 7px 10px; }
  .action-meta { font-size: 11px; }
}
</style>
