<template>
  <div class="equipment-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">召唤师装备</h1>
      <div class="header-frag" @click="showCraftPanel = true">
        <span class="frag-icon">💎</span>
        <span class="frag-count">{{ fragments }}</span>
      </div>
    </header>

    <div class="equipment-content">
      <!-- 角色模型区域 + 装备槽位 -->
      <div class="character-area">
        <div class="character-glow"></div>
        <div class="character-model">
          <span class="character-icon">⚔️</span>
          <span class="character-label">召唤师</span>
        </div>

        <!-- 6个装备槽位 -->
        <div
          v-for="s in slotConfig"
          :key="s.key"
          :class="['slot', `slot-${s.key}`, { 'slot--filled': equippedMap[s.key] }]"
          @click="handleSlotClick(s.key)"
        >
          <div class="slot-inner">
            <span class="slot-icon">{{ s.icon }}</span>
            <span class="slot-name">{{ s.label }}</span>
          </div>
          <div v-if="equippedMap[s.key]" class="slot-equipped-dot"></div>
          <div v-else class="slot-empty-hint">+</div>
        </div>
      </div>

      <!-- 属性加成面板 -->
      <div class="stats-preview">
        <h3 class="stats-title">
          <span>📊 装备属性加成</span>
          <span class="equipped-count">{{ equippedCount }}/6</span>
        </h3>
        <div class="stats-grid">
          <div v-for="s in displayStats" :key="s.key" class="stat-row">
            <span class="stat-label">{{ s.icon }} {{ s.label }}</span>
            <span class="stat-value" :class="{ 'stat-zero': s.value === 0 }">
              +{{ s.value }}{{ s.suffix }}
            </span>
          </div>
        </div>
      </div>

      <!-- 打造入口 Banner -->
      <div class="craft-banner" @click="showCraftPanel = true">
        <div class="craft-banner__icon">🔨</div>
        <div class="craft-banner__body">
          <h4 class="craft-banner__title">装备打造工坊</h4>
          <p class="craft-banner__desc">消耗 100 碎片打造指定位置装备</p>
        </div>
        <div class="craft-banner__right">
          <span class="craft-banner__frag">💎 {{ fragments }}</span>
          <span class="craft-banner__btn">前往打造 →</span>
        </div>
      </div>

      <!-- 装备背包列表 -->
      <div class="bag-section">
        <div class="bag-header">
          <h3 class="bag-title">🎒 装备背包</h3>
          <span class="bag-count">{{ allEquipments.length }} 件</span>
        </div>

        <!-- 槽位 Tab 筛选 -->
        <div class="slot-tabs">
          <button
            class="slot-tab"
            :class="{ active: filterSlot === 'all' }"
            @click="filterSlot = 'all'"
          >全部</button>
          <button
            v-for="s in slotConfig"
            :key="s.key"
            class="slot-tab"
            :class="{ active: filterSlot === s.key }"
            @click="filterSlot = s.key"
          >
            <span>{{ s.icon }}</span>
            <span>{{ s.label }}</span>
          </button>
        </div>

        <!-- 装备列表 -->
        <div v-if="filteredEquipments.length > 0" class="equip-list">
          <EquipmentCard
            v-for="eq in filteredEquipments"
            :key="eq.id"
            :equipment="eq"
            @click="handleEquipmentClick"
          />
        </div>

        <div v-else class="empty-bag">
          <span class="empty-icon">📭</span>
          <p class="empty-text">暂无{{ filterSlot === 'all' ? '' : slotLabelMap[filterSlot] }}装备</p>
          <p class="empty-hint">通关关卡或打造可获得装备</p>
        </div>
      </div>
    </div>

    <!-- ====== 装备详情弹窗 ====== -->
    <Teleport to="body">
      <div v-if="selectedEquipment" class="modal-overlay" @click.self="selectedEquipment = null">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title" :class="{ 'title-blue': !!(selectedEquipment.blueSkill || selectedEquipment.blueEffect) }">
              {{ selectedEquipment.name }}
            </h3>
            <button class="modal-close" @click="selectedEquipment = null">✕</button>
          </div>

          <div class="modal-body">
            <!-- 槽位 -->
            <div class="detail-slot">
              <span>{{ slotLabelMap[selectedEquipment.slot] || '未知' }}</span>
            </div>

            <!-- 主属性 -->
            <div class="detail-section">
              <h4 class="section-label">主属性</h4>
              <div class="detail-stats">
                <div class="detail-stat">
                  <span>{{ statLabel(selectedEquipment.primaryStat1.type) }}</span>
                  <span class="stat-val">+{{ selectedEquipment.primaryStat1.value }}{{ isPercent(selectedEquipment.primaryStat1.type) ? '%' : '' }}</span>
                </div>
                <div class="detail-stat">
                  <span>{{ statLabel(selectedEquipment.primaryStat2.type) }}</span>
                  <span class="stat-val">+{{ selectedEquipment.primaryStat2.value }}{{ isPercent(selectedEquipment.primaryStat2.type) ? '%' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- 绿字 -->
            <div v-if="selectedEquipment.greenStats?.length > 0" class="detail-section">
              <h4 class="section-label section-green">绿字属性</h4>
              <div class="detail-stats">
                <div v-for="(gs, idx) in selectedEquipment.greenStats" :key="idx" class="detail-stat green-line">
                  <span>{{ greenLabel(gs.type) }}</span>
                  <span class="stat-val green-val">+{{ gs.value }}</span>
                </div>
              </div>
            </div>

            <!-- 蓝字 -->
            <div v-if="selectedEquipment.blueSkill || selectedEquipment.blueEffect" class="detail-section">
              <h4 class="section-label section-blue">蓝字属性</h4>
              <div v-if="selectedEquipment.blueSkill" class="blue-detail">
                <span class="blue-tag">特技</span>
                <span class="blue-name">{{ selectedEquipment.blueSkill.name }}</span>
                <p class="blue-desc">{{ selectedEquipment.blueSkill.description }}</p>
              </div>
              <div v-if="selectedEquipment.blueEffect" class="blue-detail">
                <span class="blue-tag blue-tag--effect">特效</span>
                <span class="blue-name">{{ selectedEquipment.blueEffect.name }}</span>
                <p class="blue-desc">{{ selectedEquipment.blueEffect.description }}</p>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button
              v-if="!selectedEquipment.isEquipped"
              class="btn-action btn-equip"
              :disabled="actionLoading"
              @click="doEquip(selectedEquipment.id)"
            >
              {{ actionLoading ? '处理中...' : '穿戴装备' }}
            </button>
            <button
              v-else
              class="btn-action btn-unequip"
              :disabled="actionLoading"
              @click="doUnequip(selectedEquipment.id)"
            >
              {{ actionLoading ? '处理中...' : '卸下装备' }}
            </button>
            <button
              v-if="!selectedEquipment.isEquipped"
              class="btn-action btn-decompose"
              :disabled="actionLoading"
              @click="doDecompose([selectedEquipment.id])"
            >
              分解 (+10💎)
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== 打造面板弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showCraftPanel" class="modal-overlay" @click.self="!craftPhase && (showCraftPanel = false)">
        <div class="modal-panel craft-panel">
          <!-- 选择槽位阶段 -->
          <template v-if="!craftPhase">
            <div class="modal-header">
              <h3 class="modal-title">🔨 装备打造工坊</h3>
              <button class="modal-close" @click="showCraftPanel = false">✕</button>
            </div>

            <div class="craft-info">
              <span class="craft-frag-icon">💎</span>
              <span class="craft-frag-count">{{ fragments }}</span>
              <span class="craft-frag-label">碎片</span>
            </div>

            <p class="craft-cost-hint">消耗 <strong>100</strong> 碎片打造一件指定位置的装备</p>

            <div class="craft-slots">
              <button
                v-for="s in slotConfig"
                :key="s.key"
                class="craft-slot-btn"
                :disabled="fragments < 100 || actionLoading"
                @click="doCraft(s.key)"
              >
                <span class="craft-slot-icon">{{ s.icon }}</span>
                <span class="craft-slot-label">{{ s.label }}</span>
                <span class="craft-slot-cost">-100💎</span>
              </button>
            </div>
          </template>

          <!-- 打造动画阶段 -->
          <template v-if="craftPhase === 'forging'">
            <div class="forge-scene" :class="{ 'forge-scene--rare': forgeIsRare }">
              <div class="forge-anvil">🔩</div>
              <div class="forge-hammer">🔨</div>
              <div class="forge-sparks">
                <span v-for="i in 12" :key="i" class="spark" :style="{ '--i': i }"></span>
              </div>
              <div class="forge-glow"></div>
              <p class="forge-text">{{ forgeText }}</p>
              <div class="forge-progress">
                <div class="forge-progress-bar"></div>
              </div>
            </div>
          </template>

          <!-- 打造结果阶段 -->
          <template v-if="craftPhase === 'result' && craftedEquipment">
            <div class="craft-result" :class="{ 'craft-result--rare': isCraftedRare }">
              <div class="result-burst" :class="{ 'result-burst--rare': isCraftedRare }"></div>
              <div class="result-header">
                <span class="result-badge" :class="{ 'result-badge--rare': isCraftedRare }">
                  {{ isCraftedRare ? '✦ 稀有打造!' : '打造成功!' }}
                </span>
              </div>
              <div class="result-card" :class="{ 'result-card--blue': isCraftedRare }">
                <div class="result-card__icon">
                  <span>{{ slotIconMap[craftedEquipment.slot] || '📦' }}</span>
                </div>
                <h3 class="result-card__name" :class="{ 'name--blue': isCraftedRare }">
                  {{ craftedEquipment.name }}
                </h3>
                <div class="result-card__slot-tag">{{ slotLabelMap[craftedEquipment.slot] }}</div>

                <!-- 主属性 -->
                <div class="result-section">
                  <div class="result-stat">
                    <span>{{ statLabel(craftedEquipment.primaryStat1.type) }}</span>
                    <span class="result-stat-val">+{{ craftedEquipment.primaryStat1.value }}{{ isPercent(craftedEquipment.primaryStat1.type) ? '%' : '' }}</span>
                  </div>
                  <div class="result-stat">
                    <span>{{ statLabel(craftedEquipment.primaryStat2.type) }}</span>
                    <span class="result-stat-val">+{{ craftedEquipment.primaryStat2.value }}{{ isPercent(craftedEquipment.primaryStat2.type) ? '%' : '' }}</span>
                  </div>
                </div>

                <!-- 绿字 -->
                <div v-if="craftedEquipment.greenStats?.length" class="result-section result-green">
                  <div v-for="(gs, idx) in craftedEquipment.greenStats" :key="idx" class="result-stat green-line">
                    <span>{{ greenLabel(gs.type) }}</span>
                    <span class="result-stat-val green-val">+{{ gs.value }}</span>
                  </div>
                </div>

                <!-- 蓝字 -->
                <div v-if="craftedEquipment.blueSkill || craftedEquipment.blueEffect" class="result-section result-blue">
                  <div v-if="craftedEquipment.blueSkill" class="result-blue-item">
                    <span class="blue-tag">特技</span>
                    <span class="blue-name">{{ craftedEquipment.blueSkill.name }}</span>
                    <p class="blue-desc">{{ craftedEquipment.blueSkill.description }}</p>
                  </div>
                  <div v-if="craftedEquipment.blueEffect" class="result-blue-item">
                    <span class="blue-tag blue-tag--effect">特效</span>
                    <span class="blue-name">{{ craftedEquipment.blueEffect.name }}</span>
                    <p class="blue-desc">{{ craftedEquipment.blueEffect.description }}</p>
                  </div>
                </div>
              </div>

              <div class="result-actions">
                <button class="btn-action btn-equip" @click="doEquipCrafted">立即穿戴</button>
                <button class="btn-action btn-unequip" @click="closeCraftResult">放入背包</button>
              </div>
              <button
                class="btn-craft-again"
                :disabled="fragments < 100 || actionLoading"
                @click="doCraft(lastCraftSlot)"
              >
                🔨 再次打造{{ slotLabelMap[lastCraftSlot] || '' }}（-100💎）
              </button>
              <p class="result-frag-hint">剩余碎片: {{ fragments }}</p>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../services/request.js';
import { useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES, EQUIPMENT_SLOTS } from '../../utils/constants.js';
import EquipmentCard from '../../components/mobile/EquipmentCard.vue';

const router = useRouter();
const uiStore = useUiStore();

// ---- 状态 ----
const allEquipments = ref([]);
const statsData = ref(null);
const fragments = ref(0);
const filterSlot = ref('all');
const selectedEquipment = ref(null);
const showCraftPanel = ref(false);
const actionLoading = ref(false);

// ---- 打造动画状态 ----
const craftPhase = ref(null);        // null | 'forging' | 'result'
const craftedEquipment = ref(null);  // 打造出的装备
const forgeProgress = ref(0);        // 进度 0~100
const forgeText = ref('正在锻造...');
const forgeIsRare = ref(false);      // 打造结果是否稀有（控制动画颜色）
const lastCraftSlot = ref(null);     // 上次打造的槽位

/** 判断已打造装备是否稀有（有蓝字） */
const isCraftedRare = computed(() =>
  !!(craftedEquipment.value?.blueSkill || craftedEquipment.value?.blueEffect)
);

// ---- 配置 ----
const slotConfig = [
  { key: 'head', icon: '🪖', label: '头部' },
  { key: 'weapon', icon: '⚔️', label: '武器' },
  { key: 'armor', icon: '🛡️', label: '护甲' },
  { key: 'accessory', icon: '💍', label: '饰品' },
  { key: 'legs', icon: '🦿', label: '腿部' },
  { key: 'boots', icon: '👢', label: '鞋子' },
];

const slotLabelMap = Object.fromEntries(slotConfig.map((s) => [s.key, s.label]));
const slotIconMap = Object.fromEntries(slotConfig.map((s) => [s.key, s.icon]));

const STAT_LABELS = {
  hp: '生命', mp: '法力', pAtk: '物攻', mAtk: '法攻',
  pDef: '物防', mDef: '法防', spd: '速度', critRate: '暴击率', healBonus: '治疗',
};

const GREEN_LABELS = {
  constitution: '体质', strength: '力量', magic: '魔力',
  endurance: '耐力', agility: '敏捷',
};

const statLabel = (type) => STAT_LABELS[type] || type;
const greenLabel = (type) => GREEN_LABELS[type] || type;
const isPercent = (type) => type === 'critRate' || type === 'healBonus';

// ---- 计算属性 ----
const equippedMap = computed(() => {
  const map = {};
  for (const eq of allEquipments.value) {
    if (eq.isEquipped) {
      map[eq.slot] = eq;
    }
  }
  return map;
});

const equippedCount = computed(() => Object.keys(equippedMap.value).length);

const filteredEquipments = computed(() => {
  if (filterSlot.value === 'all') return allEquipments.value;
  return allEquipments.value.filter((e) => e.slot === filterSlot.value);
});

/** 属性面板展示 */
const displayStats = computed(() => {
  const s = statsData.value?.stats || {};
  return [
    { key: 'hp', icon: '❤️', label: '生命值', value: s.hp || 0, suffix: '' },
    { key: 'mp', icon: '💧', label: '法力值', value: s.mp || 0, suffix: '' },
    { key: 'pAtk', icon: '⚔️', label: '物理攻击', value: s.pAtk || 0, suffix: '' },
    { key: 'mAtk', icon: '🔮', label: '法术攻击', value: s.mAtk || 0, suffix: '' },
    { key: 'pDef', icon: '🛡️', label: '物理防御', value: s.pDef || 0, suffix: '' },
    { key: 'mDef', icon: '🔰', label: '法术防御', value: s.mDef || 0, suffix: '' },
    { key: 'spd', icon: '💨', label: '速度', value: s.spd || 0, suffix: '' },
    { key: 'critRate', icon: '⚡', label: '暴击率', value: s.critRate || 0, suffix: '%' },
  ];
});

// ---- API ----
async function fetchAll() {
  try {
    const [equips, stats, userInfo] = await Promise.all([
      request.get('/equipment'),
      request.get('/equipment/stats'),
      request.get('/user/profile'),
    ]);
    allEquipments.value = equips || [];
    statsData.value = stats || { stats: {} };
    fragments.value = userInfo?.equipFragments || 0;
  } catch (e) {
    uiStore.toast(e.message || '加载装备数据失败', 'error');
  }
}

async function doEquip(id) {
  actionLoading.value = true;
  try {
    await request.post('/equipment/equip', { equipmentId: id });
    uiStore.toast('穿戴成功', 'success');
    selectedEquipment.value = null;
    await fetchAll();
  } catch (e) {
    uiStore.toast(e.message || '穿戴失败', 'error');
  } finally {
    actionLoading.value = false;
  }
}

async function doUnequip(id) {
  actionLoading.value = true;
  try {
    await request.post('/equipment/unequip', { equipmentId: id });
    uiStore.toast('已卸下', 'success');
    selectedEquipment.value = null;
    await fetchAll();
  } catch (e) {
    uiStore.toast(e.message || '卸下失败', 'error');
  } finally {
    actionLoading.value = false;
  }
}

async function doDecompose(ids) {
  actionLoading.value = true;
  try {
    const result = await request.post('/equipment/decompose', { equipmentIds: ids });
    uiStore.toast(`分解成功，获得 ${result.fragmentGain} 碎片`, 'success');
    selectedEquipment.value = null;
    fragments.value = result.totalFragments;
    await fetchAll();
  } catch (e) {
    uiStore.toast(e.message || '分解失败', 'error');
  } finally {
    actionLoading.value = false;
  }
}

async function doCraft(slot) {
  actionLoading.value = true;
  lastCraftSlot.value = slot;
  craftPhase.value = 'forging';
  forgeIsRare.value = false;
  forgeText.value = '熔炼碎片中...';

  // 快节奏锻造文字 (总计约 2 秒)
  const forgeSteps = [
    { at: 500,  text: '注入灵力...' },
    { at: 1000, text: '锤炼成型...' },
    { at: 1500, text: '最终淬炼!' },
  ];

  const timers = forgeSteps.map((step) =>
    setTimeout(() => { forgeText.value = step.text; }, step.at)
  );

  try {
    // 同时发起请求和播动画
    const [result] = await Promise.all([
      request.post('/equipment/craft', { slot }),
      new Promise((r) => setTimeout(r, 1800)),
    ]);

    timers.forEach(clearTimeout);

    // 如果出蓝字，最后阶段切成蓝色特效
    const isRare = !!(result.equipment.blueSkill || result.equipment.blueEffect);
    if (isRare) {
      forgeIsRare.value = true;
      forgeText.value = '✦ 稀有品质!';
      await new Promise((r) => setTimeout(r, 600));
    } else {
      forgeText.value = '打造完成！';
      await new Promise((r) => setTimeout(r, 300));
    }

    // 切换到结果展示
    craftedEquipment.value = result.equipment;
    fragments.value = result.remainingFragments;
    craftPhase.value = 'result';
    await fetchAll();
  } catch (e) {
    timers.forEach(clearTimeout);
    craftPhase.value = null;
    uiStore.toast(e.message || '打造失败', 'error');
  } finally {
    actionLoading.value = false;
  }
}

/** 打造后立即穿戴 */
async function doEquipCrafted() {
  if (!craftedEquipment.value) return;
  actionLoading.value = true;
  try {
    await request.post('/equipment/equip', { equipmentId: craftedEquipment.value.id });
    uiStore.toast('穿戴成功', 'success');
    closeCraftResult();
    await fetchAll();
  } catch (e) {
    uiStore.toast(e.message || '穿戴失败', 'error');
  } finally {
    actionLoading.value = false;
  }
}

function closeCraftResult() {
  craftPhase.value = null;
  craftedEquipment.value = null;
  showCraftPanel.value = false;
}

// ---- 交互 ----
const handleSlotClick = (slot) => {
  const eq = equippedMap.value[slot];
  if (eq) {
    selectedEquipment.value = eq;
  } else {
    filterSlot.value = slot;
    // 滚动到背包区域
    const bagEl = document.querySelector('.bag-section');
    if (bagEl) bagEl.scrollIntoView({ behavior: 'smooth' });
  }
};

const handleEquipmentClick = (eq) => {
  selectedEquipment.value = eq;
};

onMounted(fetchAll);
</script>

<style lang="scss" scoped>
.equipment-page {
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
  color: $text-primary;
}

.header-frag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: $bg-card;
  border-radius: $radius-full;
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all $transition-normal;

  &:active {
    transform: scale(0.95);
  }
}

.frag-icon { font-size: 14px; }
.frag-count {
  font-size: 13px;
  font-weight: 700;
  color: $color-primary;
}

// ========== 内容区 ==========
.equipment-content {
  padding: 16px;
}

// ========== 角色区域 ==========
.character-area {
  position: relative;
  height: 320px;
  margin-bottom: 20px;
}

.character-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba($color-primary, 0.15) 0%, transparent 70%);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}

