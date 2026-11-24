<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, ArrowUpRight, Hash, FileText, Sparkles, X } from '@lucide/vue'
import { searchPosts, getTags, formatDate } from '@/lib/posts'

const route = useRoute()
const router = useRouter()
const input = ref<HTMLInputElement | null>(null)
const keyword = ref(String(route.query.q || ''))
const results = computed(() => (keyword.value.trim() ? searchPosts(keyword.value) : []))
const hotTags = getTags().slice(0, 8)

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function highlight(text: string): string {
  const q = keyword.value.trim()
  if (!q) return escapeHtml(text)
  const safe = escapeHtml(text)
  const idx = safe.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return safe
  return `${safe.slice(0, idx)}<mark>${safe.slice(idx, idx + q.length)}</mark>${safe.slice(idx + q.length)}`
}
function snippet(content: string): string {
  const q = keyword.value.trim().toLowerCase()
  const flat = content.replace(/[#*`>\[\]()]/g, '').replace(/\s+/g, ' ').trim()
  const i = flat.toLowerCase().indexOf(q)
  const start = Math.max(0, (i < 0 ? 0 : i) - 55)
  return `${start ? '…' : ''}${flat.slice(start, start + 190)}${flat.length > start + 190 ? '…' : ''}`
}
function submit() {
  const q = keyword.value.trim()
  router.replace({ path: '/search', query: q ? { q } : {} })
}
function useTag(tag: string) {
  keyword.value = tag
  submit()
}
function clear() {
  keyword.value = ''
  submit()
  input.value?.focus()
}

watch(() => route.query.q, (q) => { keyword.value = String(q || '') })
onMounted(() => input.value?.focus())
</script>

<template>
  <div class="container search-page">
    <header v-reveal class="search-hero">
      <span class="section-kicker">Search</span>
      <h1 class="search-hero__title">找到你<span class="gradient-text">想读</span>的</h1>
      <p class="search-hero__sub">在全部文章的标题、正文、标签与分类中即时检索。</p>
      <div class="search-box glass">
        <Search :size="21" class="search-box__icon" />
        <input
          ref="input"
          v-model="keyword"
          class="search-box__input"
          placeholder="输入关键词，例如 Vue、设计、部署…"
          @keydown.enter="submit"
        />
        <button v-if="keyword" class="btn btn-icon btn-ghost btn-sm" aria-label="清空" @click="clear"><X :size="16" /></button>
        <button class="btn btn-primary btn-sm" @click="submit">搜索</button>
      </div>
      <div class="hot-tags">
        <span><Sparkles :size="13" /> 热门：</span>
        <button v-for="t in hotTags" :key="t.name" class="chip" @click="useTag(t.name)">#{{ t.name }}</button>
      </div>
    </header>

    <section class="section search-results">
      <div v-if="keyword.trim()" v-reveal class="results-head">
        <h2>「{{ keyword.trim() }}」的搜索结果</h2>
        <span class="chip chip-accent">{{ results.length }} 篇</span>
      </div>

      <div v-if="results.length" class="result-list">
        <RouterLink
          v-for="(p, i) in results"
          :key="p.slug"
          v-reveal="i * 55"
          :to="`/post/${p.slug}`"
          class="result-item glass card-hover"
        >
          <span class="result-item__emoji">{{ p.cover }}</span>
          <div class="result-item__body">
            <div class="result-item__meta">{{ formatDate(p.date) }} · {{ p.category }} · {{ p.readingTime }} 分钟</div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <h3 v-html="highlight(p.title)" />
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p v-html="highlight(snippet(p.content))" />
            <div class="result-item__tags"><span v-for="t in p.tags.slice(0, 4)" :key="t"><Hash :size="11" /> {{ t }}</span></div>
          </div>
          <ArrowUpRight :size="18" class="result-item__arrow" />
        </RouterLink>
      </div>

      <div v-else-if="keyword.trim()" class="empty-state glass">
        <div class="empty-state__icon"><FileText :size="26" /></div>
        <h3>没有找到「{{ keyword.trim() }}」相关内容</h3>
        <p>试试更简短的关键词，或从热门标签开始探索。</p>
        <RouterLink to="/archive" class="btn btn-ghost btn-sm">浏览全部文章</RouterLink>
      </div>

      <div v-else class="search-tips glass">
        <h3><Sparkles :size="17" /> 搜索小贴士</h3>
        <ul>
          <li>支持匹配文章标题、正文、分类与标签</li>
          <li>在任意页面按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 可快速唤起搜索</li>
          <li>搜索完全在浏览器本地完成，无需后端、无隐私追踪</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.search-hero { padding: 76px 0 20px; text-align: center; }
.search-hero__title { font-size: clamp(36px, 5vw, 58px); font-weight: 820; letter-spacing: -.05em; margin: 14px 0; }
.search-hero__sub { font-size: 15px; color: var(--text-muted); margin: 0; }
.search-box { display: flex; align-items: center; gap: 12px; max-width: 720px; margin: 36px auto 0; padding: 10px 12px 10px 20px; border-radius: 999px; text-align: left; }
.search-box__icon { color: var(--accent); flex: none; }
.search-box__input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--text); font-size: 15px; padding: 8px 0; }
.search-box__input::placeholder { color: var(--text-muted); }
.hot-tags { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 9px; margin-top: 22px; }
.hot-tags > span { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-muted); }
.results-head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.results-head h2 { font-size: 19px; font-weight: 700; margin: 0; }
.result-list { display: flex; flex-direction: column; gap: 14px; }
.result-item { display: flex; align-items: flex-start; gap: 18px; padding: 20px 22px; }
.result-item__emoji { width: 56px; height: 56px; flex: none; display: grid; place-items: center; font-size: 28px; border-radius: 16px; background: linear-gradient(135deg, rgba(var(--accent-rgb), .16), rgba(168,85,247,.12)); }
.result-item__body { flex: 1; min-width: 0; }
.result-item__meta { font-size: 11.5px; color: var(--text-muted); margin-bottom: 6px; }
.result-item h3 { font-size: 17px; font-weight: 700; margin: 0 0 8px; }
.result-item p { font-size: 13px; line-height: 1.75; color: var(--text-muted); margin: 0 0 10px; }
.result-item__tags { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11.5px; color: var(--text-muted); }
.result-item__tags span { display: inline-flex; align-items: center; gap: 3px; }
.result-item__arrow { color: var(--text-muted); flex: none; margin-top: 18px; transition: transform .3s var(--ease), color .3s ease; }
.result-item:hover .result-item__arrow { color: var(--accent); transform: translate(4px, -4px); }
:deep(mark) { background: rgba(var(--accent-rgb), .22); color: var(--accent); padding: 0 3px; border-radius: 4px; font-weight: 700; }
.search-tips { padding: 28px 32px; border-radius: var(--radius); max-width: 720px; margin-inline: auto; }
.search-tips h3 { display: flex; align-items: center; gap: 9px; font-size: 16px; margin: 0 0 14px; }
.search-tips h3 svg { color: var(--accent); }
.search-tips ul { padding-left: 20px; margin: 0; font-size: 13.5px; line-height: 2.2; color: var(--text-muted); }
.search-tips li::marker { color: var(--accent); }
kbd { font: 600 11px var(--font-mono); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--border-strong); background: var(--surface-solid); }
.empty-state { border-radius: var(--radius); }
.empty-state h3 { margin: 0; font-size: 17px; }
@media (max-width: 700px) { .search-hero { padding-top: 50px; } .result-item { padding: 16px; gap: 12px; } .result-item__emoji { width: 44px; height: 44px; font-size: 22px; } }
</style>
