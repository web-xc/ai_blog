<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Save, UploadCloud, Eye, PenLine, Bold, Italic, Heading1, Heading2,
  Link2, Code2, Quote, List, Image, Minus, Check, X, Loader2, FileText, Info, Sparkles,
} from '@lucide/vue'
import { useAdminStore, type Draft } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import { renderPreview } from '@/lib/markdown'
import { publishPost, slugify } from '@/lib/github'
import { notify, updateToast } from '@/lib/toast'

const admin = useAdminStore()
const site = useSiteStore()
const route = useRoute()
const router = useRouter()

const draft = ref<Draft | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)
const metaOpen = ref(true)
const saved = ref(true)
const mobilePane = ref<'edit' | 'preview'>('edit')
const showPublish = ref(false)
const publishing = ref(false)
let saveTimer = 0

const previewHtml = computed(() => (draft.value ? renderPreview(draft.value.content) : ''))
const wordCount = computed(() => (draft.value?.content.replace(/\s/g, '').length || 0))
const lineCount = computed(() => (draft.value?.content.split('\n').length || 0))
const githubReady = computed(() => Boolean(site.config.github.owner && site.config.github.repo && site.config.github.token))
const targetPath = computed(() => (draft.value ? `src/content/posts/${slugify(draft.value.slug)}.md` : ''))

function load() {
  const id = String(route.params.id || '')
  if (id === 'new') {
    const created = admin.newDraft()
    // Show the editor immediately; the URL replace is only cosmetic.
    draft.value = { ...created }
    void router.replace(`/admin/editor/${created.id}`)
    return
  }
  const found = admin.getDraft(id)
  if (!found) {
    notify('草稿不存在或已被删除', 'error')
    void router.replace('/admin/posts')
    return
  }
  draft.value = { ...found }
}

function persist(showToast = false) {
  if (!draft.value) return
  admin.saveDraft(draft.value)
  saved.value = true
  if (showToast) notify('草稿已保存')
}

function scheduleSave() {
  saved.value = false
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => persist(), 900)
}

