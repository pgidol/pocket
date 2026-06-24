import { createRouter, createWebHistory } from 'vue-router';

import { ROUTE_NAMES } from '../utils/constants.js';

/**
 * 设备检测
 * @returns {boolean} 是否为移动端
 */
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * 移动端路由
 */
const mobileRoutes = [
  {
    path: '/m/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('../views/mobile/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/m/register',
    name: ROUTE_NAMES.REGISTER,
    component: () => import('../views/mobile/RegisterView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/m/home',
    name: ROUTE_NAMES.HOME,
    component: () => import('../views/mobile/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/gacha',
    name: ROUTE_NAMES.GACHA,
    component: () => import('../views/mobile/GachaView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/collection',
    name: ROUTE_NAMES.COLLECTION,
    component: () => import('../views/mobile/CollectionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/bag',
    name: ROUTE_NAMES.BAG,
    component: () => import('../views/mobile/BagView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/shop',
    name: ROUTE_NAMES.SHOP,
    component: () => import('../views/mobile/ShopView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/checkin',
    name: ROUTE_NAMES.CHECKIN,
    component: () => import('../views/mobile/CheckInView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/profile',
    name: ROUTE_NAMES.PROFILE,
    component: () => import('../views/mobile/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/battle-map',
    name: ROUTE_NAMES.BATTLE_MAP,
    component: () => import('../views/mobile/BattleMapView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/team',
    name: ROUTE_NAMES.TEAM_FORM,
    component: () => import('../views/mobile/TeamFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/battle',
    name: ROUTE_NAMES.BATTLE,
    component: () => import('../views/mobile/BattleView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/upgrade/:id',
    name: ROUTE_NAMES.CARD_UPGRADE,
    component: () => import('../views/mobile/CardUpgradeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/m/equipment',
    name: ROUTE_NAMES.EQUIPMENT,
    component: () => import('../views/mobile/EquipmentView.vue'),
    meta: { requiresAuth: true },
  },
];

/**
 * PC 端路由（Phase 6 扩展）
 */
const pcRoutes = [
  // 暂时复用移动端路由，Phase 6 替换
];

/**
 * PC 端后台管理系统路由 (Phase 7)
 */
const adminRoutes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/pc/admin/AdminLogin.vue'),
    meta: { requiresAuth: false, isAdmin: true },
  },
  {
    path: '/admin',
    component: () => import('../views/pc/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, isAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/pc/admin/AdminDashboard.vue'),
      },
      {
        path: 'cards',
        name: 'AdminCards',
        component: () => import('../views/pc/admin/AdminCards.vue'),
      },
      {
        path: 'pools',
        name: 'AdminPools',
        component: () => import('../views/pc/admin/AdminPools.vue'),
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/pc/admin/AdminUsers.vue'),
      },
      {
        path: 'stages',
        name: 'AdminStages',
        component: () => import('../views/pc/admin/AdminStages.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => (isMobile() ? '/m/home' : '/m/home'),
    },
    ...mobileRoutes,
    ...pcRoutes,
    ...adminRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

/**
 * 从本地 Token 中安全提取角色字段
 * @returns {string|null}
 */
const getUserRoleFromToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    // 使用 decodeURIComponent + escape 处理中文昵称/Unicode 字符的 Base64 解码问题
    const payloadDecoded = JSON.parse(
      decodeURIComponent(
        escape(atob(payloadBase64))
      )
    );
    return payloadDecoded.role || 'user';
  } catch (error) {
    return null;
  }
};

/**
 * 全局前置守卫
 * standard.md §3: 设备检测 + 路由重定向 + 管理员鉴权闭环
 */
router.beforeEach((to, _from, next) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const role = getUserRoleFromToken();

  // 如果访问的是后台管理路由
  if (to.meta.isAdmin) {
    if (to.name === 'AdminLogin') {
      if (isAuthenticated && role === 'admin') {
        return next({ name: 'AdminDashboard' });
      }
      return next();
    }
    if (!isAuthenticated) {
      return next({ name: 'AdminLogin' });
    }
    if (role !== 'admin') {
      // 非管理员账号拒绝访问 PC 后台，重定向至移动游戏主页
      return next({ name: ROUTE_NAMES.HOME });
    }
    return next();
  }

  // 需要登录但未登录 → 跳转登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: ROUTE_NAMES.LOGIN });
  }

  // 已登录但访问登录/注册页 → 跳转主页
  if (
    !to.meta.requiresAuth &&
    isAuthenticated &&
    [ROUTE_NAMES.LOGIN, ROUTE_NAMES.REGISTER].includes(to.name)
  ) {
    return next({ name: ROUTE_NAMES.HOME });
  }

  next();
});

export default router;
