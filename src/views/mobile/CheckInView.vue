<template>
  <div class="checkin-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">每日签到</h1>
      <span></span>
    </header>

    <div class="checkin-content">
      <!-- 连续签到提示 -->
      <div class="streak-banner">
        <div class="streak-bg"></div>
        <div class="streak-info">
          <p class="streak-label">连续签到</p>
          <h2 class="streak-count text-display">{{ checkInStreak }} <span class="streak-unit">天</span></h2>
        </div>
        <div class="streak-deco">📅</div>
      </div>

      <!-- 7日签到卡 -->
      <div class="calendar-card card-container">
        <h3 class="calendar-title">7日签到奖励</h3>
        <div class="day-grid">
          <div
            v-for="(reward, idx) in CHECKIN_REWARDS"
            :key="idx"
            class="day-item"
            :class="{
              claimed: idx < activeDayIndex,
              today: idx === activeDayIndex && !todayClaimed,
              'today-claimed': idx === activeDayIndex && todayClaimed,
            }"
          >
            <span class="day-label">Day {{ reward.day }}</span>
            <span class="day-icon">{{ reward.type === 'gold' ? '💰' : '💎' }}</span>
            <span class="day-reward">{{ reward.label }}</span>
            <span v-if="idx < activeDayIndex" class="day-check">✓</span>
            <span v-if="idx === activeDayIndex && todayClaimed" class="day-check">✓</span>
          </div>
        </div>
      </div>

      <!-- 签到按钮 -->
      <button
        class="btn-primary checkin-btn"
        :class="{ 'is-claimed': todayClaimed }"
        :disabled="todayClaimed || isLoading"
        @click="handleCheckIn"
      >
        <span v-if="isLoading" class="loading-spinner"></span>
        <span v-else-if="todayClaimed">✓ 今日已签到</span>
        <span v-else>🎁 签到领取奖励</span>
      </button>

      <!-- 签到奖励弹窗 -->
      <Teleport to="body">
        <transition name="popup">
          <div v-if="showReward" class="reward-overlay" @click="showReward = false">
            <div class="reward-popup" @click.stop>
              <div class="reward-icon-lg">🎉</div>
              <h3 class="reward-title text-display">签到成功！</h3>
              <div class="reward-detail">
                <span class="reward-emoji">{{ rewardData.type === 'gold' ? '💰' : '💎' }}</span>
                <span class="reward-text">{{ rewardData.label }}</span>
              </div>
              <button class="btn-primary" @click="showReward = false">太棒了</button>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>

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
      <router-link :to="{ name: ROUTE_NAMES.PROFILE }" class="tab-item">
        <span class="tab-icon">👤</span><span class="tab-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES, CHECKIN_REWARDS } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();

const isLoading = ref(false);
const todayClaimed = ref(false);
const checkInStreak = ref(0);
const showReward = ref(false);
const rewardData = ref({ type: 'gold', label: '', amount: 0 });

const activeDayIndex = computed(() => {
  if (todayClaimed.value) {
    return (checkInStreak.value - 1) % 7;
  }
  return checkInStreak.value % 7;
});

const handleCheckIn = async () => {
  isLoading.value = true;
  try {
    const result = await request.post('/checkin');
    todayClaimed.value = true;
    checkInStreak.value = result.streak;
    userStore.updateCurrency({ gold: result.gold, diamond: result.diamond });

    rewardData.value = result.reward;
    showReward.value = true;
  } catch (error) {
    uiStore.toast(error.message || '签到失败', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    const status = await request.get('/checkin/status');
    todayClaimed.value = status.todayClaimed;
    checkInStreak.value = status.streak;
  } catch {
    // 静默处理
  }
});
</script>

<style lang="scss" scoped>
.checkin-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

.page-header {
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

.back-btn {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
}

.checkin-content {
  padding: 16px;
}

// 连签横幅
.streak-banner {
  position: relative;
  border-radius: $radius-xl;
  padding: 24px 20px;
  background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 50%, #81C784 100%);
  color: #1B5E20;
  overflow: hidden;
  margin-bottom: 20px;
}

.streak-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 90% 30%, rgba(255,255,255,0.2) 0%, transparent 60%);
}

.streak-info {
  position: relative;
  z-index: 1;
}

.streak-label {
  font-size: 13px;
  opacity: 0.8;
}

.streak-count {
  font-size: 36px;
  margin-top: 4px;
}

.streak-unit {
  font-size: 16px;
  font-weight: 400;
}

.streak-deco {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.3;
}

// 日历卡
.calendar-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16px;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  border-radius: $radius-md;
  background: $bg-main;
  border: 1.5px solid $border-color;
  position: relative;
  transition: all $transition-normal;

  &.claimed {
    background: rgba($color-success, 0.08);
    border-color: rgba($color-success, 0.3);
    opacity: 0.6;
  }

  &.today {
    background: rgba($color-primary, 0.08);
    border-color: $color-primary;
    box-shadow: 0 0 12px rgba($color-primary, 0.15);
    animation: pulse-border 2s ease-in-out infinite;
  }

  &.today-claimed {
    background: rgba($color-success, 0.1);
    border-color: $color-success;
  }
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 8px rgba($color-primary, 0.15); }
  50% { box-shadow: 0 0 20px rgba($color-primary, 0.3); }
}

.day-label {
  font-size: 10px;
  color: $text-tertiary;
  font-weight: 600;
}

.day-icon {
  font-size: 22px;
}

.day-reward {
  font-size: 10px;
  color: $text-secondary;
  text-align: center;
  line-height: 1.2;
}

.day-check {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  color: $color-success;
  font-weight: 700;
}

// 签到按钮
.checkin-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;

  &.is-claimed {
    background: $bg-card;
    color: $text-tertiary;
    box-shadow: none;
  }
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 奖励弹窗
.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.reward-popup {
  background: $bg-elevated;
  border-radius: $radius-xl;
  padding: 32px 24px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  animation: scale-in 0.35s ease;
}

.reward-icon-lg {
  font-size: 48px;
  margin-bottom: 12px;
}

.reward-title {
  font-size: 20px;
  color: $text-primary;
  margin-bottom: 16px;
}

.reward-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba($color-accent, 0.1);
  border-radius: $radius-md;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.reward-emoji {
  font-size: 24px;
}

.reward-text {
  font-size: 16px;
  font-weight: 600;
  color: $color-accent-dark;
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
