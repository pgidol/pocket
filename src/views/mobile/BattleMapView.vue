<template>
  <div class="battle-map-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">战斗</h1>
      <div class="header-stamina">
        <span>⚡</span>
        <span class="stamina-count">{{ battleStore.stamina }}/{{ battleStore.maxStamina }}</span>
      </div>
    </header>

    <!-- 章节Tab -->
    <div class="chapter-tabs">
      <button
        v-for="ch in CHAPTER_CONFIG"
        :key="ch.chapter"
        class="chapter-tab"
        :class="{ active: currentChapter === ch.chapter }"
        :style="{ '--ch-color': ch.color }"
        @click="selectChapter(ch.chapter)"
      >
        <span class="ch-icon">{{ ch.icon }}</span>
        <span class="ch-name">{{ ch.name }}</span>
      </button>
    </div>

    <!-- 关卡列表 -->
    <div class="stages-container">
      <div v-if="loading" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>加载中...</p>
      </div>

      <div v-else-if="stages.length === 0" class="empty-state">
        <span class="empty-icon">🔒</span>
        <p>暂无关卡数据</p>
      </div>

      <div v-else class="stages-list">
        <div
          v-for="stage in stages"
          :key="stage.id"
          class="stage-node"
          :class="{
            cleared: isCleared(stage.id),
            current: isCurrent(stage),
            locked: isLocked(stage),
          }"
          @click="openStageDetail(stage)"
        >
          <div class="stage-icon-wrap">
            <span v-if="isCleared(stage.id)" class="stage-icon cleared-icon">✅</span>
            <span v-else-if="isCurrent(stage)" class="stage-icon current-icon">⭐</span>
            <span v-else class="stage-icon locked-icon">🔒</span>
          </div>
          <div class="stage-info">
            <h3 class="stage-name">{{ stage.chapter }}-{{ stage.stageNum }}</h3>
            <p class="stage-title">{{ stage.name }}</p>
            <div class="stage-meta">
              <span class="meta-stamina">⚡{{ stage.staminaCost }}</span>
              <span class="meta-power">⚔️{{ stage.recommendPower }}</span>
              <div v-if="isCleared(stage.id)" class="stage-stars">
                <span v-for="s in 3" :key="s" :class="{ 'star-active': s <= getStars(stage.id) }">★</span>
              </div>
            </div>
          </div>
          <div class="stage-arrow">›</div>
        </div>
      </div>
    </div>

    <!-- 关卡详情弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="selectedStage" class="detail-overlay" @click="selectedStage = null">
          <div class="detail-modal" @click.stop>
            <button class="modal-close" @click="selectedStage = null">✕</button>
            <h2 class="modal-title text-display">{{ selectedStage.name }}</h2>
            <p class="modal-desc">{{ selectedStage.description }}</p>

            <div class="modal-info-grid">
              <div class="info-item">
                <span class="info-label">体力消耗</span>
                <span class="info-value">⚡ {{ selectedStage.staminaCost }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">推荐战力</span>
                <span class="info-value">⚔️ {{ selectedStage.recommendPower }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">经验奖励</span>
                <span class="info-value">📊 {{ selectedStage.rewards?.exp }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">金币奖励</span>
                <span class="info-value">💰 {{ selectedStage.rewards?.gold }}</span>
              </div>
            </div>

            <!-- 敌方阵容预览 -->
            <h3 class="enemies-title">敌方阵容</h3>
            <div class="enemies-preview">
              <div v-for="(enemy, idx) in selectedStage.enemies" :key="idx" class="enemy-card">
                <div :class="['mini-frame', `mini-frame-${(enemy.cardId?.rarity || 'n').toLowerCase()}`]">
                  <span class="enemy-emoji">{{ factionEmoji(enemy.cardId?.series) }}</span>
                </div>
                <span class="enemy-name">{{ enemy.cardId?.name || '???' }}</span>
                <span class="enemy-level">Lv.{{ enemy.level }}</span>
              </div>
            </div>

            <div v-if="selectedStage.rewards?.diamond > 0" class="first-clear-bonus">
              💎 首通奖励: {{ selectedStage.rewards.diamond }} 钻石
            </div>

            <button
              class="btn-primary challenge-btn"
              :disabled="isLocked(selectedStage) || battleStore.stamina < selectedStage.staminaCost"
              @click="goToTeamForm"
            >
              {{ isLocked(selectedStage) ? '🔒 未解锁' : battleStore.stamina < selectedStage.staminaCost ? '体力不足' : '⚔️ 编队挑战' }}
            </button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 底部 Tab -->
    <nav class="bottom-tabs">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="tab-item">
        <span class="tab-icon">🏠</span><span class="tab-label">主页</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.BATTLE_MAP }" class="tab-item active">
        <span class="tab-icon">⚔️</span><span class="tab-label">战斗</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item">
        <span class="tab-icon">🎰</span><span class="tab-label">抽卡</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.PROFILE }" class="tab-item">
        <span class="tab-icon">👤</span><span class="tab-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useBattleStore } from '../../stores/index.js';
import { ROUTE_NAMES, CHAPTER_CONFIG, FACTION_CONFIG } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const battleStore = useBattleStore();

const currentChapter = ref(1);
const stages = ref([]);
const loading = ref(false);
const selectedStage = ref(null);

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

const isCleared = (stageId) => battleStore.progress[stageId]?.cleared;
const getStars = (stageId) => battleStore.progress[stageId]?.stars || 0;

const isLocked = (stage) => {
  if (stage.chapter === 1 && stage.stageNum === 1) return false;
  // 需要前一关通关
  const prevStage = stages.value.find(
    (s) => s.chapter === stage.chapter && s.stageNum === stage.stageNum - 1
  );
  if (prevStage) return !isCleared(prevStage.id);
  // 跨章需要上一章最后一关通关
  if (stage.stageNum === 1 && stage.chapter > 1) {
    // 简化判断
    return false; // 由后端canChallenge做安全校验
  }
  return false;
};

const isCurrent = (stage) => !isCleared(stage.id) && !isLocked(stage);

const selectChapter = async (chapter) => {
  currentChapter.value = chapter;
  await loadStages(chapter);
};

const loadStages = async (chapter) => {
  loading.value = true;
  try {
    const [stageData, progressData, staminaData] = await Promise.all([
      request.get(`/stages/${chapter}`),
      request.get('/stages/progress'),
      request.get('/battle/stamina'),
    ]);
    stages.value = stageData || [];
    battleStore.setProgress(progressData || {});
    battleStore.setStamina(staminaData);
  } catch {
    stages.value = [];
  } finally {
    loading.value = false;
  }
};

const openStageDetail = (stage) => {
  if (!isLocked(stage)) {
    selectedStage.value = stage;
  }
};

const goToTeamForm = () => {
  battleStore.setStage(selectedStage.value);
  selectedStage.value = null;
  router.push({ name: ROUTE_NAMES.TEAM_FORM });
};

onMounted(() => {
  loadStages(currentChapter.value);
});
</script>

<style lang="scss" scoped>
.battle-map-page {
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
  &:active { background: $bg-overlay; border-radius: $radius-sm; }
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  color: $text-primary;
}

.header-stamina {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.stamina-count { color: $color-success; }

// ========== 章节Tab ==========
.chapter-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.chapter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: $radius-full;
  background: $bg-card;
  border: 1.5px solid $border-color;
  font-size: 13px;
  white-space: nowrap;
  transition: all $transition-normal;
  cursor: pointer;

  &.active {
    background: linear-gradient(135deg, var(--ch-color), #f8cdd4);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}

.ch-icon { font-size: 16px; }

// ========== 关卡列表 ==========
.stages-container {
  padding: 0 16px 16px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 12px;
  color: $text-tertiary;
}

.loading-icon, .empty-icon { font-size: 48px; opacity: 0.5; }

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stage-node {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1px solid $border-color;
  box-shadow: $shadow-sm;
  transition: all $transition-normal;
  cursor: pointer;

  &:active { transform: scale(0.98); }

  &.cleared {
    border-color: rgba($color-success, 0.3);
    .stage-name { color: $color-success; }
  }

  &.current {
    border-color: rgba($color-warning, 0.4);
    box-shadow: 0 0 12px rgba($color-warning, 0.15);
    background: linear-gradient(135deg, rgba(255,159,10,0.04), rgba(255,255,255,0));
  }

  &.locked {
    opacity: 0.5;
    pointer-events: none;
  }
}

.stage-icon-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $bg-overlay;
  font-size: 20px;
}

.stage-info { flex: 1; }

.stage-name {
  font-size: 15px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 2px;
}

.stage-title {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 4px;
}

.stage-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: $text-tertiary;
}

.meta-stamina { color: $color-success; }
.meta-power { color: $color-warning; }

.stage-stars {
  display: flex;
  gap: 1px;
  font-size: 12px;
  color: #D0D0D0;

  .star-active { color: #FFD700; }
}

.stage-arrow {
  font-size: 20px;
  color: $text-tertiary;
  font-weight: 300;
}

// ========== 详情弹窗 ==========
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.detail-modal {
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  background: $bg-elevated;
  border-radius: $radius-xl $radius-xl 0 0;
  padding: 24px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  overflow-y: auto;
  position: relative;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 18px;
  color: $text-tertiary;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  font-size: 20px;
  color: $text-primary;
  margin-bottom: 6px;
}

.modal-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 16px;
  line-height: 1.6;
}

.modal-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.info-item {
  background: $bg-main;
  border-radius: $radius-md;
  padding: 10px 12px;
  text-align: center;
}

.info-label {
  display: block;
  font-size: 11px;
  color: $text-tertiary;
  margin-bottom: 4px;
}

.info-value {
  font-size: 15px;
  font-weight: 700;
  color: $text-primary;
}

.enemies-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 10px;
}

.enemies-preview {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.enemy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}

.mini-frame {
  width: 48px;
  height: 48px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;

  &.mini-frame-n { background: $rarity-n; }
  &.mini-frame-r { background: $rarity-r; }
  &.mini-frame-sr { background: $rarity-sr; }
  &.mini-frame-ssr { background: $rarity-ssr; }
  &.mini-frame-ur { background: $rarity-ur; }
}

.enemy-name {
  font-size: 10px;
  color: $text-secondary;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enemy-level {
  font-size: 10px;
  color: $text-tertiary;
  font-weight: 600;
}

.first-clear-bonus {
  background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.08));
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: $radius-md;
  padding: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #B8860B;
  margin-bottom: 16px;
}

.challenge-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

// ========== 底部Tab ==========
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
