<template>
  <div class="collection-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">卡牌图鉴</h1>
      <span class="progress-badge">{{ cardStore.collectionProgress.owned }}/{{ cardStore.collectionProgress.total }}</span>
    </header>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <!-- 稀有度Tab -->
      <div class="rarity-tabs">
        <button
          v-for="tab in rarityTabs"
          :key="tab.key"
          class="rarity-tab"
          :class="[`tab-${tab.key.toLowerCase()}`, { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <!-- 仅看持有 -->
      <div class="filter-toggles">
        <button
          class="toggle-btn"
          :class="{ active: ownedOnly }"
          @click="ownedOnly = !ownedOnly"
        >
          {{ ownedOnly ? '✅ 仅看持有' : '📋 全部' }}
        </button>
      </div>
    </div>

    <!-- 卡牌网格 -->
    <div class="card-grid">
      <div
        v-for="card in filteredCards"
        :key="card.id"
        :class="[
          'card-frame',
          `card-frame-${card.rarity.toLowerCase()}`,
          'card-size-sm',
          { 'card-uncollected': !cardStore.ownedCardIds.has(card.id) }
        ]"
        @click="openDetail(card)"
      >
        <div class="card-inner">
          <div class="card-image">
            <span class="card-placeholder-icon">{{ factionEmoji(card.series) }}</span>
          </div>
          <div class="card-name">{{ card.name }}</div>
        </div>
        <!-- 重新设计的卡牌等级与星级徽章 -->
        <div v-if="getOwnedInfo(card.id)" class="card-badges">
          <!-- 等级 -->
          <div class="badge-level">
            <span class="level-text">Lv.{{ getOwnedInfo(card.id).level || 1 }}</span>
          </div>
          <!-- 星级 -->
          <div v-if="(getOwnedInfo(card.id).stars || 0) > 0" class="badge-stars">
            <span v-for="s in getOwnedInfo(card.id).stars" :key="s" class="mini-star">★</span>
          </div>
        </div>
        <!-- 持有数量 -->
        <div v-if="getOwnedInfo(card.id)?.count > 1" class="badge-count">
          ×{{ getOwnedInfo(card.id).count }}
        </div>
      </div>
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
                      <span>已收集</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p class="flip-hint">💡 点击卡牌翻转查看故事</p>

            <!-- 已持有卡牌的养成信息 -->
            <div v-if="selectedOwnedInfo" class="detail-card-stats">
              <div class="stat-chip">
                <span class="stat-chip-label">等级</span>
                <span class="stat-chip-value">Lv.{{ selectedOwnedInfo.level || 1 }}</span>
              </div>
              <div class="stat-chip">
                <span class="stat-chip-label">星级</span>
                <span class="stat-chip-value">
                  <span v-for="s in 5" :key="s" :class="s <= (selectedOwnedInfo.stars || 0) ? 'star-on' : 'star-off'">★</span>
                </span>
              </div>
              <div class="stat-chip">
                <span class="stat-chip-label">持有</span>
                <span class="stat-chip-value">×{{ selectedOwnedInfo.count || 1 }}</span>
              </div>
            </div>

            <div class="detail-actions">
              <button class="btn-primary detail-action-btn" @click="goUpgrade(selectedCard)">📈 养成升级</button>
              <button class="btn-secondary detail-action-btn" @click="goTeam">👥 编队</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 底部 Tab 栏 -->
    <nav class="bottom-tabs">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="tab-item">
        <span class="tab-icon">🏠</span><span class="tab-label">主页</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item">
        <span class="tab-icon">🎰</span><span class="tab-label">抽卡</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.COLLECTION }" class="tab-item active">
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

const activeTab = ref('ALL');
const selectedCard = ref(null);
const isFlipped = ref(false);
const ownedOnly = ref(false);

const rarityTabs = [
  { key: 'ALL', label: '全部' },
  { key: 'N', label: 'N' },
  { key: 'R', label: 'R' },
  { key: 'SR', label: 'SR' },
  { key: 'SSR', label: 'SSR' },
  { key: 'UR', label: 'UR' },
];

/** 持有卡牌信息的快速查询 Map（cardId → myCard）*/
const ownedMap = computed(() => {
  const map = new Map();
  (cardStore.myCards || []).forEach((c) => {
    if (c && c.cardId) {
      map.set(c.cardId, c);
    }
  });
  return map;
});

/**
 * 获取已持有卡牌的养成信息
 * @param {string} cardId
 * @returns {Object|null}
 */
const getOwnedInfo = (cardId) => ownedMap.value.get(cardId) || null;

/** 当前选中卡牌的持有信息 */
const selectedOwnedInfo = computed(() => {
  if (!selectedCard.value) return null;
  return getOwnedInfo(selectedCard.value.id);
});

