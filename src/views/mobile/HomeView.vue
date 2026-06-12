<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <header class="home-header">
      <button class="menu-btn" @click="uiStore.toggleDrawer()">☰</button>
      <h1 class="header-title text-display">Pocket</h1>
      <div class="header-currency">
        <span class="currency-item gold">
          <span class="currency-icon">💰</span>
          <span class="currency-value">{{ userStore.gold }}</span>
        </span>
        <span class="currency-item diamond">
          <span class="currency-icon">💎</span>
          <span class="currency-value">{{ userStore.diamond }}</span>
        </span>
      </div>
    </header>

    <!-- 主题大厅内容 -->
    <div class="home-content">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <p class="banner-greeting">{{ greetingText }}</p>
          <h2 class="banner-name text-display">{{ userStore.profile?.nickname || '冒险者' }}</h2>
          <p class="banner-info">收集进度 {{ cardStore.collectionProgress.owned }}/{{ cardStore.collectionProgress.total }}</p>
        </div>
        <div class="banner-avatar">
          <span class="avatar-emoji">🎴</span>
        </div>
      </div>

      <!-- 快捷功能入口 -->
      <div class="quick-actions">
        <router-link
          v-for="action in quickActions"
          :key="action.name"
          :to="action.to"
          class="action-card"
          :style="{ '--action-color': action.color }"
        >
          <span class="action-icon">{{ action.icon }}</span>
          <span class="action-label">{{ action.label }}</span>
          <span v-if="action.badge" class="action-badge">{{ action.badge }}</span>
        </router-link>
      </div>

      <!-- 今日活动 -->
      <section class="section">
        <h3 class="section-title">
          <span class="section-icon">🔥</span>
          今日推荐
        </h3>
        <div class="activity-cards">
          <div class="activity-card activity-gacha" @click="router.push({ name: ROUTE_NAMES.GACHA })">
            <div class="activity-bg"></div>
            <div class="activity-content">
              <span class="activity-tag">限时UP</span>
              <h4 class="activity-title">标准卡池</h4>
              <p class="activity-desc">全角色常驻，开启你的收集之旅</p>
              <button class="btn-gold activity-btn">前往抽卡</button>
            </div>
          </div>
          <div class="activity-card activity-checkin" @click="router.push({ name: ROUTE_NAMES.CHECKIN })">
            <div class="activity-content">
              <span class="activity-tag tag-green">每日</span>
              <h4 class="activity-title">每日签到</h4>
              <p class="activity-desc">连续签到获取丰厚奖励</p>
              <button class="btn-secondary activity-btn">去签到</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 收集统计 -->
      <section class="section">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          我的数据
        </h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value text-gradient-primary">{{ userStore.totalPulls }}</span>
            <span class="stat-label">总抽卡次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-gradient-gold">{{ cardStore.collectionProgress.owned }}</span>
            <span class="stat-label">已收集卡牌</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">Lv.{{ userStore.level }}</span>
            <span class="stat-label">冒险等级</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ cardStore.collectionProgress.percentage }}%</span>
            <span class="stat-label">图鉴完成度</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 导航抽屉 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="uiStore.isDrawerOpen" class="drawer-overlay" @click="uiStore.closeDrawer()"></div>
      </transition>
      <transition name="slide-drawer">
        <nav v-if="uiStore.isDrawerOpen" class="nav-drawer">
          <div class="drawer-header">
            <div class="drawer-avatar">🎴</div>
            <h3 class="drawer-username">{{ userStore.profile?.nickname || '冒险者' }}</h3>
            <p class="drawer-uid">UID: {{ userStore.profile?.id?.slice(-8) || '------' }}</p>
          </div>
          <div class="drawer-menu">
            <router-link
              v-for="item in menuItems"
              :key="item.name"
              :to="item.to"
              class="drawer-item"
              @click="uiStore.closeDrawer()"
            >
              <span class="drawer-item-icon">{{ item.icon }}</span>
              <span class="drawer-item-label">{{ item.label }}</span>
            </router-link>
          </div>
          <div class="drawer-footer">
            <button class="drawer-logout" @click="handleLogout">
              🚪 退出登录
            </button>
          </div>
        </nav>
      </transition>
    </Teleport>

    <!-- 底部 Tab 栏 -->
    <nav class="bottom-tabs">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="tab-item"
        :class="{ active: currentTab === tab.name }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { useAuthStore, useUserStore, useCardStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();
