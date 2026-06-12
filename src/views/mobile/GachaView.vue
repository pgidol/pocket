<template>
  <div class="gacha-page">
    <header class="gacha-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">抽卡</h1>
      <div class="header-diamond">
        <span>💎</span>
        <span class="diamond-count">{{ userStore.diamond }}</span>
      </div>
    </header>

    <div class="gacha-content">
      <!-- 卡池选择 -->
      <div class="pool-selector">
        <div
          v-for="pool in gachaStore.pools"
          :key="pool.id"
          class="pool-tab"
          :class="{ active: gachaStore.currentPoolId === pool.id }"
          @click="gachaStore.selectPool(pool.id)"
        >
          <span class="pool-icon">{{ pool.type === 'limited' ? '⭐' : '🎴' }}</span>
          <span class="pool-name">{{ pool.name }}</span>
        </div>
      </div>

      <!-- 卡池展示区 -->
      <div class="pool-banner">
        <div class="banner-decoration">
          <div class="deco-circle deco-1"></div>
          <div class="deco-circle deco-2"></div>
        </div>
        <div class="banner-info">
          <h2 class="pool-title text-display">
            {{ gachaStore.currentPool?.name || '标准卡池' }}
          </h2>
          <p class="pool-desc">全60种角色等待相遇</p>
          <div class="pity-info">
            <div class="pity-item">
              <span class="pity-label">距SR保底</span>
              <span class="pity-value pity-sr">{{ gachaStore.pityToSR }}抽</span>
            </div>
            <div class="pity-divider"></div>
            <div class="pity-item">
              <span class="pity-label">距SSR保底</span>
              <span class="pity-value pity-ssr">{{ gachaStore.pityToSSR }}抽</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 概率说明 -->
      <div class="rate-info" @click="showRates = !showRates">
        <span class="rate-trigger">📊 查看概率 {{ showRates ? '▲' : '▼' }}</span>
        <transition name="fade">
          <div v-if="showRates" class="rate-detail">
            <div class="rate-row"><span class="rarity-badge rarity-n">N</span> <span>45%</span></div>
            <div class="rate-row"><span class="rarity-badge rarity-r">R</span> <span>30%</span></div>
            <div class="rate-row"><span class="rarity-badge rarity-sr">SR</span> <span>17%</span></div>
            <div class="rate-row"><span class="rarity-badge rarity-ssr">SSR</span> <span>7%</span></div>
            <div class="rate-row"><span class="rarity-badge rarity-ur">UR</span> <span>1%</span></div>
          </div>
        </transition>
      </div>

      <!-- 抽卡按钮区域 -->
      <div class="gacha-actions">
        <button
          class="gacha-btn single-btn btn-secondary"
          :disabled="userStore.diamond < 160 || isPulling"
          @click="handlePull('single')"
        >
          <span class="btn-label">单抽</span>
          <span class="btn-cost">💎 160</span>
        </button>
        <button
          class="gacha-btn ten-btn btn-gold"
          :disabled="userStore.diamond < 1600 || isPulling"
          @click="handlePull('ten')"
        >
          <span class="btn-label">十连抽</span>
          <span class="btn-cost">💎 1600</span>
        </button>
      </div>
    </div>

    <!-- 抽卡结果弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showResult" class="result-overlay" @click="closeResult">
          <div class="result-container" @click.stop>
            <h3 class="result-title text-display">
              {{ pullResults.length > 1 ? '十连结果' : '单抽结果' }}
            </h3>
            <div class="result-cards" :class="{ 'single-result': pullResults.length === 1 }">
              <div
                v-for="(card, idx) in pullResults"
                :key="idx"
                :class="['card-frame', `card-frame-${card.rarity.toLowerCase()}`]"
                class="result-card"
                :style="{ animationDelay: `${idx * 0.1}s` }"
              >
                <div class="card-inner">
                  <div class="card-image">
                    <span class="card-placeholder-icon">{{ factionEmoji(card.series) }}</span>
                  </div>
                  <div class="card-name">{{ card.name }}</div>
                  <span :class="['rarity-badge', `rarity-${card.rarity.toLowerCase()}`]">
                    {{ card.rarity }}
                  </span>
                </div>
              </div>
            </div>
            <div class="result-actions">
              <button class="btn-secondary" @click="closeResult">确认</button>
              <button
                class="btn-primary"
                :disabled="userStore.diamond < (pullResults.length > 1 ? 1600 : 160)"
                @click="handlePullAgain"
              >
                再来一次
              </button>
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
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item active">
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore, useGachaStore, useCardStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES, GACHA_COST } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const userStore = useUserStore();
const gachaStore = useGachaStore();
const cardStore = useCardStore();
const uiStore = useUiStore();

const isPulling = ref(false);
const showResult = ref(false);
const showRates = ref(false);
const pullResults = ref([]);
const lastPullType = ref('single');

/**
 * 获取阵营Emoji
 * @param {string} series
 * @returns {string}
 */
const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

/**
 * 加载卡池数据
 */
