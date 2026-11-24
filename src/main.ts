import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { reveal } from './directives/reveal'
import './styles/main.css'
import './styles/markdown.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('reveal', reveal)
app.mount('#app')

requestAnimationFrame(() => {
  requestAnimationFrame(() => document.documentElement.classList.add('app-ready'))
})
// Fallback for throttled/background tabs where rAF may not fire promptly.
window.setTimeout(() => document.documentElement.classList.add('app-ready'), 1200)
