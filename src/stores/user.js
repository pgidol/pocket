import { defineStore } from 'pinia';
import request from '../services/request.js';

/**
 * 用户信息 Store
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    /** @type {Object|null} */
    profile: null,
    /** @type {number} */
    gold: 0,
    /** @type {number} */
    diamond: 0,
    /** @type {number} */
    equipFragments: 0,
    /** @type {number} */
    level: 1,
    /** @type {number} */
    totalPulls: 0,
    /** @type {number} */
    stamina: 120,
    /** @type {number} */
    totalBattles: 0,
    /** @type {number} */
    totalWins: 0,
  }),

  actions: {
    /**
     * 从服务端拉取最新用户资料并更新 store
     * 用于页面刷新、路由切换等场景，确保资源数据与服务端同步
     */
    async fetchProfile() {
      try {
        const user = await request.get('/user/profile');
        this.setProfile(user);
      } catch {
        // 静默处理（可能 token 过期，由 request 拦截器处理）
      }
    },

    /**
     * 设置用户信息
     * @param {Object} user
     */
    setProfile(user) {
      this.profile = user;
      this.gold = user.gold ?? 0;
      this.diamond = user.diamond ?? 0;
      this.equipFragments = user.equipFragments ?? 0;
      this.level = user.level ?? 1;
      this.totalPulls = user.totalPulls ?? 0;
      this.stamina = user.stamina ?? 120;
      this.totalBattles = user.totalBattles ?? 0;
      this.totalWins = user.totalWins ?? 0;
    },

    /**
     * 更新货币/资源
     * @param {{ gold?: number, diamond?: number, equipFragments?: number }} currency
     */
    updateCurrency({ gold, diamond, equipFragments }) {
      if (gold !== undefined) {
        this.gold = gold;
        if (this.profile) this.profile.gold = gold;
      }
      if (diamond !== undefined) {
        this.diamond = diamond;
        if (this.profile) this.profile.diamond = diamond;
      }
      if (equipFragments !== undefined) {
        this.equipFragments = equipFragments;
        if (this.profile) this.profile.equipFragments = equipFragments;
      }
    },

    /**
     * 扣除钻石
     * @param {number} amount
     */
    deductDiamond(amount) {
      this.diamond = Math.max(0, this.diamond - amount);
    },

    /**
     * 增加总抽卡次数
     * @param {number} count
     */
    addPulls(count) {
      this.totalPulls += count;
    },

    /**
     * 清除用户数据
     */
    clearUser() {
      this.profile = null;
      this.gold = 0;
      this.diamond = 0;
      this.equipFragments = 0;
      this.level = 1;
      this.totalPulls = 0;
      this.stamina = 120;
      this.totalBattles = 0;
      this.totalWins = 0;
    },
  },
});