.character-model {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
}

.character-icon {
  font-size: 56px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
}

.character-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
}

// ========== 装备槽位 ==========
.slot {
  position: absolute;
  width: 68px;
  height: 68px;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 2px dashed rgba($color-primary, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-normal;
  box-shadow: $shadow-sm;

  &:active {
    transform: scale(0.93);
    border-color: $color-primary;
  }

  &--filled {
    border-style: solid;
    border-color: rgba($color-primary, 0.5);
    background: linear-gradient(135deg, rgba($color-primary, 0.08), rgba($color-accent, 0.05));
  }
}

.slot-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.slot-icon {
  font-size: 22px;
}

.slot--filled .slot-icon {
  opacity: 1;
}

.slot-name {
  font-size: 10px;
  color: $text-tertiary;
  font-weight: 500;
}

.slot-equipped-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $color-success;
  border: 2px solid $bg-main;
}

.slot-empty-hint {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: $bg-elevated;
  border: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: $text-tertiary;
  font-weight: 700;
}

// 各槽位布局位置
.slot-head     { top: 10px;  left: 50%; transform: translateX(-50%); }
.slot-weapon   { top: 80px;  left: 12%; }
.slot-armor    { top: 80px;  right: 12%; }
.slot-accessory { top: 180px; left: 12%; }
.slot-legs     { top: 180px; right: 12%; }
.slot-boots    { bottom: 10px; left: 50%; transform: translateX(-50%); }

