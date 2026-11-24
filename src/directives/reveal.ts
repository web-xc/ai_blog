import type { Directive } from 'vue'

interface RevealElement extends HTMLElement {
  __revealObserver?: IntersectionObserver
  __revealFallback?: number
}

/** v-reveal="120" — fades / lifts an element into view with an optional delay (ms). */
export const reveal: Directive<RevealElement, number | string | undefined> = {
  mounted(el, binding) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('reveal')
    const delay = Number(binding.value ?? 0) || 0
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)

    const show = () => el.classList.add('is-visible')
    const inViewport = () => {
      const rect = el.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    )
    observer.observe(el)
    el.__revealObserver = observer

    // Safety net: IntersectionObserver callbacks can be delayed or skipped in
    // headless / low-power environments. Never leave content invisible.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (inViewport()) show()
      })
    })
    el.__revealFallback = window.setTimeout(() => {
      if (inViewport()) show()
    }, 1600)
  },
  unmounted(el) {
    el.__revealObserver?.disconnect()
    if (el.__revealFallback) window.clearTimeout(el.__revealFallback)
    delete el.__revealObserver
    delete el.__revealFallback
  },
}
