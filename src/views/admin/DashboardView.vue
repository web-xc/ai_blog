<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { FileText, Hash, BookOpen, Eye, PenLine, Settings, ExternalLink, MessageCircle, ArrowRight, Sparkles, TrendingUp, UploadCloud, Check, Clock } from '@lucide/vue'
import { getPosts, getTags, getCategories, formatDate } from '@/lib/posts'
import { useAdminStore } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import BrandGithub from '@/components/BrandGithub.vue'
import { capability } from '@/lib/cloud'

const admin = useAdminStore()
const site = useSiteStore()
onMounted(() => { void admin.refreshStats() })
const posts = getPosts()
const tags = getTags()
const categories = getCategories()
const totalWords = computed(() => Math.round(posts.reduce((s, p) => s + p.wordCount, 0) / 1000))
const chart = computed(() => admin.viewsByDay(7))
const maxView = computed(() => Math.max(1, ...chart.value.map((d) => d.count)))
const topPosts = computed(() =>
  admin.topViewed(4).map((v) => ({ ...v, post: posts.find((p) => p.slug === v.slug) })).filter((v) => v.post),
)
const githubReady = computed(() => capability('publish') || Boolean(site.config.github.owner && site.config.github.repo && site.config.github.token))

const stats = computed(() => [
  { label: '已发布文章', value: posts.length, icon: FileText, tone: 'indigo', hint: `${categories.length} 个分类` },
  { label: '标签总数', value: tags.length, icon: Hash, tone: 'purple', hint: '内容脉络' },
  { label: '累计字数', value: totalWords.value, icon: BookOpen, tone: 'cyan', hint: '千字' },
  { label: admin.cloudStats ? '云端浏览量' : '本地浏览量', value: admin.totalViews, icon: Eye, tone: 'green', hint: admin.cloudStats ? '全站访客实时统计' : '仅本机统计' },
])

const quickActions = [
  { label: '写新文章', desc: '打开 Markdown 编辑器', to: '/admin/editor/new', icon: PenLine },
  { label: '文章管理', desc: '草稿与发布状态', to: '/admin/posts', icon: FileText },
  { label: '站点设置', desc: '外观、评论与部署', to: '/admin/settings', icon: Settings },
  { label: '评论管理', desc: 'Twikoo 配置', to: '/admin/comments', icon: MessageCircle },
]
</script>