// ========== 属性加成 ==========
.stats-preview {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16px;
  border: 1px solid $border-color;
  margin-bottom: 20px;
}

.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.equipped-count {
  font-size: 12px;
  color: $text-tertiary;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: $bg-main;
  border-radius: $radius-sm;
}

.stat-label {
  font-size: 12px;
  color: $text-secondary;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: $color-success;
}

.stat-zero {
  color: $text-tertiary;
}

// ========== 背包区域 ==========
.bag-section {
  margin-top: 4px;
}

.bag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bag-title {
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
}

.bag-count {
  font-size: 12px;
  color: $text-tertiary;
}

// ---- 槽位 Tab ----
.slot-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}

.slot-tab {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 7px 12px;
  background: $bg-card;
  border-radius: $radius-full;
  border: 1px solid $border-color;
  font-size: 12px;
  font-weight: 500;
  color: $text-secondary;
  white-space: nowrap;
  cursor: pointer;
  transition: all $transition-normal;
  flex-shrink: 0;

  &.active {
    background: linear-gradient(135deg, rgba($color-primary, 0.12), rgba($color-accent, 0.08));
    border-color: rgba($color-primary, 0.4);
    color: $color-primary;
    font-weight: 600;
  }

  &:active {
    transform: scale(0.95);
  }
}

