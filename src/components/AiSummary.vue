<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Sparkles, Wand2, RefreshCw, Brain, Loader2, Hash } from '@lucide/vue'
import { useExtrasStore } from '@/stores/extras'
import { useSiteStore } from '@/stores/site'
import { cloudApi, capability, type AiResult } from '@/lib/cloud'
import { localSummary } from '@/lib/summary'
import { notify } from '@/lib/toast'

const props = defineProps<{
  slug: string
  title: string
  content: string
  staticSummary?: string
}>()

const extras = useExtrasStore()
const site = useSiteStore()
const busy = ref(false)
const generated = ref<AiResult | null>(null)

const result = computed<AiResult | null>(() => {
  if (props.staticSummary) {
    return { summary: props.staticSummary, bullets: [], tags: [], source: 'llm' }
  }
  return generated.value || extras.getAi(props.slug) || null
})
const sourceLabel = computed(() => {
  if (props.staticSummary) return '随文章发布'
  if (!result.value) return ''
  return result.value.source === 'llm' ? '模型生成' : '本地提取'
})

// Typewriter reveal — only plays once the card scrolls into view.
const root = ref<HTMLElement | null>(null)
const typed = ref('')
const typing = ref(false)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let typeTimer = 0
let fallbackTimer = 0
let observer: IntersectionObserver | null = null
let started = false
let pending = ''

function typeText(full: string) {
  clearTimeout(typeTimer)
  typing.value = false
  if (!full || reduceMotion) {
    typed.value = full
    return
  }
  typed.value = ''
  typing.value = true
  const stepMs = 30
  const ticks = Math.max(1, Math.ceil(Math.min(2600, Math.max(600, full.length * 26)) / stepMs))
  const perTick = Math.max(1, Math.ceil(full.length / ticks))
  let i = 0
  const step = () => {
    i = Math.min(full.length, i + perTick)
    typed.value = full.slice(0, i)
    if (i < full.length) typeTimer = window.setTimeout(step, stepMs)
    else typing.value = false
  }
  typeTimer = window.setTimeout(step, stepMs)
}

function startTyping() {
  if (started) return
  started = true
  clearTimeout(fallbackTimer)
  typeText(pending)
  // First visit: produce an instant local summary so the typewriter has
  // something to reveal; the refresh button can still call the real model.
  if (!result.value && !busy.value) void generate(true)
}

watch(result, (value) => {
  pending = value?.summary || ''
  if (started) typeText(pending)
}, { immediate: true })

onMounted(() => {
  if (!('IntersectionObserver' in window) || !root.value) {
    startTyping()
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer?.disconnect()
      startTyping()
    }
  }, { threshold: 0.15 })
  observer.observe(root.value)
  // Never leave an empty card if the observer callback is delayed.
  fallbackTimer = window.setTimeout(startTyping, 1800)
})

onUnmounted(() => {
  clearTimeout(typeTimer)
  clearTimeout(fallbackTimer)
  observer?.disconnect()
  observer = null
})

