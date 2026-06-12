<template>
  <!-- 全服抽卡广播 -->
  <BroadcastBar v-if="authStore.isLoggedIn" />

  <!-- Toast 通知 -->
  <transition name="fade">
    <div v-if="uiStore.showToast" :class="['toast', `toast-${uiStore.toastType}`]">
      {{ uiStore.toastMessage }}
    </div>
  </transition>

  <!-- 路由视图 -->
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<script setup>
/**
 * App 根组件
 * 集成广播弹幕、Toast 通知、路由过渡动画
 * 应用启动时自动从服务端同步用户资料与卡牌数据，确保不依赖 localStorage 缓存
 */
import { onMounted } from 'vue';
import BroadcastBar from './components/mobile/BroadcastBar.vue';
import { useAuthStore, useUserStore, useCardStore, useUiStore } from './stores/index.js';
import request from './services/request.js';

const authStore = useAuthStore();
const userStore = useUserStore();
const cardStore = useCardStore();
const uiStore = useUiStore();

/**
 * 应用初始化 — 从服务端拉取最新用户数据和卡牌数据
 * 确保刷新页面、打开新标签页后，资源数据与服务端同步
 */
onMounted(async () => {
  if (authStore.isLoggedIn) {
    // 并行拉取用户资料和卡牌数据
    await Promise.all([
      userStore.fetchProfile(),
      refreshCardData(),
    ]);
  }
});

/**
 * 刷新卡牌数据
 */
const refreshCardData = async () => {
  try {
    const [allCards, myCards] = await Promise.all([
      request.get('/cards'),
      request.get('/user/cards'),
    ]);
    cardStore.setAllCards(allCards || []);
    cardStore.setMyCards(myCards || []);
  } catch {
    // 静默处理
  }
};
</script>

<style lang="scss">
@use './styles/global.scss';
@use './styles/animations.scss';
@use './styles/card-frames.scss';

// Toast 样式
.toast {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 16px);
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  z-index: 9000;
  backdrop-filter: blur(12px);
  max-width: 85%;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

  &-success {
    background: rgba(52, 199, 89, 0.9);
    color: white;
  }

  &-error {
    background: rgba(255, 59, 48, 0.9);
    color: white;
  }

  &-warning {
    background: rgba(255, 159, 10, 0.9);
    color: white;
  }

  &-info {
    background: rgba(44, 44, 46, 0.85);
    color: white;
  }
}
</style>
