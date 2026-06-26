<template>
  <div
    class="equip-card"
    :class="{ 'equip-card--equipped': equipment.isEquipped, 'equip-card--selected': selected }"
    @click="$emit('click', equipment)"
  >
    <!-- 左侧：槽位图标 -->
    <div class="equip-card__icon">
      <span class="equip-card__emoji">{{ slotIcon }}</span>
      <span v-if="hasBlue" class="equip-card__blue-dot" title="蓝字装备">✦</span>
    </div>

    <!-- 中间：装备信息 -->
    <div class="equip-card__body">
      <div class="equip-card__header">
        <span class="equip-card__name" :class="{ 'name--blue': hasBlue }">{{ equipment.name }}</span>
        <span v-if="equipment.isEquipped" class="equip-card__equipped-tag">已装备</span>
      </div>

      <!-- 主属性 -->
      <div class="equip-card__primary">
        <span class="primary-stat">
          {{ statLabel(equipment.primaryStat1.type) }} +{{ equipment.primaryStat1.value }}{{ isPercent(equipment.primaryStat1.type) ? '%' : '' }}
        </span>
        <span class="primary-stat">
          {{ statLabel(equipment.primaryStat2.type) }} +{{ equipment.primaryStat2.value }}{{ isPercent(equipment.primaryStat2.type) ? '%' : '' }}
        </span>
      </div>

      <!-- 绿字属性 -->
      <div v-if="equipment.greenStats && equipment.greenStats.length > 0" class="equip-card__green">
        <span
          v-for="(gs, idx) in equipment.greenStats"
          :key="idx"
          class="green-stat"
        >
          {{ greenLabel(gs.type) }} +{{ gs.value }}
        </span>
      </div>

      <!-- 蓝字特技/特效 -->
      <div v-if="hasBlue" class="equip-card__blue">
        <span v-if="equipment.blueSkill" class="blue-attr blue-skill" :title="equipment.blueSkill.description">
          特技：{{ equipment.blueSkill.name }}
        </span>
        <span v-if="equipment.blueEffect" class="blue-attr blue-effect" :title="equipment.blueEffect.description">
          特效：{{ equipment.blueEffect.name }}
        </span>
      </div>
    </div>

    <!-- 右侧：槽位标签 -->
    <div class="equip-card__slot">
      <span class="slot-label">{{ slotLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { EQUIPMENT_SLOTS } from '../../utils/constants.js';

const props = defineProps({
  equipment: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['click']);

const slotIcon = computed(() => EQUIPMENT_SLOTS[props.equipment.slot]?.icon || '📦');
const slotLabel = computed(() => EQUIPMENT_SLOTS[props.equipment.slot]?.label || '未知');

const hasBlue = computed(() => !!(props.equipment.blueSkill || props.equipment.blueEffect));

/** 主属性中文标签 */
const STAT_LABELS = {
  hp: '生命', mp: '法力',
  pAtk: '物攻', mAtk: '法攻',
  pDef: '物防', mDef: '法防',
  spd: '速度', critRate: '暴击率', healBonus: '治疗',
};

const statLabel = (type) => STAT_LABELS[type] || type;
const isPercent = (type) => type === 'critRate' || type === 'healBonus';

/** 绿字五维中文标签 */
const GREEN_LABELS = {
  constitution: '体质', strength: '力量', magic: '魔力',
  endurance: '耐力', agility: '敏捷',
};

const greenLabel = (type) => GREEN_LABELS[type] || type;
</script>

<style lang="scss" scoped>
.equip-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: $bg-card;
  border-radius: $radius-md;
  border: 1.5px solid $border-color;
  transition: all $transition-normal;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }

  &--equipped {
    border-color: rgba($color-primary, 0.35);
    background: linear-gradient(135deg, rgba($color-primary, 0.04), rgba($color-accent, 0.03));
  }

  &--selected {
    border-color: $color-warning;
    background: rgba($color-warning, 0.06);
    box-shadow: 0 0 0 1px rgba($color-warning, 0.3);
  }
}

// ---- 图标区域 ----
.equip-card__icon {
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

.equip-card__emoji {
  font-size: 24px;
}

.equip-card__blue-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 14px;
  color: #4A90D9;
  filter: drop-shadow(0 0 3px rgba(74, 144, 217, 0.5));
  animation: blue-shine 2s ease-in-out infinite;
}

@keyframes blue-shine {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

// ---- 装备信息 ----
.equip-card__body {
  flex: 1;
  min-width: 0;
}

.equip-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.equip-card__name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.name--blue {
    color: #4A90D9;
  }
}

.equip-card__equipped-tag {
  font-size: 10px;
  font-weight: 600;
  color: $color-primary-dark;
  background: rgba($color-primary, 0.12);
  padding: 2px 7px;
  border-radius: $radius-full;
  flex-shrink: 0;
}

// ---- 主属性 ----
.equip-card__primary {
  display: flex;
  gap: 10px;
  margin-bottom: 2px;
}

.primary-stat {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
}

// ---- 绿字 ----
.equip-card__green {
  display: flex;
  gap: 8px;
  margin-bottom: 2px;
}

.green-stat {
  font-size: 11px;
  color: #27AE60;
  font-weight: 600;
}

// ---- 蓝字 ----
.equip-card__blue {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.blue-attr {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: $radius-sm;
}

.blue-skill {
  color: #4A90D9;
  background: rgba(74, 144, 217, 0.08);
}

.blue-effect {
  color: #8E44AD;
  background: rgba(142, 68, 173, 0.08);
}

// ---- 槽位标签 ----
.equip-card__slot {
  flex-shrink: 0;
}

.slot-label {
  font-size: 11px;
  color: $text-tertiary;
  font-weight: 500;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}
</style>
