<template>
  <div class="battle-page">
    <!-- 战斗中顶部栏 -->
    <header class="battle-header">
      <div class="round-counter">
        <span class="round-label">回合</span>
        <span class="round-num">{{ currentRound }}</span>
      </div>
      <div class="battle-speed">
        <button class="speed-btn" @click="toggleSpeed">{{ speedLabel }}</button>
      </div>
    </header>

    <!-- 战斗舞台 -->
    <div class="battle-stage">
      <!-- 敌方区域 -->
      <div class="team-area enemy-area">
        <div class="team-label">敌方</div>
        <div class="units-row">
          <div
            v-for="unit in enemyUnits"
            :key="unit.id"
            class="battle-unit"
            :class="{ dead: !unit.alive, acting: activeUnitId === unit.id, hit: hitUnitId === unit.id }"
          >
            <div :class="['unit-avatar', `unit-rarity-${unit.rarity.toLowerCase()}`]">
              <span class="unit-emoji">{{ factionEmoji(unit.series) }}</span>
            </div>
            <div class="unit-hp-bar">
              <div class="hp-fill" :style="{ width: hpPercent(unit) + '%' }" :class="hpClass(unit)"></div>
            </div>
            <span class="unit-name">{{ unit.name }}</span>
          </div>
        </div>
      </div>

      <!-- 战斗动画区 -->
      <div class="battle-fx-area">
        <transition name="fx-pop">
          <div v-if="currentAction" class="action-display" :key="actionKey">
            <span v-if="currentAction.type === 'normal_attack'" class="fx-text fx-normal">
              {{ currentAction.actorName }} 攻击 {{ currentAction.targetName }}
              <span class="fx-damage">-{{ currentAction.damage }}</span>
            </span>
            <span v-else-if="currentAction.type === 'skill_damage'" class="fx-text fx-skill">
              {{ currentAction.actorName }} 释放 「{{ currentAction.skillName }}」
              <span class="fx-damage">-{{ currentAction.damage }}</span>
            </span>
            <span v-else-if="currentAction.type === 'skill_heal'" class="fx-text fx-heal">
              {{ currentAction.actorName }} 释放 「{{ currentAction.skillName }}」
              <span class="fx-heal-num">+{{ currentAction.heal }}</span>
            </span>
            <span v-else-if="currentAction.type === 'skill_aoe'" class="fx-text fx-aoe">
              {{ currentAction.actorName }} 释放 「{{ currentAction.skillName }}」 群攻！
            </span>
            <span v-else-if="currentAction.type === 'skill_buff'" class="fx-text fx-buff">
              {{ currentAction.actorName }} 释放 「{{ currentAction.skillName }}」 全体强化！
            </span>
            <span v-else-if="currentAction.type === 'skill_debuff'" class="fx-text fx-debuff">
              {{ currentAction.actorName }} 释放 「{{ currentAction.skillName }}」 全体弱化！
            </span>
          </div>
        </transition>
      </div>

      <!-- 我方区域 -->
      <div class="team-area player-area">
        <div class="team-label">我方</div>
        <div class="units-row">
          <div
            v-for="unit in playerUnits"
            :key="unit.id"
            class="battle-unit"
            :class="{ dead: !unit.alive, acting: activeUnitId === unit.id, hit: hitUnitId === unit.id }"
          >
            <div :class="['unit-avatar', `unit-rarity-${unit.rarity.toLowerCase()}`]">
              <span class="unit-emoji">{{ factionEmoji(unit.series) }}</span>
            </div>
            <div class="unit-hp-bar">
              <div class="hp-fill" :style="{ width: hpPercent(unit) + '%' }" :class="hpClass(unit)"></div>
            </div>
            <div class="unit-rage-bar">
              <div class="rage-fill" :style="{ width: unit.rage + '%' }"></div>
            </div>
            <span class="unit-name">{{ unit.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗结算弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showResult" class="result-overlay">
          <div class="result-modal" :class="battleStore.battleResult">
            <div class="result-icon">{{ battleStore.battleResult === 'win' ? '🎉' : '💀' }}</div>
            <h2 class="result-title text-display">
              {{ battleStore.battleResult === 'win' ? '战斗胜利！' : '战斗失败' }}
            </h2>

            <!-- 星级 -->
            <div v-if="battleStore.battleResult === 'win'" class="result-stars">
              <span v-for="s in 3" :key="s" :class="{ 'star-active': s <= battleStore.stars }">★</span>
            </div>

            <p class="result-rounds">用时 {{ battleStore.rounds }} 回合</p>

            <!-- 奖励 -->
            <div v-if="battleStore.rewards" class="rewards-grid">
              <div class="reward-item" v-if="battleStore.rewards.exp">
                <span class="reward-icon">📊</span>
                <span class="reward-val">+{{ battleStore.rewards.exp }} 经验</span>
              </div>
              <div class="reward-item" v-if="battleStore.rewards.gold">
                <span class="reward-icon">💰</span>
                <span class="reward-val">+{{ battleStore.rewards.gold }} 金币</span>
              </div>
              <div class="reward-item" v-if="battleStore.rewards.diamond > 0">
                <span class="reward-icon">💎</span>
                <span class="reward-val">+{{ battleStore.rewards.diamond }} 钻石</span>
              </div>
              <div class="reward-item first-clear" v-if="battleStore.rewards.isFirstClear">
                <span class="reward-icon">🏆</span>
                <span class="reward-val">首次通关！</span>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn-secondary" @click="goBack">返回地图</button>
              <button v-if="battleStore.battleResult === 'lose'" class="btn-primary" @click="retryBattle">重新挑战</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

import { useBattleStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';

const router = useRouter();
const battleStore = useBattleStore();

const currentRound = ref(0);
const currentAction = ref(null);
const actionKey = ref(0);
const activeUnitId = ref(null);
const hitUnitId = ref(null);
const showResult = ref(false);
const speed = ref(1); // 1x, 2x, 3x
let playTimer = null;

const speedLabel = computed(() => `${speed.value}x`);

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

// 从战斗日志中提取所有参战单位的初始状态
const buildInitialUnits = (log) => {
  const units = {};
  if (!log || log.length === 0) return { player: [], enemy: [] };

  for (const round of log) {
    for (const action of round.actions) {
      // Actor
      if (action.actorId && !units[action.actorId]) {
        units[action.actorId] = {
          id: action.actorId,
          name: action.actorName,
          side: action.actorSide,
          rarity: 'r',
          series: 'mortal',
          alive: true,
          maxHp: 100,
          currentHp: 100,
          rage: 0,
        };
      }
      // Target
      if (action.targetId && !units[action.targetId]) {
        units[action.targetId] = {
          id: action.targetId,
          name: action.targetName,
          side: action.actorSide === 'player' ? 'enemy' : 'player',
          rarity: 'r',
          series: 'mortal',
          alive: true,
          maxHp: action.targetMaxHp || 100,
          currentHp: action.targetMaxHp || 100,
          rage: 0,
        };
      }
      // Update maxHp from first seen action
      if (action.targetId && action.targetMaxHp && units[action.targetId]) {
        units[action.targetId].maxHp = action.targetMaxHp;
        if (units[action.targetId].currentHp > action.targetMaxHp) {
          units[action.targetId].currentHp = action.targetMaxHp;
        }
      }
      // AOE targets
      if (action.targets) {
        for (const t of action.targets) {
          if (t.targetId && !units[t.targetId]) {
            units[t.targetId] = {
              id: t.targetId,
              name: t.targetName,
              side: action.actorSide === 'player' ? 'enemy' : 'player',
              rarity: 'r',
              series: 'mortal',
              alive: true,
              maxHp: t.targetMaxHp || 100,
              currentHp: t.targetMaxHp || 100,
              rage: 0,
            };
          }
        }
      }
    }
  }

  const all = Object.values(units);
  return {
    player: all.filter((u) => u.side === 'player'),
    enemy: all.filter((u) => u.side === 'enemy'),
  };
};

const playerUnits = ref([]);
const enemyUnits = ref([]);

const hpPercent = (unit) => {
  if (unit.maxHp === 0) return 0;
  return Math.max(0, Math.min(100, (unit.currentHp / unit.maxHp) * 100));
};

const hpClass = (unit) => {
  const pct = hpPercent(unit);
  if (pct > 50) return 'hp-high';
  if (pct > 25) return 'hp-mid';
  return 'hp-low';
};

const toggleSpeed = () => {
  speed.value = speed.value >= 3 ? 1 : speed.value + 1;
};

/**
 * 回放战斗日志
 */
const playBattleLog = () => {
  const log = battleStore.battleLog;
  if (!log || log.length === 0) {
    showResult.value = true;
    return;
  }

  const { player, enemy } = buildInitialUnits(log);
  playerUnits.value = player;
  enemyUnits.value = enemy;

  let flatActions = [];
  for (const round of log) {
    flatActions.push({ type: 'round_start', round: round.round });
    for (const action of round.actions) {
      flatActions.push(action);
    }
  }

  let idx = 0;

  const playNext = () => {
    if (idx >= flatActions.length) {
      // 战斗结束
      setTimeout(() => {
        showResult.value = true;
      }, 500);
      return;
    }

    const action = flatActions[idx];
    idx++;

    if (action.type === 'round_start') {
      currentRound.value = action.round;
      playTimer = setTimeout(playNext, 300 / speed.value);
      return;
    }

    currentAction.value = action;
    actionKey.value++;
    activeUnitId.value = action.actorId;

    // 更新单位状态
    if (action.targetId) {
      hitUnitId.value = action.targetId;
      const unit = findUnit(action.targetId);
      if (unit) {
        unit.currentHp = action.targetHpAfter ?? unit.currentHp;
        unit.alive = action.targetAlive ?? unit.alive;
      }
    }

    if (action.heal && action.targetId) {
      const unit = findUnit(action.targetId);
      if (unit) {
        unit.currentHp = action.targetHpAfter ?? unit.currentHp;
      }
    }

    // AOE
    if (action.targets) {
      action.targets.forEach((t) => {
        const unit = findUnit(t.targetId);
        if (unit) {
          unit.currentHp = t.targetHpAfter ?? unit.currentHp;
          unit.alive = t.targetAlive ?? unit.alive;
        }
      });
    }

    // 更新怒气
    if (action.actorId && action.actorRage !== undefined) {
      const actor = findUnit(action.actorId);
      if (actor) actor.rage = action.actorRage;
    }

    // 清除高亮
    setTimeout(() => {
      activeUnitId.value = null;
      hitUnitId.value = null;
    }, 400 / speed.value);

    playTimer = setTimeout(playNext, 800 / speed.value);
  };

  playNext();
};

const findUnit = (id) => {
  return [...playerUnits.value, ...enemyUnits.value].find((u) => u.id === id);
};

const goBack = () => {
  battleStore.clearBattle();
  router.push({ name: ROUTE_NAMES.BATTLE_MAP });
};

const retryBattle = () => {
  showResult.value = false;
  router.push({ name: ROUTE_NAMES.TEAM_FORM });
};

onMounted(() => {
  if (battleStore.battleLog.length > 0) {
    playBattleLog();
  } else {
    showResult.value = true;
  }
});

onUnmounted(() => {
  if (playTimer) clearTimeout(playTimer);
});
</script>

<style lang="scss" scoped>
.battle-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0e1a 0%, #1a1e2e 50%, #0d1117 100%);
  color: white;
  overflow: hidden;
}

.battle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
}

.round-counter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.round-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.round-num {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.speed-btn {
  padding: 6px 14px;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.1);
  color: #FFD700;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255,215,0,0.3);

  &:active { background: rgba(255,255,255,0.2); }
}

// ========== 战斗舞台 ==========
.battle-stage {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  min-height: calc(100vh - 60px);
}

.team-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.team-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.4);
  margin-bottom: 8px;
  text-align: center;
}

