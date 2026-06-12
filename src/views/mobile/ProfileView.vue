<template>
  <div class="profile-page page-container">
    <header class="page-header">
      <span></span>
      <h1 class="header-title text-display">个人中心</h1>
      <span></span>
    </header>

    <div class="profile-card card-container">
      <div class="profile-avatar">🎴</div>
      <h2 class="profile-name">{{ userStore.profile?.nickname || '冒险者' }}</h2>
      <p class="profile-username">@{{ userStore.profile?.username || '---' }}</p>
      <p class="profile-uid">UID: {{ userStore.profile?.id?.slice(-8) || '------' }}</p>
    </div>

    <div class="profile-stats">
      <div class="stat-row">
        <span class="stat-icon">💰</span>
        <span class="stat-label">金币</span>
        <span class="stat-value">{{ userStore.gold }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-icon">💎</span>
        <span class="stat-label">钻石</span>
        <span class="stat-value">{{ userStore.diamond }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-icon">🎰</span>
        <span class="stat-label">总抽卡次数</span>
        <span class="stat-value">{{ userStore.totalPulls }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-icon">⭐</span>
        <span class="stat-label">冒险等级</span>
        <span class="stat-value">Lv.{{ userStore.level }}</span>
      </div>
    </div>

    <button class="btn-secondary logout-btn" @click="handleLogout">
      🚪 退出登录
    </button>

    <!-- 底部 Tab -->
    <nav class="bottom-tabs">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="tab-item">
        <span class="tab-icon">🏠</span><span class="tab-label">主页</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item">
        <span class="tab-icon">🎰</span><span class="tab-label">抽卡</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.COLLECTION }" class="tab-item">
        <span class="tab-icon">📖</span><span class="tab-label">图鉴</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.PROFILE }" class="tab-item active">
        <span class="tab-icon">👤</span><span class="tab-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore, useUserStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

onMounted(() => {
  userStore.fetchProfile();
});

const handleLogout = async () => {
  await authStore.logout();
  userStore.clearUser();
  router.push({ name: ROUTE_NAMES.LOGIN });
};
</script>

<style lang="scss" scoped>
.profile-page {
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.profile-avatar {
  font-size: 60px;
  margin-bottom: 12px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
}

.profile-username {
  font-size: 13px;
  color: $text-secondary;
  margin-top: 4px;
}

.profile-uid {
  font-size: 11px;
  color: $text-tertiary;
  margin-top: 2px;
}

.profile-stats {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
  overflow: hidden;
  margin-bottom: 24px;
}

.stat-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid $divider;

  &:last-child { border-bottom: none; }
}

.stat-icon { font-size: 20px; margin-right: 12px; }
.stat-label { flex: 1; font-size: 14px; color: $text-secondary; }
.stat-value { font-size: 15px; font-weight: 600; color: $text-primary; }

.logout-btn {
  width: 100%;
  padding: 14px;
  color: $color-danger;
  border-color: rgba($color-danger, 0.2);
}

// 底部 Tab
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
  color: $text-tertiary;
  &.active { color: $color-primary; }
}

.tab-icon { font-size: 22px; }
.tab-label { font-size: 10px; font-weight: 500; }
</style>
