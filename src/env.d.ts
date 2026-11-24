/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BASE?: string
  readonly VITE_TWIKOO_ENV_ID?: string
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  /** Where the admin commits Markdown when the source lives in a repo subfolder. */
  readonly VITE_POSTS_DIR?: string
  /** Use hash routing when the site root 404.html belongs to another site. */
  readonly VITE_HASH_ROUTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