const cardStore = useCardStore();
const uiStore = useUiStore();

onMounted(() => {
  userStore.fetchProfile();
});

/** 问候语 */
const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '🌙 夜深了';
  if (hour < 12) return '☀️ 早上好';
  if (hour < 18) return '🌤️ 下午好';
  return '🌅 晚上好';
});

/** 当前Tab */
const currentTab = computed(() => route.name);

/** 快捷功能入口 */
const quickActions = [
  { name: 'battle', icon: '⚔️', label: '战斗', to: { name: ROUTE_NAMES.BATTLE_MAP }, color: '#FF6B6B' },
  { name: 'gacha', icon: '🎰', label: '抽卡', to: { name: ROUTE_NAMES.GACHA }, color: '#F2A7B3' },
  { name: 'collection', icon: '📖', label: '图鉴', to: { name: ROUTE_NAMES.COLLECTION }, color: '#A8D8EA' },
  { name: 'bag', icon: '🎒', label: '背包', to: { name: ROUTE_NAMES.BAG }, color: '#FFC3A0' },
  { name: 'shop', icon: '🏪', label: '商店', to: { name: ROUTE_NAMES.SHOP }, color: '#B8A9C9' },
  { name: 'team', icon: '👥', label: '编队', to: { name: ROUTE_NAMES.TEAM_FORM }, color: '#90EE90' },
];

/** 底部 Tab */
const tabs = [
  { name: ROUTE_NAMES.HOME, icon: '🏠', label: '主页', to: { name: ROUTE_NAMES.HOME } },
  { name: ROUTE_NAMES.GACHA, icon: '🎰', label: '抽卡', to: { name: ROUTE_NAMES.GACHA } },
  { name: ROUTE_NAMES.COLLECTION, icon: '📖', label: '图鉴', to: { name: ROUTE_NAMES.COLLECTION } },
  { name: ROUTE_NAMES.PROFILE, icon: '👤', label: '我的', to: { name: ROUTE_NAMES.PROFILE } },
];

/** 侧边菜单 */
const menuItems = [
  { name: 'home', icon: '🏠', label: '主页', to: { name: ROUTE_NAMES.HOME } },
  { name: 'gacha', icon: '🎰', label: '抽卡', to: { name: ROUTE_NAMES.GACHA } },
  { name: 'collection', icon: '📖', label: '图鉴', to: { name: ROUTE_NAMES.COLLECTION } },
  { name: 'bag', icon: '🎒', label: '背包', to: { name: ROUTE_NAMES.BAG } },
  { name: 'shop', icon: '🏪', label: '商店', to: { name: ROUTE_NAMES.SHOP } },
  { name: 'battle', icon: '⚔️', label: '战斗', to: { name: ROUTE_NAMES.BATTLE_MAP } },
  { name: 'team', icon: '👥', label: '编队', to: { name: ROUTE_NAMES.TEAM_FORM } },
  { name: 'checkin', icon: '📅', label: '签到', to: { name: ROUTE_NAMES.CHECKIN } },
  { name: 'profile', icon: '👤', label: '个人中心', to: { name: ROUTE_NAMES.PROFILE } },
];

const handleLogout = async () => {
  await authStore.logout();
  userStore.clearUser();
  uiStore.closeDrawer();
  router.push({ name: ROUTE_NAMES.LOGIN });
};
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

// ========== 顶部导航 ==========
.home-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: rgba($bg-elevated, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: $z-sticky;
}

.menu-btn {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;

  &:active {
    background: $bg-overlay;
  }
}