const loadPools = async () => {
  try {
    const pools = await request.get('/gacha/pools');
    gachaStore.setPools(pools || []);
  } catch {
    // 若后端未就绪，使用默认卡池
    gachaStore.setPools([
      { id: 'standard', name: '标准卡池', type: 'standard' },
    ]);
  }
};

/**
 * 执行抽卡
 * @param {'single' | 'ten'} type
 */
const handlePull = async (type) => {
  const cost = type === 'single' ? GACHA_COST.single : GACHA_COST.ten;
  if (userStore.diamond < cost) {
    uiStore.toast('钻石不足！', 'warning');
    return;
  }

  isPulling.value = true;
  lastPullType.value = type;

  try {
    const result = await request.post('/gacha/pull', {
      poolId: gachaStore.currentPoolId,
      type,
    });

    pullResults.value = result.cards || [];
    userStore.updateCurrency({
      diamond: result.diamond,
      gold: result.gold,
    });
    gachaStore.setPityCounters(result.pityCountSR, result.pityCountSSR);
    userStore.addPulls(type === 'single' ? 1 : 10);
    cardStore.addCards(result.cards);

    showResult.value = true;
  } catch (error) {
    uiStore.toast(error.message || '抽卡失败', 'error');
  } finally {
    isPulling.value = false;
  }
};

const handlePullAgain = () => {
  showResult.value = false;
  handlePull(lastPullType.value);
};

const closeResult = () => {
  showResult.value = false;
};

onMounted(() => {
  loadPools();
  userStore.fetchProfile();
});
</script>

<style lang="scss" scoped>
.gacha-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

// ========== Header ==========
.gacha-header {
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
  border-radius: $radius-sm;
  color: $text-secondary;

  &:active { background: $bg-overlay; }
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  color: $text-primary;
}

.header-diamond {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.diamond-count { color: $text-primary; }

// ========== Content ==========
.gacha-content {
  padding: 16px;
}

// ========== 卡池选择 ==========
.pool-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.pool-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: $radius-full;
  background: $bg-card;
  border: 1.5px solid $border-color;
  font-size: 13px;
  white-space: nowrap;
  transition: all $transition-normal;
  cursor: pointer;

  &.active {
    background: linear-gradient(135deg, $color-primary, $color-accent);
    color: white;
    border-color: transparent;
    box-shadow: $shadow-glow-primary;
  }
}

.pool-icon { font-size: 16px; }

// ========== 卡池横幅 ==========
.pool-banner {
  position: relative;
  border-radius: $radius-xl;
  padding: 28px 20px;
  background: linear-gradient(135deg, #FFF0F3 0%, #FFE8EE 50%, #FDE2D4 100%);
  border: 1px solid rgba($color-primary, 0.15);
  margin-bottom: 16px;
  overflow: hidden;
}

.banner-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;

  &.deco-1 {
    width: 120px;
    height: 120px;
    background: rgba($color-primary, 0.08);
    top: -20px;
    right: -20px;
  }

  &.deco-2 {
    width: 80px;
    height: 80px;
    background: rgba($color-accent, 0.06);
    bottom: -10px;
    left: 30%;
  }
}

.banner-info {
  position: relative;
  z-index: 1;
}

.pool-title {
  font-size: 22px;
  color: $text-primary;
  margin-bottom: 6px;
}

.pool-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 16px;
}

.pity-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pity-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pity-label {
  font-size: 11px;
  color: $text-tertiary;
}

.pity-value {
  font-size: 18px;
  font-weight: 700;
  font-family: $font-display;
}

.pity-sr { color: $rarity-text-sr; }
.pity-ssr { color: $rarity-text-ssr; }

.pity-divider {
  width: 1px;
  height: 32px;
  background: $border-color;
}

// ========== 概率说明 ==========
.rate-info {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 12px 16px;
  border: 1px solid $border-color;
  margin-bottom: 20px;
  cursor: pointer;
}

.rate-trigger {
  font-size: 13px;
  color: $text-secondary;
}

.rate-detail {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: $text-secondary;
}

// ========== 抽卡按钮 ==========
.gacha-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.gacha-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-radius: $radius-lg;
  font-size: 16px;

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.btn-label {
  font-weight: 700;
  font-size: 16px;
}

.btn-cost {
  font-size: 12px;
  opacity: 0.8;
}

// ========== 抽卡结果弹窗 ==========
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.result-container {
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  background: $bg-elevated;
  border-radius: $radius-xl;
  padding: 24px 16px;
  overflow-y: auto;
}

.result-title {
  text-align: center;
  font-size: 20px;
  color: $text-primary;
  margin-bottom: 20px;
}

.result-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 24px;

  &.single-result {
    grid-template-columns: 1fr;
    max-width: 160px;
    margin: 0 auto 24px;
  }
}

.result-card {
  animation: card-flip 0.6s ease backwards;
}

.result-actions {
  display: flex;
  gap: 12px;

  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 12px;
    font-size: 14px;
    border-radius: $radius-md;
  }
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
