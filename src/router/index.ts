import { createRouter, createWebHistory } from 'vue-router'
import { defaultSiteConfig } from '@/config/site'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
    { path: '/post/:slug', name: 'post', component: () => import('@/views/PostView.vue'), meta: { title: '文章' } },
    { path: '/archive', name: 'archive', component: () => import('@/views/ArchiveView.vue'), meta: { title: '归档' } },
    { path: '/tags', name: 'tags', component: () => import('@/views/TagsView.vue'), meta: { title: '标签' } },
    { path: '/tag/:name', name: 'tag', component: () => import('@/views/TagView.vue'), meta: { title: '标签' } },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue'), meta: { title: '搜索' } },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue'), meta: { title: '关于' } },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/LoginView.vue'),
      meta: { plain: true, title: '后台登录' },
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { plain: true, title: '后台管理' },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '概览' } },
        { path: 'posts', name: 'admin-posts', component: () => import('@/views/admin/PostsView.vue'), meta: { title: '文章管理' } },
        { path: 'editor/:id', name: 'admin-editor', component: () => import('@/views/admin/EditorView.vue'), meta: { title: '写文章' } },
        { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue'), meta: { title: '站点设置' } },
        { path: 'comments', name: 'admin-comments', component: () => import('@/views/admin/CommentsView.vue'), meta: { title: '评论管理' } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: '页面未找到' } },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || ''
  document.title = title ? `${title} · ${defaultSiteConfig.title}` : defaultSiteConfig.title
})

export default router
