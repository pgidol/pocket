<template>
  <div class="upgrade-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">←</button>
      <h1 class="header-title text-display">卡牌养成</h1>
      <div class="header-gold">
        <span>💰</span>
        <span class="gold-val">{{ userStore.gold }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <span>⏳</span>
      <p>加载中...</p>
    </div>

    <template v-else-if="cardInfo">
      <!-- 卡牌展示 -->
      <div class="card-showcase">
        <div :class="['showcase-frame', `showcase-${cardInfo.rarity.toLowerCase()}`]">
          <span class="showcase-emoji">{{ factionEmoji(cardInfo.series) }}</span>
        </div>
        <h2 class="card-title">{{ cardInfo.name }}</h2>
        <div class="card-badges">
          <span :class="['rarity-badge', `rarity-${cardInfo.rarity.toLowerCase()}`]">{{ cardInfo.rarity }}</span>
          <span class="level-badge">Lv.{{ cardInfo.level }}</span>
          <span class="star-badge">
            <span v-for="s in 5" :key="s" :class="{ 'star-on': s <= cardInfo.stars }">★</span>
          </span>
        </div>
        <div class="card-power">
          <span>⚔️ 战力 {{ cardInfo.power }}</span>
        </div>
      </div>

      <!-- 属性面板 -->
      <div class="stats-panel">
        <h3 class="panel-title">战斗属性</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">❤️ 生命</span>
            <span class="stat-value">{{ cardInfo.currentStats.hp }}</span>
            <span v-if="cardInfo.nextLevelStats" class="stat-next">→ {{ cardInfo.nextLevelStats.hp }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">⚔️ 攻击</span>
            <span class="stat-value">{{ cardInfo.currentStats.atk }}</span>
            <span v-if="cardInfo.nextLevelStats" class="stat-next">→ {{ cardInfo.nextLevelStats.atk }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">🛡️ 防御</span>
            <span class="stat-value">{{ cardInfo.currentStats.def }}</span>
            <span v-if="cardInfo.nextLevelStats" class="stat-next">→ {{ cardInfo.nextLevelStats.def }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">💨 速度</span>
            <span class="stat-value">{{ cardInfo.currentStats.spd }}</span>
            <span v-if="cardInfo.nextLevelStats" class="stat-next">→ {{ cardInfo.nextLevelStats.spd }}</span>
          </div>
        </div>
      </div>

      <!-- 技能信息 -->
      <div class="skill-panel" v-if="cardInfo.skill">
        <h3 class="panel-title">技能</h3>
        <div class="skill-card">
          <span class="skill-type-icon">{{ skillTypeIcon(cardInfo.skill.type) }}</span>
          <div class="skill-info">
            <span class="skill-name">{{ cardInfo.skill.name }}</span>
            <span class="skill-desc">{{ cardInfo.skill.description }}</span>
            <span class="skill-meta">倍率 {{ cardInfo.skill.multiplier }}x · 怒气 {{ cardInfo.skill.rageCost }}</span>
          </div>
        </div>
      </div>

      <!-- 升级面板 -->
      <div class="upgrade-panel">
        <h3 class="panel-title">等级升级</h3>

        <!-- 经验条 -->
        <div class="exp-bar-wrap">
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
          </div>
          <span class="exp-text">{{ cardInfo.exp }} / {{ cardInfo.expRequired }}</span>
        </div>

        <div class="level-limit-info">
          等级上限 Lv.{{ cardInfo.maxLevel }}
          <span v-if="cardInfo.atLevelCap" class="limit-warn">（已达上限，请突破）</span>
        </div>

        <div class="gold-input-row">
          <label>消耗金币</label>
          <div class="gold-presets">
            <button
              v-for="preset in goldPresets"
              :key="preset"
              class="preset-btn"
              :class="{ active: goldSpend === preset }"
              @click="goldSpend = preset"
              :disabled="userStore.gold < preset || cardInfo.atLevelCap"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <button
          class="btn-primary upgrade-btn"
          :disabled="goldSpend === 0 || upgrading || cardInfo.atLevelCap"
          @click="doLevelUp"
        >
          {{ upgrading ? '升级中...' : `📈 升级 (消耗 ${goldSpend} 金币)` }}
        </button>
      </div>

      <!-- 突破面板 -->
      <div class="breakthrough-panel">
        <h3 class="panel-title">突破进阶</h3>

        <div v-if="cardInfo.stars >= 5" class="max-stars-notice">
          🌟 已达最高星级！
        </div>

        <template v-else-if="cardInfo.breakthroughInfo">
          <div class="breakthrough-cost">
            <div class="cost-item">
              <span class="cost-label">同名卡消耗</span>
              <span class="cost-value" :class="{ enough: cardInfo.breakthroughInfo.hasEnoughCards }">
                {{ cardInfo.count }}/{{ cardInfo.breakthroughInfo.cards + 1 }}
              </span>
            </div>
            <div class="cost-item">
              <span class="cost-label">金币消耗</span>
              <span class="cost-value" :class="{ enough: userStore.gold >= cardInfo.breakthroughInfo.gold }">
                {{ cardInfo.breakthroughInfo.gold }}
              </span>
            </div>
            <div class="cost-item">
              <span class="cost-label">属性加成</span>
              <span class="cost-value bonus">+{{ (cardInfo.breakthroughInfo.bonus * 100).toFixed(0) }}%</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">解锁等级上限</span>
              <span class="cost-value bonus">Lv.{{ cardInfo.breakthroughInfo.maxLevel }}</span>
            </div>
          </div>

          <button
            class="btn-primary breakthrough-btn"
            :disabled="!canBreakthrough || breakthroughing"
            @click="doBreakthrough"
          >
            {{ breakthroughing ? '突破中...' : `⭐ 突破到 ${cardInfo.stars + 1} 星` }}
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { useUserStore, useUiStore } from '../../stores/index.js';
import request from '../../services/request.js';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const uiStore = useUiStore();

const loading = ref(true);
const upgrading = ref(false);
const breakthroughing = ref(false);
const cardInfo = ref(null);
const goldSpend = ref(500);

const goldPresets = [100, 500, 1000, 5000, 10000];

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

const skillTypeIcon = (type) => {
  const map = { damage: '⚔️', heal: '💚', aoe: '💥', buff: '⬆️', debuff: '⬇️' };
  return map[type] || '⚔️';
};

const expPercent = computed(() => {
  if (!cardInfo.value) return 0;
  return Math.min(100, (cardInfo.value.exp / cardInfo.value.expRequired) * 100);
});

const canBreakthrough = computed(() => {
  if (!cardInfo.value || !cardInfo.value.breakthroughInfo) return false;
  const bi = cardInfo.value.breakthroughInfo;
  return bi.hasEnoughCards && userStore.gold >= bi.gold;
});

const loadUpgradeInfo = async () => {
  const id = route.params.id;
  if (!id) {
    router.back();
    return;
  }

  loading.value = true;
  try {
    const data = await request.get(`/upgrade/info/${id}`);
    cardInfo.value = data;
  } catch (error) {
    uiStore.toast(error.message || '加载失败', 'error');
    router.back();
  } finally {
    loading.value = false;
  }
};

const doLevelUp = async () => {
  if (!cardInfo.value || goldSpend.value <= 0) return;
  upgrading.value = true;

  try {
    const result = await request.post('/upgrade/level-up', {
      userCardId: cardInfo.value.userCardId,
      goldSpend: goldSpend.value,
    });

    // 更新本地状态
    cardInfo.value.level = result.level;
    cardInfo.value.exp = result.exp;
    cardInfo.value.expRequired = result.expRequired;
    cardInfo.value.currentStats = result.stats;
    cardInfo.value.power = result.power;
    userStore.updateCurrency({ gold: result.userGold });

    if (result.levelsGained > 0) {
      uiStore.toast(`升级成功！+${result.levelsGained}级`, 'success');
    } else {
      uiStore.toast('获得经验！', 'success');
    }

    // 刷新完整信息
    await loadUpgradeInfo();
  } catch (error) {
    uiStore.toast(error.message || '升级失败', 'error');
  } finally {
    upgrading.value = false;
  }
};

const doBreakthrough = async () => {
  if (!cardInfo.value) return;
  breakthroughing.value = true;

  try {
    const result = await request.post('/upgrade/breakthrough', {
      userCardId: cardInfo.value.userCardId,
    });

    cardInfo.value.stars = result.stars;
    cardInfo.value.count = result.count;
    cardInfo.value.currentStats = result.stats;
    cardInfo.value.power = result.power;
    userStore.updateCurrency({ gold: result.userGold });

    uiStore.toast(`突破成功！${result.stars} 星`, 'success');

    // 刷新完整信息
    await loadUpgradeInfo();
  } catch (error) {
    uiStore.toast(error.message || '突破失败', 'error');
  } finally {
    breakthroughing.value = false;
  }
};

onMounted(() => {
  loadUpgradeInfo();
});
</script>

<style lang="scss" scoped>
.upgrade-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 40px;
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

.header-gold {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.gold-val { color: #FFD700; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-size: 48px;
  color: $text-tertiary;
  gap: 12px;

  p { font-size: 14px; }
}

// ========== 卡牌展示 ==========
.card-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background: linear-gradient(180deg, rgba($bg-elevated, 0.5), transparent);
}

.showcase-frame {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 12px;
  border: 3px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);

  &.showcase-n { background: $rarity-n; }
  &.showcase-r { background: $rarity-r; }
  &.showcase-sr { background: $rarity-sr; }
  &.showcase-ssr { background: $rarity-ssr; }
  &.showcase-ur { background: $rarity-ur; }
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.level-badge {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  padding: 2px 8px;
  background: $bg-card;
  border-radius: $radius-full;
}

.star-badge {
  font-size: 14px;
  color: #555;
  .star-on { color: #FFD700; }
}

.card-power {
  font-size: 14px;
  font-weight: 600;
  color: $color-warning;
}

// ========== 属性面板 ==========
.stats-panel, .skill-panel, .upgrade-panel, .breakthrough-panel {
  margin: 0 16px 16px;
  padding: 16px;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1px solid $border-color;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: $text-tertiary;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
}

.stat-next {
  font-size: 11px;
  color: $color-success;
  font-weight: 500;
}

// ========== 技能面板 ==========
.skill-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-type-icon { font-size: 28px; }

.skill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.skill-desc {
  font-size: 11px;
  color: $text-secondary;
}

.skill-meta {
  font-size: 10px;
  color: $text-tertiary;
}

// ========== 升级面板 ==========
.exp-bar-wrap {
  margin-bottom: 8px;
}

.exp-bar {
  height: 12px;
  background: $bg-overlay;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
}

.exp-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, $color-primary, $color-accent);
  transition: width 0.5s ease;
}

.exp-text {
  font-size: 11px;
  color: $text-tertiary;
}

.level-limit-info {
  font-size: 11px;
  color: $text-tertiary;
  margin-bottom: 12px;
}

.limit-warn { color: $color-warning; font-weight: 500; }

.gold-input-row {
  margin-bottom: 12px;

  label {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 6px;
    display: block;
  }
}

.gold-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 6px 14px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  background: $bg-main;
  color: $text-secondary;
  border: 1px solid $border-color;
  transition: all $transition-normal;

  &.active {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a1a;
    border-color: transparent;
  }

  &:disabled {
    opacity: 0.3;
    pointer-events: none;
  }
}

.upgrade-btn, .breakthrough-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

// ========== 突破面板 ==========
.max-stars-notice {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
  padding: 16px 0;
}

.breakthrough-cost {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.cost-item {
  padding: 8px 12px;
  background: $bg-main;
  border-radius: $radius-md;
}

.cost-label {
  display: block;
  font-size: 10px;
  color: $text-tertiary;
  margin-bottom: 2px;
}

.cost-value {
  font-size: 15px;
  font-weight: 700;
  color: $color-danger;

  &.enough { color: $color-success; }
  &.bonus { color: $color-warning; }
}
</style>
