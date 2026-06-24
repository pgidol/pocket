<template>
  <div class="card-selector">
    <!-- 排序 & 筛选工具栏 -->
    <div class="selector-toolbar">
      <div class="toolbar-left">
        <h3 class="toolbar-title">我的卡牌</h3>
        <span class="card-count">{{ filteredCards.length }}张可用</span>
      </div>
      <div class="toolbar-right">
        <button class="sort-btn" @click="showSortMenu = !showSortMenu">
          <span class="sort-icon">{{ sortDirectionIcon }}</span>
          <span class="sort-label">{{ currentSortLabel }}</span>
        </button>
      </div>
    </div>

    <!-- 排序菜单弹出 -->
    <transition name="slide-down">
      <div v-if="showSortMenu" class="sort-menu">
        <button
          v-for="option in sortOptions"
          :key="option.key"
          class="sort-option"
          :class="{ active: currentSort === option.key }"
          @click="selectSort(option.key)"
        >
          <span class="sort-option-icon">{{ option.icon }}</span>
          <span class="sort-option-text">{{ option.label }}</span>
          <span v-if="currentSort === option.key" class="sort-check">✓</span>
        </button>
      </div>
    </transition>

    <!-- 稀有度快速筛选 -->
    <div class="rarity-filters">
      <button
        class="rarity-tag"
        :class="{ active: activeRarity === 'all' }"
        @click="activeRarity = 'all'"
      >全部</button>
      <button
        v-for="r in rarityList"
        :key="r"
        class="rarity-tag"
        :class="[`rarity-tag-${r.toLowerCase()}`, { active: activeRarity === r }]"
        @click="activeRarity = r"
      >{{ r }}</button>
    </div>

    <!-- 卡牌列表 -->
    <div class="card-list">
      <div
        v-for="card in filteredCards"
        :key="card.userCardId"
        class="card-item"
        :class="{
          'in-team': inTeamIds.includes(card.userCardId),
          selected: selectedId === card.userCardId,
        }"
        @click="handleSelect(card)"
      >
        <div :class="['card-frame', `mini-frame-${card.rarity.toLowerCase()}`]">
          <span class="card-emoji">{{ factionEmoji(card.series) }}</span>
        </div>
        <div class="card-info">
          <span class="card-name">{{ card.name }}</span>
          <div class="card-meta">
            <span :class="['rarity-badge', `rarity-${card.rarity.toLowerCase()}`]">{{ card.rarity }}</span>
            <span class="card-level">Lv.{{ card.level || 1 }}</span>
            <span v-if="card.stars" class="card-stars">
              <span v-for="s in card.stars" :key="s" class="star">★</span>
            </span>
          </div>
        </div>
        <span v-if="inTeamIds.includes(card.userCardId)" class="in-team-badge">已上阵</span>
      </div>

      <div v-if="filteredCards.length === 0" class="empty-state">
        <p v-if="activeRarity !== 'all'">没有 {{ activeRarity }} 稀有度的卡牌</p>
        <p v-else>没有卡牌，先去抽卡吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

import { RARITY_ORDER } from '../../utils/constants.js';

