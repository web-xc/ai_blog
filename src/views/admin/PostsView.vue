<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Plus, UploadCloud, Trash2, PenLine, ExternalLink, RefreshCw, Search, Settings, Check, Clock, Loader2, FilePlus2 } from '@lucide/vue'
import { getPosts, formatDate } from '@/lib/posts'
import { useAdminStore, type Draft } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import { publishPost, listRemotePosts, deleteRemotePost, type RemoteFile } from '@/lib/github'
import { notify, updateToast } from '@/lib/toast'

const admin = useAdminStore()
const site = useSiteStore()
const router = useRouter()

const published = getPosts()
const tab = ref<'drafts' | 'online' | 'remote'>('drafts')
const query = ref('')
const remoteFiles = ref<RemoteFile[]>([])
const remoteLoading = ref(false)
const remoteLoaded = ref(false)
const publishingId = ref('')

const drafts = computed(() =>
  admin.drafts.filter(
    (d) => !query.value || `${d.title} ${d.slug} ${d.category} ${d.tags}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
)
const online = computed(() =>
  published.filter((p) => !query.value || `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(query.value.toLowerCase())),
)
const remote = computed(() => remoteFiles.value.filter((f) => !query.value || f.name.toLowerCase().includes(query.value.toLowerCase())))
const githubReady = computed(() => Boolean(site.config.github.owner && site.config.github.repo && site.config.github.token))

function createPost() {
  router.push('/admin/editor/new')
}

function ensureGithub(): boolean {
  if (githubReady.value) return true
  notify('请先在「站点设置」中填写 GitHub 仓库信息与 Token', 'error', 5000)
  router.push('/admin/settings')
  return false
}

async function publish(draft: Draft) {
  if (!ensureGithub()) return
  publishingId.value = draft.id
  const toastId = notify(`正在提交「${draft.title}」到 GitHub…`, 'loading', 0)
  try {
    const result = await publishPost(site.config.github, draft)
    admin.markPublished(draft.id)
    updateToast(toastId, `${result.created ? '发布' : '更新'}成功！GitHub Actions 正在自动部署`, 'success', 6500)
  } catch (e) {
    updateToast(toastId, e instanceof Error ? e.message : '发布失败', 'error', 6000)
  } finally {
    publishingId.value = ''
  }
}

function removeDraft(draft: Draft) {
  if (!window.confirm(`确定删除草稿「${draft.title}」吗？此操作不可撤销。`)) return
  admin.deleteDraft(draft.id)
  notify('草稿已删除', 'info')
}

function switchRemote() {
  tab.value = 'remote'
  if (!remoteLoaded.value) void loadRemote()
}

async function loadRemote() {
  if (!ensureGithub()) return
  remoteLoading.value = true
  try {
    remoteFiles.value = await listRemotePosts(site.config.github)
    remoteLoaded.value = true
    notify(`已同步 ${remoteFiles.value.length} 个仓库文件`)
  } catch (e) {
    notify(e instanceof Error ? e.message : '同步失败', 'error')
  } finally {
    remoteLoading.value = false
  }
}

async function removeRemote(file: RemoteFile) {
  if (!window.confirm(`确定从仓库删除「${file.name}」吗？提交后会自动触发重新部署。`)) return
  const toastId = notify('正在删除仓库文件…', 'loading', 0)
  try {
    await deleteRemotePost(site.config.github, file)
    remoteFiles.value = remoteFiles.value.filter((f) => f.sha !== file.sha)
    updateToast(toastId, '已删除，Actions 正在重新部署', 'success', 5000)
  } catch (e) {
    updateToast(toastId, e instanceof Error ? e.message : '删除失败', 'error', 6000)
  }
}
</script>