// ---- 装备列表 ----
.equip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ---- 空状态 ----
.empty-bag {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: $text-secondary;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  color: $text-tertiary;
}

// ========== 弹窗通用 ==========
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: $z-modal;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-panel {
  background: $bg-elevated;
  border-radius: $radius-xl $radius-xl 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;

  &.title-blue {
    color: #4A90D9;
  }
}

.modal-close {
  font-size: 18px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $bg-main;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-tertiary;
  cursor: pointer;
}

// ---- 详情弹窗 ----
.modal-body {
  margin-bottom: 16px;
}

.detail-slot {
  display: inline-block;
  padding: 3px 10px;
  background: rgba($color-primary, 0.1);
  border-radius: $radius-full;
  font-size: 12px;
  color: $color-primary;
  font-weight: 600;
  margin-bottom: 14px;
}

.detail-section {
  margin-bottom: 14px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;

  &.section-green { color: #27AE60; }
  &.section-blue { color: #4A90D9; }
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: $bg-main;
  border-radius: $radius-sm;
  font-size: 13px;
  color: $text-primary;

  &.green-line {
    color: #27AE60;
  }
}

.stat-val {
  font-weight: 700;
  color: $color-success;

  &.green-val { color: #27AE60; }
}

// ---- 蓝字详情 ----
.blue-detail {
  padding: 10px 12px;
  background: rgba(74, 144, 217, 0.05);
  border-radius: $radius-sm;
  border-left: 3px solid #4A90D9;
  margin-bottom: 8px;
}

.blue-tag {
  font-size: 10px;
  font-weight: 700;
  color: white;
  background: #4A90D9;
  padding: 2px 6px;
  border-radius: $radius-sm;
  margin-right: 6px;

  &--effect {
    background: #8E44AD;
  }
}

.blue-name {
  font-size: 14px;
  font-weight: 600;
  color: #4A90D9;
}

.blue-desc {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
  line-height: 1.5;
}

// ---- 操作按钮 ----
.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  flex: 1;
  padding: 12px;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-normal;

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.97);
  }
}