async function generate(silent = false) {
  if (busy.value) return
  busy.value = true
  try {
    let value: AiResult | null = null
    if (capability('ai')) {
      try {
        value = await cloudApi.ai('summary', { title: props.title, content: props.content })
      } catch {
        value = null
      }
    }
    if (!value) value = localSummary(props.title, props.content)
    generated.value = value
    extras.cacheAi(props.slug, value)
    if (!silent) notify(value.source === 'llm' ? 'AI 摘要已生成' : '已生成离线摘要', 'success')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="site.config.showAiSummary" v-reveal ref="root" class="ai-summary glass">
    <div class="ai-summary__glow" />
    <div class="ai-summary__head">
      <span class="ai-summary__icon"><Brain :size="17" /></span>
      <div>
        <strong>AI 文章摘要</strong>
        <small>读完提纲，再决定要不要细看</small>
      </div>
      <span v-if="result" class="ai-summary__badge"><Sparkles :size="11" /> {{ sourceLabel }}</span>
      <button
        v-if="result && !staticSummary"
        class="ai-summary__refresh"
        :disabled="busy"
        :aria-label="busy ? '生成中' : '重新生成'"
        @click="generate()"
      >
        <Loader2 v-if="busy" :size="15" class="spin" /><RefreshCw v-else :size="15" />
      </button>
    </div>

    <template v-if="result">
      <p class="ai-summary__text">{{ typed }}<span v-if="typing" class="ai-summary__caret" /></p>
      <ul v-if="!typing && result.bullets.length" class="ai-summary__bullets">
        <li v-for="(item, i) in result.bullets" :key="i">{{ item }}</li>
      </ul>
      <div v-if="!typing && result.tags.length" class="ai-summary__tags">
        <span v-for="tag in result.tags" :key="tag" class="chip"><Hash :size="11" />{{ tag }}</span>
      </div>
      <p v-if="!typing && result.source === 'local'" class="ai-summary__note">当前为离线提取式摘要；在 Vercel 配置 AI_API_KEY 后可获得模型生成的摘要。</p>
    </template>

    <div v-else class="ai-summary__empty">
      <p>这篇文章还没有摘要，让 AI 帮你快速抓住重点。</p>
      <button class="btn btn-primary btn-sm" :disabled="busy" @click="generate()">
        <Loader2 v-if="busy" :size="15" class="spin" /><Wand2 v-else :size="15" />
        {{ busy ? '正在生成…' : '生成 AI 摘要' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-summary { position: relative; overflow: hidden; padding: 20px 22px; margin-bottom: 24px; border-color: rgba(var(--accent-rgb), .28); }
.ai-summary__glow { position: absolute; width: 260px; height: 260px; right: -110px; top: -150px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--accent-rgb), .2), transparent 70%); pointer-events: none; }
.ai-summary__head { position: relative; display: flex; align-items: center; gap: 11px; }
.ai-summary__icon { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 11px; color: #fff; background: linear-gradient(125deg, var(--accent), var(--accent-2)); box-shadow: 0 6px 18px rgba(var(--accent-rgb), .3); }
.ai-summary__head > div { display: flex; flex-direction: column; gap: 2px; }
.ai-summary__head strong { font-size: 14px; font-weight: 720; }
.ai-summary__head small { font-size: 11px; color: var(--text-muted); }
.ai-summary__badge { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: rgba(var(--accent-rgb), .1); color: var(--accent); font-size: 10.5px; font-weight: 650; white-space: nowrap; }
.ai-summary__refresh { width: 30px; height: 30px; flex: none; display: grid; place-items: center; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-solid); color: var(--text-muted); }
.ai-summary__refresh:hover { color: var(--accent); border-color: rgba(var(--accent-rgb), .4); }
.ai-summary__text { position: relative; margin: 16px 0 0; min-height: 1.9em; font-size: 13.5px; line-height: 1.9; color: var(--text-soft); }
.ai-summary__caret { display: inline-block; width: 2px; height: 1em; margin-left: 2px; vertical-align: -2px; background: var(--accent); animation: blink .85s step-end infinite; }
.ai-summary__bullets { position: relative; margin: 12px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; animation: fade-in .45s ease both; }
.ai-summary__bullets li { font-size: 12.5px; line-height: 1.75; color: var(--text-muted); }
.ai-summary__tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; animation: fade-in .45s ease both; }
.ai-summary__tags .chip { font-size: 10.5px; padding: 3px 9px; }
.ai-summary__note { margin: 12px 0 0; font-size: 11px; color: var(--text-muted); animation: fade-in .45s ease both; }
.ai-summary__empty { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
.ai-summary__empty p { margin: 0; font-size: 12.5px; color: var(--text-muted); }
.spin { animation: spin 1s linear infinite; }
@media (max-width: 560px) {
  .ai-summary { padding: 16px 15px; }
  .ai-summary__head small { display: none; }
  .ai-summary__empty { flex-direction: column; align-items: flex-start; }
}
</style>