function insert(before: string, after = '', placeholder = '') {
  const ta = textarea.value
  if (!ta || !draft.value) return
  const { selectionStart: start, selectionEnd: end } = ta
  const selected = draft.value.content.slice(start, end) || placeholder
  const content = draft.value.content
  draft.value.content = content.slice(0, start) + before + selected + after + content.slice(end)
  void nextTick(() => {
    ta.focus()
    ta.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
  scheduleSave()
}

const tools = [
  { icon: Heading1, title: '一级标题', fn: () => insert('\n# ', '', '标题') },
  { icon: Heading2, title: '二级标题', fn: () => insert('\n## ', '', '小节标题') },
  { icon: Bold, title: '加粗', fn: () => insert('**', '**', '加粗文字') },
  { icon: Italic, title: '斜体', fn: () => insert('*', '*', '斜体文字') },
  { icon: Link2, title: '链接', fn: () => insert('[', '](https://)', '链接文字') },
  { icon: Code2, title: '代码块', fn: () => insert('\n```ts\n', '\n```\n', '// your code') },
  { icon: Quote, title: '引用', fn: () => insert('\n> ', '', '引用内容') },
  { icon: List, title: '列表', fn: () => insert('\n- ', '', '列表项') },
  { icon: Image, title: '图片', fn: () => insert('![', '](https://)', '图片描述') },
  { icon: Minus, title: '分隔线', fn: () => insert('\n\n---\n\n') },
]

async function openPublish() {
  persist()
  if (!githubReady.value) {
    notify('请先在「站点设置」中填写 GitHub 仓库信息与 Token', 'error', 5000)
    void router.push('/admin/settings')
    return
  }
  showPublish.value = true
}

async function confirmPublish() {
  if (!draft.value) return
  publishing.value = true
  const toastId = notify(`正在提交「${draft.value.title}」…`, 'loading', 0)
  try {
    const result = await publishPost(site.config.github, draft.value)
    admin.markPublished(draft.value.id)
    showPublish.value = false
    updateToast(toastId, `${result.created ? '发布' : '更新'}成功！GitHub Actions 正在部署`, 'success', 6500)
  } catch (e) {
    updateToast(toastId, e instanceof Error ? e.message : '发布失败', 'error', 6000)
  } finally {
    publishing.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    persist(true)
  }
}

watch(
  () => (draft.value ? { ...draft.value } : null),
  () => { if (draft.value) scheduleSave() },
  { deep: true },
)

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  if (draft.value && !saved.value) persist()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="draft" class="editor-page">
    <!-- toolbar -->
    <header class="editor-toolbar glass">
      <RouterLink to="/admin/posts" class="btn btn-icon btn-ghost btn-sm" aria-label="返回"><ArrowLeft :size="17" /></RouterLink>
      <input v-model="draft.title" class="editor-title-input" placeholder="文章标题…" aria-label="文章标题" />
      <span class="save-state" :class="{ 'is-dirty': !saved }"><Check v-if="saved" :size="13" /><Loader2 v-else :size="13" class="spin" /> {{ saved ? '已保存' : '保存中…' }}</span>
      <div class="spacer" />
      <button class="btn btn-ghost btn-sm editor-save" @click="persist(true)"><Save :size="14" /> 保存</button>
      <button class="btn btn-primary btn-sm" @click="openPublish"><UploadCloud :size="14" /> 发布上线</button>
    </header>

    <!-- meta -->
    <section class="editor-meta glass">
      <button class="editor-meta__toggle" @click="metaOpen = !metaOpen">
        <Info :size="15" /> 文章元数据 <span>{{ metaOpen ? '收起' : '展开' }}</span>
      </button>
      <Transition name="meta">
        <div v-if="metaOpen" class="editor-meta__grid">
          <div class="field"><label>URL Slug</label><input v-model="draft.slug" class="input" placeholder="my-first-post" /></div>
          <div class="field"><label>发布日期</label><input v-model="draft.date" type="date" class="input" /></div>
          <div class="field"><label>分类</label><input v-model="draft.category" class="input" placeholder="前端工程" /></div>
          <div class="field"><label>标签（逗号分隔）</label><input v-model="draft.tags" class="input" placeholder="Vue 3, Vite, 设计" /></div>
          <div class="field"><label>封面 Emoji</label><input v-model="draft.cover" class="input" maxlength="4" /></div>
          <label class="switch-row"><span>置顶文章</span><button class="switch" :class="{ 'is-on': draft.pinned }" @click="draft.pinned = !draft.pinned" /></label>
          <div class="field field-wide"><label>摘要</label><textarea v-model="draft.excerpt" class="textarea" style="min-height: 68px" placeholder="留空则自动截取正文前 100 字" /></div>
        </div>
      </Transition>
    </section>

    <!-- panes -->
    <div class="editor-panes">
      <div class="pane-switch">
        <button :class="{ 'is-active': mobilePane === 'edit' }" @click="mobilePane = 'edit'"><PenLine :size="14" /> 编辑</button>
        <button :class="{ 'is-active': mobilePane === 'preview' }" @click="mobilePane = 'preview'"><Eye :size="14" /> 预览</button>
      </div>

      <section class="pane pane--edit glass" :class="{ 'is-hidden-mobile': mobilePane !== 'edit' }">
        <div class="pane__head">
          <span><PenLine :size="14" /> Markdown 编辑器</span>
          <div class="md-tools">
            <button v-for="(t, i) in tools" :key="i" :title="t.title" :aria-label="t.title" @click="t.fn()"><component :is="t.icon" :size="15" /></button>
          </div>
        </div>
        <textarea
          ref="textarea"
          v-model="draft.content"
          class="editor-textarea"
          spellcheck="false"
          placeholder="## 从这里开始&#10;&#10;用 Markdown 写下你的想法…"
        />
        <div class="pane__foot"><span>{{ wordCount }} 字符 · {{ lineCount }} 行</span><span><Sparkles :size="12" /> 支持实时预览</span></div>
      </section>

      <section class="pane pane--preview glass" :class="{ 'is-hidden-mobile': mobilePane !== 'preview' }">
        <div class="pane__head"><span><Eye :size="14" /> 实时预览</span><span class="pane__badge">LIVE</span></div>
        <div class="pane__preview md-body" v-html="previewHtml" />
      </section>
    </div>

    <!-- publish dialog -->
    <Transition name="overlay">
      <div v-if="showPublish" class="dialog-mask" @click.self="showPublish = false">
        <div class="dialog glass">
          <button class="dialog__close" aria-label="关闭" @click="showPublish = false"><X :size="17" /></button>
          <div class="dialog__icon"><UploadCloud :size="26" /></div>
          <h2>确认发布到 GitHub？</h2>
          <p>文章会以 Markdown 文件提交到仓库，并自动触发 GitHub Actions 重新构建部署。</p>
          <div class="dialog__info">
            <div><span>标题</span><strong>{{ draft.title }}</strong></div>
            <div><span>仓库</span><strong>{{ site.config.github.owner }}/{{ site.config.github.repo }}</strong></div>
            <div><span>分支</span><strong>{{ site.config.github.branch }}</strong></div>
            <div><span>路径</span><strong class="mono">{{ targetPath }}</strong></div>
          </div>
          <div class="dialog__actions">
            <button class="btn btn-ghost btn-sm" @click="showPublish = false">再改改</button>
            <button class="btn btn-primary btn-sm" :disabled="publishing" @click="confirmPublish">
              <Loader2 v-if="publishing" :size="14" class="spin" /><UploadCloud v-else :size="14" /> 确认发布
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <div v-else class="editor-loading"><FileText :size="22" /> 正在载入编辑器…</div>
</template>

<style scoped>
.editor-page { display: flex; flex-direction: column; gap: 14px; }
.editor-toolbar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--radius); }
.editor-title-input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 17px; font-weight: 700; letter-spacing: -.02em; padding: 6px 4px; }
.editor-title-input::placeholder { color: var(--text-muted); font-weight: 500; }
.save-state { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }
.save-state svg { color: var(--success); }
.save-state.is-dirty svg { color: var(--warning); }

