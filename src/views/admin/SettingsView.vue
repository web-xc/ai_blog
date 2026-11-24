<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Settings, Palette, MessageCircle, Link2, Save, RefreshCw, Plus, Trash2,
  Check, TriangleAlert, Shield, Download, Sun, Moon, Sparkles, ExternalLink, Loader2,
} from '@lucide/vue'
import { useSiteStore } from '@/stores/site'
import { defaultSiteConfig, type SiteConfig } from '@/config/site'
import { verifyRepo } from '@/lib/github'
import { notify } from '@/lib/toast'
import BrandGithub from '@/components/BrandGithub.vue'

const site = useSiteStore()
const form = ref<SiteConfig>(JSON.parse(JSON.stringify(site.config)) as SiteConfig)
const testing = ref(false)
const repoOk = ref<boolean | null>(null)

const accents = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b']
const iconOptions = ['github', 'mail', 'rss', 'book', 'code', 'feather', 'heart', 'send', 'link', 'coffee']

const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(site.config))

function save() {
  form.value.title = form.value.title.trim() || defaultSiteConfig.title
  site.updateConfig(form.value)
  notify('站点设置已保存，部分配置立即生效')
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
@media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } .social-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } .field-2 { grid-column: auto; } .social-row { grid-template-columns: 1fr; } }
</style>
