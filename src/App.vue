<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import { useAdminStore } from '@/stores/admin'
import { useExtrasStore } from '@/stores/extras'
import AuroraBackground from '@/components/AuroraBackground.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import ScrollProgress from '@/components/ScrollProgress.vue'
import BackToTop from '@/components/BackToTop.vue'
import ToastHost from '@/components/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const site = useSiteStore()
const admin = useAdminStore()
const extras = useExtrasStore()
const isPlain = computed(() => Boolean(route.meta.plain))

// Detect the Vercel backend once, then hydrate shared config / drafts / stats.
// On a pure static host this resolves to local mode and everything still works.
onMounted(() => {
  void site.hydrate().then(() => {
    void admin.hydrate()
    void extras.hydrate()
  })
})

// Route titles are set in router.afterEach; this keeps them in sync when the
// site name is changed from the admin dashboard without a rebuild.
watch(
  () => [site.config.title, site.config.subtitle],
  () => {
    const metaTitle = router.currentRoute.value.meta.title as string | undefined
    document.title = metaTitle
      ? `${metaTitle} · ${site.config.title}`
      : `${site.config.title} · ${site.config.subtitle}`
  },
)
</script>

<template>
  <AuroraBackground />
  <ToastHost />

  <SiteHeader v-if="!isPlain" />
  <main :class="isPlain ? 'plain-main' : 'site-main'">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="page" mode="out-in">
        <component
          :is="Component"
          :key="viewRoute.meta.plain ? `plain-${viewRoute.matched[0]?.path ?? ''}` : viewRoute.fullPath"
        />
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
