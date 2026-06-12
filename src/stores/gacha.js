import { defineStore } from 'pinia';

/**
 * 抽卡状态 Store
 */
export const useGachaStore = defineStore('gacha', {
  state: () => ({
    /** @type {Array<Object>} 可用卡池列表 */
    pools: [],
    /** @type {string|null} 当前选中的卡池 ID */
    currentPoolId: null,
    /** @type {number} SR 保底计数 */
    pityCountSR: 0,
    /** @type {number} SSR 保底计数 */
    pityCountSSR: 0,
    /** @type {Array<Object>} 最近抽卡结果 */
    lastPullResult: [],
    /** @type {boolean} 是否正在播放抽卡动画 */
    isAnimating: false,
    /** @type {Array<Object>} 抽卡历史记录 */
    history: [],
  }),

  getters: {
    currentPool(state) {
      return state.pools.find((p) => p.id === state.currentPoolId) || null;
    },

    pityToSR(state) {
      return 10 - (state.pityCountSR % 10);
    },

    pityToSSR(state) {
      return 90 - state.pityCountSSR;
    },
  },

  actions: {
    setPools(pools) {
      this.pools = pools;
      if (pools.length > 0) {
        const exists = pools.some((p) => p.id === this.currentPoolId);
        if (!exists) {
          this.currentPoolId = pools[0].id;
        }
      } else {
        this.currentPoolId = null;
      }
    },

    selectPool(poolId) {
      this.currentPoolId = poolId;
    },

    setPityCounters(sr, ssr) {
      this.pityCountSR = sr;
      this.pityCountSSR = ssr;
    },

    setLastPullResult(cards) {
      this.lastPullResult = cards;
    },

    setAnimating(val) {
      this.isAnimating = val;
    },

    addHistory(records) {
      this.history.unshift(...records);
    },
  },

  persist: {
    pick: ['currentPoolId', 'pityCountSR', 'pityCountSSR'],
  },
});