<template>
  <div class="posts-admin">
    <header v-reveal class="page-head">
      <div>
        <span class="section-kicker">Content</span>
        <h1>文章<span class="gradient-text">管理</span></h1>
        <p>管理本地草稿、已上线文章，以及远程仓库中的 Markdown 文件。</p>
      </div>
      <button class="btn btn-primary" @click="createPost"><Plus :size="16" /> 新建文章</button>
    </header>

    <div v-reveal class="toolbar glass">
      <div class="tabs">
        <button :class="{ 'is-active': tab === 'drafts' }" @click="tab = 'drafts'">本地草稿 <em>{{ admin.drafts.length }}</em></button>
        <button :class="{ 'is-active': tab === 'online' }" @click="tab = 'online'">已上线 <em>{{ published.length }}</em></button>
        <button :class="{ 'is-active': tab === 'remote' }" @click="switchRemote">仓库文件 <em>{{ remoteFiles.length }}</em></button>
      </div>
      <div class="toolbar__right">
        <div class="toolbar__search"><Search :size="15" /><input v-model="query" placeholder="筛选…" /></div>
        <button v-if="tab === 'remote'" class="btn btn-ghost btn-sm" :disabled="remoteLoading" @click="loadRemote">
          <RefreshCw :size="14" :class="{ spin: remoteLoading }" /> 同步
        </button>
      </div>
    </div>

    <!-- drafts -->
    <div v-if="tab === 'drafts'" v-reveal class="admin-card glass table-card">
      <div v-if="drafts.length" class="table-scroll">
        <table class="data-table">
          <thead><tr><th>文章</th><th>分类 / 标签</th><th>更新时间</th><th>状态</th><th style="text-align: right">操作</th></tr></thead>
          <tbody>
            <tr v-for="d in drafts" :key="d.id">
              <td>
                <div class="cell-title"><span class="cell-title__emoji">{{ d.cover }}</span><div><strong>{{ d.title }}</strong><small>/{{ d.slug }}.md</small></div></div>
              </td>
              <td><span class="chip chip-accent">{{ d.category }}</span> <span class="cell-muted">{{ d.tags || '—' }}</span></td>
              <td class="cell-muted">{{ new Date(d.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</td>
              <td><span class="status" :class="d.published ? 'is-ok' : 'is-pending'"><Check v-if="d.published" :size="12" /><Clock v-else :size="12" /> {{ d.published ? '已提交' : '草稿' }}</span></td>
              <td>
                <div class="row-actions">
                  <RouterLink :to="`/admin/editor/${d.id}`" class="btn btn-ghost btn-sm"><PenLine :size="13" /> 编辑</RouterLink>
                  <button class="btn btn-ghost btn-sm" :disabled="publishingId === d.id" @click="publish(d)">
                    <Loader2 v-if="publishingId === d.id" :size="13" class="spin" /><UploadCloud v-else :size="13" /> 发布
                  </button>
                  <button class="btn btn-icon btn-ghost btn-sm btn-danger" aria-label="删除" @click="removeDraft(d)"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state__icon"><FilePlus2 :size="26" /></div>
        <h3>{{ query ? '没有匹配的草稿' : '还没有草稿' }}</h3>
        <p>新建一篇文章，用 Markdown 开始写作。</p>
        <button class="btn btn-primary btn-sm" @click="createPost"><Plus :size="14" /> 新建文章</button>
      </div>
    </div>

    <!-- online -->
    <div v-else-if="tab === 'online'" v-reveal class="admin-card glass table-card">
      <div v-if="online.length" class="table-scroll">
        <table class="data-table">
          <thead><tr><th>文章</th><th>分类</th><th>发布日期</th><th>字数</th><th style="text-align: right">操作</th></tr></thead>
          <tbody>
            <tr v-for="p in online" :key="p.slug">
              <td><div class="cell-title"><span class="cell-title__emoji">{{ p.cover }}</span><div><strong>{{ p.title }}</strong><small>/{{ p.slug }}.md</small></div></div></td>
              <td><span class="chip chip-accent">{{ p.category }}</span></td>
              <td class="cell-muted">{{ formatDate(p.date) }}</td>
              <td class="cell-muted">{{ p.wordCount.toLocaleString('zh-CN') }}</td>
              <td><div class="row-actions"><RouterLink :to="`/post/${p.slug}`" class="btn btn-ghost btn-sm"><ExternalLink :size="13" /> 查看</RouterLink></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><div class="empty-state__icon"><FileText :size="26" /></div><h3>暂无已上线文章</h3><p>在仓库的 src/content/posts/ 目录添加 Markdown 文件即可。</p></div>
    </div>

    <!-- remote -->
    <div v-else v-reveal class="admin-card glass table-card">
      <div v-if="remoteLoading" class="loading-box"><Loader2 :size="20" class="spin" /> 正在读取仓库文件…</div>
      <div v-else-if="!githubReady" class="empty-state">
        <div class="empty-state__icon"><Settings :size="26" /></div>
        <h3>尚未连接 GitHub 仓库</h3>
        <p>填写仓库信息与 Token 后，即可在后台直接管理仓库中的文章文件。</p>
        <RouterLink to="/admin/settings" class="btn btn-primary btn-sm"><Settings :size="14" /> 前往设置</RouterLink>
      </div>
      <div v-else-if="!remoteLoaded" class="empty-state">
        <div class="empty-state__icon"><UploadCloud :size="26" /></div>
        <h3>读取仓库内容</h3>
        <p>同步 src/content/posts/ 目录下的 Markdown 文件。</p>
        <button class="btn btn-primary btn-sm" @click="loadRemote"><RefreshCw :size="14" /> 立即同步</button>
      </div>
      <div v-else-if="remote.length" class="table-scroll">
        <table class="data-table">
          <thead><tr><th>文件</th><th>路径</th><th>SHA</th><th style="text-align: right">操作</th></tr></thead>
          <tbody>
            <tr v-for="f in remote" :key="f.sha">
              <td><strong style="color: var(--text)">{{ f.name }}</strong></td>
              <td class="mono cell-muted">{{ f.path }}</td>
              <td class="mono cell-muted">{{ f.sha.slice(0, 8) }}</td>
              <td><div class="row-actions"><button class="btn btn-icon btn-ghost btn-sm btn-danger" aria-label="删除文件" @click="removeRemote(f)"><Trash2 :size="14" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><div class="empty-state__icon"><FileText :size="26" /></div><h3>仓库中没有 Markdown 文件</h3><p>发布一篇草稿试试吧。</p></div>
    </div>

    <div v-reveal class="hint-card glass">
      <UploadCloud :size="18" />
      <div><strong>发布说明</strong><p>点击「发布」会通过 GitHub Contents API 把 Markdown 文件提交到仓库，推送事件将自动触发 GitHub Actions 构建并部署。通常需要 1–2 分钟生效。</p></div>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
.page-head h1 { font-size: clamp(26px, 3vw, 34px); font-weight: 780; letter-spacing: -.04em; margin: 8px 0; }
.page-head p { margin: 0; font-size: 13.5px; color: var(--text-muted); }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; margin-bottom: 16px; flex-wrap: wrap; }
.tabs { display: flex; gap: 4px; }
.tabs button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: 0; border-radius: 9px; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 650; transition: all .28s var(--ease); }
.tabs button:hover { color: var(--accent); background: rgba(var(--accent-rgb), .07); }
.tabs button.is-active { color: var(--accent); background: rgba(var(--accent-rgb), .13); }
.tabs em { font-style: normal; font: 600 10.5px var(--font-mono); padding: 2px 6px; border-radius: 99px; background: var(--border); color: var(--text-muted); }
.toolbar__right { display: flex; align-items: center; gap: 10px; }
.toolbar__search { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-muted); }
.toolbar__search input { width: 130px; border: 0; outline: none; background: transparent; color: var(--text); font-size: 12.5px; }
.table-card { padding: 8px 12px; }
.table-scroll { overflow-x: auto; }
.cell-title { display: flex; align-items: center; gap: 11px; min-width: 200px; }
.cell-title__emoji { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 10px; background: rgba(var(--accent-rgb), .1); font-size: 18px; }
.cell-title div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cell-title strong { font-size: 13.5px; color: var(--text); font-weight: 650; }
.cell-title small { font: 500 10.5px var(--font-mono); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
.cell-muted { color: var(--text-muted); font-size: 12px; }
.row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 650; }
.status.is-ok { background: rgba(16,185,129,.12); color: var(--success); }
.status.is-pending { background: rgba(245,158,11,.12); color: var(--warning); }
.hint-card { display: flex; gap: 14px; align-items: flex-start; margin-top: 16px; padding: 18px 20px; }
.hint-card > svg { color: var(--accent); flex: none; margin-top: 2px; }
.hint-card strong { font-size: 13px; }
.hint-card p { margin: 5px 0 0; font-size: 12px; line-height: 1.8; color: var(--text-muted); }
.loading-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 0; color: var(--text-muted); font-size: 13px; }
.empty-state h3 { margin: 0; font-size: 16px; }
.spin { animation: spin 1s linear infinite; }
</style>
