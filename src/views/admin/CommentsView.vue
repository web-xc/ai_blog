<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MessageCircle, Check, TriangleAlert, ExternalLink, Save, Shield, Server,
  Cloud, Code2, ChevronDown, Sparkles, ArrowRight, Eye,
} from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { notify } from '@/lib/toast'
import { getPosts } from '@/lib/posts'

const site = useSiteStore()
const envId = ref(site.config.twikooEnvId)
const configured = computed(() => Boolean(site.config.twikooEnvId.trim()))
const openFaq = ref<number | null>(0)

function save() {
  site.updateConfig({ twikooEnvId: envId.value.trim() })
  notify('Twikoo 配置已保存，刷新文章页即可生效')
}

const deployWays = [
  {
    icon: Cloud,
    name: '腾讯云 CloudBase',
    desc: '官方推荐，一键部署云函数 + 免费数据库，获得环境 ID 填入即可。',
    tag: '最省心',
    href: 'https://twikoo.js.org/quick-start.html#腾讯云开发cloudbase部署',
  },
  {
    icon: Server,
    name: 'Vercel / Netlify',
    desc: '将 Twikoo 部署为 Serverless 函数，把函数地址当作 envId 使用。',
    tag: '海外可用',
    href: 'https://twikoo.js.org/quick-start.html#vercel部署',
  },
  {
    icon: Code2,
    name: '自建服务器',
    desc: '用 Node.js + MongoDB 自行托管 twikoo 后端，完全掌控数据。',
    tag: '完全自控',
    href: 'https://twikoo.js.org/quick-start.html#私有部署',
  },
]

const faqs = [
  { q: '为什么配置后仍看不到评论？', a: '请确认 envId 正确、云函数可访问、浏览器未被广告插件拦截 CDN；配置修改后需刷新文章页面。Twikoo 脚本从 jsDelivr 加载，国内网络偶尔需要等待几秒。' },
  { q: '评论数据存在哪里？', a: '评论保存在你自己的 Twikoo 后端数据库，本站不托管任何用户数据。站点本身是纯静态文件。' },
  { q: '如何管理 / 删除评论？', a: '在文章页评论框右下角点击「管理」小齿轮，首次会要求设置管理密码，之后即可审核、置顶、删除评论。' },
  { q: '环境变量写进代码是否安全？', a: 'envId 是公开的环境标识，本身不是密钥，可以写进前端配置。真正需要保密的是数据库凭据，它们只存在于你的云函数环境中。' },
]
const latestPost = getPosts()[0]
</script>

<template>
  <div class="comments-admin">
    <header v-reveal class="page-head">
      <div>
        <span class="section-kicker">Comments</span>
        <h1>评论<span class="gradient-text">管理</span></h1>
        <p>Twikoo 配置、部署指引与评论 moderation 说明。</p>
      </div>
      <a href="https://twikoo.js.org/" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm"><ExternalLink :size="14" /> Twikoo 官方文档</a>
    </header>

    <section v-reveal class="status-card glass" :class="configured ? 'is-ok' : 'is-warn'">
      <div class="status-card__icon"><Check v-if="configured" :size="26" /><TriangleAlert v-else :size="26" /></div>
      <div class="status-card__body">
        <h2>{{ configured ? '评论系统已启用' : '评论系统尚未启用' }}</h2>
        <p>{{ configured ? `当前 envId：${site.config.twikooEnvId.slice(0, 18)}${site.config.twikooEnvId.length > 18 ? '…' : ''}` : '填入 Twikoo envId 后，前台所有文章页会自动显示评论区。' }}</p>
      </div>
      <span class="chip" :class="configured ? 'chip-accent' : ''">{{ configured ? 'ACTIVE' : 'PENDING' }}</span>
    </section>

    <section v-reveal class="admin-card glass config-card">
      <div class="card-title"><span><MessageCircle :size="17" /></span><div><h3>快速配置</h3><p>保存后立即生效，无需重新构建或部署</p></div></div>
      <div class="config-row">
        <div class="field"><label>Twikoo envId / 云函数地址</label><input v-model="envId" class="input" placeholder="cloudbase 环境 ID 或 https://your-twikoo.vercel.app" /></div>
        <button class="btn btn-primary" @click="save"><Save :size="15" /> 保存配置</button>
      </div>
      <div class="config-note"><Shield :size="14" /> envId 属于公开标识，可安全写在前端；数据库凭据只保存在你自己的云函数环境中。</div>
    </section>

    <section class="section">
      <div v-reveal class="section-head"><div><span class="section-kicker">Deploy</span><h2 class="section-title" style="font-size: 24px">三种<span class="gradient-text">部署方式</span></h2><p class="section-sub">Twikoo 需要一个极轻量的云函数后端，任选其一即可。</p></div></div>
      <div class="deploy-grid">
        <a v-for="(w, i) in deployWays" :key="w.name" v-reveal="i * 80" :href="w.href" target="_blank" rel="noopener noreferrer" class="deploy-card glass card-hover">
          <span class="deploy-card__tag">{{ w.tag }}</span>
          <span class="deploy-card__icon"><component :is="w.icon" :size="22" /></span>
          <strong>{{ w.name }}</strong>
          <p>{{ w.desc }}</p>
          <span class="deploy-card__link">查看教程 <ArrowRight :size="13" /></span>
        </a>
      </div>
    </section>

    <section class="dash-grid">
      <div v-reveal class="admin-card glass">
        <div class="card-title"><span><Shield :size="17" /></span><div><h3>如何审核评论</h3><p>Twikoo 自带的管理面板</p></div></div>
        <ol class="steps">
          <li><span>1</span>打开任意文章页，滚动到评论区</li>
          <li><span>2</span>点击评论框右下角的「管理」小齿轮</li>
          <li><span>3</span>首次进入设置一个管理密码</li>
          <li><span>4</span>之后即可审核、置顶、删除或回复评论</li>
        </ol>
        <RouterLink v-if="latestPost" :to="`/post/${latestPost.slug}`" class="btn btn-ghost btn-sm"><Eye :size="14" /> 去文章页查看评论区</RouterLink>
      </div>

      <div v-reveal="100" class="admin-card glass">
        <div class="card-title"><span><Sparkles :size="17" /></span><div><h3>常见问题</h3><p>配置前后值得先看一眼</p></div></div>
        <div class="faq">
          <div v-for="(f, i) in faqs" :key="f.q" class="faq__item" :class="{ 'is-open': openFaq === i }">
            <button @click="openFaq = openFaq === i ? null : i"><span>{{ f.q }}</span><ChevronDown :size="15" /></button>
            <p v-if="openFaq === i">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
