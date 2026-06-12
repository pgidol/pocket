<template>
  <div class="bag-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">我的背包</h1>
      <div class="header-count">{{ myCards.length }}张</div>
    </header>

    <!-- 排序切换 -->
    <div class="sort-bar">
      <button
        v-for="opt in sortOptions"
        :key="opt.key"
        class="sort-btn"
        :class="{ active: sortBy === opt.key }"
        @click="sortBy = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 卡牌列表 -->
    <div v-if="sortedCards.length > 0" class="card-list">
      <div
        v-for="card in sortedCards"
        :key="card.cardId"
        class="bag-card"
        @click="openDetail(card)"
      >
        <div :class="['card-frame', `card-frame-${card.rarity.toLowerCase()}`, 'card-size-sm']">
          <div class="card-inner">
            <div class="card-image">
              <span class="card-placeholder-icon">{{ factionEmoji(card.series) }}</span>
            </div>
            <div class="card-name">{{ card.name }}</div>
          </div>
        </div>
        <div class="bag-card-info">
          <span :class="['rarity-badge', `rarity-${card.rarity.toLowerCase()}`]">{{ card.rarity }}</span>
          <span class="card-count">×{{ card.count }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon">🎴</span>
      <p class="empty-text">背包空空如也</p>
      <button class="btn-primary" @click="router.push({ name: ROUTE_NAMES.GACHA })">去抽卡</button>
    </div>

    <!-- 卡牌详情弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="selectedCard" class="detail-overlay" @click="selectedCard = null">
          <div class="detail-container" @click.stop>
            <button class="close-btn" @click="selectedCard = null">✕</button>

            <div class="detail-card-wrapper">
              <div
                :class="[
                  'card-frame',
                  `card-frame-${selectedCard.rarity.toLowerCase()}`,
                  'card-size-xl',
                  'detail-card',
                  { flipped: isFlipped }
                ]"
                @click="isFlipped = !isFlipped"
              >
                <div class="card-front">
                  <div class="card-inner">
                    <div class="card-image">
                      <span class="card-placeholder-icon-lg">{{ factionEmoji(selectedCard.series) }}</span>
                    </div>
                    <div class="card-name">{{ selectedCard.name }}</div>
                    <span :class="['rarity-badge', `rarity-${selectedCard.rarity.toLowerCase()}`]">
                      {{ selectedCard.rarity }}
                    </span>
                  </div>
                </div>
                <div class="card-back">
                  <div class="card-inner card-back-content">
                    <div class="back-pattern"></div>
                    <h3 class="back-title">{{ selectedCard.name }}</h3>
                    <div class="back-faction">
                      <span class="faction-icon">{{ factionEmoji(selectedCard.series) }}</span>
                      <span class="faction-name">{{ factionName(selectedCard.series) }}</span>
                    </div>
                    <p class="back-story">{{ selectedCard.description || '这位角色的故事尚未被揭开...' }}</p>
                    <div class="back-meta">
                      <span>持有 ×{{ selectedCard.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p class="flip-hint">💡 点击卡牌翻转查看故事</p>
            <div class="detail-actions">
              <button class="btn-primary detail-action-btn" @click="goUpgrade(selectedCard)">📈 养成升级</button>
              <button class="btn-secondary detail-action-btn" @click="goTeam">👥 编队</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

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

import { useCardStore } from '../../stores/index.js';
import { ROUTE_NAMES, RARITY_ORDER } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const cardStore = useCardStore();

const sortBy = ref('rarity');
const selectedCard = ref(null);
const isFlipped = ref(false);

const sortOptions = [
  { key: 'rarity', label: '按稀有度' },
  { key: 'count', label: '按数量' },
  { key: 'time', label: '按获取时间' },
];

const myCards = computed(() => cardStore.myCards);

const sortedCards = computed(() => {
  const cards = [...myCards.value];
  switch (sortBy.value) {
    case 'rarity':
      return cards.sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
    case 'count':
      return cards.sort((a, b) => b.count - a.count);
    case 'time':
      return cards.sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt));
    default:
      return cards;
  }
});

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

const factionName = (series) => {
  const map = { celestial: '天界', demon: '魔界', mortal: '人间' };
  return map[series] || '未知';
};

// 打开详情时重置翻转状态
const openDetail = (card) => {
  selectedCard.value = card;
  isFlipped.value = false;
};

// 跳转养成页面
const goUpgrade = (card) => {
  selectedCard.value = null;
  const id = card.userCardId || card.cardId || card.id;
  router.push({ name: ROUTE_NAMES.CARD_UPGRADE, params: { id } });
};

// 跳转编队页面
const goTeam = () => {
  selectedCard.value = null;
  router.push({ name: ROUTE_NAMES.TEAM_FORM });
};

onMounted(async () => {
  try {
    const cards = await request.get('/user/cards');
    cardStore.setMyCards(cards || []);
  } catch {
    // 静默处理
  }
});
</script>

<style lang="scss" scoped>
.bag-page {
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

.header-count {
  font-size: 13px;
  color: $text-tertiary;
  font-weight: 500;
}

// 排序栏
.sort-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.sort-btn {
  padding: 6px 14px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  background: $bg-card;
  color: $text-secondary;
  border: 1px solid $border-color;
  transition: all $transition-normal;

  &.active {
    background: linear-gradient(135deg, $color-primary, $color-accent);
    color: white;
    border-color: transparent;
  }
}

// 卡牌列表
.card-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px 16px;
}

.bag-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.bag-card-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-count {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
}

.card-placeholder-icon {
  font-size: 32px;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.4;
}

.empty-text {
  font-size: 14px;
  color: $text-tertiary;
}

// ========== 卡牌详情弹窗 ==========
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.detail-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-card-wrapper {
  perspective: 1000px;
}

.detail-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
  cursor: pointer;
  overflow: visible !important; /* 关键：覆盖 .card-frame 带来的 overflow: hidden，恢复 3D 渲染上下文 */

  &.flipped {
    transform: rotateY(180deg);
  }
}

.card-front,
.card-back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden; /* Webkit 浏览器（如 iOS Safari）兼容性支持 */
}

.card-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

.card-back-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  position: relative;
}

.back-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 30%, rgba($color-primary, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba($color-secondary, 0.05) 0%, transparent 50%);
  border-radius: inherit;
}

.back-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  position: relative;
  z-index: 1;
}

.back-faction {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.faction-icon {
  font-size: 16px;
}

.faction-name {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
}

.back-story {
  font-size: 12px;
  line-height: 1.8;
  color: $text-secondary;
  padding: 0 12px;
  position: relative;
  z-index: 1;
  max-height: 120px;
  overflow-y: auto;
}

.back-meta {
  font-size: 11px;
  color: $text-tertiary;
  position: relative;
  z-index: 1;
}

.card-placeholder-icon-lg {
  font-size: 56px;
}

.flip-hint {
  margin-top: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  width: 100%;
  max-width: 280px;
}

.detail-action-btn {
  flex: 1;
  padding: 10px 12px;
  font-size: 13px;
  border-radius: $radius-md;
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
