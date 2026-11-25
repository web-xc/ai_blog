import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AI_CACHE_KEY, BOOKMARKS_KEY, LIKES_KEY, READING_KEY } from '@/config/site'
import { readJSON, writeJSON } from '@/lib/storage'
import { cloudApi, capability, type AiResult } from '@/lib/cloud'

export type FontSize = 'small' | 'normal' | 'large'

interface ReadingPrefs {
  fontSize: FontSize
}

/**
 * Visitor-side interactions. Everything works offline; like counts and AI
 * results are enriched from the Vercel backend whenever it is available.
 */
export const useExtrasStore = defineStore('extras', () => {
  const bookmarks = ref<string[]>(readJSON<string[]>(BOOKMARKS_KEY, []))
  const likes = ref<Record<string, boolean>>(readJSON<Record<string, boolean>>(LIKES_KEY, {}))
  const likeCounts = ref<Record<string, number>>({})
  const aiCache = ref<Record<string, AiResult>>(readJSON<Record<string, AiResult>>(AI_CACHE_KEY, {}))
  const reading = ref<ReadingPrefs>(readJSON<ReadingPrefs>(READING_KEY, { fontSize: 'normal' }))

  const bookmarkCount = computed(() => bookmarks.value.length)
  const fontScale = computed(() => ({ small: 0.92, normal: 1, large: 1.12 })[reading.value.fontSize] || 1)

  function isBookmarked(slug: string) {
    return bookmarks.value.includes(slug)
  }
  function toggleBookmark(slug: string) {
    bookmarks.value = isBookmarked(slug) ? bookmarks.value.filter((s) => s !== slug) : [slug, ...bookmarks.value]
    writeJSON(BOOKMARKS_KEY, bookmarks.value)
    return isBookmarked(slug)
  }
  function removeBookmark(slug: string) {
    bookmarks.value = bookmarks.value.filter((s) => s !== slug)
    writeJSON(BOOKMARKS_KEY, bookmarks.value)
  }

  function liked(slug: string) {
    return Boolean(likes.value[slug])
  }
  function likeCount(slug: string) {
    return likeCounts.value[slug] ?? 0
  }
  function toggleLike(slug: string) {
    const next = !liked(slug)
    likes.value = { ...likes.value, [slug]: next }
    writeJSON(LIKES_KEY, likes.value)
    likeCounts.value = { ...likeCounts.value, [slug]: Math.max(0, likeCount(slug) + (next ? 1 : -1)) }
    if (capability('stats')) void cloudApi.track(next ? 'like' : 'unlike', slug).catch(() => {})
    return next
  }

  function setFontSize(size: FontSize) {
    reading.value = { ...reading.value, fontSize: size }
    writeJSON(READING_KEY, reading.value)
  }

  function getAi(slug: string) {
    return aiCache.value[slug]
  }
  function cacheAi(slug: string, result: AiResult) {
    aiCache.value = { ...aiCache.value, [slug]: result }
    writeJSON(AI_CACHE_KEY, aiCache.value)
  }

  async function hydrate() {
    if (!capability('stats')) return
    try {
      const stats = await cloudApi.getStats()
      if (stats.likes) likeCounts.value = { ...likeCounts.value, ...stats.likes }
    } catch {
      /* offline */
    }
  }

  return {
    bookmarks, bookmarkCount, likes, likeCounts, aiCache, reading, fontScale,
    isBookmarked, toggleBookmark, removeBookmark,
    liked, likeCount, toggleLike,
    setFontSize, getAi, cacheAi, hydrate,
  }
})
