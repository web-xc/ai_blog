<script setup lang="ts">
import { computed, ref } from 'vue'
import { Archive, Search, CalendarDays, ArrowUpRight, Hash, FileText } from '@lucide/vue'
import { getArchives, getPosts, getTags, formatDate } from '@/lib/posts'
import AnimatedNumber from '@/components/AnimatedNumber.vue'

const keyword = ref('')
const archives = getArchives()
const posts = getPosts()
const tags = getTags()

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return archives
    .map((g) => ({
      ...g,
      posts: q
        ? g.posts.filter((p) => `${p.title} ${p.category} ${p.tags.join(' ')} ${p.excerpt}`.toLowerCase().includes(q))
        : g.posts,
    }))
    .filter((g) => g.posts.length)
})
const resultCount = computed(() => filtered.value.reduce((s, g) => s + g.posts.length, 0))
const totalWords = computed(() => Math.round(posts.reduce((s, p) => s + p.wordCount, 0) / 1000))
</script>

<template>
  <div class="container archive-page">
    <header v-reveal class="page-hero">
      <span class="section-kicker">Archive</span>
      <h1 class="page-hero__title">时光<span class="gradient-text">归档</span></h1>
      <p class="page-hero__sub">所有写下的文字，按时间排成一条可以回望的路。</p>
      <div class="page-hero__stats">
        <div><strong><AnimatedNumber :value="posts.length" /></strong><span>篇文章</span></div>
        <div><strong><AnimatedNumber :value="archives.length" /></strong><span>个年份</span></div>
        <div><strong><AnimatedNumber :value="tags.length" /></strong><span>个标签</span></div>
        <div><strong><AnimatedNumber :value="totalWords" suffix="k" /></strong><span>字记录</span></div>
      </div>
    </header>

    <div v-reveal class="archive-filter glass">
      <Search :size="18" />
      <input v-model="keyword" class="archive-filter__input" placeholder="在归档中筛选文章标题、分类、标签…" />
      <span class="archive-filter__count">{{ resultCount }} 篇</span>
    </div>

    <div v-if="filtered.length" class="timeline">
      <section v-for="(group, gi) in filtered" :key="group.year" v-reveal="gi * 90" class="timeline__group">
        <div class="timeline__year">
          <span class="timeline__year-num">{{ group.year }}</span>
          <span class="timeline__year-count">{{ group.posts.length }} 篇</span>
        </div>
        <div class="timeline__items">
          <RouterLink
            v-for="(p, i) in group.posts"
            :key="p.slug"
            v-reveal="i * 55"
            :to="`/post/${p.slug}`"
            class="timeline__item glass"
          >
            <span class="timeline__dot" />
            <span class="timeline__date"><CalendarDays :size="13" /> {{ formatDate(p.date) }}</span>
            <span class="timeline__content">
              <strong>{{ p.title }}</strong>
              <span class="timeline__tags"><em>{{ p.category }}</em><span v-for="t in p.tags.slice(0, 3)" :key="t">#{{ t }}</span></span>
            </span>
            <ArrowUpRight :size="17" class="timeline__arrow" />
          </RouterLink>
        </div>
      </section>
    </div>

    <div v-else class="empty-state glass">
      <div class="empty-state__icon"><FileText :size="26" /></div>
      <h3>没有找到匹配的文章</h3>
      <p>换个关键词试试，或浏览全部标签。</p>
      <RouterLink to="/tags" class="btn btn-ghost btn-sm"><Hash :size="14" /> 查看标签</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page-hero { padding: 76px 0 40px; text-align: center; }
.page-hero__title { font-size: clamp(36px, 5vw, 58px); font-weight: 820; letter-spacing: -.05em; margin: 14px 0; }
.page-hero__sub { font-size: 15px; color: var(--text-muted); margin: 0; }
.page-hero__stats { display: flex; justify-content: center; gap: 46px; flex-wrap: wrap; margin-top: 38px; }
.page-hero__stats > div { display: flex; flex-direction: column; gap: 4px; }
.page-hero__stats strong { font-size: 26px; font-weight: 780; letter-spacing: -.04em; }
.page-hero__stats span { font-size: 12px; color: var(--text-muted); }
.archive-filter { display: flex; align-items: center; gap: 12px; padding: 12px 20px; margin-bottom: 46px; }
.archive-filter > svg { color: var(--accent); flex: none; }
.archive-filter__input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 14px; padding: 6px 0; }
.archive-filter__input::placeholder { color: var(--text-muted); }
.archive-filter__count { font: 600 12px var(--font-mono); color: var(--accent); flex: none; }
.timeline { position: relative; padding-left: 8px; }
.timeline__group { display: grid; grid-template-columns: 130px 1fr; gap: 26px; margin-bottom: 34px; }
.timeline__year { display: flex; flex-direction: column; gap: 6px; padding-top: 18px; }
.timeline__year-num { font-size: 38px; font-weight: 800; letter-spacing: -.05em; background: linear-gradient(120deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.timeline__year-count { font-size: 12px; color: var(--text-muted); }
.timeline__items { position: relative; display: flex; flex-direction: column; gap: 12px; padding-left: 26px; border-left: 2px solid var(--border); }
.timeline__item { position: relative; display: flex; align-items: center; gap: 18px; padding: 16px 20px; border-radius: var(--radius-sm); transition: all .38s var(--ease); }
.timeline__item:hover { transform: translateX(6px); box-shadow: var(--shadow); border-color: rgba(var(--accent-rgb), .35); }
.timeline__dot { position: absolute; left: -33px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: var(--surface-solid); border: 2px solid var(--accent); box-shadow: 0 0 0 4px var(--bg); transition: all .3s ease; }
.timeline__item:hover .timeline__dot { background: var(--accent); box-shadow: 0 0 0 5px rgba(var(--accent-rgb), .2); }
.timeline__date { display: inline-flex; align-items: center; gap: 6px; font: 600 11.5px var(--font-mono); color: var(--text-muted); flex: none; width: 108px; }
.timeline__date svg { color: var(--accent); }
.timeline__content { display: flex; flex-direction: column; gap: 7px; min-width: 0; flex: 1; }
.timeline__content strong { font-size: 15px; font-weight: 680; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline__item:hover .timeline__content strong { color: var(--accent); }
.timeline__tags { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11.5px; color: var(--text-muted); }
.timeline__tags em { font-style: normal; color: var(--accent); font-weight: 650; }
.timeline__arrow { color: var(--text-muted); flex: none; transition: transform .3s var(--ease), color .3s ease; }
.timeline__item:hover .timeline__arrow { color: var(--accent); transform: translate(3px, -3px); }
.empty-state { border-radius: var(--radius); margin-bottom: 60px; }
.empty-state h3 { margin: 0; font-size: 17px; }
.empty-state p { margin: 0; font-size: 13.5px; }
@media (max-width: 700px) {
  .page-hero { padding-top: 50px; }
  .page-hero__stats { gap: 24px; }
  .timeline__group { grid-template-columns: 1fr; gap: 8px; }
  .timeline__year { flex-direction: row; align-items: baseline; gap: 12px; padding-top: 0; }
  .timeline__year-num { font-size: 30px; }
  .timeline__date { width: auto; }
  .timeline__item { flex-wrap: wrap; gap: 8px; }
  .timeline__content { flex-basis: 100%; }
}
</style>
