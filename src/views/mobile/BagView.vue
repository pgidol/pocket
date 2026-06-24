<template>
  <div class="bag-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">我的背包</h1>
      <div class="header-placeholder"></div>
    </header>

    <!-- 分类 Tab -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-tab"
        :class="{ active: activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-label">{{ cat.label }}</span>
        <span v-if="cat.count > 0" class="cat-count">{{ cat.count }}</span>
      </button>
    </div>

    <!-- 装备分类 -->
    <div v-if="activeCategory === 'equipment'" class="bag-content">
      <!-- 装备列表 -->
      <div v-if="equipmentItems.length > 0" class="item-list">
        <div
          v-for="item in equipmentItems"
          :key="item.id"
          class="item-card"
          @click="handleEquipmentClick(item)"
        >
          <div :class="['item-icon-frame', `frame-${(item.rarity || 'n').toLowerCase()}`]">
            <span class="item-emoji">{{ slotIcon(item.slot) }}</span>
          </div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-meta">
              <span :class="['rarity-badge', `rarity-${(item.rarity || 'n').toLowerCase()}`]">
                {{ item.rarity || 'N' }}
              </span>
              <span class="item-slot-label">{{ slotLabel(item.slot) }}</span>
              <span v-if="item.level > 0" class="item-level">+{{ item.level }}</span>
            </div>
          </div>
          <div class="item-status">
            <span v-if="item.isEquipped" class="equipped-badge">已装备</span>
          </div>
        </div>
      </div>

      <!-- 装备空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon-wrap">
          <span class="empty-icon">🛡️</span>
        </div>
        <h3 class="empty-title">暂无装备</h3>
        <p class="empty-desc">装备系统即将上线，届时可在此管理您的召唤师装备</p>
        <button class="btn-primary empty-action" @click="router.push({ name: ROUTE_NAMES.EQUIPMENT })">
          查看装备系统
        </button>
      </div>
    </div>

    <!-- 纪念品分类 -->
    <div v-if="activeCategory === 'souvenir'" class="bag-content">
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <span class="empty-icon">🏆</span>
        </div>
        <h3 class="empty-title">暂无纪念品</h3>
        <p class="empty-desc">冒险途中收集的珍贵纪念品将在这里展示<br />更多精彩内容即将推出</p>
        <div class="coming-features">
          <div class="feature-tag">
            <span>🎖️</span>
            <span>成就奖章</span>
          </div>
          <div class="feature-tag">
            <span>📜</span>
            <span>通关证书</span>
          </div>
          <div class="feature-tag">
            <span>🎁</span>
            <span>限定纪念</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 Tab -->
    <nav class="bottom-tabs">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="tab-item">
        <span class="tab-icon">🏠</span><span class="tab-label">主页</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item">
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import { useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES, EQUIPMENT_SLOTS } from '../../utils/constants.js';

const router = useRouter();
const uiStore = useUiStore();

const activeCategory = ref('equipment');

/** 装备物品列表（暂无数据，预留接口） */
const equipmentItems = ref([]);

/** 分类配置 */
const categories = computed(() => [
  { key: 'equipment', label: '装备', icon: '🛡️', count: equipmentItems.value.length },
  { key: 'souvenir', label: '纪念品', icon: '🏆', count: 0 },
]);

/** 获取槽位图标 */
const slotIcon = (slot) => {
  return EQUIPMENT_SLOTS[slot]?.icon || '📦';
};

/** 获取槽位名称 */
const slotLabel = (slot) => {
  return EQUIPMENT_SLOTS[slot]?.label || '未知';
};

const handleEquipmentClick = (item) => {
  uiStore.toast(`${item.name} — 装备详情即将开放`, 'info');
};
</script>

<style lang="scss" scoped>
.bag-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

// ========== 页头 ==========
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
}

.header-placeholder {
  width: 36px;
}

// ========== 分类 Tab ==========
.category-tabs {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
}

.category-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1.5px solid $border-color;
  transition: all $transition-normal;
  cursor: pointer;
  position: relative;

  &.active {
    background: linear-gradient(135deg, rgba($color-primary, 0.12), rgba($color-accent, 0.08));
    border-color: rgba($color-primary, 0.4);
    box-shadow: 0 2px 8px rgba($color-primary, 0.1);
  }

  &:active {
    transform: scale(0.97);
  }
}

.cat-icon {
  font-size: 20px;
}

.cat-label {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.cat-count {
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: $color-primary;
  padding: 1px 7px;
  border-radius: $radius-full;
  min-width: 18px;
  text-align: center;
}

// ========== 背包内容 ==========
.bag-content {
  padding: 0 16px;
}

// ========== 物品列表 ==========
.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: $bg-card;
  border-radius: $radius-md;
  border: 1px solid $border-color;
  transition: all $transition-normal;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    background: $bg-overlay;
  }
}

.item-icon-frame {
  width: 46px;
  height: 46px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.frame-n { background: $rarity-n; }
.frame-r { background: $rarity-r; }
.frame-sr { background: $rarity-sr; }
.frame-ssr { background: $rarity-ssr; }
.frame-ur { background: $rarity-ur; }

.item-emoji {
  font-size: 22px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.item-slot-label {
  font-size: 11px;
  color: $text-tertiary;
}

.item-level {
  font-size: 11px;
  font-weight: 600;
  color: $color-success;
}

.item-status {
  flex-shrink: 0;
}

.equipped-badge {
  font-size: 10px;
  color: $color-primary-dark;
  background: rgba($color-primary, 0.12);
  padding: 3px 8px;
  border-radius: $radius-full;
  font-weight: 600;
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 0 20px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba($color-primary, 0.08), rgba($color-accent, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 36px;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: $text-tertiary;
  line-height: 1.6;
  margin-bottom: 20px;
}

.empty-action {
  padding: 10px 28px;
  font-size: 14px;
}

// ========== 即将上线标签 ==========
.coming-features {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-full;
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
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
