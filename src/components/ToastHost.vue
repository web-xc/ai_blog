<script setup lang="ts">
import { toasts, dismiss } from '@/lib/toast'
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`is-${t.type}`"
        @click="dismiss(t.id)"
      >
        <span class="toast__dot" />
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active { animation: pop-in .35s var(--ease) both; }
.toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-leave-to { opacity: 0; transform: translateX(24px); }
.toast-move { transition: transform .3s var(--ease); }
</style>