<template>
  <div class="dashboard">
    <!-- welcome -->
    <section v-reveal class="welcome">
      <div class="welcome__glow" />
      <div class="welcome__text">
        <span class="welcome__kicker"><Sparkles :size="13" /> AURORA CONSOLE</span>
        <h1>欢迎回到<span class="gradient-text">写作台</span></h1>
        <p>内容即文件，发布即提交。你的每一次写作，都会自动变成线上新的一页。</p>
      </div>
      <div class="welcome__actions">
        <RouterLink to="/admin/editor/new" class="btn btn-primary"><PenLine :size="16" /> 开始写作</RouterLink>
        <RouterLink to="/" class="btn btn-ghost"><ExternalLink :size="15" /> 查看站点</RouterLink>
      </div>
    </section>

    <!-- stats -->
    <section class="stat-grid">
      <div v-for="(s, i) in stats" :key="s.label" v-reveal="i * 70" class="stat-card glass card-hover" :class="`tone-${s.tone}`">
        <span class="stat-card__icon"><component :is="s.icon" :size="20" /></span>
        <div class="stat-card__body">
          <span class="stat-label">{{ s.label }}</span>
          <strong class="stat-value"><AnimatedNumber :value="s.value" /></strong>
        </div>
        <span class="stat-card__hint">{{ s.hint }} <TrendingUp :size="12" /></span>
        <span class="stat-card__decor" />
      </div>
    </section>

    <!-- chart + quick -->
    <section class="dash-grid">
      <div v-reveal class="admin-card glass chart-card">
        <div class="card-head">
          <div><h3 class="admin-card__title">最近 7 天浏览趋势</h3><p class="admin-card__desc">浏览器本地记录，刷新页面后依然保留</p></div>
          <span class="chip chip-accent"><Eye :size="12" /> {{ admin.totalViews }} 次</span>
        </div>
        <div class="chart">
          <div class="chart__grid"><span>高</span><span>中</span><span>低</span></div>
          <div class="chart__bars">
            <div v-for="(d, i) in chart" :key="d.label" class="chart__col">
              <span class="chart__value">{{ d.count || '' }}</span>
              <div class="chart__bar" :style="{ height: `${Math.max(4, (d.count / maxView) * 100)}%`, animationDelay: `${i * 80}ms` }" />
              <span class="chart__label">{{ d.label }}</span>
            </div>
          </div>
        </div>
        <p v-if="!admin.totalViews" class="chart__tip">暂无浏览记录 · 打开任意文章后，这里会开始记录（数据仅保存在你的浏览器）</p>
      </div>

      <div v-reveal="100" class="admin-card glass quick-card">
        <div class="card-head"><div><h3 class="admin-card__title">快捷操作</h3><p class="admin-card__desc">常用功能一键直达</p></div></div>
        <div class="quick-list">
          <RouterLink v-for="(a, i) in quickActions" :key="a.label" :to="a.to" class="quick-item" :style="{ animationDelay: `${i * 70}ms` }">
            <span class="quick-item__icon"><component :is="a.icon" :size="17" /></span>
            <span class="quick-item__text"><strong>{{ a.label }}</strong><small>{{ a.desc }}</small></span>
            <ArrowRight :size="15" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- pipeline -->
    <section v-reveal class="admin-card glass pipeline-card">
      <div class="card-head">
        <div><h3 class="admin-card__title">自动发布流水线</h3><p class="admin-card__desc">从敲下第一个字，到全球可访问，只有三步</p></div>
        <span class="chip" :class="githubReady ? 'chip-accent' : ''">
          <Check v-if="githubReady" :size="12" /><Clock v-else :size="12" />
          {{ githubReady ? 'GitHub 已配置' : '待配置 GitHub' }}
        </span>
      </div>
      <div class="pipeline">
        <div class="pipeline__step"><span class="pipeline__num">01</span><PenLine :size="20" /><strong>Markdown 写作</strong><p>在后台编辑器写下内容，保存为本地草稿</p></div>
        <span class="pipeline__arrow"><ArrowRight :size="18" /></span>
        <div class="pipeline__step"><span class="pipeline__num">02</span><UploadCloud :size="20" /><strong>提交到仓库</strong><p>通过 GitHub API 推送 .md 文件到 content/posts</p></div>
        <span class="pipeline__arrow"><ArrowRight :size="18" /></span>
        <div class="pipeline__step"><span class="pipeline__num">03</span><BrandGithub :size="20" /><strong>自动部署上线</strong><p>Actions 构建并发布到 GitHub Pages</p></div>
      </div>
      <div v-if="!githubReady" class="pipeline__alert">
        <span>还没连接仓库？前往 <RouterLink to="/admin/settings">站点设置</RouterLink> 填写仓库信息与 Token，即可一键发布。</span>
      </div>
    </section>

    <!-- recent + top -->
    <section class="dash-grid">
      <div v-reveal class="admin-card glass">
        <div class="card-head"><div><h3 class="admin-card__title">最近发布的文章</h3><p class="admin-card__desc">来自构建时收录的 Markdown 文件</p></div>
          <RouterLink to="/admin/posts" class="btn btn-ghost btn-sm">全部 <ArrowRight :size="13" /></RouterLink>
        </div>
        <div class="recent-list">
          <RouterLink v-for="p in posts.slice(0, 5)" :key="p.slug" :to="`/post/${p.slug}`" class="recent-item">
            <span class="recent-item__emoji">{{ p.cover }}</span>
            <span class="recent-item__body"><strong>{{ p.title }}</strong><small>{{ p.category }} · {{ formatDate(p.date) }}</small></span>
            <ArrowRight :size="14" />
          </RouterLink>
        </div>
      </div>

      <div v-reveal="100" class="admin-card glass">
        <div class="card-head"><div><h3 class="admin-card__title">热门文章</h3><p class="admin-card__desc">按本地浏览次数排序</p></div></div>
        <div v-if="topPosts.length" class="top-list">
          <div v-for="(item, i) in topPosts" :key="item.slug" class="top-item">
            <span class="top-item__rank">0{{ i + 1 }}</span>
            <span class="top-item__title">{{ item.post?.title }}</span>
            <span class="top-item__bar"><i :style="{ width: `${(item.count / (topPosts[0]?.count || 1)) * 100}%` }" /></span>
            <span class="top-item__count">{{ item.count }}</span>
          </div>
        </div>
        <div v-else class="mini-empty"><Eye :size="22" /><p>还没有浏览数据</p><span>去前台读一篇文章吧</span></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.welcome { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding: 32px 34px; border-radius: var(--radius-lg); overflow: hidden; color: #fff; background: linear-gradient(115deg, var(--accent) 0%, var(--accent-2) 58%, #7c5cf0 100%); box-shadow: 0 20px 46px rgba(var(--accent-rgb), .28); }
.welcome__glow { position: absolute; width: 340px; height: 340px; right: -60px; top: -170px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.35), transparent 68%); animation: float-slow 12s ease-in-out infinite; }
.welcome__text, .welcome__actions { position: relative; }
.welcome__kicker { display: inline-flex; align-items: center; gap: 7px; font: 700 10.5px var(--font-mono); letter-spacing: .2em; opacity: .85; }
.welcome h1 { font-size: clamp(24px, 3vw, 34px); font-weight: 780; letter-spacing: -.035em; margin: 10px 0 8px; }
.welcome h1 .gradient-text { background: linear-gradient(100deg, #fff, #d9f6ff); -webkit-background-clip: text; background-clip: text; }
.welcome p { margin: 0; font-size: 13.5px; opacity: .88; line-height: 1.8; }
.welcome__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.welcome .btn-primary { background: #fff; color: var(--accent); box-shadow: 0 8px 22px rgba(0,0,0,.14); }
.welcome .btn-ghost { color: #fff; border-color: rgba(255,255,255,.4); background: rgba(255,255,255,.1); }
.welcome .btn-ghost:hover { background: rgba(255,255,255,.22); border-color: #fff; }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
.stat-card { position: relative; display: flex; align-items: center; gap: 14px; padding: 20px; overflow: hidden; }
.stat-card__icon { width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: 14px; background: rgba(var(--accent-rgb), .12); color: var(--accent); }
.stat-card__body { display: flex; flex-direction: column; gap: 4px; }
.stat-card__hint { position: absolute; right: 16px; top: 18px; display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--text-muted); }
.stat-card__decor { position: absolute; right: -30px; bottom: -40px; width: 110px; height: 110px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .16), transparent 70%); }
.tone-purple .stat-card__icon { background: rgba(168,85,247,.13); color: #a855f7; }
.tone-cyan .stat-card__icon { background: rgba(6,182,212,.13); color: #06b6d4; }
.tone-green .stat-card__icon { background: rgba(16,185,129,.13); color: #10b981; }

.dash-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px; margin-top: 16px; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.chart { display: flex; gap: 12px; height: 172px; }
.chart__grid { display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 24px; font-size: 10px; color: var(--text-muted); }
.chart__bars { flex: 1; display: flex; align-items: flex-end; justify-content: space-around; gap: 8px; border-bottom: 1px solid var(--border); background: repeating-linear-gradient(to top, transparent 0, transparent 34px, var(--border) 35px); }
.chart__col { position: relative; flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.chart__bar { width: min(28px, 70%); border-radius: 7px 7px 2px 2px; background: linear-gradient(180deg, var(--accent-3), var(--accent)); box-shadow: 0 4px 14px rgba(var(--accent-rgb), .25); animation: bar-grow .9s var(--ease) both; transform-origin: bottom; }
@keyframes bar-grow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
.chart__value { position: absolute; bottom: calc(var(--h, 0px) + 2px); font: 600 10px var(--font-mono); color: var(--text-muted); }
.chart__label { position: absolute; bottom: -22px; font: 600 10px var(--font-mono); color: var(--text-muted); }
.chart__tip { margin: 18px 0 0; font-size: 11.5px; color: var(--text-muted); text-align: center; }
.quick-list { display: flex; flex-direction: column; gap: 8px; }
.quick-item { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 12px; border: 1px solid transparent; transition: all .32s var(--ease); animation: fade-up .5s var(--ease) both; }
.quick-item:hover { background: rgba(var(--accent-rgb), .07); border-color: rgba(var(--accent-rgb), .2); transform: translateX(4px); }
.quick-item__icon { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 10px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.quick-item__text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.quick-item__text strong { font-size: 13px; }
.quick-item__text small { font-size: 11px; color: var(--text-muted); }
.quick-item > svg { color: var(--text-muted); }

.pipeline-card { margin-top: 16px; }
.pipeline { display: flex; align-items: stretch; gap: 10px; }
.pipeline__step { flex: 1; position: relative; padding: 18px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-solid); }
.pipeline__step > svg { color: var(--accent); margin-bottom: 10px; }
.pipeline__step strong { display: block; font-size: 13.5px; margin-bottom: 6px; }
.pipeline__step p { font-size: 11.5px; line-height: 1.7; color: var(--text-muted); margin: 0; }
.pipeline__num { position: absolute; right: 14px; top: 12px; font: 750 18px var(--font-mono); color: var(--border-strong); }
.pipeline__arrow { display: grid; place-items: center; color: var(--accent); }
.pipeline__alert { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 11px 14px; border-radius: 10px; background: rgba(245,158,11,.09); color: var(--text-soft); font-size: 12px; }
.pipeline__alert a { color: var(--accent); font-weight: 650; text-decoration: underline; }

.recent-list, .top-list { display: flex; flex-direction: column; }
.recent-item { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid var(--border); transition: all .3s var(--ease); }
.recent-item:last-child { border-bottom: 0; }
.recent-item:hover { padding-left: 10px; }
.recent-item__emoji { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 10px; background: rgba(var(--accent-rgb), .1); font-size: 19px; }
.recent-item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.recent-item__body strong { font-size: 13px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-item__body small { font-size: 11px; color: var(--text-muted); }
.recent-item > svg { color: var(--text-muted); }
.top-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.top-item__rank { font: 700 13px var(--font-mono); color: var(--accent); }
.top-item__title { flex: 1; min-width: 0; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-item__bar { width: 60px; height: 5px; border-radius: 99px; background: var(--border); overflow: hidden; }
.top-item__bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
.top-item__count { font: 600 11px var(--font-mono); color: var(--text-muted); width: 24px; text-align: right; }
.mini-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 30px 0; color: var(--text-muted); }
.mini-empty svg { color: var(--accent); opacity: .6; }
.mini-empty p { margin: 4px 0 0; font-size: 13px; font-weight: 650; }
.mini-empty span { font-size: 11.5px; }

@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } .pipeline { flex-direction: column; } .pipeline__arrow { transform: rotate(90deg); } }
@media (max-width: 560px) { .welcome { padding: 24px; } .stat-grid { grid-template-columns: 1fr 1fr; } .stat-card { padding: 16px; } .stat-card__hint { display: none; } }
</style>