.btn-equip {
  background: linear-gradient(135deg, $color-primary, $color-accent);
  color: white;
}

.btn-unequip {
  background: $bg-main;
  color: $text-primary;
  border: 1px solid $border-color;
}

.btn-decompose {
  background: rgba($color-warning, 0.1);
  color: $color-warning;
  border: 1px solid rgba($color-warning, 0.3);
}

// ========== 打造面板 ==========
.craft-panel {
  text-align: center;
  overflow: hidden;
}

.craft-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.craft-frag-icon { font-size: 28px; }
.craft-frag-count {
  font-size: 28px;
  font-weight: 800;
  color: $color-primary;
}
.craft-frag-label {
  font-size: 14px;
  color: $text-tertiary;
}

.craft-cost-hint {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 20px;

  strong {
    color: $color-primary;
    font-weight: 800;
  }
}

.craft-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.craft-slot-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  background: $bg-main;
  border-radius: $radius-lg;
  border: 1.5px solid $border-color;
  cursor: pointer;
  transition: all $transition-normal;

  &:not(:disabled):hover {
    border-color: rgba($color-primary, 0.4);
    background: rgba($color-primary, 0.04);
  }

  &:not(:disabled):active {
    transform: scale(0.93);
    border-color: $color-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.craft-slot-icon { font-size: 28px; }
.craft-slot-label {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
}
.craft-slot-cost {
  font-size: 10px;
  color: $text-tertiary;
  margin-top: 2px;
}

// ========== 打造动画场景 ==========
.forge-scene {
  position: relative;
  height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.forge-anvil {
  font-size: 64px;
  position: relative;
  z-index: 2;
  animation: anvil-pulse 0.6s ease-in-out infinite;
}

@keyframes anvil-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.forge-hammer {
  font-size: 48px;
  position: absolute;
  top: 50px;
  right: 30%;
  z-index: 3;
  transform-origin: bottom right;
  animation: hammer-strike 0.6s ease-in-out infinite;
}

@keyframes hammer-strike {
  0% { transform: rotate(0deg) translate(0, 0); }
  40% { transform: rotate(-35deg) translate(-10px, -20px); }
  55% { transform: rotate(5deg) translate(5px, 5px); }
  70% { transform: rotate(0deg) translate(0, 0); }
  100% { transform: rotate(0deg) translate(0, 0); }
}

.forge-sparks {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 4;
}

.spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #FFD700;
  box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.6);
  animation: spark-fly 0.6s ease-out infinite;
  animation-delay: calc(var(--i) * 0.05s);
}