.header-title {
  flex: 1;
  font-size: 20px;
  text-align: center;
  background: linear-gradient(135deg, $color-primary, $color-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-currency {
  display: flex;
  gap: 12px;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

.currency-icon {
  font-size: 14px;
}

.currency-value {
  color: $text-primary;
}

// ========== 主内容 ==========
.home-content {
  padding: 16px;
}

// ========== 欢迎横幅 ==========
.welcome-banner {
  position: relative;
  border-radius: $radius-xl;
  padding: 24px 20px;
  background: linear-gradient(135deg, $color-primary, $color-accent);
  color: white;
  overflow: hidden;
  margin-bottom: 20px;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 100% 0%, rgba(255,255,255,0.15) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(0,0,0,0.08) 0%, transparent 50%);
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-greeting {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.banner-name {
  font-size: 24px;
  margin-bottom: 8px;
}

.banner-info {
  font-size: 12px;
  opacity: 0.8;
}

.banner-avatar {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.avatar-emoji {
  font-size: 48px;
  opacity: 0.3;
}

// ========== 快捷功能 ==========
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
  transition: all $transition-normal;
  position: relative;

  &:active {
    transform: scale(0.94);
    box-shadow: $shadow-md;
  }
}

.action-icon {
  font-size: 28px;
}

.action-label {
  font-size: 12px;
  font-weight: 500;
  color: $text-secondary;
}

.action-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: $color-danger;
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: $radius-full;
  font-weight: 600;
}

// ========== 章节 ==========
.section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 18px;
}

// ========== 活动卡片 ==========
.activity-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-card {
  border-radius: $radius-lg;
  padding: 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform $transition-normal;

  &:active {
    transform: scale(0.98);
  }
}

.activity-gacha {
  background: linear-gradient(135deg, #FFE0B2 0%, #FFCCBC 100%);
}

.activity-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 90% 30%, rgba(255,255,255,0.3) 0%, transparent 60%);
}

.activity-checkin {
  background: linear-gradient(135deg, #C8E6C9 0%, #B2DFDB 100%);
}

.activity-content {
  position: relative;
  z-index: 1;
}

.activity-tag {
  display: inline-block;
  background: rgba(255, 152, 0, 0.8);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: $radius-full;
  margin-bottom: 8px;
}

.tag-green {
  background: rgba(76, 175, 80, 0.8);
}

.activity-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 12px;
}

.activity-btn {
  padding: 8px 20px;
  font-size: 13px;
}

// ========== 统计网格 ==========
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16px;
  text-align: center;
  border: 1px solid $border-color;
  box-shadow: $shadow-sm;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  font-family: $font-display;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: $text-tertiary;
}

// ========== 导航抽屉 ==========
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: $z-modal;
}

.nav-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: $bg-elevated;
  z-index: calc($z-modal + 1);
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl;
}

.slide-drawer-enter-active,
.slide-drawer-leave-active {
  transition: transform 0.3s ease;
}

.slide-drawer-enter-from,
.slide-drawer-leave-to {
  transform: translateX(-100%);
}

.drawer-header {
  padding: 40px 20px 24px;
  background: linear-gradient(135deg, $color-primary, $color-accent);
  color: white;
}

.drawer-avatar {
  font-size: 40px;
  margin-bottom: 12px;
}

.drawer-username {
  font-size: 18px;
  font-weight: 600;
}

.drawer-uid {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.drawer-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  font-size: 15px;
  color: $text-primary;
  transition: background $transition-fast;

  &:active, &.router-link-active {
    background: $bg-overlay;
    color: $color-primary;
  }
}

.drawer-item-icon {
  font-size: 20px;
}

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid $border-color;
}

.drawer-logout {
  width: 100%;
  text-align: left;
  padding: 12px 0;
  font-size: 14px;
  color: $color-danger;
}

// ========== 底部 Tab ==========
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba($bg-elevated, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid $border-color;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: $z-sticky;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  transition: color $transition-fast;
  color: $text-tertiary;

  &.active {
    color: $color-primary;
  }
}

.tab-icon {
  font-size: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
