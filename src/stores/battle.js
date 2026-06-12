import { defineStore } from 'pinia';

/**
 * 战斗状态 Store
 */
export const useBattleStore = defineStore('battle', {
  state: () => ({
    /** @type {Object|null} 当前关卡信息 */
    currentStage: null,
    /** @type {Array<Object>} 战斗回放日志 */
    battleLog: [],
    /** @type {'win'|'lose'|null} 战斗结果 */
    battleResult: null,
    /** @type {Object|null} 战斗奖励 */
    rewards: null,
    /** @type {boolean} 是否正在战斗 */
    isInBattle: false,
    /** @type {number} 战斗回合数 */
    rounds: 0,
    /** @type {number} 战斗星级 */
    stars: 0,
    /** @type {number} 当前体力 */
    stamina: 120,
    /** @type {number} 最大体力 */
    maxStamina: 120,
    /** @type {number|null} 下次恢复秒数 */
    nextRecoverIn: null,
    /** @type {Object} 用户关卡进度 {stageId: {cleared, stars}} */
    progress: {},
    /** @type {number} 当前选中的编队槽位 */
    selectedTeamSlot: 0,
  }),

  actions: {
    setStage(stage) {
      this.currentStage = stage;
    },

    setBattleResult(data) {
      this.battleLog = data.log || [];
      this.battleResult = data.result;
      this.rewards = data.rewards;
      this.rounds = data.rounds;
      this.stars = data.stars;
      this.isInBattle = false;
    },

    startBattle() {
      this.isInBattle = true;
      this.battleResult = null;
      this.rewards = null;
      this.battleLog = [];
    },

    setStamina({ stamina, maxStamina, nextRecoverIn }) {
      this.stamina = stamina;
      if (maxStamina !== undefined) this.maxStamina = maxStamina;
      if (nextRecoverIn !== undefined) this.nextRecoverIn = nextRecoverIn;
    },

    setProgress(progressMap) {
      this.progress = progressMap;
    },

    updateProgress(stageId, data) {
      this.progress[stageId] = data;
    },

    setSelectedTeamSlot(slot) {
      this.selectedTeamSlot = slot;
    },

    clearBattle() {
      this.currentStage = null;
      this.battleLog = [];
      this.battleResult = null;
      this.rewards = null;
      this.isInBattle = false;
      this.rounds = 0;
      this.stars = 0;
    },
  },
});