const filteredCards = computed(() => {
  let cards = [];
  if (activeTab.value === 'ALL') {
    cards = (cardStore.allCards || []).filter((c) => c && c.id && c.rarity);
  } else {
    cards = (cardStore.cardsByRarity[activeTab.value] || []).filter((c) => c && c.id && c.rarity);
  }

  // 仅看持有筛选
  if (ownedOnly.value) {
    cards = cards.filter((c) => cardStore.ownedCardIds.has(c.id));
  }

  // 排序：已持有优先 → 稀有度高优先 → 等级高优先
  return [...cards].sort((a, b) => {
    const aOwned = cardStore.ownedCardIds.has(a.id) ? 1 : 0;
    const bOwned = cardStore.ownedCardIds.has(b.id) ? 1 : 0;
    if (bOwned !== aOwned) return bOwned - aOwned;

    const orderA = RARITY_ORDER[a.rarity] ?? 0;
    const orderB = RARITY_ORDER[b.rarity] ?? 0;
    if (orderB !== orderA) return orderB - orderA;

    // 同稀有度按等级排序
    const aLevel = getOwnedInfo(a.id)?.level || 0;
    const bLevel = getOwnedInfo(b.id)?.level || 0;
    return bLevel - aLevel;
  });
});

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

const factionName = (series) => {
  const map = { celestial: '天界', demon: '魔界', mortal: '人间' };
  return map[series] || '未知';
};

const openDetail = (card) => {
  if (cardStore.ownedCardIds.has(card.id)) {
    selectedCard.value = card;
    isFlipped.value = false;
  }
};

const goUpgrade = (card) => {
  selectedCard.value = null;
  const userCard = cardStore.myCards.find((c) => c.cardId === card.id);
  const id = userCard?.userCardId || card.id;
  router.push({ name: ROUTE_NAMES.CARD_UPGRADE, params: { id } });
};

const goTeam = () => {
  selectedCard.value = null;
  router.push({ name: ROUTE_NAMES.TEAM_FORM });
};

onMounted(async () => {
  console.log('🔮 [Collection] 图鉴页面载入，开始请求 /cards 与 /user/cards...');
  try {
    const [cards, myCards] = await Promise.all([
      request.get('/cards'),
      request.get('/user/cards'),
    ]);
    cardStore.setAllCards(cards || []);
    cardStore.setMyCards(myCards || []);
  } catch (error) {
    console.error('🔮 [Collection] 获取卡牌图鉴失败:', error);
  }
});
</script>

<style lang="scss" scoped>
.collection-page {
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
  color: $text-primary;
}

.progress-badge {
  font-size: 12px;
  font-weight: 600;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 4px 10px;
  border-radius: $radius-full;
}

// ========== 筛选工具栏 ==========
.filter-toolbar {
  padding: 12px 16px 0;
}

.filter-toggles {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  padding-bottom: 4px;
}

.toggle-btn {
  padding: 5px 14px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  background: $bg-card;
  border: 1px solid $border-color;
  color: $text-secondary;
  transition: all $transition-normal;

  &.active {
    background: rgba($color-primary, 0.1);
    border-color: rgba($color-primary, 0.3);
    color: $color-primary-dark;
  }
}

.rarity-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.rarity-tab {
  padding: 6px 14px;
  border-radius: $radius-full;
  font-size: 13px;
  font-weight: 600;
  background: $bg-card;
  border: 1px solid $border-color;
  color: $text-secondary;
  transition: all $transition-normal;
  white-space: nowrap;

  &.active {
    color: white;
    border-color: transparent;
  }

  &.tab-all.active { background: $text-primary; }
  &.tab-n.active { background: $rarity-text-n; }
  &.tab-r.active { background: $rarity-text-r; }
  &.tab-sr.active { background: $rarity-text-sr; }
  &.tab-ssr.active { background: $rarity-text-ssr; }
  &.tab-ur.active { background: $rarity-text-ur; }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 8px 16px 16px;

  // 卡牌帧需要 relative 使 overlay 定位正确
  .card-frame {
    position: relative;
  }
}

.card-placeholder-icon {
  font-size: 32px;
}

// ========== 卡牌角标重设 (二次元高级感) ==========
.card-badges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
  z-index: 2;
}

// 等级：左上角斜切护身符/缎带风格
.badge-level {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(60, 60, 60, 0.85));
  padding: 2px 8px 3px 6px;
  border-bottom-right-radius: $radius-lg;
  border-top-right-radius: $radius-lg;
  border-top-left-radius: inherit;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  
  .level-text {
    font-size: 11px;
    font-weight: 900;
    font-style: italic;
    color: #fcebcf; // 白金色
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
    letter-spacing: 0.5px;
    line-height: 1;
  }
}

// 星级：卡图底部居中，名字上方
.badge-stars {
  position: absolute;
  bottom: 40px; // 刚好在图片底部
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1px;
  padding-bottom: 4px;
  padding-top: 16px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.75) 0%, transparent 100%);
  
  .mini-star {
    font-size: 9px;
    color: #FFD700;
    line-height: 1;
    text-shadow: 0 0 3px rgba(255, 215, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 1);
  }
}

// 数量：右上角简单文字显示
.badge-count {
  position: absolute;
  top: 6px;
  right: 6px;
  color: #FDE8A4; // 淡金色
  font-size: 14px;
  font-weight: 900;
  font-family: 'Inter', system-ui, sans-serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 4px rgba(253, 232, 164, 0.4);
  pointer-events: none;
  z-index: 3;
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

// ========== 详情弹窗卡牌统计 ==========
.detail-card-stats {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  width: 100%;
  max-width: 280px;
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-md;
  backdrop-filter: blur(6px);
}

.stat-chip-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-chip-value {
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.star-on {
  color: #FFD700;
  font-size: 11px;
}

.star-off {
  color: rgba(255, 255, 255, 0.2);
  font-size: 11px;
}
</style>