.units-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.battle-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 64px;
  transition: all 0.3s ease;

  &.dead {
    opacity: 0.25;
    filter: grayscale(1);
    transform: scale(0.85);
  }

  &.acting {
    transform: scale(1.15);
    filter: brightness(1.3);
  }

  &.hit {
    animation: shake 0.3s ease;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}

.unit-avatar {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid rgba(255,255,255,0.15);

  &.unit-rarity-n { background: linear-gradient(135deg, #3a3f4a, #2a2e38); }
  &.unit-rarity-r { background: linear-gradient(135deg, #1a3a6a, #2a4a8a); }
  &.unit-rarity-sr { background: linear-gradient(135deg, #4a2a7a, #6a3aaa); }
  &.unit-rarity-ssr { background: linear-gradient(135deg, #6a4a0a, #8a6a1a); }
  &.unit-rarity-ur { background: linear-gradient(135deg, #6a1a3a, #9a2a5a); }
}

.unit-hp-bar {
  width: 48px;
  height: 5px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;

  &.hp-high { background: linear-gradient(90deg, #22c55e, #4ade80); }
  &.hp-mid { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.hp-low { background: linear-gradient(90deg, #ef4444, #f87171); }
}

.unit-rage-bar {
  width: 48px;
  height: 3px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}

.rage-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
}

.unit-name {
  font-size: 9px;
  color: rgba(255,255,255,0.6);
  max-width: 60px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ========== 战斗特效区 ==========
.battle-fx-area {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-display {
  text-align: center;
  padding: 8px 20px;
  border-radius: $radius-full;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
}

.fx-text {
  font-size: 13px;
  font-weight: 500;
}

.fx-normal { color: rgba(255,255,255,0.8); }
.fx-skill { color: #FFD700; }
.fx-heal { color: #4ade80; }
.fx-aoe { color: #f87171; }
.fx-buff { color: #60a5fa; }
.fx-debuff { color: #c084fc; }

.fx-damage {
  display: inline-block;
  font-weight: 800;
  color: #ef4444;
  margin-left: 6px;
}

.fx-heal-num {
  display: inline-block;
  font-weight: 800;
  color: #22c55e;
  margin-left: 6px;
}

.fx-pop-enter-active { animation: pop-in 0.25s ease; }
.fx-pop-leave-active { animation: pop-out 0.15s ease; }

@keyframes pop-in {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pop-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

// ========== 结算弹窗 ==========
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.result-modal {
  width: 100%;
  max-width: 360px;
  background: $bg-elevated;
  border-radius: $radius-xl;
  padding: 32px 24px;
  text-align: center;
  animation: scale-in 0.4s ease;

  &.win {
    border: 2px solid rgba(255,215,0,0.3);
    box-shadow: 0 0 40px rgba(255,215,0,0.1);
  }

  &.lose {
    border: 2px solid rgba(239,68,68,0.2);
  }
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.result-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.result-title {
  font-size: 24px;
  color: $text-primary;
  margin-bottom: 8px;
}

.result-stars {
  font-size: 32px;
  color: #555;
  margin-bottom: 8px;

  .star-active { color: #FFD700; }
}

.result-rounds {
  font-size: 13px;
  color: $text-tertiary;
  margin-bottom: 20px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: $bg-main;
  border-radius: $radius-md;

  &.first-clear {
    grid-column: span 2;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,165,0,0.06));
    border: 1px solid rgba(255,215,0,0.15);
  }
}

.reward-icon { font-size: 16px; }
.reward-val {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
}

.result-actions {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: $radius-md;
  }
}
</style>
