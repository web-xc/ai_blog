<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Settings, Palette, MessageCircle, Link2, Save, RefreshCw, Plus, Trash2,
  Check, TriangleAlert, Shield, Download, Sun, Moon, Sparkles, ExternalLink, Loader2,
  Cloud, CloudOff, Server, Brain, Megaphone,
} from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { defaultSiteConfig, type SiteConfig } from '@/config/site'
import { verifyRepo } from '@/lib/github'
import { cloudHealth, cloudMode, capability } from '@/lib/cloud'
import { notify } from '@/lib/toast'
import BrandGithub from '@/components/BrandGithub.vue'

const site = useSiteStore()
const form = ref<SiteConfig>(JSON.parse(JSON.stringify(site.config)) as SiteConfig)
const testing = ref(false)
const repoOk = ref<boolean | null>(null)
const syncingNow = ref(false)

const accents = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b']
const iconOptions = ['github', 'mail', 'rss', 'book', 'code', 'feather', 'heart', 'send', 'link', 'coffee']

const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(site.config))
const caps = computed(() => cloudHealth.value?.capabilities)
const syncLabel = computed(() => ({
  idle: '待同步', syncing: '同步中…', saved: '已同步', error: '同步失败', offline: '本地模式',
})[site.syncStatus])
const aiLabel = computed(() => cloudHealth.value?.ai === 'llm' ? '已接入大模型' : '本地提取式摘要')
const capNames: Record<string, string> = {
  auth: '服务端鉴权', config: '云端配置', drafts: '草稿同步', stats: '全站统计', ai: 'AI 摘要', publish: '云端发布',
}
function capLabel(key: string) { return capNames[key] || key }

