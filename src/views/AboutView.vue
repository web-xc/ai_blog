<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Sparkles, Code2, PenLine, MessageCircle, LayoutDashboard, Zap, ArrowRight, Heart, Mail } from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { resolveIcon } from '@/lib/icons'
import { getPosts, getTags } from '@/lib/posts'
import BrandGithub from '@/components/BrandGithub.vue'

const site = useSiteStore()
const social = computed(() => site.config.social)
const posts = getPosts()
const tags = getTags()

const skills = [
  { name: 'Vue 3 / TypeScript', level: 92 },
  { name: 'UI / 动效设计', level: 86 },
  { name: '工程化与自动化', level: 88 },
  { name: '写作与表达', level: 74 },
]
const animate = ref(false)
onMounted(() => requestAnimationFrame(() => (animate.value = true)))

const stack = [
  { icon: Code2, name: 'Vue 3 + Vite', desc: '组合式 API、TypeScript、按需懒加载' },
  { icon: PenLine, name: 'Markdown 写作', desc: 'Hexo 式文件即内容，构建时自动收录' },
  { icon: Code2, name: 'GitHub Actions', desc: '推送即构建，自动部署到 GitHub Pages' },
  { icon: MessageCircle, name: 'Twikoo 评论', desc: '无服务器、无追踪的轻量评论系统' },
  { icon: LayoutDashboard, name: '后台管理', desc: '在线写作、发布、统计与站点设置' },
  { icon: Zap, name: '极致静态', desc: '零后端、全球 CDN 加速、秒级打开' },
]
const milestones = [
  { date: '2026.01', title: '一个想法', text: '想拥有一个完全属于自己的、没有广告与算法的地方。' },
  { date: '2026.06', title: '技术选型', text: '放弃笨重的 CMS，选择 Vue 3 + Markdown 的纯静态方案。' },
  { date: '2026.11', title: 'Aurora 上线', text: '从写作到发布全流程打通，第一束光终于亮起。' },
]
</script>

<template>
  <div class="container about-page">
    <header v-reveal class="page-hero">
      <span class="section-kicker">About</span>
      <h1 class="page-hero__title">关于<span class="gradient-text">我</span>与这个站</h1>
      <p class="page-hero__sub">一点自我介绍，以及这个小小数字花园背后的技术。</p>
    </header>

    <section v-reveal class="profile glass">
      <div class="profile__avatar">
        <span class="profile__avatar-text">{{ site.config.avatar }}</span>
        <span class="profile__avatar-ring" />
      </div>
      <div class="profile__info">
        <h2>{{ site.config.author }}</h2>
        <p class="profile__role">{{ site.config.authorRole }}</p>
        <p class="profile__desc">{{ site.config.description }}</p>
        <p class="profile__desc">在这里，我记录读书与编码的碎片，也记录一些不那么技术、却同样重要的日常。所有文字都以纯文本的形式存放在仓库里，像种子一样，安静、可迁移、不会被平台锁住。</p>
        <div class="profile__social">
          <a v-for="item in social" :key="item.label" :href="item.href" target="_blank" rel="noopener noreferrer" class="social-btn">
            <component :is="resolveIcon(item.icon)" :size="17" />
          </a>
          <a :href="`mailto:${site.config.social.find((s) => s.icon === 'mail')?.href || ''}`" class="social-btn" aria-label="邮件"><Mail :size="17" /></a>
        </div>
      </div>
      <div class="profile__numbers">
        <div><strong>{{ posts.length }}</strong><span>文章</span></div>
        <div><strong>{{ tags.length }}</strong><span>标签</span></div>
        <div><strong>100%</strong><span>静态</span></div>
      </div>
    </section>

    <section class="section about-grid">
      <div v-reveal class="about-card glass">
        <h3><Sparkles :size="17" /> 正在琢磨的事</h3>
        <div v-for="s in skills" :key="s.name" class="skill">
          <div class="skill__head"><span>{{ s.name }}</span><em>{{ s.level }}%</em></div>
          <div class="skill__bar"><i :style="{ width: animate ? `${s.level}%` : '0%' }" /></div>
        </div>
      </div>

      <div v-reveal="120" class="about-card glass">
        <h3><Heart :size="17" /> 为什么叫 Aurora</h3>
        <p>极光是太阳风与地球磁场相遇时，才会在夜空中浮现的光。文字也差不多——日常的碰撞、偶然的灵感、深夜里的一点执拗，堆叠起来，才有了这里微弱但真实的光。</p>
        <p>所以这个站不追热点，也不求被看见。它只是安静地亮着，等一个恰好路过的人。</p>
        <RouterLink to="/archive" class="btn btn-ghost btn-sm">读读这些文字 <ArrowRight :size="14" /></RouterLink>
      </div>
    </section>

    <section class="section">
      <div v-reveal class="section-head">
        <div>
          <span class="section-kicker">How It Works</span>
          <h2 class="section-title">这个站<span class="gradient-text">如何运转</span></h2>
          <p class="section-sub">没有服务器、没有数据库，一切都从一份 Markdown 开始。</p>
        </div>
      </div>
      <div class="stack-grid">
        <div v-for="(item, i) in stack" :key="item.name" v-reveal="i * 70" class="stack-card glass card-hover">
          <span class="stack-card__icon">
            <BrandGithub v-if="item.name.startsWith('GitHub')" :size="20" />
            <component :is="item.icon" v-else :size="20" />
          </span>
          <strong>{{ item.name }}</strong>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div v-reveal class="section-head"><div><span class="section-kicker">Timeline</span><h2 class="section-title">一点<span class="gradient-text">来路</span></h2></div></div>
      <div class="milestones">
        <div v-for="(m, i) in milestones" :key="m.date" v-reveal="i * 90" class="milestone glass">
          <span class="milestone__date">{{ m.date }}</span>
          <span class="milestone__dot" />
          <div><h4>{{ m.title }}</h4><p>{{ m.text }}</p></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-hero { padding: 76px 0 40px; text-align: center; }
