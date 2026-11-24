<script setup lang="ts">
import { ArrowLeft, Search, Home } from '@lucide/vue'
</script>

<template>
  <div class="not-found container">
    <div class="not-found__orbit" aria-hidden="true" />
    <div class="not-found__content">
      <div class="not-found__code">
        <span>4</span><span class="not-found__zero">✦</span><span>4</span>
      </div>
      <h1>这束光，好像飘走了</h1>
      <p>你要找的页面不存在，或者已经被移到了别的地方。<br />不如回到起点，重新逛逛？</p>
      <div class="not-found__actions">
        <RouterLink to="/" class="btn btn-primary"><Home :size="16" /> 回到首页</RouterLink>
        <RouterLink to="/search" class="btn btn-ghost"><Search :size="16" /> 搜索内容</RouterLink>
      </div>
      <button class="not-found__back" @click="$router.back()"><ArrowLeft :size="13" /> 返回上一页</button>
    </div>
  </div>
</template>

<style scoped>
.not-found { position: relative; min-height: 72vh; display: grid; place-items: center; text-align: center; overflow: hidden; }
.not-found__orbit { position: absolute; width: 460px; height: 460px; border: 1px dashed rgba(var(--accent-rgb), .3); border-radius: 50%; animation: spin 40s linear infinite; }
.not-found__orbit::after { content: ""; position: absolute; inset: 70px; border: 1px solid rgba(168,85,247,.22); border-radius: 50%; }
.not-found__content { position: relative; }
.not-found__code { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: clamp(96px, 16vw, 180px); font-weight: 850; letter-spacing: -.08em; line-height: 1; background: linear-gradient(120deg, var(--accent), var(--accent-2), var(--accent-3)); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: gradient-flow 6s linear infinite, float-y 6s ease-in-out infinite; }
.not-found__zero { font-size: .62em; -webkit-text-fill-color: var(--accent); animation: spin 12s linear infinite; }
.not-found h1 { font-size: 24px; font-weight: 740; margin: 16px 0 10px; }
.not-found p { font-size: 14px; line-height: 1.9; color: var(--text-muted); margin: 0 0 28px; }
.not-found__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.not-found__back { display: inline-flex; align-items: center; gap: 6px; margin-top: 24px; border: 0; background: transparent; color: var(--text-muted); font-size: 12.5px; transition: color .25s ease; }
.not-found__back:hover { color: var(--accent); }
</style>
