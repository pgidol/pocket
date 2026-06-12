import { defineStore } from 'pinia';

/**
 * 卡牌收藏 Store
 */
export const useCardStore = defineStore('card', {
  state: () => ({
    /** @type {Array<Object>} 全部卡牌图鉴 */
    allCards: [],
    /** @type {Array<Object>} 用户拥有的卡牌 */
    myCards: [],
    /** @type {boolean} 是否已加载图鉴 */
    isLoaded: false,
  }),

  getters: {
    /**
     * 按稀有度分组的图鉴
     */
    cardsByRarity(state) {
      const groups = { N: [], R: [], SR: [], SSR: [], UR: [] };
      const allCards = state.allCards || [];
      allCards.forEach((card) => {
        if (card && card.rarity && groups[card.rarity]) {
          groups[card.rarity].push(card);
        }
      });
      return groups;
    },

    /**
     * 收集进度
     */
    collectionProgress(state) {
      const allCards = state.allCards || [];
      const myCards = state.myCards || [];
      const total = allCards.length;
      const owned = new Set(myCards.map((c) => c && c.cardId).filter(Boolean)).size;
      return { total, owned, percentage: total ? Math.round((owned / total) * 100) : 0 };
    },

    /**
     * 拥有的卡牌ID集合（快速查询）
     */
    ownedCardIds(state) {
      const myCards = state.myCards || [];
      return new Set(myCards.map((c) => c && c.cardId).filter(Boolean));
    },
  },

  actions: {
    setAllCards(cards) {
      this.allCards = cards;
      this.isLoaded = true;
    },

    setMyCards(cards) {
      this.myCards = cards;
    },

    /**
     * 添加新获得的卡牌
     * @param {Array<Object>} newCards
     */
    addCards(newCards) {
      newCards.forEach((newCard) => {
        const existing = this.myCards.find((c) => c.cardId === newCard.cardId);
        if (existing) {
          existing.count = newCard.count;
          if (!existing.userCardId && newCard.userCardId) {
            existing.userCardId = newCard.userCardId;
          }
          if (!existing.id && newCard.id) {
            existing.id = newCard.id;
          }
        } else {
          this.myCards.push({ ...newCard });
        }
      });
    },
  },

  persist: true,
});
