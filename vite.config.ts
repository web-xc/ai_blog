import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * GitHub Pages has no SPA rewrite rules. Shipping index.html as 404.html
 * makes deep links (e.g. /post/hello-world) work with history mode routing.
 */
function spaFallback(): Plugin {
  return {
    name: 'aurora-spa-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const index = resolve(dist, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(dist, '404.html'))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_BASE is injected by the GitHub Actions workflow: '/<repo>/' for
  // project pages and '/' for username.github.io user pages.
  const base = process.env.VITE_BASE || env.VITE_BASE || '/'

  return {
    base,
    plugins: [vue(), spaFallback()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1200,
      cssCodeSplit: true,
    },
    server: { host: '0.0.0.0', port: 5173 },
    preview: { host: '0.0.0.0', port: 4173 },
  }
})
