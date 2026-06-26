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
      <!-- 碎片信息栏 -->
      <div class="frag-bar">
        <div class="frag-info">
          <span class="frag-icon">💎</span>
          <span class="frag-label">碎片：</span>
          <span class="frag-value">{{ fragments }}</span>
        </div>
        <button
          class="craft-btn"
          :disabled="fragments < 100"
          @click="router.push({ name: ROUTE_NAMES.EQUIPMENT })"
        >
          🔨 前往打造
        </button>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="selectedIds.size > 0" class="batch-bar">
        <span class="batch-count">已选 {{ selectedIds.size }} 件</span>
        <button class="batch-cancel" @click="selectedIds.clear()">取消</button>
        <button
          class="batch-decompose"
          :disabled="decomposeLoading"
          @click="doBatchDecompose"
        >
          {{ decomposeLoading ? '分解中...' : `分解 (+${selectedIds.size * 10}💎)` }}
        </button>
      </div>

      <!-- 装备列表 -->
      <div v-if="loading" class="loading-state">
        <span class="loading-spinner">⏳</span>
        <p>加载中...</p>
      </div>

      <div v-else-if="equipmentItems.length > 0" class="item-list">
        <div
          v-for="item in equipmentItems"
          :key="item.id"
          class="item-card"
          :class="{
            'item-card--selected': selectedIds.has(item.id),
            'item-card--equipped': item.isEquipped,
          }"
          @click="handleEquipmentClick(item)"
          @contextmenu.prevent="toggleSelect(item)"
        >
          <div class="item-icon-frame">
            <span class="item-emoji">{{ slotIcon(item.slot) }}</span>
            <span v-if="item.blueSkill || item.blueEffect" class="item-blue-mark">✦</span>
          </div>
          <div class="item-info">
            <span
              class="item-name"
              :class="{ 'name-blue': item.blueSkill || item.blueEffect }"
            >{{ item.name }}</span>
            <div class="item-meta">
              <span class="item-slot-label">{{ slotLabel(item.slot) }}</span>
              <span class="item-primary">
                {{ statLabel(item.primaryStat1?.type) }}+{{ item.primaryStat1?.value }}
              </span>
            </div>
            <!-- 绿字概要 -->
            <div v-if="item.greenStats?.length > 0" class="item-green">
              <span v-for="(gs, idx) in item.greenStats" :key="idx" class="green-tag">
                {{ greenLabel(gs.type) }}+{{ gs.value }}
              </span>
            </div>
            <!-- 蓝字概要 -->
            <div v-if="item.blueSkill || item.blueEffect" class="item-blue-tags">
              <span v-if="item.blueSkill" class="blue-tag">{{ item.blueSkill.name }}</span>
              <span v-if="item.blueEffect" class="blue-tag blue-tag--effect">{{ item.blueEffect.name }}</span>
            </div>
          </div>
          <div class="item-status">
            <span v-if="item.isEquipped" class="equipped-badge">已装备</span>
            <div v-if="!item.isEquipped" class="select-check" :class="{ checked: selectedIds.has(item.id) }">
              <span v-if="selectedIds.has(item.id)">✓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 装备空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon-wrap">
          <span class="empty-icon">🛡️</span>
        </div>
        <h3 class="empty-title">暂无装备</h3>
        <p class="empty-desc">通关关卡获取装备掉落，或消耗碎片打造装备</p>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../services/request.js';
import { useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES, EQUIPMENT_SLOTS } from '../../utils/constants.js';

const router = useRouter();
const uiStore = useUiStore();

const activeCategory = ref('equipment');
const loading = ref(false);
const decomposeLoading = ref(false);

/** 装备列表 */
const equipmentItems = ref([]);
/** 碎片数量 */
const fragments = ref(0);
/** 批量选中的装备 ID */
const selectedIds = reactive(new Set());

/** 分类配置 */
const categories = computed(() => [
  { key: 'equipment', label: '装备', icon: '🛡️', count: equipmentItems.value.length },
  { key: 'souvenir', label: '纪念品', icon: '🏆', count: 0 },
]);

/** 获取槽位图标 */
const slotIcon = (slot) => EQUIPMENT_SLOTS[slot]?.icon || '📦';

/** 获取槽位名称 */
const slotLabel = (slot) => EQUIPMENT_SLOTS[slot]?.label || '未知';

/** 主属性标签 */
const STAT_LABELS = {
  hp: '生命', mp: '法力', pAtk: '物攻', mAtk: '法攻',
  pDef: '物防', mDef: '法防', spd: '速度', critRate: '暴击率', healBonus: '治疗',
};
const statLabel = (type) => STAT_LABELS[type] || type;

/** 绿字标签 */
const GREEN_LABELS = {
  constitution: '体质', strength: '力量', magic: '魔力',
  endurance: '耐力', agility: '敏捷',
};
const greenLabel = (type) => GREEN_LABELS[type] || type;

