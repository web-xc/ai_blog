<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, KeyRound, Eye, EyeOff } from '@lucide/vue'
import { useAdminStore } from '@/stores/admin'
import { useSiteStore } from '@/stores/site'
import { notify } from '@/lib/toast'

const admin = useAdminStore()
const site = useSiteStore()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const show = ref(false)
const busy = ref(false)
const error = ref('')
const isSetup = computed(() => !admin.hasPassword)

async function submit() {
  error.value = ''
  if (!password.value) { error.value = '请输入密码'; return }
  busy.value = true
  try {
    if (isSetup.value) {
      if (password.value.length < 6) { error.value = '密码至少需要 6 位'; return }
      if (password.value !== confirm.value) { error.value = '两次输入的密码不一致'; return }
      await admin.setupPassword(password.value)
      notify('管理员密码设置成功，欢迎来到写作台 ✦')
      await router.replace('/admin')
    } else {
      const ok = await admin.login(password.value)
      if (!ok) { error.value = '密码不正确，请重试'; return }
      notify('登录成功，欢迎回来')
      await router.replace('/admin')
    }
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  if (admin.authenticated) router.replace('/admin')
})
</script>

<template>
  <div class="login-page">
    <div class="login-orbit" aria-hidden="true" />
    <div class="login-card glass">
      <RouterLink to="/" class="login-back"><ArrowLeft :size="14" /> 返回站点</RouterLink>

      <div class="login-mark"><span>✦</span></div>
      <span class="section-kicker" style="justify-content: center; display: flex">Aurora Admin</span>
      <h1>{{ isSetup ? '初始化写作台' : '欢迎回来' }}</h1>
      <p class="login-sub">
        {{ isSetup ? '第一次进入，请先设置一个管理员密码，用于保护后台界面。' : `登录 ${site.config.title} 的后台，继续写下新的文字。` }}
      </p>

      <form class="login-form" @submit.prevent="submit">
        <div class="field">
          <label for="pwd">{{ isSetup ? '设置密码' : '管理员密码' }}</label>
          <div class="pwd-wrap">
            <KeyRound :size="16" />
            <input id="pwd" v-model="password" :type="show ? 'text' : 'password'" class="input" placeholder="至少 6 位" autocomplete="current-password" />
            <button type="button" class="pwd-toggle" :aria-label="show ? '隐藏' : '显示'" @click="show = !show">
              <EyeOff v-if="show" :size="16" /><Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <div v-if="isSetup" class="field">
          <label for="confirm">确认密码</label>
          <div class="pwd-wrap">
            <Lock :size="16" />
            <input id="confirm" v-model="confirm" :type="show ? 'text' : 'password'" class="input" placeholder="再输入一次" autocomplete="new-password" />
          </div>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary login-submit" :disabled="busy">
          <ShieldCheck v-if="isSetup" :size="16" />
          <Lock v-else :size="16" />
          {{ isSetup ? '设置并进入后台' : '进入后台' }}
          <ArrowRight :size="15" />
        </button>
      </form>

      <div class="login-note">
        <Sparkles :size="13" />
        <span>密码仅保存在本机浏览器中，用于锁定后台界面；文章发布使用 GitHub Token 完成鉴权。</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: grid; place-items: center; padding: 30px 20px; position: relative; }
.login-orbit { position: fixed; width: 560px; height: 560px; border: 1px dashed rgba(var(--accent-rgb), .25); border-radius: 50%; animation: spin 44s linear infinite; pointer-events: none; }
.login-orbit::after { content: ""; position: absolute; inset: 90px; border: 1px solid rgba(168,85,247,.16); border-radius: 50%; }
.login-card { position: relative; width: min(430px, 100%); padding: 38px 36px 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); text-align: center; animation: pop-in .6s var(--ease) both; }
.login-back { position: absolute; top: 20px; left: 22px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); transition: color .25s ease; }
.login-back:hover { color: var(--accent); }
.login-mark { width: 68px; height: 68px; margin: 10px auto 20px; display: grid; place-items: center; border-radius: 22px; color: #fff; font-size: 32px; background: linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3)); background-size: 200% 200%; animation: gradient-flow 6s linear infinite, float-y 5s ease-in-out infinite; box-shadow: 0 14px 34px rgba(var(--accent-rgb), .38); }
.login-card h1 { font-size: 26px; font-weight: 780; margin: 8px 0 10px; letter-spacing: -.03em; }
.login-sub { font-size: 13px; line-height: 1.85; color: var(--text-muted); margin: 0 0 28px; }
.login-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
.pwd-wrap { position: relative; display: flex; align-items: center; }
.pwd-wrap > svg { position: absolute; left: 14px; color: var(--accent); z-index: 1; }
.pwd-wrap .input { padding-left: 42px; padding-right: 44px; }
.pwd-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: transparent; color: var(--text-muted); border-radius: 8px; }
.pwd-toggle:hover { color: var(--accent); background: rgba(var(--accent-rgb), .08); }
.login-error { padding: 9px 12px; border-radius: 10px; background: rgba(239,68,68,.1); color: var(--danger); font-size: 12.5px; }
.login-submit { width: 100%; margin-top: 4px; padding: 12px; }
.login-note { display: flex; gap: 8px; align-items: flex-start; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border); text-align: left; font-size: 11.5px; line-height: 1.7; color: var(--text-muted); }
.login-note svg { color: var(--accent); flex: none; margin-top: 2px; }
</style>