.page-head h1 { font-size: clamp(26px, 3vw, 34px); font-weight: 780; letter-spacing: -.04em; margin: 8px 0; }
.page-head p { margin: 0; font-size: 13.5px; color: var(--text-muted); }
.status-card { display: flex; align-items: center; gap: 18px; padding: 22px 26px; margin-bottom: 16px; }
.status-card__icon { width: 56px; height: 56px; flex: none; display: grid; place-items: center; border-radius: 17px; }
.status-card.is-ok .status-card__icon { background: rgba(16,185,129,.12); color: var(--success); }
.status-card.is-warn .status-card__icon { background: rgba(245,158,11,.12); color: var(--warning); }
.status-card__body { flex: 1; }
.status-card h2 { font-size: 17px; margin: 0 0 5px; }
.status-card p { margin: 0; font-size: 12.5px; color: var(--text-muted); font-family: var(--font-mono); }
.card-title { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.card-title > span { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.card-title h3 { margin: 0 0 3px; font-size: 15px; }
.card-title p { margin: 0; font-size: 11.5px; color: var(--text-muted); }
.config-row { display: flex; align-items: flex-end; gap: 12px; }
.config-row .field { flex: 1; }
.config-note { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 11.5px; color: var(--text-muted); }
.config-note svg { color: var(--accent); flex: none; }
.section-head { margin-bottom: 22px; }
.section-sub { margin: 8px 0 0; font-size: 13px; color: var(--text-muted); }
.deploy-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.deploy-card { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 24px; }
.deploy-card__tag { position: absolute; top: 16px; right: 16px; font-size: 10.5px; font-weight: 650; color: var(--accent); padding: 3px 9px; border-radius: 99px; background: rgba(var(--accent-rgb), .1); }
.deploy-card__icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.deploy-card strong { font-size: 15px; }
.deploy-card p { font-size: 12.5px; line-height: 1.8; color: var(--text-muted); margin: 0; flex: 1; }
.deploy-card__link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 650; color: var(--accent); }
.dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.steps { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 12px; }
.steps li { display: flex; align-items: center; gap: 11px; font-size: 12.8px; color: var(--text-soft); }
.steps li span { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 7px; background: rgba(var(--accent-rgb), .12); color: var(--accent); font: 700 11px var(--font-mono); }
.faq { display: flex; flex-direction: column; }
.faq__item { border-bottom: 1px solid var(--border); }
.faq__item:last-child { border-bottom: 0; }
.faq__item button { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 12px 0; border: 0; background: transparent; color: var(--text); font-size: 13px; font-weight: 650; text-align: left; }
.faq__item button svg { color: var(--text-muted); transition: transform .3s var(--ease); flex: none; }
.faq__item.is-open button svg { transform: rotate(180deg); color: var(--accent); }
.faq__item p { margin: 0 0 14px; font-size: 12.3px; line-height: 1.85; color: var(--text-muted); animation: fade-in .3s ease both; }
@media (max-width: 900px) { .deploy-grid, .dash-grid { grid-template-columns: 1fr; } .config-row { flex-direction: column; align-items: stretch; } }
</style>