@keyframes spark-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform:
      translate(
        calc((var(--i) - 6) * 18px),
        calc((var(--i) * 7 - 40) * 1px)
      )
      scale(0);
    opacity: 0;
  }
}

.forge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 165, 0, 0.25) 0%, transparent 70%);
  animation: glow-pulse 1.2s ease-in-out infinite;
  z-index: 1;
}

@keyframes glow-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.forge-text {
  position: relative;
  z-index: 5;
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
  margin-top: 20px;
  letter-spacing: 1px;
}

.forge-progress {
  width: 200px;
  height: 6px;
  background: rgba($border-color, 0.5);
  border-radius: 3px;
  margin-top: 14px;
  overflow: hidden;
  position: relative;
  z-index: 5;
}

.forge-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #FF8C00, #FFD700);
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  animation: progress-fill 1.8s ease-out forwards;
}

@keyframes progress-fill {
  from { width: 0%; }
  to { width: 100%; }
}

// ---- 稀有变体（蓝色特效） ----
.forge-scene--rare {
  .spark {
    background: #4A90D9;
    box-shadow: 0 0 8px 3px rgba(74, 144, 217, 0.7);
  }

  .forge-glow {
    background: radial-gradient(circle, rgba(74, 144, 217, 0.3) 0%, rgba(142, 68, 173, 0.15) 40%, transparent 70%);
  }

  .forge-progress-bar {
    background: linear-gradient(90deg, #4A90D9, #A855F7);
    box-shadow: 0 0 10px rgba(74, 144, 217, 0.6);
  }

  .forge-text {
    color: #4A90D9;
  }
}

// ========== 打造结果展示 ==========
.craft-result {
  position: relative;
  padding: 10px 0;
  animation: resultFadeIn 0.5s ease;
}

@keyframes resultFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.result-burst {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  animation: burst-expand 1s ease-out;
  pointer-events: none;
}

@keyframes burst-expand {
  from { transform: translateX(-50%) scale(0); opacity: 1; }
  to { transform: translateX(-50%) scale(2); opacity: 0; }
}

.result-header {
  margin-bottom: 16px;
}

.result-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #5D3400;
  font-size: 16px;
  font-weight: 800;
  padding: 6px 24px;
  border-radius: $radius-full;
  letter-spacing: 2px;
  box-shadow: 0 4px 16px rgba(255, 165, 0, 0.3);
  animation: badge-bounce 0.6s ease;

  &--rare {
    background: linear-gradient(135deg, #4A90D9, #A855F7);
    color: white;
    box-shadow: 0 4px 20px rgba(74, 144, 217, 0.4);
  }
}

.result-burst--rare {
  background: radial-gradient(circle, rgba(74, 144, 217, 0.2) 0%, rgba(142, 68, 173, 0.1) 40%, transparent 70%);
}

@keyframes badge-bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.result-card {
  background: $bg-main;
  border-radius: $radius-lg;
  padding: 20px;
  border: 2px solid $border-color;
  margin-bottom: 16px;
  text-align: center;
  animation: card-slide-up 0.5s ease 0.2s both;

  &--blue {
    border-color: rgba(74, 144, 217, 0.4);
    background: linear-gradient(135deg, rgba(74, 144, 217, 0.04), rgba(142, 68, 173, 0.03));
  }
}

@keyframes card-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-card__icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: icon-pop 0.4s ease 0.4s both;
}

