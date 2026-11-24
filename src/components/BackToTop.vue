<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowUp } from '@lucide/vue'

const ratio = ref(0)
function update() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  ratio.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
}
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const visible = computed(() => ratio.value > 0.12)
const ring = computed(() => `conic-gradient(var(--accent) ${ratio.value * 360}deg, var(--border-strong) 0deg)`)

onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', update))
</script>

<template>
  <Transition name="pop">
    <button v-if="visible" class="back-to-top" :style="{ background: ring }" aria-label="返回顶部" @click="toTop">
      <span class="back-to-top__inner"><ArrowUp :size="18" /></span>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed; right: 26px; bottom: 28px; z-index: 70;
  width: 46px; height: 46px; border: 0; border-radius: 50%; padding: 2px;
  box-shadow: var(--shadow);
  transition: transform .35s var(--ease), opacity .35s ease;
}
.back-to-top:hover { transform: translateY(-5px) scale(1.06); }
.back-to-top__inner {
  width: 100%; height: 100%; display: grid; place-items: center;
  border-radius: 50%; background: var(--surface-solid); color: var(--accent);
}
.pop-enter-active, .pop-leave-active { transition: opacity .3s ease, transform .3s var(--ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(16px) scale(.8); }
@media (max-width: 640px) { .back-to-top { right: 16px; bottom: 18px; width: 40px; height: 40px; } }
</style>