.page-hero__title { font-size: clamp(36px, 5vw, 58px); font-weight: 820; letter-spacing: -.05em; margin: 14px 0; }
.page-hero__sub { font-size: 15px; color: var(--text-muted); margin: 0; }
.profile { display: grid; grid-template-columns: auto 1fr auto; gap: 34px; align-items: center; padding: 38px 42px; }
.profile__avatar { position: relative; width: 130px; height: 130px; flex: none; display: grid; place-items: center; border-radius: 34px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff; font-size: 58px; box-shadow: 0 18px 44px rgba(var(--accent-rgb), .35); animation: float-y 6s ease-in-out infinite; }
.profile__avatar-ring { position: absolute; inset: -12px; border: 1px dashed rgba(var(--accent-rgb), .45); border-radius: 42px; animation: spin 26s linear infinite; }
.profile__info h2 { font-size: 28px; font-weight: 780; margin: 0 0 4px; letter-spacing: -.03em; }
.profile__role { font-size: 13px; font-weight: 650; color: var(--accent); margin: 0 0 16px; }
.profile__desc { font-size: 13.8px; line-height: 1.9; color: var(--text-soft); margin: 0 0 12px; max-width: 620px; }
.profile__social { display: flex; gap: 10px; margin-top: 20px; }
.social-btn { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-soft); transition: all .35s var(--ease); }
.social-btn:hover { color: #fff; background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-color: transparent; transform: translateY(-3px); }
.profile__numbers { display: flex; flex-direction: column; gap: 20px; padding-left: 34px; border-left: 1px solid var(--border); }
.profile__numbers > div { display: flex; flex-direction: column; gap: 2px; }
.profile__numbers strong { font-size: 24px; font-weight: 780; letter-spacing: -.04em; }
.profile__numbers span { font-size: 11.5px; color: var(--text-muted); }
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.about-card { padding: 28px 30px; }
.about-card h3 { display: flex; align-items: center; gap: 9px; font-size: 16px; margin: 0 0 22px; }
.about-card h3 svg { color: var(--accent); }
.about-card p { font-size: 13.5px; line-height: 1.95; color: var(--text-soft); margin: 0 0 14px; }
.skill { margin-bottom: 18px; }
.skill__head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
.skill__head em { font-style: normal; font: 600 11.5px var(--font-mono); color: var(--accent); }
.skill__bar { height: 6px; border-radius: 99px; background: var(--border); overflow: hidden; }
.skill__bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent-3)); transition: width 1.2s var(--ease); }
.section-head { margin-bottom: 30px; }
.section-sub { margin: 10px 0 0; font-size: 14px; color: var(--text-muted); }
.stack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stack-card { padding: 24px; }
.stack-card__icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 13px; background: rgba(var(--accent-rgb), .1); color: var(--accent); margin-bottom: 16px; }
.stack-card strong { display: block; font-size: 15px; margin-bottom: 7px; }
.stack-card p { font-size: 12.8px; line-height: 1.8; color: var(--text-muted); margin: 0; }
.milestones { display: flex; flex-direction: column; gap: 14px; position: relative; }
.milestone { display: grid; grid-template-columns: 90px 20px 1fr; gap: 16px; align-items: center; padding: 18px 24px; }
.milestone__date { font: 650 12px var(--font-mono); color: var(--accent); }
.milestone__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 5px rgba(var(--accent-rgb), .15); }
.milestone h4 { margin: 0 0 5px; font-size: 14.5px; }
.milestone p { margin: 0; font-size: 12.8px; color: var(--text-muted); line-height: 1.7; }
@media (max-width: 900px) { .profile { grid-template-columns: 1fr; text-align: center; justify-items: center; } .profile__numbers { flex-direction: row; border-left: 0; border-top: 1px solid var(--border); padding: 20px 0 0; gap: 40px; } .profile__social { justify-content: center; } .about-grid { grid-template-columns: 1fr; } .stack-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .page-hero { padding-top: 50px; } .profile { padding: 28px 20px; } .stack-grid { grid-template-columns: 1fr; } .milestone { grid-template-columns: 1fr; gap: 8px; } .milestone__dot { display: none; } }
</style>
