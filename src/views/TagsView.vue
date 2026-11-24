<script setup lang="ts">
import { computed, ref } from 'vue'
import { Tags, Hash, ArrowUpRight, Folder, Search } from '@lucide/vue'
import { getTags, getCategories, getPosts } from '@/lib/posts'

const tags = getTags()
const categories = getCategories()
const posts = getPosts()
const filter = ref('')
const visibleTags = computed(() => tags.filter((t) => t.name.toLowerCase().includes(filter.value.trim().toLowerCase())))
const maxCount = Math.max(1, ...tags.map((t) => t.count))
</script>

<template>
  <div class="container tags-page">
    <header v-reveal class="page-hero">
      <span class="section-kicker">Tags & Categories</span>
      <h1 class="page-hero__title">标签<span class="gradient-text">星图</span></h1>
      <p class="page-hero__sub">{{ tags.length }} 个标签、{{ categories.length }} 个分类，串起 {{ posts.length }} 篇文章之间的隐秘关联。</p>
      <div class="tag-search glass">
        <Search :size="17" />
        <input v-model="filter" placeholder="筛选标签…" />
        <span>{{ visibleTags.length }} / {{ tags.length }}</span>
      </div>
    </header>

    <section class="section tag-section">
      <div class="tag-grid">
        <RouterLink
          v-for="(tag, i) in visibleTags"
          :key="tag.name"
          v-reveal="Math.min(i * 55, 500)"
          :to="`/tag/${encodeURIComponent(tag.name)}`"
          class="tag-card glass card-hover"
        >
          <span class="tag-card__glow" />
          <span class="tag-card__hash"><Hash :size="22" /></span>
          <span class="tag-card__name">{{ tag.name }}</span>
          <span class="tag-card__count"><strong>{{ tag.count }}</strong> 篇文章</span>
          <span class="tag-card__bar"><i :style="{ width: `${(tag.count / maxCount) * 100}%` }" /></span>
          <ArrowUpRight :size="17" class="tag-card__arrow" />
        </RouterLink>
      </div>
      <div v-if="!visibleTags.length" class="empty-state glass">
        <div class="empty-state__icon"><Tags :size="26" /></div>
        <h3>没有匹配的标签</h3>
        <p>试试更简短的关键词。</p>
      </div>
    </section>

    <section v-reveal class="section category-section">
      <div class="section-head">
        <div>
          <span class="section-kicker">Categories</span>
          <h2 class="section-title">文章<span class="gradient-text">分类</span></h2>
        </div>
      </div>
      <div class="category-grid">
        <RouterLink v-for="(c, i) in categories" :key="c.name" v-reveal="i * 70" to="/archive" class="category-card glass card-hover">
          <span class="category-card__icon"><Folder :size="20" /></span>
          <span class="category-card__body"><strong>{{ c.name }}</strong><small>{{ c.count }} 篇文章</small></span>
          <span class="category-card__num">0{{ i + 1 }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-hero { padding: 76px 0 30px; text-align: center; }
.page-hero__title { font-size: clamp(36px, 5vw, 58px); font-weight: 820; letter-spacing: -.05em; margin: 14px 0; }
.page-hero__sub { font-size: 15px; color: var(--text-muted); margin: 0 auto; max-width: 620px; line-height: 1.8; }
.tag-search { display: inline-flex; align-items: center; gap: 10px; margin-top: 32px; padding: 10px 18px; min-width: min(380px, 100%); border-radius: 999px; }
.tag-search svg { color: var(--accent); flex: none; }
.tag-search input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 14px; }
.tag-search span { font: 600 11px var(--font-mono); color: var(--text-muted); }
.tag-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.tag-card { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 24px; min-height: 168px; overflow: hidden; }
.tag-card__glow { position: absolute; width: 150px; height: 150px; right: -60px; top: -70px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .35), transparent 68%); opacity: .5; transition: opacity .4s ease, transform .6s var(--ease); }
.tag-card:hover .tag-card__glow { opacity: 1; transform: scale(1.4); }
.tag-card__hash { color: var(--accent); }
.tag-card__name { font-size: 19px; font-weight: 730; letter-spacing: -.02em; margin-top: 4px; }
.tag-card__count { font-size: 12px; color: var(--text-muted); }
.tag-card__count strong { color: var(--accent); font-size: 15px; }
.tag-card__bar { height: 4px; border-radius: 99px; background: var(--border); margin-top: auto; overflow: hidden; }
.tag-card__bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); transition: width .8s var(--ease); }
.tag-card__arrow { position: absolute; top: 22px; right: 22px; color: var(--text-muted); transition: transform .35s var(--ease), color .3s ease; }
.tag-card:hover .tag-card__arrow { color: var(--accent); transform: translate(4px, -4px); }
.category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.category-card { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
.category-card__icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 13px; background: rgba(var(--accent-rgb), .1); color: var(--accent); flex: none; }
.category-card__body { display: flex; flex-direction: column; gap: 3px; }
.category-card__body strong { font-size: 15px; }
.category-card__body small { font-size: 12px; color: var(--text-muted); }
.category-card__num { margin-left: auto; font: 700 20px var(--font-mono); color: var(--border-strong); }
.empty-state { border-radius: var(--radius); }
.empty-state h3 { margin: 0; font-size: 17px; }
@media (max-width: 980px) { .tag-grid { grid-template-columns: repeat(3, 1fr); } .category-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .page-hero { padding-top: 50px; } .tag-grid { grid-template-columns: repeat(2, 1fr); } .category-grid { grid-template-columns: 1fr; } }
@media (max-width: 420px) { .tag-grid { grid-template-columns: 1fr; } }
</style>