// ---- API ----
async function fetchEquipments() {
  loading.value = true;
  try {
    const [equips, userInfo] = await Promise.all([
      request.get('/equipment'),
      request.get('/user/profile'),
    ]);
    equipmentItems.value = equips || [];
    fragments.value = userInfo?.equipFragments || 0;
  } catch (e) {
    uiStore.toast(e.message || '加载装备失败', 'error');
  } finally {
    loading.value = false;
  }
}

// ---- 交互 ----
const handleEquipmentClick = (item) => {
  // 如果正在批量选择模式，则切换选中
  if (selectedIds.size > 0) {
    toggleSelect(item);
    return;
  }
  // 跳转到装备页面查看详情
  router.push({ name: ROUTE_NAMES.EQUIPMENT });
};

const toggleSelect = (item) => {
  if (item.isEquipped) {
    uiStore.toast('已装备的装备不能分解', 'warning');
    return;
  }
  if (selectedIds.has(item.id)) {
    selectedIds.delete(item.id);
  } else {
    selectedIds.add(item.id);
  }
};

async function doBatchDecompose() {
  if (selectedIds.size === 0) return;
  decomposeLoading.value = true;
  try {
    const ids = [...selectedIds];
    const result = await request.post('/equipment/decompose', { equipmentIds: ids });
    uiStore.toast(`分解 ${result.decomposed} 件装备，获得 ${result.fragmentGain} 碎片`, 'success');
    selectedIds.clear();
    fragments.value = result.totalFragments;
    await fetchEquipments();
  } catch (e) {
    uiStore.toast(e.message || '分解失败', 'error');
  } finally {
    decomposeLoading.value = false;
  }
}

onMounted(fetchEquipments);
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

.cat-icon { font-size: 20px; }
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

// ========== 碎片信息栏 ==========
.frag-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: $bg-card;
  border-radius: $radius-md;
  border: 1px solid $border-color;
  margin-bottom: 12px;
}

.frag-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.frag-icon { font-size: 16px; }
.frag-label {
  font-size: 13px;
  color: $text-secondary;
}
.frag-value {
  font-size: 15px;
  font-weight: 700;
  color: $color-primary;
}

.craft-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, $color-primary, $color-accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: $radius-full;
  cursor: pointer;
  transition: all $transition-normal;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: scale(0.95);
  }
}

// ========== 批量操作栏 ==========
.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba($color-warning, 0.08);
  border-radius: $radius-md;
  border: 1px solid rgba($color-warning, 0.25);
  margin-bottom: 12px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.batch-count {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: $color-warning;
}

.batch-cancel {
  padding: 6px 12px;
  font-size: 12px;
  color: $text-secondary;
  background: $bg-card;
  border-radius: $radius-full;
  border: 1px solid $border-color;
  cursor: pointer;
}

.batch-decompose {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: $color-warning;
  border-radius: $radius-full;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
  }
}

// ========== 背包内容 ==========
.bag-content {
  padding: 0 16px;
}

// ========== 加载状态 ==========
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: $text-tertiary;
  font-size: 14px;
}

.loading-spinner {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

  &--equipped {
    border-color: rgba($color-primary, 0.3);
    background: linear-gradient(135deg, rgba($color-primary, 0.03), rgba($color-accent, 0.02));
  }

  &--selected {
    border-color: $color-warning;
    background: rgba($color-warning, 0.06);
  }
}

.item-icon-frame {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: $radius-md;
  background: linear-gradient(135deg, rgba($color-primary, 0.08), rgba($color-accent, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-emoji { font-size: 24px; }

.item-blue-mark {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 12px;
  color: #4A90D9;
  filter: drop-shadow(0 0 3px rgba(74, 144, 217, 0.5));
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

  &.name-blue { color: #4A90D9; }
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.item-slot-label {
  font-size: 11px;
  color: $text-tertiary;
}

.item-primary {
  font-size: 11px;
  color: $text-secondary;
  font-weight: 500;
}

.item-green {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.green-tag {
  font-size: 10px;
  color: #27AE60;
  font-weight: 600;
}

.item-blue-tags {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.blue-tag {
  font-size: 10px;
  color: #4A90D9;
  background: rgba(74, 144, 217, 0.08);
  padding: 1px 5px;
  border-radius: $radius-sm;
  font-weight: 600;

  &--effect { color: #8E44AD; background: rgba(142, 68, 173, 0.08); }
}

.item-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.equipped-badge {
  font-size: 10px;
  color: $color-primary-dark;
  background: rgba($color-primary, 0.12);
  padding: 3px 8px;
  border-radius: $radius-full;
  font-weight: 600;
}

.select-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  transition: all $transition-normal;

  &.checked {
    background: $color-warning;
    border-color: $color-warning;
  }
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

.empty-icon { font-size: 36px; }
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
