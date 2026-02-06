/**
 * 路由：/ → HomeView，beforeEach 設定 document.title。
 */
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { title: 'AutoQ', requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title}` : 'AutoQ';
  next();
});

export default router;
