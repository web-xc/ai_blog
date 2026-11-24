<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MessageCircle, Settings, Sparkles, Loader2, TriangleAlert } from '@lucide/vue'
import { useSiteStore } from '@/stores/site'

const props = defineProps<{ slug: string; title: string }>()
const site = useSiteStore()

const CDN = 'https://cdn.jsdelivr.net/npm/twikoo@1/dist/twikoo.all.min.js'
const CDN_BACKUP = 'https://fastly.jsdelivr.net/npm/twikoo@1/dist/twikoo.all.min.js'

type TwikooApi = { init: (options: Record<string, unknown>) => Promise<unknown> }
const twikooWindow = () => window as unknown as { twikoo?: TwikooApi }

const container = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref('')
const envId = computed(() => site.config.twikooEnvId.trim())

let loader: Promise<void> | null = null
function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Twikoo 脚本加载失败'))
    document.head.appendChild(script)
  })
}
async function ensureTwikoo(): Promise<void> {
  if (twikooWindow().twikoo) return
  if (!loader) {
    loader = injectScript(CDN)
      .catch(() => injectScript(CDN_BACKUP))
      .then(() => {
        if (!twikooWindow().twikoo) throw new Error('Twikoo 初始化失败，请检查网络或 CDN 设置')
      })
  }
  return loader
}

async function init() {
  if (!envId.value || !container.value) return
  loading.value = true
  error.value = ''
  try {
    await ensureTwikoo()
    const el = container.value
    if (!el) return
    el.innerHTML = ''
    await twikooWindow().twikoo!.init({
      envId: envId.value,
      el,
      path: `/post/${props.slug}`,
      lang: 'zh-CN',
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '评论加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(init)
watch(envId, () => init())
watch(() => site.isDark, () => { if (envId.value) void init() })
</script>

<template>
  <section v-reveal class="comments glass">
    <div class="comments__head">
      <div class="comments__title"><MessageCircle :size="18" /> 评论 <span>/ {{ title }}</span></div>
      <span class="chip chip-accent"><Sparkles :size="12" /> Powered by Twikoo</span>
    </div>

    <div v-if="loading" class="comments__loading"><Loader2 :size="18" class="spin" /> 正在加载评论…</div>

    <div v-if="error" class="comments__error"><TriangleAlert :size="16" /> {{ error }}</div>

    <div v-if="!envId" class="comments__setup">
      <div class="comments__setup-icon"><MessageCircle :size="26" /></div>
      <h3>评论功能尚未启用</h3>
      <p>本站使用 <strong>Twikoo</strong>：一个简洁、安全、无追踪的静态博客评论系统。只需三步即可开启：</p>
      <ol>
        <li>将 Twikoo 云函数部署到腾讯云 CloudBase、Vercel 或其他支持的平台</li>
        <li>获取你的 <code>envId</code>（环境 ID 或云函数地址）</li>
        <li>在后台「站点设置 → 评论设置」中填入并保存，刷新本页即可生效</li>
      </ol>
      <RouterLink to="/admin/settings" class="btn btn-primary btn-sm"><Settings :size="14" /> 前往站点设置</RouterLink>
    </div>

    <div v-show="envId && !loading && !error" ref="container" class="twikoo-container" />
  </section>
</template>

<style scoped>
.comments { padding: 28px; margin-top: 44px; }
.comments__head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
.comments__title { display: flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 720; color: var(--text); }
.comments__title svg { color: var(--accent); }
.comments__title span { font-size: 13px; font-weight: 500; color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comments__loading, .comments__error { display: flex; align-items: center; gap: 10px; padding: 26px 0; font-size: 13.5px; color: var(--text-muted); }
.comments__error { color: var(--danger); }
.spin { animation: spin 1s linear infinite; }
.comments__setup { padding: 30px 26px; border-radius: var(--radius); border: 1px dashed var(--border-strong); background: rgba(var(--accent-rgb), .045); text-align: center; }
.comments__setup-icon { width: 56px; height: 56px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: 18px; background: rgba(var(--accent-rgb), .12); color: var(--accent); }
.comments__setup h3 { margin: 0 0 10px; font-size: 18px; }
.comments__setup p { margin: 0 auto 16px; max-width: 560px; font-size: 13.5px; line-height: 1.8; color: var(--text-soft); }
.comments__setup ol { max-width: 520px; margin: 0 auto 22px; padding-left: 20px; text-align: left; font-size: 13px; line-height: 2.1; color: var(--text-muted); }
.comments__setup li::marker { color: var(--accent); font-weight: 700; }
.comments__setup code { font: 12px var(--font-mono); padding: 2px 6px; border-radius: 5px; background: rgba(var(--accent-rgb), .12); color: var(--accent); }
:deep(.twikoo-container .tk-comments) { color: var(--text-soft); }
:deep(.twikoo-container .el-input__inner),
:deep(.twikoo-container .el-textarea__inner) { background: var(--surface-solid) !important; color: var(--text) !important; border-color: var(--border-strong) !important; }
:deep(.twikoo-container .tk-content) { color: var(--text-soft); }
:deep(.twikoo-container a) { color: var(--accent) !important; }
@media (max-width: 640px) { .comments { padding: 20px 16px; } .comments__title span { display: none; } }
</style>
