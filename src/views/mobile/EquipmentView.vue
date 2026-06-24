<template>
  <div class="equipment-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">召唤师装备</h1>
      <div class="header-placeholder"></div>
    </header>

    <div class="equipment-content">
      <!-- 角色模型区域 -->
      <div class="character-area">
        <div class="character-glow"></div>
        <div class="character-model">
          <span class="character-icon">⚔️</span>
          <span class="character-label">召唤师</span>
        </div>

        <!-- 6个装备槽位 -->
        <div class="slot slot-head" @click="handleSlotClick('head')">
          <div class="slot-inner">
            <span class="slot-icon">🪖</span>
            <span class="slot-name">头部</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>

        <div class="slot slot-weapon" @click="handleSlotClick('weapon')">
          <div class="slot-inner">
            <span class="slot-icon">⚔️</span>
            <span class="slot-name">武器</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>

        <div class="slot slot-armor" @click="handleSlotClick('armor')">
          <div class="slot-inner">
            <span class="slot-icon">🛡️</span>
            <span class="slot-name">护甲</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>

        <div class="slot slot-accessory" @click="handleSlotClick('accessory')">
          <div class="slot-inner">
            <span class="slot-icon">💍</span>
            <span class="slot-name">饰品</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>

        <div class="slot slot-legs" @click="handleSlotClick('legs')">
          <div class="slot-inner">
            <span class="slot-icon">🦿</span>
            <span class="slot-name">腿部</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>

        <div class="slot slot-boots" @click="handleSlotClick('boots')">
          <div class="slot-inner">
            <span class="slot-icon">👢</span>
            <span class="slot-name">鞋子</span>
          </div>
          <div class="slot-lock">🔒</div>
        </div>
      </div>

      <!-- 属性加成预览（预留） -->
      <div class="stats-preview">
        <h3 class="stats-title">装备属性加成</h3>
        <div class="stats-grid">
          <div class="stat-row">
            <span class="stat-label">❤️ 生命值</span>
            <span class="stat-value stat-zero">+0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">⚔️ 攻击力</span>
            <span class="stat-value stat-zero">+0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🛡️ 防御力</span>
            <span class="stat-value stat-zero">+0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">💨 速度</span>
            <span class="stat-value stat-zero">+0</span>
          </div>
        </div>
      </div>

      <!-- 即将上线提示 -->
      <div class="coming-soon">
        <div class="coming-soon-icon">🔧</div>
        <h3 class="coming-soon-title">装备系统即将上线</h3>
        <p class="coming-soon-desc">
          全新召唤师装备系统正在紧张开发中！<br />
          穿戴装备可以为你的战斗提供强力加成。
        </p>
        <div class="coming-soon-features">
          <div class="feature-item">
            <span class="feature-icon">🪖</span>
            <span>6个装备位置</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⬆️</span>
            <span>装备强化</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span>战斗加成</span>
          </div>
        </div>
      </div>
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
import { useRouter } from 'vue-router';

import { useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';

const router = useRouter();
const uiStore = useUiStore();

const handleSlotClick = (slot) => {
  const slotNames = {
    head: '头部', armor: '护甲', legs: '腿部',
    boots: '鞋子', weapon: '武器', accessory: '饰品',
  };
  uiStore.toast(`${slotNames[slot]}装备 — 即将开放`, 'info');
};
</script>

<style lang="scss" scoped>
.equipment-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

// ========== 页头 ==========
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
  color: $text-primary;
}

.header-placeholder {
  width: 36px;
}

// ========== 内容区 ==========
.equipment-content {
  padding: 16px;
}

// ========== 角色区域 ==========
.character-area {
  position: relative;
  height: 320px;
  margin-bottom: 20px;
}

.character-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba($color-primary, 0.15) 0%, transparent 70%);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}

.character-model {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
}

.character-icon {
  font-size: 56px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
}

.character-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
}

// ========== 装备槽位 ==========
.slot {
  position: absolute;
  width: 68px;
  height: 68px;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 2px dashed rgba($color-primary, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-normal;
  box-shadow: $shadow-sm;

  &:active {
    transform: scale(0.93);
    border-color: $color-primary;
  }
}

.slot-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.slot-icon {
  font-size: 22px;
  opacity: 0.5;
}

.slot-name {
  font-size: 10px;
  color: $text-tertiary;
  font-weight: 500;
}

.slot-lock {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 14px;
  background: $bg-elevated;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-sm;
}

// 各槽位布局位置
.slot-head     { top: 10px;  left: 50%; transform: translateX(-50%); }
.slot-weapon   { top: 80px;  left: 12%; }
.slot-armor    { top: 80px;  right: 12%; }
.slot-accessory { top: 180px; left: 12%; }
.slot-legs     { top: 180px; right: 12%; }
.slot-boots    { bottom: 10px; left: 50%; transform: translateX(-50%); }

// ========== 属性加成 ==========
.stats-preview {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16px;
  border: 1px solid $border-color;
  margin-bottom: 20px;
}

.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: $bg-main;
  border-radius: $radius-sm;
}

.stat-label {
  font-size: 13px;
  color: $text-secondary;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: $color-success;
}

.stat-zero {
  color: $text-tertiary;
}

// ========== 即将上线 ==========
.coming-soon {
  text-align: center;
  padding: 28px 20px;
  background: linear-gradient(135deg, rgba($color-primary, 0.06), rgba($color-accent, 0.06));
  border-radius: $radius-xl;
  border: 1px solid rgba($color-primary, 0.12);
}

.coming-soon-icon {
  font-size: 40px;
  margin-bottom: 12px;
  animation: bounce-icon 2s ease-in-out infinite;
}

@keyframes bounce-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.coming-soon-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
}

.coming-soon-desc {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 20px;
}

.coming-soon-features {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
}

.feature-icon {
  font-size: 24px;
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
  color: $text-tertiary;
  &.active { color: $color-primary; }
}

.tab-icon { font-size: 22px; }
.tab-label { font-size: 10px; font-weight: 500; }
</style>
