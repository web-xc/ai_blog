<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ value: number; duration?: number; suffix?: string }>(), {
  duration: 1400,
  suffix: '',
})

const display = ref(0)
let raf = 0

function animate(to: number) {
  cancelAnimationFrame(raf)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    display.value = to
    return
  }
  const from = display.value
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = from + (to - from) * eased
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <span>{{ Math.round(display).toLocaleString('zh-CN') }}{{ suffix }}</span>
</template>
