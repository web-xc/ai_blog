import type { Directive } from 'vue'

interface RevealElement extends HTMLElement {
  __revealObserver?: IntersectionObserver
}

/** v-reveal="120" — fades / lifts an element into view with an optional delay (ms). */
export const reveal: Directive<RevealElement, number | string | undefined> = {
  mounted(el, binding) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('reveal')
    const delay = Number(binding.value ?? 0) || 0
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    )
    observer.observe(el)
    el.__revealObserver = observer
  },
  unmounted(el) {
    el.__revealObserver?.disconnect()
    delete el.__revealObserver
  },
}