.editor-meta { padding: 14px 18px; border-radius: var(--radius); }
.editor-meta__toggle { display: inline-flex; align-items: center; gap: 8px; border: 0; background: transparent; color: var(--text); font-size: 13px; font-weight: 700; padding: 0; }
.editor-meta__toggle svg { color: var(--accent); }
.editor-meta__toggle span { font-size: 11.5px; font-weight: 550; color: var(--text-muted); margin-left: 4px; }
.editor-meta__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 16px; }
.field-wide { grid-column: 1 / -1; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; align-self: end; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-solid); font-size: 13px; font-weight: 650; }
.meta-enter-active, .meta-leave-active { transition: opacity .3s ease, transform .35s var(--ease); }
.meta-enter-from, .meta-leave-to { opacity: 0; transform: translateY(-8px); }

.editor-panes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; min-height: 560px; }
.pane { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.pane__head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 12px; font-weight: 700; color: var(--text-soft); }
.pane__head > span:first-child { display: inline-flex; align-items: center; gap: 7px; }
.pane__head svg { color: var(--accent); }
.md-tools { display: flex; flex-wrap: wrap; gap: 2px; margin-left: auto; }
.md-tools button { width: 27px; height: 27px; display: grid; place-items: center; border: 0; border-radius: 7px; background: transparent; color: var(--text-muted); transition: all .25s ease; }
.md-tools button:hover { color: var(--accent); background: rgba(var(--accent-rgb), .1); transform: translateY(-1px); }
.md-tools button svg { color: inherit; }
.pane__badge { margin-left: auto; font: 700 9.5px var(--font-mono); letter-spacing: .12em; color: var(--success); padding: 3px 8px; border-radius: 99px; background: rgba(16,185,129,.1); }
.editor-textarea { flex: 1; width: 100%; min-height: 460px; padding: 18px; border: 0; outline: none; resize: vertical; background: transparent; color: var(--text); font: 13.5px/1.9 var(--font-mono); tab-size: 2; }
.editor-textarea::placeholder { color: var(--text-muted); }
.pane__preview { flex: 1; padding: 22px 24px; overflow-y: auto; max-height: 640px; }
.pane__foot { display: flex; justify-content: space-between; gap: 10px; padding: 9px 14px; border-top: 1px solid var(--border); font: 600 11px var(--font-mono); color: var(--text-muted); }
.pane__foot span:last-child { display: inline-flex; align-items: center; gap: 5px; }
.pane-switch { display: none; }

.dialog-mask { position: fixed; inset: 0; z-index: 150; display: grid; place-items: center; padding: 20px; background: rgba(10,13,24,.5); backdrop-filter: blur(6px); }
.dialog { position: relative; width: min(460px, 100%); padding: 32px; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); text-align: center; animation: pop-in .35s var(--ease) both; }
.dialog__close { position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: var(--text-muted); }
.dialog__close:hover { background: rgba(var(--accent-rgb), .1); color: var(--accent); }
.dialog__icon { width: 58px; height: 58px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: 18px; background: rgba(var(--accent-rgb), .12); color: var(--accent); }
.dialog h2 { font-size: 20px; margin: 0 0 8px; }
.dialog > p { font-size: 13px; line-height: 1.8; color: var(--text-muted); margin: 0 0 20px; }
.dialog__info { text-align: left; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 22px; }
.dialog__info > div { display: flex; justify-content: space-between; gap: 12px; padding: 9px 14px; border-bottom: 1px solid var(--border); font-size: 12px; }
.dialog__info > div:last-child { border-bottom: 0; }
.dialog__info span { color: var(--text-muted); flex: none; }
.dialog__info strong { font-weight: 650; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dialog__actions { display: flex; justify-content: center; gap: 10px; }
.overlay-enter-active, .overlay-leave-active { transition: opacity .3s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.editor-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 80px 0; color: var(--text-muted); }
.spin { animation: spin 1s linear infinite; }

@media (max-width: 1000px) { .editor-meta__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) {
  .editor-panes { grid-template-columns: 1fr; }
  .pane-switch { display: flex; gap: 6px; }
  .pane-switch button { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text-muted); font-size: 12.5px; font-weight: 650; }
  .pane-switch button.is-active { color: #fff; background: var(--accent); border-color: transparent; }
  .is-hidden-mobile { display: none; }
  .editor-meta__grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
  .editor-save { display: none; }
}
</style>
