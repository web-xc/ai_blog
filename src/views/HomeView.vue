<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowRight, Sparkles, PenLine, BookOpen, Hash, Folder, ChevronLeft, ChevronRight, Feather, Code2, Zap } from '@lucide/vue'
import { getPosts, getTags, getCategories } from '@/lib/posts'
import { useSiteStore } from '@/stores/site'
import PostCard from '@/components/PostCard.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import BrandGithub from '@/components/BrandGithub.vue'
import { useRoute } from 'vue-router'

const site = useSiteStore()
const route = useRoute()
const posts = getPosts()
const tags = getTags()
const categories = getCategories()

const perPage = computed(() => site.config.postsPerPage || 6)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const totalPages = computed(() => Math.max(1, Math.ceil(posts.length / perPage.value)))
const pagePosts = computed(() => posts.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const totalWords = computed(() => Math.max(1, Math.round(posts.reduce((s, p) => s + p.wordCount, 0) / 1000)))

const phrases = ['用 Vue 3 构建体验。', '把灵感沉淀成文字。', '保持好奇，持续创造。', '在代码之外看见生活。']
const typed = ref('')
let timer = 0
function typeLoop() {
  let phraseIndex = 0
  let charIndex = 0
  let deleting = false
  const step = () => {
    const phrase = phrases[phraseIndex]
    charIndex += deleting ? -1 : 1
    typed.value = phrase.slice(0, charIndex)
    let delay = deleting ? 55 : 105
    if (!deleting && charIndex === phrase.length) { deleting = true; delay = 1900 }
    else if (deleting && charIndex === 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 400 }
    timer = window.setTimeout(step, delay)
  }
  step()
}
onMounted(typeLoop)
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="home">
    <!-- ============ HERO ============ -->
    <section class="hero container">
      <div class="hero__content">
        <div v-reveal class="hero__badge">
          <span class="hero__badge-dot" />
          <Sparkles :size="13" /> 一个持续更新的数字花园
        </div>

        <h1 v-reveal="80" class="hero__title">
          记录<span class="gradient-text">思考</span>，<br />
          分享<span class="gradient-text">创造</span>的光
        </h1>

        <p v-reveal="160" class="hero__sub">
          {{ site.config.subtitle }}<br />
          <span class="hero__typed">{{ typed }}<span class="caret" /></span>
        </p>

        <div v-reveal="240" class="hero__actions">
          <RouterLink to="/archive" class="btn btn-primary">
            <BookOpen :size="16" /> 开始阅读 <ArrowRight :size="15" />
          </RouterLink>
          <RouterLink to="/about" class="btn btn-ghost"><Feather :size="16" /> 关于我</RouterLink>
        </div>

        <div v-reveal="320" class="hero__stats">
          <div class="hero__stat">
            <strong><AnimatedNumber :value="posts.length" /></strong>
            <span>篇文章</span>
          </div>
          <div class="hero__stat">
            <strong><AnimatedNumber :value="tags.length" /></strong>
            <span>个标签</span>
          </div>
          <div class="hero__stat">
            <strong><AnimatedNumber :value="totalWords" suffix="k" /></strong>
            <span>字沉淀</span>
          </div>
          <div class="hero__stat">
            <strong><AnimatedNumber :value="categories.length" /></strong>
            <span>个分类</span>
          </div>
        </div>
      </div>

      <div class="hero__visual" aria-hidden="true">
        <div class="orbit orbit--1" />
        <div class="orbit orbit--2" />
        <div class="orbit orbit--3" />
        <div class="orbit__core"><span>✦</span></div>
        <div class="float-chip float-chip--a glass"><Code2 :size="16" /> Vue 3 + Vite</div>
        <div class="float-chip float-chip--b glass"><PenLine :size="16" /> Markdown</div>
        <div class="float-chip float-chip--c glass"><BrandGithub :size="16" /> Auto Deploy</div>
        <div class="float-chip float-chip--d glass"><Zap :size="16" /> Fast &amp; Static</div>
        <div class="orbit__satellite orbit__satellite--1" />
        <div class="orbit__satellite orbit__satellite--2" />
      </div>
    </section>

    <!-- ============ TICKER ============ -->
    <div class="ticker">
      <div class="ticker__track">
        <span v-for="i in 2" :key="i" class="ticker__group">
          <span v-for="item in ['VUE 3', 'TYPESCRIPT', 'MARKDOWN', 'GITHUB ACTIONS', 'TWIKOO', 'MODERN UI', 'STATIC FIRST']" :key="i + item">
            <Sparkles :size="13" /> {{ item }}
          </span>
        </span>
      </div>
    </div>

    <!-- ============ LATEST POSTS ============ -->
    <section class="container section">
      <div v-reveal class="section-head">
        <div>
          <span class="section-kicker">Latest Writings</span>
          <h2 class="section-title">最新<span class="gradient-text">文章</span></h2>
          <p class="section-sub">一些关于技术、设计与日常的碎片记录。</p>
        </div>
        <RouterLink to="/archive" class="btn btn-ghost btn-sm">全部文章 <ArrowRight :size="14" /></RouterLink>
      </div>

      <div class="post-grid">
        <PostCard
          v-for="(post, i) in pagePosts"
          :key="post.slug"
          :post="post"
          :featured="page === 1 && i === 0"
          :delay="Math.min(i * 90, 450)"
        />
      </div>

      <div v-if="totalPages > 1" v-reveal class="pagination">
        <RouterLink
          v-if="page > 1"
          :to="{ path: '/', query: { page: page - 1 } }"
          class="btn btn-ghost btn-sm"
        ><ChevronLeft :size="15" /> 上一页</RouterLink>
        <span v-else class="btn btn-ghost btn-sm disabled"><ChevronLeft :size="15" /> 上一页</span>

        <div class="pagination__pages">
          <RouterLink
            v-for="p in totalPages"
            :key="p"
            :to="{ path: '/', query: p === 1 ? {} : { page: p } }"
            class="pagination__num"
            :class="{ 'is-active': p === page }"
          >{{ p }}</RouterLink>
        </div>

        <RouterLink
          v-if="page < totalPages"
          :to="{ path: '/', query: { page: page + 1 } }"
          class="btn btn-ghost btn-sm"
        >下一页 <ChevronRight :size="15" /></RouterLink>
        <span v-else class="btn btn-ghost btn-sm disabled">下一页 <ChevronRight :size="15" /></span>
      </div>
    </section>

    <!-- ============ TOPICS ============ -->
    <section class="container section topics">
      <div v-reveal class="topics__card glass">
        <div class="topics__main">
          <span class="section-kicker">Explore Topics</span>
          <h2 class="section-title">按<span class="gradient-text">标签</span>探索</h2>
          <p class="section-sub">每一枚标签，都是一条通往相似灵感的线索。</p>
          <div class="topics__cloud">
            <RouterLink
              v-for="tag in tags.slice(0, 14)"
              :key="tag.name"
              :to="`/tag/${encodeURIComponent(tag.name)}`"
              class="topic-tag"
              :style="{ '--tag-scale': `${Math.min(1.35, 0.9 + tag.count * 0.1)}` }"
            >#{{ tag.name }} <sup>{{ tag.count }}</sup></RouterLink>
          </div>
        </div>
        <div class="topics__side">
          <div class="topics__side-title"><Folder :size="15" /> 文章分类</div>
          <RouterLink v-for="c in categories" :key="c.name" to="/archive" class="topics__cat">
            <span><Hash :size="13" /> {{ c.name }}</span>
            <span class="topics__cat-count">{{ c.count }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ============ CTA ============ -->
    <section class="container section">
      <div v-reveal class="cta glass">
        <div class="cta__glow" />
        <div class="cta__content">
          <span class="section-kicker">Write With Us</span>
          <h2 class="section-title">每个想法，都值得被<span class="gradient-text">认真写下</span></h2>
          <p class="section-sub">进入后台，用 Markdown 写下新文章，一次提交即可自动发布上线。</p>
        </div>
        <RouterLink to="/admin/posts" class="btn btn-primary"><PenLine :size="16" /> 进入写作台 <ArrowRight :size="15" /></RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* hero */
.hero { display: grid; grid-template-columns: 1.08fr 0.92fr; align-items: center; gap: 40px; padding: 86px 0 72px; min-height: 600px; }
.hero__badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 15px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-size: 12.5px; font-weight: 600; color: var(--text-soft); box-shadow: var(--shadow-sm); }
.hero__badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(16,185,129,.15); animation: pulse-glow 2s ease-in-out infinite; }
.hero__title { font-size: clamp(40px, 5.4vw, 68px); font-weight: 820; line-height: 1.17; margin: 26px 0 20px; letter-spacing: -0.05em; }
.hero__sub { font-size: 16px; line-height: 2; color: var(--text-soft); margin: 0 0 30px; }
.hero__typed { display: inline-block; min-height: 1.6em; font-weight: 650; color: var(--accent); }
.caret { display: inline-block; width: 2px; height: 1.05em; margin-left: 4px; vertical-align: -3px; background: var(--accent); animation: blink 1s step-end infinite; }
.hero__actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero__stats { display: flex; gap: 34px; margin-top: 52px; padding-top: 26px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.hero__stat { display: flex; flex-direction: column; gap: 4px; }
.hero__stat strong { font-size: 28px; font-weight: 780; letter-spacing: -.04em; color: var(--text); }
.hero__stat span { font-size: 12px; color: var(--text-muted); font-weight: 600; }

/* orbits */
.hero__visual { position: relative; height: 440px; display: grid; place-items: center; }
.orbit { position: absolute; border-radius: 50%; border: 1px solid rgba(var(--accent-rgb), .22); }
.orbit--1 { width: 360px; height: 360px; border-style: dashed; animation: spin 32s linear infinite; }
.orbit--2 { width: 270px; height: 270px; border-color: rgba(168,85,247,.26); animation: spin 24s linear infinite reverse; }
.orbit--3 { width: 180px; height: 180px; border-color: rgba(6,182,212,.3); }
.orbit__core { width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; font-size: 56px; color: #fff; background: linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3)); background-size: 200% 200%; animation: gradient-flow 6s linear infinite, float-y 6s ease-in-out infinite; box-shadow: 0 0 60px rgba(var(--accent-rgb), .5), inset 0 0 30px rgba(255,255,255,.28); }
.orbit__core span { filter: drop-shadow(0 4px 10px rgba(0,0,0,.2)); }
.orbit__satellite { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: var(--accent-3); box-shadow: 0 0 16px var(--accent-3); animation: float-y 4s ease-in-out infinite; }
.orbit__satellite--1 { top: 44px; left: 50%; }
.orbit__satellite--2 { bottom: 70px; right: 16%; background: var(--accent-2); box-shadow: 0 0 16px var(--accent-2); }
.float-chip { position: absolute; display: inline-flex; align-items: center; gap: 8px; padding: 10px 15px; border-radius: 14px; font-size: 12.5px; font-weight: 650; color: var(--text); box-shadow: var(--shadow); }
.float-chip svg { color: var(--accent); }
.float-chip--a { top: 42px; left: 4%; animation: float-y 5s ease-in-out infinite; }
.float-chip--b { top: 130px; right: 0; animation: float-y 6s ease-in-out infinite -1.5s; }
.float-chip--c { bottom: 76px; left: 0; animation: float-y 5.5s ease-in-out infinite -3s; }
.float-chip--d { bottom: 20px; right: 8%; animation: float-y 7s ease-in-out infinite -2s; }

/* ticker */
.ticker { overflow: hidden; padding: 13px 0; border-block: 1px solid var(--border); background: var(--surface); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.ticker__track { display: flex; width: max-content; animation: marquee 34s linear infinite; }
.ticker__group { display: flex; gap: 42px; padding-right: 42px; }
.ticker__group > span { display: inline-flex; align-items: center; gap: 9px; font: 650 11.5px var(--font-mono); letter-spacing: .16em; color: var(--text-muted); white-space: nowrap; }
.ticker__group svg { color: var(--accent); }
@keyframes marquee { to { transform: translateX(-50%); } }

/* section head */
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 34px; flex-wrap: wrap; }
.section-sub { margin: 10px 0 0; font-size: 14px; color: var(--text-muted); line-height: 1.8; }
.post-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }
.post-grid > :first-child.post-card--featured { grid-column: 1 / -1; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 40px; flex-wrap: wrap; }
.disabled { opacity: .4; pointer-events: none; }
.pagination__pages { display: flex; gap: 6px; }
.pagination__num { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; font-size: 13px; font-weight: 650; color: var(--text-muted); border: 1px solid transparent; transition: all .3s var(--ease); }
.pagination__num:hover { color: var(--accent); border-color: var(--border); }
.pagination__num.is-active { color: #fff; background: var(--accent); box-shadow: 0 6px 16px rgba(var(--accent-rgb), .35); }

/* topics */
.topics__card { display: grid; grid-template-columns: 1.7fr 1fr; gap: 36px; padding: 36px; overflow: hidden; }
.topics__cloud { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
.topic-tag { display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-soft); font-size: calc(12px * var(--tag-scale, 1)); font-weight: 650; transition: all .35s var(--ease); }
.topic-tag:hover { color: #fff; border-color: transparent; background: linear-gradient(120deg, var(--accent), var(--accent-2)); transform: translateY(-3px) scale(1.05); box-shadow: 0 10px 22px rgba(var(--accent-rgb), .3); }
.topic-tag sup { font-size: 10px; opacity: .6; }
.topics__side { border-left: 1px solid var(--border); padding-left: 30px; }
.topics__side-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 16px; color: var(--text); }
.topics__side-title svg { color: var(--accent); }
.topics__cat { display: flex; align-items: center; justify-content: space-between; padding: 10px 2px; border-bottom: 1px dashed var(--border); font-size: 13px; color: var(--text-soft); transition: color .25s ease, padding .25s var(--ease); }
.topics__cat:hover { color: var(--accent); padding-left: 8px; }
.topics__cat > span:first-child { display: inline-flex; align-items: center; gap: 7px; }
.topics__cat-count { font: 600 11px var(--font-mono); padding: 2px 8px; border-radius: 99px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }

/* cta */
.cta { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 26px; padding: 42px 46px; overflow: hidden; flex-wrap: wrap; }
.cta__glow { position: absolute; width: 380px; height: 380px; right: -90px; top: -180px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .28), transparent 68%); filter: blur(30px); animation: float-slow 12s ease-in-out infinite; }
.cta__content { position: relative; }

@media (max-width: 980px) {
  .hero { grid-template-columns: 1fr; padding-top: 60px; }
  .hero__visual { height: 330px; order: -1; }
  .orbit--1 { width: 280px; height: 280px; } .orbit--2 { width: 210px; height: 210px; } .orbit--3 { width: 140px; height: 140px; }
  .orbit__core { width: 100px; height: 100px; font-size: 42px; }
  .float-chip--b { right: 2%; } .float-chip--c { left: 4%; }
  .topics__card { grid-template-columns: 1fr; }
  .topics__side { border-left: 0; border-top: 1px solid var(--border); padding: 24px 0 0; }
}
@media (max-width: 700px) {
  .post-grid { grid-template-columns: 1fr; }
  .hero__stats { gap: 22px; }
  .hero__stat strong { font-size: 23px; }
  .cta { padding: 30px 24px; }
  .float-chip { font-size: 11px; padding: 8px 11px; }
}
</style>
