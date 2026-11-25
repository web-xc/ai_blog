<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const progress = ref(0)
let ticking = false

function update() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0
  ticking = false
}
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="scroll-progress-track" aria-hidden="true">
    <div class="scroll-progress-bar" :style="{ transform: `scaleX(${progress / 100})` }" />
  </div>
</template>

<style scoped>
.scroll-progress-track { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 100; pointer-events: none; }
.scroll-progress-bar {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
  transition: transform .12s linear;
  border-radius: 0 4px 4px 0;
}
</style>