function save() {
  form.value.title = form.value.title.trim() || defaultSiteConfig.title
  site.updateConfig(form.value)
  notify(capability('config') ? '设置已保存并同步到云端，所有访客可见' : '设置已保存在本机浏览器')
}
async function syncNow() {
  if (!capability('config')) { notify('当前未连接云端，配置保存在本机', 'info'); return }
  syncingNow.value = true
  try {
    const ok = await site.pushConfig()
    notify(ok ? '配置已同步到云端' : '同步失败，请检查 Vercel 环境变量', ok ? 'success' : 'error')
  } finally {
    syncingNow.value = false
  }
}
function reset() {
  if (!window.confirm('确定恢复默认站点设置吗？本地自定义配置将被覆盖。')) return
  site.resetConfig()
  form.value = JSON.parse(JSON.stringify(site.config)) as SiteConfig
  notify('已恢复默认设置', 'info')
}
function addSocial() {
  form.value.social.push({ label: '新链接', href: 'https://', icon: 'link' })
}
function removeSocial(i: number) {
  form.value.social.splice(i, 1)
}
function addLink() {
  form.value.links.push({ name: '新朋友', url: 'https://', desc: '一句话简介', avatar: '✦' })
}
function removeLink(i: number) {
  form.value.links.splice(i, 1)
}
async function testConnection() {
  testing.value = true
  repoOk.value = null
  try {
    const repo = await verifyRepo(form.value.github)
    repoOk.value = true
    notify(`连接成功：${repo.full_name}（默认分支 ${repo.default_branch}）`)
  } catch (e) {
    repoOk.value = false
    notify(e instanceof Error ? e.message : '连接失败', 'error', 6000)
  } finally {
    testing.value = false
  }
}
function exportConfig() {
  const blob = new Blob([JSON.stringify(form.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aurora-site-config.json'
  a.click()
  URL.revokeObjectURL(url)
  notify('配置已导出为 JSON 文件')
}
</script>

<template>
  <div class="settings-page">
    <header v-reveal class="page-head">
      <div>
        <span class="section-kicker">Settings</span>
        <h1>站点<span class="gradient-text">设置</span></h1>
        <p>品牌、外观、评论与自动部署，全部在这里配置。</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn-ghost btn-sm" @click="exportConfig"><Download :size="14" /> 导出配置</button>
        <button class="btn btn-ghost btn-sm" @click="reset"><RefreshCw :size="14" /> 恢复默认</button>
        <button class="btn btn-primary btn-sm" @click="save"><Save :size="14" /> 保存设置 {{ dirty ? '•' : '' }}</button>
      </div>
    </header>

    <div class="settings-grid">
      <!-- cloud connection -->
      <section v-reveal class="admin-card glass settings-wide cloud-card">
        <div class="card-title">
          <span><Cloud v-if="cloudMode === 'cloud'" :size="17" /><CloudOff v-else :size="17" /></span>
          <div><h3>云端数据连接</h3><p>{{ site.cloudLabel }} · 配置 / 草稿 / 统计 / AI 由 Vercel Serverless Functions 提供</p></div>
          <span class="cloud-badge" :class="{ 'is-on': cloudMode === 'cloud' }">{{ syncLabel }}</span>
        </div>
        <div class="cloud-caps">
          <span v-for="(on, key) in (caps || {})" :key="key" class="cloud-cap" :class="{ 'is-on': on }">
            <Check v-if="on" :size="12" /><TriangleAlert v-else :size="12" /> {{ capLabel(String(key)) }}
          </span>
        </div>
        <div class="security-note"><Server :size="15" /><span>云端模式下管理员密码、GitHub Token 与 AI Key 都保存在 Vercel 环境变量，浏览器只持有 HttpOnly 会话 Cookie。未连接时自动回退为本地模式（配置存 localStorage），功能不会中断。</span></div>
        <div class="github-actions">
          <button class="btn btn-ghost btn-sm" :disabled="syncingNow" @click="syncNow"><Loader2 v-if="syncingNow" :size="14" class="spin" /><RefreshCw v-else :size="14" /> 立即同步配置</button>
          <span class="cloud-hint"><Brain :size="13" /> AI：{{ aiLabel }}</span>
        </div>
      </section>

      <!-- brand -->
      <section v-reveal class="admin-card glass">
        <div class="card-title"><span><Settings :size="17" /></span><div><h3>基本信息</h3><p>展示在前台各处的品牌信息</p></div></div>
        <div class="form-grid">
          <div class="field"><label>站点名称</label><input v-model="form.title" class="input" /></div>
          <div class="field"><label>作者名</label><input v-model="form.author" class="input" /></div>
          <div class="field field-2"><label>副标题</label><input v-model="form.subtitle" class="input" /></div>
          <div class="field field-2"><label>站点描述</label><input v-model="form.description" class="input" /></div>
          <div class="field"><label>作者角色</label><input v-model="form.authorRole" class="input" /></div>
          <div class="field"><label>头像 Emoji</label><input v-model="form.avatar" class="input" maxlength="4" /></div>
          <div class="field field-2"><label>页脚文字</label><input v-model="form.footerNote" class="input" /></div>
        </div>
      </section>

      <!-- appearance -->
      <section v-reveal="80" class="admin-card glass">
        <div class="card-title"><span><Palette :size="17" /></span><div><h3>外观与主题</h3><p>亮暗模式、强调色与动效</p></div></div>
        <div class="setting-row">
          <div><strong>当前主题</strong><small>跟随浏览器偏好，也可手动切换</small></div>
          <button class="btn btn-ghost btn-sm" @click="site.toggleTheme()"><Sun v-if="site.isDark" :size="15" /><Moon v-else :size="15" /> {{ site.isDark ? '切换亮色' : '切换暗色' }}</button>
        </div>
        <div class="setting-row">
          <div><strong>强调色</strong><small>影响按钮、链接与渐变光晕</small></div>
          <div class="accent-picker">
            <button v-for="c in accents" :key="c" class="accent-dot" :class="{ 'is-active': form.accent.toLowerCase() === c }" :style="{ background: c }" :aria-label="c" @click="form.accent = c" />
            <input v-model="form.accent" type="color" class="accent-custom" aria-label="自定义颜色" />
          </div>
        </div>
        <div class="setting-row">
          <div><strong>首页每页文章数</strong><small>超出后自动分页</small></div>
          <input v-model.number="form.postsPerPage" type="number" min="1" max="30" class="input number-input" />
        </div>
        <div class="setting-row">
          <div><strong>背景粒子动效</strong><small>极光背景中的连线粒子</small></div>
          <button class="switch" :class="{ 'is-on': form.showParticles }" @click="form.showParticles = !form.showParticles" />
        </div>
        <div class="setting-row">
          <div><strong>首页 Hero 横幅</strong><small>「记录思考，分享创造的光」展示区</small></div>
          <button class="switch" :class="{ 'is-on': form.showHero }" @click="form.showHero = !form.showHero" />
        </div>
        <div class="setting-row">
          <div><strong>访客可自行收起横幅</strong><small>前台显示收起 / 展开按钮，偏好保存在访客设备</small></div>
          <button class="switch" :class="{ 'is-on': form.allowHeroToggle }" @click="form.allowHeroToggle = !form.allowHeroToggle" />
        </div>
      </section>

      <!-- features -->
      <section v-reveal class="admin-card glass">
        <div class="card-title"><span><Brain :size="17" /></span><div><h3>功能与交互</h3><p>AI 摘要、点赞、书签、公告</p></div></div>
        <div class="setting-row">
          <div><strong>文章 AI 摘要</strong><small>文章页展示摘要卡片，可在编辑器一键生成</small></div>
          <button class="switch" :class="{ 'is-on': form.showAiSummary }" @click="form.showAiSummary = !form.showAiSummary" />
        </div>
        <div class="setting-row">
          <div><strong>文章点赞</strong><small>云端计数，未连接时记在本机</small></div>
          <button class="switch" :class="{ 'is-on': form.enableLikes }" @click="form.enableLikes = !form.enableLikes" />
        </div>
        <div class="setting-row">
          <div><strong>稍后读书签</strong><small>卡片与文章页可收藏，专属 /bookmarks 页面</small></div>
          <button class="switch" :class="{ 'is-on': form.enableBookmarks }" @click="form.enableBookmarks = !form.enableBookmarks" />
        </div>
        <div class="setting-row">
          <div><strong>站点公告条</strong><small>显示在导航栏下方，访客可关闭</small></div>
          <button class="switch" :class="{ 'is-on': form.showAnnouncement }" @click="form.showAnnouncement = !form.showAnnouncement" />
        </div>
        <div class="field" style="margin-top: 14px"><label>公告文字</label><input v-model="form.announcement" class="input" placeholder="例如：新文章已上线" /></div>
        <div class="field" style="margin-top: 12px"><label>公告链接（可选）</label><input v-model="form.announcementUrl" class="input" placeholder="https://" /></div>
        <div class="status-note" :class="cloudHealth?.ai === 'llm' ? 'is-ok' : 'is-warn'">
          <Brain :size="15" /><span>{{ aiLabel }}。在 Vercel 配置 AI_API_KEY / AI_BASE_URL / AI_MODEL 可升级为模型生成；未配置时自动使用离线提取式摘要。</span>
        </div>
      </section>

      <!-- comments -->
      <section v-reveal="160" class="admin-card glass">
        <div class="card-title"><span><MessageCircle :size="17" /></span><div><h3>评论设置</h3><p>Twikoo 环境 ID，保存后立即生效</p></div></div>
        <div class="field">
          <label>Twikoo envId</label>
          <input v-model="form.twikooEnvId" class="input" placeholder="例如：your-env-id 或 https://xxx.vercel.app" />
          <span class="field-hint">留空则前台显示「评论功能尚未启用」引导卡片。无需重新构建站点。</span>
        </div>
        <div class="status-note" :class="form.twikooEnvId ? 'is-ok' : 'is-warn'">
          <Check v-if="form.twikooEnvId" :size="15" /><TriangleAlert v-else :size="15" />
          <span>{{ form.twikooEnvId ? '评论系统已配置，刷新文章页即可加载' : '尚未配置，评论区域会显示部署引导' }}</span>
        </div>
        <RouterLink to="/admin/comments" class="btn btn-ghost btn-sm" style="margin-top: 14px"><MessageCircle :size="14" /> 查看部署指引 <ExternalLink :size="13" /></RouterLink>
      </section>

      <!-- github -->
      <section v-reveal="240" class="admin-card glass">
        <div class="card-title"><span><BrandGithub :size="17" /></span><div><h3>GitHub 自动部署</h3><p>发布文章时使用 GitHub API 提交</p></div></div>
        <div class="form-grid">
          <div class="field"><label>仓库所有者</label><input v-model="form.github.owner" class="input" placeholder="your-username" /></div>
          <div class="field"><label>仓库名</label><input v-model="form.github.repo" class="input" placeholder="aurora-blog" /></div>
          <div class="field"><label>分支</label><input v-model="form.github.branch" class="input" placeholder="main" /></div>
          <div class="field"><label>Personal Access Token</label><input v-model="form.github.token" type="password" class="input" placeholder="github_pat_… 或 ghp_…" autocomplete="off" /></div>
        </div>
        <div class="security-note"><Shield :size="15" /><span>请使用仅授予该仓库 <strong>Contents: read &amp; write</strong> 的细粒度 Token。Token 只保存在本机浏览器 localStorage，不会提交到仓库或打包进静态资源。</span></div>
        <div class="github-actions">
          <button class="btn btn-ghost btn-sm" :disabled="testing" @click="testConnection"><Loader2 v-if="testing" :size="14" class="spin" /><Link2 v-else :size="14" /> 测试连接</button>
          <span v-if="repoOk === true" class="test-result is-ok"><Check :size="13" /> 连接正常</span>
          <span v-else-if="repoOk === false" class="test-result is-bad"><TriangleAlert :size="13" /> 连接失败</span>
        </div>
      </section>

      <!-- friend links -->
      <section v-reveal class="admin-card glass settings-wide">
        <div class="card-title"><span><Link2 :size="17" /></span><div><h3>友链管理</h3><p>展示在前台 /links 页面，保存后同步到云端</p></div></div>
        <div class="link-list">
          <div v-for="(item, i) in form.links" :key="i" class="link-row">
            <input v-model="item.avatar" class="input link-avatar" maxlength="4" placeholder="✦" />
            <input v-model="item.name" class="input" placeholder="名称" />
            <input v-model="item.url" class="input" placeholder="https://" />
            <input v-model="item.desc" class="input" placeholder="一句话简介" />
            <button class="btn btn-icon btn-ghost btn-sm btn-danger" aria-label="删除" @click="removeLink(i)"><Trash2 :size="14" /></button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-top: 12px" @click="addLink"><Plus :size="14" /> 添加友链</button>
      </section>

      <!-- social -->
      <section v-reveal class="admin-card glass settings-wide">
        <div class="card-title"><span><Link2 :size="17" /></span><div><h3>社交链接</h3><p>展示在页脚与关于页</p></div></div>
        <div class="social-list">
          <div v-for="(item, i) in form.social" :key="i" class="social-row">
            <input v-model="item.label" class="input" placeholder="名称" />
            <input v-model="item.href" class="input" placeholder="链接" />
            <select v-model="item.icon" class="select"><option v-for="opt in iconOptions" :key="opt" :value="opt">{{ opt }}</option></select>
            <button class="btn btn-icon btn-ghost btn-sm btn-danger" aria-label="删除" @click="removeSocial(i)"><Trash2 :size="14" /></button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-top: 12px" @click="addSocial"><Plus :size="14" /> 添加链接</button>
      </section>
    </div>

    <div v-reveal class="save-bar glass">
      <div><Sparkles :size="16" /><span>{{ dirty ? '有未保存的修改' : '所有修改均已保存' }}</span></div>
      <button class="btn btn-primary btn-sm" @click="save"><Save :size="14" /> 保存设置</button>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
.page-head h1 { font-size: clamp(26px, 3vw, 34px); font-weight: 780; letter-spacing: -.04em; margin: 8px 0; }
.page-head p { margin: 0; font-size: 13.5px; color: var(--text-muted); }
.page-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.settings-wide { grid-column: 1 / -1; }
.card-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.card-title > span { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.card-title h3 { margin: 0 0 3px; font-size: 15px; }
.card-title p { margin: 0; font-size: 11.5px; color: var(--text-muted); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field-2 { grid-column: 1 / -1; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 0; border-bottom: 1px solid var(--border); }
.setting-row:last-child { border-bottom: 0; }
.setting-row > div:first-child { display: flex; flex-direction: column; gap: 3px; }
.setting-row strong { font-size: 13px; }
.setting-row small { font-size: 11.5px; color: var(--text-muted); }
.number-input { width: 84px; text-align: center; }
.accent-picker { display: flex; gap: 8px; align-items: center; }
.accent-dot { width: 24px; height: 24px; border: 2px solid transparent; border-radius: 50%; padding: 0; transition: transform .3s var(--ease), box-shadow .3s ease; }
.accent-dot:hover { transform: scale(1.18); }
.accent-dot.is-active { box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--accent); transform: scale(1.12); }
.accent-custom { width: 28px; height: 28px; padding: 0; border: 1px solid var(--border); border-radius: 8px; background: transparent; cursor: pointer; }
.status-note { display: flex; align-items: center; gap: 9px; margin-top: 16px; padding: 11px 14px; border-radius: 10px; font-size: 12px; }
.status-note.is-ok { background: rgba(16,185,129,.09); color: var(--success); }
.status-note.is-warn { background: rgba(245,158,11,.09); color: var(--warning); }
.security-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: rgba(var(--accent-rgb), .06); font-size: 11.5px; line-height: 1.75; color: var(--text-muted); }
.security-note svg { color: var(--accent); flex: none; margin-top: 2px; }
.github-actions { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.test-result { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 650; }
.test-result.is-ok { color: var(--success); }
.test-result.is-bad { color: var(--danger); }
.social-list { display: flex; flex-direction: column; gap: 9px; }
.social-row { display: grid; grid-template-columns: 1fr 2fr 120px 34px; gap: 9px; align-items: center; }
.save-bar { position: sticky; bottom: 14px; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 18px; padding: 12px 18px; }
.save-bar > div { display: inline-flex; align-items: center; gap: 9px; font-size: 12.5px; color: var(--text-soft); }
.save-bar svg { color: var(--accent); }
.spin { animation: spin 1s linear infinite; }
.cloud-card { border-color: rgba(var(--accent-rgb), .28); }
.cloud-badge { margin-left: auto; padding: 5px 11px; border-radius: 999px; background: var(--bg-2); color: var(--text-muted); font-size: 11px; font-weight: 650; white-space: nowrap; }
.cloud-badge.is-on { background: rgba(16,185,129,.12); color: var(--success); }
.cloud-caps { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 16px; }
.cloud-cap { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-solid); font-size: 11.5px; color: var(--text-muted); }
.cloud-cap.is-on { color: var(--success); border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.07); }
.cloud-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.link-list { display: flex; flex-direction: column; gap: 9px; }
.link-row { display: grid; grid-template-columns: 64px 1fr 1.6fr 1.6fr 34px; gap: 9px; align-items: center; }
.link-avatar { text-align: center; }
@media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } .social-row { grid-template-columns: 1fr 1fr; } .link-row { grid-template-columns: 60px 1fr 1.4fr 34px; } .link-row .input:nth-child(4) { display: none; } }
@media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } .field-2 { grid-column: auto; } .social-row { grid-template-columns: 1fr; } .link-row { grid-template-columns: 52px 1fr 34px; } .link-row .input:nth-child(3) { display: none; } }
</style>
