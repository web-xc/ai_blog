<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark, Trash2, ArrowRight } from '@lucide/vue'
import { getPost, type Post } from '@/lib/posts'
import { useExtrasStore } from '@/stores/extras'
import { notify } from '@/lib/toast'
import PostCard from '@/components/PostCard.vue'

const extras = useExtrasStore()
const posts = computed<Post[]>(() =>
  extras.bookmarks.map((slug) => getPost(slug)).filter((p): p is Post => p !== undefined),
)

function clearAll() {
  if (!posts.value.length) return
  if (!window.confirm(`确定清空 ${posts.value.length} 篇稍后读吗？`)) return
  extras.bookmarks.forEach((slug) => extras.removeBookmark(slug))
  notify('稍后读已清空', 'info')
}
function remove(slug: string) {
  extras.removeBookmark(slug)
  notify('已移除', 'info')
}
</script>

<template>
  <div class="container bookmarks-page">
    <header v-reveal class="page-hero">
      <span class="section-kicker">Read Later</span>
      <h1 class="section-title">稍后<span class="gradient-text">再读</span></h1>
      <p class="page-hero__sub">收藏的文章保存在这台设备{{ extras.bookmarks.length ? `，共 ${extras.bookmarks.length} 篇` : '' }}。</p>
      <button v-if="posts.length" class="btn btn-ghost btn-sm" @click="clearAll"><Trash2 :size="14" /> 清空全部</button>
    </header>

    <div v-if="posts.length" class="bookmark-grid">
      <div v-for="(post, i) in posts" :key="post.slug" class="bookmark-item">
        <PostCard :post="post" :delay="Math.min(i * 60, 360)" />
        <button class="bookmark-remove" :aria-label="`移除 ${post.title}`" @click="remove(post.slug)"><Trash2 :size="13" /> 移除</button>
      </div>
    </div>

    <div v-else v-reveal class="empty-state glass">
      <div class="empty-state__icon"><Bookmark :size="26" /></div>
      <h2>清单还是空的</h2>
      <p>在文章卡片右上角点书签，或读文章时点「稍后读」，就能收进这里。</p>
      <RouterLink to="/archive" class="btn btn-primary btn-sm">去逛逛文章 <ArrowRight :size="14" /></RouterLink>
    </div>
  </div>
</template>

<style scoped>
.bookmarks-page { padding-top: 48px; padding-bottom: 80px; }
.page-hero { text-align: center; margin-bottom: 36px; }
.page-hero__sub { margin: 14px 0 18px; font-size: 14px; color: var(--text-muted); }
.bookmark-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.bookmark-item { position: relative; }
.bookmark-remove { position: absolute; z-index: 4; bottom: 10px; right: 48px; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-muted); font-size: 10.5px; opacity: 0; transition: all .25s ease; }
.bookmark-item:hover .bookmark-remove { opacity: 1; }
.bookmark-remove:hover { color: var(--danger); border-color: rgba(239,68,68,.4); }
@media (max-width: 1100px) { .bookmark-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) {
  .bookmarks-page { padding-top: 30px; }
  .bookmark-grid { grid-template-columns: 1fr; gap: 12px; }
  .bookmark-remove { opacity: 1; }
}
</style>