@keyframes icon-pop {
  from { transform: scale(0) rotate(-15deg); }
  to { transform: scale(1) rotate(0deg); }
}

.result-card__name {
  font-size: 20px;
  font-weight: 800;
  color: $text-primary;
  margin-bottom: 6px;

  &.name--blue {
    color: #4A90D9;
  }
}

.result-card__slot-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 2px 10px;
  border-radius: $radius-full;
  margin-bottom: 14px;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.result-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: rgba($bg-elevated, 0.6);
  border-radius: $radius-sm;
  font-size: 13px;
  color: $text-primary;
  animation: stat-fade 0.3s ease calc(0.5s + var(--idx, 0) * 0.1s) both;

  &.green-line { color: #27AE60; }
}

@keyframes stat-fade {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.result-stat-val {
  font-weight: 700;
  color: $color-success;

  &.green-val { color: #27AE60; }
}

.result-green { border-top: 1px dashed rgba(39, 174, 96, 0.2); padding-top: 10px; }
.result-blue { border-top: 1px dashed rgba(74, 144, 217, 0.2); padding-top: 10px; }

.result-blue-item {
  text-align: left;
  padding: 8px 12px;
  background: rgba(74, 144, 217, 0.05);
  border-radius: $radius-sm;
  border-left: 3px solid #4A90D9;
  margin-bottom: 6px;
  animation: stat-fade 0.3s ease 0.7s both;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-craft-again {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background: rgba(212, 165, 116, 0.1);
  border: 1.5px solid rgba(212, 165, 116, 0.3);
  border-radius: $radius-md;
  font-size: 13px;
  font-weight: 600;
  color: #D4A574;
  cursor: pointer;
  transition: all $transition-normal;

  &:not(:disabled):active {
    transform: scale(0.97);
    border-color: rgba(212, 165, 116, 0.6);
    background: rgba(212, 165, 116, 0.15);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.result-frag-hint {
  font-size: 12px;
  color: $text-tertiary;
}

// ========== 打造入口 Banner ==========
.craft-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(212, 165, 116, 0.12), rgba(255, 165, 0, 0.08));
  border: 1.5px solid rgba(212, 165, 116, 0.3);
  border-radius: $radius-lg;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all $transition-normal;

  &:active {
    transform: scale(0.98);
    border-color: rgba(212, 165, 116, 0.6);
  }
}

.craft-banner__icon {
  font-size: 32px;
  animation: bounce-icon 2s ease-in-out infinite;
}

@keyframes bounce-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.craft-banner__body {
  flex: 1;
  min-width: 0;
}

.craft-banner__title {
  font-size: 15px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 2px;
}

.craft-banner__desc {
  font-size: 11px;
  color: $text-tertiary;
}

.craft-banner__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.craft-banner__frag {
  font-size: 14px;
  font-weight: 700;
  color: $color-primary;
}

.craft-banner__btn {
  font-size: 11px;
  font-weight: 600;
  color: #D4A574;
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
