<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Hash, FileText, Tags } from '@lucide/vue'
import { getPosts, getTags, formatDate } from '@/lib/posts'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const name = computed(() => String(route.params.name || ''))
const posts = computed(() => getPosts().filter((p) => p.tags.includes(name.value)))
const siblings = computed(() => getTags().filter((t) => t.name !== name.value).slice(0, 8))
</script>

<template>
  <div class="container tag-page">
    <header v-reveal class="tag-hero glass">
      <span class="tag-hero__hash"><Hash :size="34" /></span>
      <div>
        <span class="section-kicker">Tagged Posts</span>
        <h1 class="tag-hero__title">{{ name }}</h1>
        <p>共 <strong>{{ posts.length }}</strong> 篇文章带有这个标签</p>
      </div>
      <RouterLink to="/tags" class="btn btn-ghost btn-sm"><ArrowLeft :size="14" /> 全部标签</RouterLink>
    </header>

    <section class="section">
      <div v-if="posts.length" class="tag-posts">
        <PostCard v-for="(p, i) in posts" :key="p.slug" :post="p" :delay="i * 90" />
      </div>
      <div v-else class="empty-state glass">
        <div class="empty-state__icon"><FileText :size="26" /></div>
        <h3>该标签下暂无文章</h3>
        <p>也许可以成为第一篇。</p>
        <RouterLink to="/tags" class="btn btn-ghost btn-sm"><Tags :size="14" /> 浏览其他标签</RouterLink>
      </div>
    </section>

    <section v-reveal class="section sibling-section">
      <h2 class="section-title" style="font-size: 22px">其他标签</h2>
      <div class="sibling-tags">
        <RouterLink v-for="t in siblings" :key="t.name" :to="`/tag/${encodeURIComponent(t.name)}`" class="chip">
          #{{ t.name }} <sup>{{ t.count }}</sup>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tag-hero { display: flex; align-items: center; gap: 24px; margin-top: 56px; padding: 30px 34px; position: relative; overflow: hidden; }
.tag-hero::after { content: ""; position: absolute; width: 240px; height: 240px; right: -60px; top: -120px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .28), transparent 70%); }
.tag-hero__hash { width: 76px; height: 76px; flex: none; display: grid; place-items: center; border-radius: 22px; color: #fff; background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 12px 30px rgba(var(--accent-rgb), .35); animation: float-y 5s ease-in-out infinite; }
.tag-hero__title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; margin: 6px 0; letter-spacing: -.04em; }
.tag-hero p { margin: 0; font-size: 13.5px; color: var(--text-muted); }
.tag-hero p strong { color: var(--accent); }
.tag-hero .btn { margin-left: auto; position: relative; z-index: 1; }
.tag-posts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }
.sibling-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.sibling-tags sup { font-size: 10px; opacity: .6; }
.empty-state { border-radius: var(--radius); }
.empty-state h3 { margin: 0; font-size: 17px; }
@media (max-width: 700px) { .tag-hero { flex-wrap: wrap; padding: 24px; gap: 16px; } .tag-hero .btn { margin-left: 0; } .tag-posts { grid-template-columns: 1fr; } }
</style>
