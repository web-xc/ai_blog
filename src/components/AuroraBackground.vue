<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()
const canvas = ref<HTMLCanvasElement | null>(null)

interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number }

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let particles: Particle[] = []
let mouse = { x: -9999, y: -9999 }
let running = false

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const compactQuery = window.matchMedia('(max-width: 700px)')
let compact = compactQuery.matches

function resize() {
  const el = canvas.value
  if (!el) return
  // Phones pay for every canvas pixel; cap the backing store separately.
  const dpr = compact ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  el.width = width * dpr
  el.height = height * dpr
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  ctx = el.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const count = compact
    ? Math.min(18, Math.max(10, Math.round((width * height) / 42000)))
    : Math.min(72, Math.max(24, Math.round((width * height) / 26000)))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    r: Math.random() * 1.5 + 0.6,
    a: Math.random() * 0.5 + 0.25,
  }))
}

let lastFrame = 0
function frame(t: number) {
  if (!ctx || !running) return
  // Cap to ~30fps on phones: the particle field is decoration, not content.
  if (compact && t - lastFrame < 32) {
    raf = requestAnimationFrame(frame)
    return
  }
  lastFrame = t
  ctx.clearRect(0, 0, width, height)
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  const rgb = dark ? '150, 170, 255' : '99, 102, 241'

  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < -20) p.x = width + 20
    if (p.x > width + 20) p.x = -20
    if (p.y < -20) p.y = height + 20
    if (p.y > height + 20) p.y = -20

    const dx = p.x - mouse.x
    const dy = p.y - mouse.y
    const dist2 = dx * dx + dy * dy
    if (dist2 < 16000 && dist2 > 1) {
      const force = (1 - Math.sqrt(dist2) / 126) * 0.5
      p.x += (dx / Math.sqrt(dist2)) * force
      p.y += (dy / Math.sqrt(dist2)) * force
    }

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${rgb}, ${p.a})`
    ctx.fill()
  }

  // The O(n²) link pass is the expensive part; skip it entirely on phones.
  if (!compact) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const d2 = dx * dx + dy * dy
        if (d2 < 15000) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(${rgb}, ${(1 - d2 / 15000) * (dark ? 0.16 : 0.1)})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        }
      }
    }
  }
  raf = requestAnimationFrame(frame)
}

function start() {
  if (!site.config.showParticles || reduced || running) return
  running = true
  resize()
  raf = requestAnimationFrame(frame)
}

function stop() {
  running = false
  cancelAnimationFrame(raf)
  ctx?.clearRect(0, 0, width, height)
}

function onMouseMove(e: MouseEvent) { mouse = { x: e.clientX, y: e.clientY } }
function onMouseLeave() { mouse = { x: -9999, y: -9999 } }
function onResize() {
  compact = compactQuery.matches
  if (running) resize()
}

watch(() => site.config.showParticles, (on) => (on ? start() : stop()))

onMounted(() => {
  start()
  window.addEventListener('resize', onResize)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)
})
onUnmounted(() => {
  stop()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
})
</script>

<template>
  <div class="aurora-bg" aria-hidden="true">
    <div class="aurora-bg__grid" />
    <div class="aurora-blob aurora-blob--1" />
    <div class="aurora-blob aurora-blob--2" />
    <div class="aurora-blob aurora-blob--3" />
    <canvas v-show="site.config.showParticles" ref="canvas" class="aurora-bg__canvas" />
  </div>
</template>

<style scoped>
.aurora-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; background: radial-gradient(ellipse at 50% -20%, var(--bg-2), var(--bg) 62%); }
.aurora-bg__grid {
  position: absolute; inset: 0; opacity: .45;
  background-image: linear-gradient(to right, rgba(var(--accent-rgb), .055) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--accent-rgb), .055) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,.8), transparent 78%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,.8), transparent 78%);
}
.aurora-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .5; animation: float-slow 16s ease-in-out infinite; }
.aurora-blob--1 { width: 46vw; height: 46vw; min-width: 420px; min-height: 420px; top: -18vw; left: -8vw; background: radial-gradient(circle, rgba(var(--accent-rgb), .42), transparent 68%); }
.aurora-blob--2 { width: 38vw; height: 38vw; min-width: 360px; min-height: 360px; top: 8vh; right: -12vw; background: radial-gradient(circle, rgba(168, 85, 247, .34), transparent 68%); animation-delay: -5s; animation-duration: 21s; }
.aurora-blob--3 { width: 34vw; height: 34vw; min-width: 320px; min-height: 320px; bottom: -16vw; left: 28vw; background: radial-gradient(circle, rgba(6, 182, 212, .28), transparent 68%); animation-delay: -11s; animation-duration: 25s; }
.aurora-bg__canvas { position: absolute; inset: 0; }
html[data-theme="dark"] .aurora-blob { opacity: .38; }
html[data-theme="dark"] .aurora-bg__grid { opacity: .7; }
@media (max-width: 700px) {
  .aurora-blob { filter: blur(46px); animation: none; opacity: .3; }
  .aurora-bg__grid { opacity: .28; }
}
</style>