const props = defineProps({
  /** @type {Array<Object>} 全部可用卡牌列表 */
  cards: {
    type: Array,
    default: () => [],
  },
  /** @type {string|null} 当前选中的卡牌 ID */
  selectedId: {
    type: [String, null],
    default: null,
  },
  /** @type {Array<string>} 已在队伍中的卡牌 ID 列表 */
  inTeamIds: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select']);

const rarityList = ['N', 'R', 'SR', 'SSR', 'UR'];

const showSortMenu = ref(false);
const currentSort = ref('rarity_desc');
const activeRarity = ref('all');

/** 排序选项配置 */
const sortOptions = [
  { key: 'rarity_desc', label: '稀有度 高→低', icon: '💎' },
  { key: 'rarity_asc', label: '稀有度 低→高', icon: '🔹' },
  { key: 'level_desc', label: '等级 高→低', icon: '📈' },
  { key: 'level_asc', label: '等级 低→高', icon: '📉' },
  { key: 'stars_desc', label: '星级 高→低', icon: '⭐' },
  { key: 'name_asc', label: '名称 A→Z', icon: '🔤' },
];

const currentSortLabel = computed(() => {
  const opt = sortOptions.find((o) => o.key === currentSort.value);
  return opt ? opt.label : '排序';
});

const sortDirectionIcon = computed(() => {
  return currentSort.value.endsWith('_desc') ? '↓' : '↑';
});

const factionEmoji = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

/**
 * 排序比较函数
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
const sortCompare = (a, b) => {
  switch (currentSort.value) {
    case 'rarity_desc':
      if ((RARITY_ORDER[b.rarity] || 0) !== (RARITY_ORDER[a.rarity] || 0)) {
        return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
      }
      return (b.level || 1) - (a.level || 1);
    case 'rarity_asc':
      if ((RARITY_ORDER[a.rarity] || 0) !== (RARITY_ORDER[b.rarity] || 0)) {
        return (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
      }
      return (a.level || 1) - (b.level || 1);
    case 'level_desc':
      if ((b.level || 1) !== (a.level || 1)) {
        return (b.level || 1) - (a.level || 1);
      }
      return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
    case 'level_asc':
      if ((a.level || 1) !== (b.level || 1)) {
        return (a.level || 1) - (b.level || 1);
      }
      return (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
    case 'stars_desc':
      if ((b.stars || 0) !== (a.stars || 0)) {
        return (b.stars || 0) - (a.stars || 0);
      }
      return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
    case 'name_asc':
      return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    default:
      return 0;
  }
};

/** 经过筛选 + 排序的卡牌列表 */
const filteredCards = computed(() => {
  let list = [...(props.cards || [])];

  // 稀有度筛选
  if (activeRarity.value !== 'all') {
    list = list.filter((c) => c.rarity === activeRarity.value);
  }

  // 排序
  list.sort(sortCompare);

  return list;
});

const selectSort = (key) => {
  currentSort.value = key;
  showSortMenu.value = false;
};

const handleSelect = (card) => {
  emit('select', card);
};
</script>

<style lang="scss" scoped>
.card-selector {
  padding: 0 16px;
}

// ========== 工具栏 ==========
.selector-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.card-count {
  font-size: 12px;
  color: $text-tertiary;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-full;
  font-size: 12px;
  color: $text-secondary;
  transition: all $transition-normal;

  &:active {
    background: $bg-overlay;
  }
}

.sort-icon {
  font-size: 12px;
  font-weight: 700;
  color: $color-primary;
}

// ========== 排序菜单 ==========
.sort-menu {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 4px;
  margin-bottom: 8px;
  box-shadow: $shadow-md;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: $radius-sm;
  font-size: 13px;
  color: $text-secondary;
  transition: background $transition-fast;

  &:active {
    background: $bg-overlay;
  }

  &.active {
    color: $color-primary-dark;
    background: rgba($color-primary, 0.08);
    font-weight: 600;
  }
}

.sort-option-icon {
  font-size: 16px;
}

.sort-check {
  margin-left: auto;
  color: $color-primary;
  font-weight: 700;
}

// ========== 稀有度筛选 ==========
.rarity-filters {
  display: flex;
  gap: 6px;
  padding-bottom: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rarity-tag {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  background: $bg-card;
  border: 1px solid $border-color;
  color: $text-secondary;
  transition: all $transition-normal;

  &.active {
    color: white;
    background: $color-primary;
    border-color: $color-primary;
  }

  &.rarity-tag-n.active { background: $rarity-text-n; border-color: $rarity-text-n; }
  &.rarity-tag-r.active { background: $rarity-text-r; border-color: $rarity-text-r; }
  &.rarity-tag-sr.active { background: $rarity-text-sr; border-color: $rarity-text-sr; }
  &.rarity-tag-ssr.active { background: $rarity-text-ssr; border-color: $rarity-text-ssr; }
  &.rarity-tag-ur.active { background: $rarity-text-ur; border-color: $rarity-text-ur; }
}

// ========== 卡牌列表 ==========
.card-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
}

.card-item {
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

  &:active {
    transform: scale(0.98);
  }
}

.card-frame {
  width: 40px;
  height: 40px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-emoji {
  font-size: 18px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.card-level {
  font-size: 11px;
  color: $text-tertiary;
}

.card-stars {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 10px;
  color: $color-warning;
}

.in-team-badge {
  font-size: 10px;
  color: $text-tertiary;
  padding: 2px 8px;
  background: $bg-overlay;
  border-radius: $radius-full;
  flex-shrink: 0;
}

.mini-frame-n { background: $rarity-n; }
.mini-frame-r { background: $rarity-r; }
.mini-frame-sr { background: $rarity-sr; }
.mini-frame-ssr { background: $rarity-ssr; }
.mini-frame-ur { background: $rarity-ur; }

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: $text-tertiary;
  font-size: 14px;
}

// ========== 动画 ==========
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
