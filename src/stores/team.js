import { defineStore } from 'pinia';

/**
 * 编队状态 Store
 */
export const useTeamStore = defineStore('team', {
  state: () => ({
    /** @type {Array<Object|null>} 3个编队槽位 */
    teams: [null, null, null],
    /** @type {number} 当前激活的编队索引 */
    activeSlot: 0,
  }),

  getters: {
    /**
     * 当前激活编队
     */
    activeTeam(state) {
      return state.teams[state.activeSlot] || null;
    },

    /**
     * 当前编队总战力
     */
    activePower(state) {
      const team = state.teams[state.activeSlot];
      return team?.totalPower || 0;
    },
  },

  actions: {
    setTeams(teams) {
      this.teams = teams;
    },

    setActiveSlot(index) {
      if (index >= 0 && index <= 2) {
        this.activeSlot = index;
      }
    },

    updateTeam(slotIndex, teamData) {
      this.teams[slotIndex] = teamData;
    },
  },

  persist: {
    pick: ['activeSlot'],
  },
});
