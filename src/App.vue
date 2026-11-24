<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import AuroraBackground from '@/components/AuroraBackground.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import ScrollProgress from '@/components/ScrollProgress.vue'
import BackToTop from '@/components/BackToTop.vue'
import ToastHost from '@/components/ToastHost.vue'

const route = useRoute()
const site = useSiteStore()
const isPlain = computed(() => Boolean(route.meta.plain))

watch(
  [() => route.meta.title, () => site.config.title],
  () => {
    const title = (route.meta.title as string) || ''
    document.title = title ? `${title} · ${site.config.title}` : `${site.config.title} · ${site.config.subtitle}`
  },
  { immediate: true },
)
</script>

<template>
  <AuroraBackground />
  <ToastHost />

  <SiteHeader v-if="!isPlain" />
  <main :class="isPlain ? 'plain-main' : 'site-main'">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="viewRoute.fullPath" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter v-if="!isPlain" />

  <template v-if="!isPlain">
    <ScrollProgress />
    <BackToTop />
  </template>
</template>

<style scoped>
.site-main { min-height: calc(100vh - var(--header-h) - 220px); position: relative; }
.plain-main { min-height: 100vh; position: relative; }
</style>
