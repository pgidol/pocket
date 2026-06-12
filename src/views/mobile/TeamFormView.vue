<template>
  <div class="team-form-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">←</button>
      <h1 class="header-title text-display">编队出战</h1>
      <div class="header-power">
        <span>⚔️</span>
        <span class="power-value">{{ teamStore.activePower }}</span>
      </div>
    </header>

    <!-- 关卡信息 -->
    <div v-if="battleStore.currentStage" class="stage-banner">
      <span class="stage-tag">{{ battleStore.currentStage.chapter }}-{{ battleStore.currentStage.stageNum }}</span>
      <span class="stage-name-text">{{ battleStore.currentStage.name }}</span>
      <span class="stage-recommend">推荐战力 {{ battleStore.currentStage.recommendPower }}</span>
    </div>

    <!-- 编队槽位Tab -->
    <div class="slot-tabs">
      <button
        v-for="i in 3"
        :key="i - 1"
        class="slot-tab"
        :class="{ active: teamStore.activeSlot === i - 1 }"
        @click="switchSlot(i - 1)"
      >
        队伍 {{ i }}
      </button>
    </div>

    <!-- 上阵区域 5个位置 -->
    <div class="formation-area">
      <div class="formation-label">前排</div>
      <div class="formation-row front-row">
        <div
          v-for="pos in [0, 1, 2]"
          :key="pos"
          class="formation-slot"
          :class="{ filled: getSlotCard(pos), 'drag-over': dragOverPos === pos }"
          @click="handleSlotClick(pos)"
        >
          <template v-if="getSlotCard(pos)">
            <div :class="['slot-card-frame', `mini-frame-${getSlotCard(pos).rarity.toLowerCase()}`]">
              <span class="slot-emoji">{{ factionEmoji(getSlotCard(pos).series) }}</span>
            </div>
            <span class="slot-card-name">{{ getSlotCard(pos).name }}</span>
            <span class="slot-card-level">Lv.{{ getSlotCard(pos).level }}</span>
            <button class="slot-remove" @click.stop="removeFromTeam(pos)">✕</button>
          </template>
          <template v-else>
            <span class="slot-placeholder">+</span>
            <span class="slot-pos-label">前{{ pos + 1 }}</span>
          </template>
        </div>
      </div>
      <div class="formation-label">后排</div>
      <div class="formation-row back-row">
        <div
          v-for="pos in [3, 4]"
          :key="pos"
          class="formation-slot"
          :class="{ filled: getSlotCard(pos) }"
          @click="handleSlotClick(pos)"
        >
          <template v-if="getSlotCard(pos)">
            <div :class="['slot-card-frame', `mini-frame-${getSlotCard(pos).rarity.toLowerCase()}`]">
              <span class="slot-emoji">{{ factionEmoji(getSlotCard(pos).series) }}</span>
            </div>
            <span class="slot-card-name">{{ getSlotCard(pos).name }}</span>
            <span class="slot-card-level">Lv.{{ getSlotCard(pos).level }}</span>
            <button class="slot-remove" @click.stop="removeFromTeam(pos)">✕</button>
          </template>
          <template v-else>
            <span class="slot-placeholder">+</span>
            <span class="slot-pos-label">后{{ pos - 2 }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 卡牌列表 -->
    <div class="card-pool-header">
      <h3>我的卡牌</h3>
      <span class="card-count-label">{{ availableCards.length }}张可用</span>
    </div>
    <div class="card-pool">
      <div
        v-for="card in availableCards"
        :key="card.userCardId"
        class="pool-card"
        :class="{ 'in-team': isInTeam(card.userCardId), selected: selectedCardId === card.userCardId }"
        @click="selectCard(card)"
      >
        <div :class="['pool-card-frame', `mini-frame-${card.rarity.toLowerCase()}`]">
          <span class="pool-emoji">{{ factionEmoji(card.series) }}</span>
        </div>
        <div class="pool-card-info">
          <span class="pool-card-name">{{ card.name }}</span>
          <div class="pool-card-meta">
            <span :class="['rarity-badge', `rarity-${card.rarity.toLowerCase()}`]">{{ card.rarity }}</span>
            <span class="pool-card-level">Lv.{{ card.level || 1 }}</span>
          </div>
        </div>
        <span v-if="isInTeam(card.userCardId)" class="in-team-badge">已上阵</span>
      </div>

      <div v-if="availableCards.length === 0" class="pool-empty">
        <p>没有卡牌，先去抽卡吧！</p>
        <button class="btn-primary" @click="router.push({ name: ROUTE_NAMES.GACHA })">去抽卡</button>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <button class="btn-secondary save-btn" @click="saveTeam" :disabled="saving">
        {{ saving ? '保存中...' : '💾 保存编队' }}
      </button>
      <button
        class="btn-primary fight-btn"
        :disabled="teamCards.length === 0 || fighting"
        @click="startBattle"
      >
        {{ fighting ? '战斗中...' : '⚔️ 开始战斗' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useBattleStore, useTeamStore, useCardStore, useUserStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const battleStore = useBattleStore();
const teamStore = useTeamStore();
const cardStore = useCardStore();
const userStore = useUserStore();
const uiStore = useUiStore();

const saving = ref(false);
const fighting = ref(false);
const selectedCardId = ref(null);
const dragOverPos = ref(null);

/** 当前编队中的卡牌 [{userCardId, position, ...cardInfo}] */
const teamCards = ref([]);

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

/** 可用卡牌列表（排除已在队伍中的） */
const availableCards = computed(() => {
  return (cardStore.myCards || []).map((c) => ({
    ...c,
    userCardId: c.userCardId || c.cardId || c.id,
    level: c.level || 1,
  }));
});

const getSlotCard = (pos) => teamCards.value.find((c) => c.position === pos);
const isInTeam = (userCardId) => teamCards.value.some((c) => c.userCardId === userCardId);

const selectCard = (card) => {
  if (isInTeam(card.userCardId)) return;
  selectedCardId.value = card.userCardId;
};

const handleSlotClick = (pos) => {
  const existing = getSlotCard(pos);
  if (existing) return; // 已有卡牌，点击无效

  if (selectedCardId.value) {
    const card = availableCards.value.find((c) => c.userCardId === selectedCardId.value);
    if (card && !isInTeam(card.userCardId)) {
      teamCards.value.push({ ...card, position: pos });
      selectedCardId.value = null;
    }
  }
};

const removeFromTeam = (pos) => {
  teamCards.value = teamCards.value.filter((c) => c.position !== pos);
};

const switchSlot = async (slot) => {
  teamStore.setActiveSlot(slot);
  await loadTeam();
};

const loadTeam = async () => {
  try {
    const teams = await request.get('/team');
    teamStore.setTeams(teams || [null, null, null]);

    const activeTeam = teams?.[teamStore.activeSlot];
    if (activeTeam && activeTeam.cards) {
      teamCards.value = activeTeam.cards.map((c) => ({
        userCardId: c.userCardId,
        cardId: c.cardId,
        position: c.position,
        name: c.name,
        rarity: c.rarity,
        series: c.series,
        level: c.level,
        stars: c.stars,
        power: c.power,
      }));
    } else {
      teamCards.value = [];
    }
  } catch {
    teamCards.value = [];
  }
};

const saveTeam = async () => {
  if (teamCards.value.length === 0) return;
  saving.value = true;
  try {
    const result = await request.post('/team/save', {
      slotIndex: teamStore.activeSlot,
      cards: teamCards.value.map((c) => ({
        userCardId: c.userCardId,
        position: c.position,
      })),
    });
    teamStore.updateTeam(teamStore.activeSlot, result);
    uiStore.toast('编队保存成功', 'success');
  } catch (error) {
    uiStore.toast(error.message || '保存失败', 'error');
  } finally {
    saving.value = false;
  }
};

const startBattle = async () => {
  if (!battleStore.currentStage || teamCards.value.length === 0) return;

  // 先保存编队
  if (teamCards.value.length > 0) {
    try {
      await request.post('/team/save', {
        slotIndex: teamStore.activeSlot,
        cards: teamCards.value.map((c) => ({
          userCardId: c.userCardId,
          position: c.position,
        })),
      });
    } catch {
      // 如果保存失败仍然允许战斗
    }
  }

  fighting.value = true;
  battleStore.startBattle();

  try {
    const result = await request.post('/battle/start', {
      stageId: battleStore.currentStage.id,
      teamSlotIndex: teamStore.activeSlot,
    });

    battleStore.setBattleResult(result);
    battleStore.setStamina({ stamina: result.stamina });

    if (result.rewards) {
      userStore.updateCurrency({
        gold: userStore.gold + result.rewards.gold,
        diamond: userStore.diamond + (result.rewards.diamond || 0),
      });
    }

    router.push({ name: ROUTE_NAMES.BATTLE });
  } catch (error) {
    uiStore.toast(error.message || '战斗失败', 'error');
    battleStore.clearBattle();
  } finally {
    fighting.value = false;
  }
};

onMounted(async () => {
  // 加载卡牌列表
  try {
    const cards = await request.get('/user/cards');
    cardStore.setMyCards(cards || []);
  } catch {
    // 静默处理
  }
  await loadTeam();
});
</script>

<style lang="scss" scoped>
.team-form-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 80px;
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

.header-power {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.power-value { color: $color-warning; }

// ========== 关卡信息 ==========
.stage-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba($color-primary, 0.08), rgba($color-accent, 0.06));
  border-bottom: 1px solid $border-color;
}

.stage-tag {
  background: $color-primary;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: $radius-full;
}

.stage-name-text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
}

.stage-recommend {
  font-size: 11px;
  color: $text-tertiary;
}

// ========== 编队槽位Tab ==========
.slot-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.slot-tab {
  flex: 1;
  padding: 8px;
  border-radius: $radius-md;
  font-size: 13px;
  font-weight: 500;
  background: $bg-card;
  border: 1px solid $border-color;
  transition: all $transition-normal;

  &.active {
    background: linear-gradient(135deg, $color-primary, $color-accent);
    color: white;
    border-color: transparent;
  }
}

// ========== 编队区域 ==========
.formation-area {
  padding: 0 16px 16px;
}

.formation-label {
  font-size: 11px;
  color: $text-tertiary;
  font-weight: 500;
  margin-bottom: 6px;
  margin-top: 8px;
}

.formation-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.front-row { gap: 10px; }
.back-row { gap: 10px; padding: 0 20px; }

.formation-slot {
  flex: 1;
  max-width: 100px;
  aspect-ratio: 3 / 4;
  border-radius: $radius-lg;
  border: 2px dashed rgba($color-primary, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all $transition-normal;
  position: relative;
  cursor: pointer;

  &.filled {
    border-style: solid;
    border-color: rgba($color-primary, 0.4);
    background: $bg-card;
  }

  &:active { transform: scale(0.96); }
}

.slot-card-frame {
  width: 40px;
  height: 40px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.slot-emoji { font-size: 20px; }

.slot-card-name {
  font-size: 10px;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-card-level {
  font-size: 9px;
  color: $text-tertiary;
}

.slot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: $color-danger;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-placeholder {
  font-size: 24px;
  color: rgba($color-primary, 0.3);
}

.slot-pos-label {
  font-size: 10px;
  color: $text-tertiary;
}

.mini-frame-n { background: $rarity-n; }
.mini-frame-r { background: $rarity-r; }
.mini-frame-sr { background: $rarity-sr; }
.mini-frame-ssr { background: $rarity-ssr; }
.mini-frame-ur { background: $rarity-ur; }

// ========== 卡牌池 ==========
.card-pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 8px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
}

.card-count-label {
  font-size: 12px;
  color: $text-tertiary;
}

.card-pool {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: $bg-card;
  border-radius: $radius-md;
  border: 1.5px solid $border-color;
  transition: all $transition-normal;
  cursor: pointer;

  &.selected {
    border-color: $color-primary;
    box-shadow: 0 0 8px rgba($color-primary, 0.2);
  }

  &.in-team {
    opacity: 0.5;
  }

  &:active { transform: scale(0.98); }
}

.pool-card-frame {
  width: 40px;
  height: 40px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pool-emoji { font-size: 18px; }

.pool-card-info { flex: 1; }

.pool-card-name {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  display: block;
}

.pool-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.pool-card-level {
  font-size: 11px;
  color: $text-tertiary;
}

.in-team-badge {
  font-size: 10px;
  color: $text-tertiary;
  padding: 2px 8px;
  background: $bg-overlay;
  border-radius: $radius-full;
}

.pool-empty {
  text-align: center;
  padding: 40px 0;
  color: $text-tertiary;
  font-size: 14px;

  .btn-primary { margin-top: 12px; }
}

// ========== 底部操作栏 ==========
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba($bg-elevated, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid $border-color;
  z-index: $z-sticky;
}

.save-btn, .fight-btn {
  flex: 1;
  padding: 14px;
  font-size: 15px;
  border-radius: $radius-md;

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}
</style>
