<template>
  <div class="admin-dashboard">
    <!-- 1. 顶部统计数据卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #default>
            <div class="stat-content">
              <div class="stat-title">全服总玩家数</div>
              <div class="stat-number">{{ stats.totalUsers || 0 }} 人</div>
              <div class="stat-footer">仅限普通玩家账号</div>
            </div>
            <div class="stat-icon icon-users">👥</div>
          </template>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #default>
            <div class="stat-content">
              <div class="stat-title">全服总抽卡数</div>
              <div class="stat-number">{{ stats.totalPulls || 0 }} 次</div>
              <div class="stat-footer">所有玩家抽选累计</div>
            </div>
            <div class="stat-icon icon-pulls">🎰</div>
          </template>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #default>
            <div class="stat-content">
              <div class="stat-title">全服流通金币</div>
              <div class="stat-number">{{ formatNumber(stats.totalGold) }}</div>
              <div class="stat-footer">总金币保有量</div>
            </div>
            <div class="stat-icon icon-gold">💰</div>
          </template>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #default>
            <div class="stat-content">
              <div class="stat-title">全服流通钻石</div>
              <div class="stat-number">{{ formatNumber(stats.totalDiamond) }}</div>
              <div class="stat-footer">总钻石保有量</div>
            </div>
            <div class="stat-icon icon-diamond">💎</div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 全服抽卡爆率实时对照表 -->
    <el-card class="rate-monitor-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span class="header-title">📊 全服爆率实时对照监控</span>
          <el-button type="primary" size="small" @click="fetchStats">刷新数据</el-button>
        </div>
      </template>

      <el-table :data="stats.rates" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="rarity" label="稀有度" width="120">
          <template #default="{ row }">
            <span :class="['rarity-badge', `rarity-${row.rarity.toLowerCase()}`]">
              {{ row.rarity }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="theoreticalRate" label="系统理论爆率" width="180">
          <template #default="{ row }">
            <strong>{{ row.theoreticalRate }}%</strong>
          </template>
        </el-table-column>

        <el-table-column prop="count" label="实际抽出数量" width="180">
          <template #default="{ row }">
            {{ row.count }} 张
          </template>
        </el-table-column>

        <el-table-column prop="actualRate" label="全服真实爆率" width="180">
          <template #default="{ row }">
            <span class="actual-rate-text">{{ row.actualRate }}%</span>
          </template>
        </el-table-column>

        <el-table-column label="爆率偏差度">
          <template #default="{ row }">
            <span :class="getDeviationClass(row.actualRate, row.theoreticalRate)">
              {{ getDeviationLabel(row.actualRate, row.theoreticalRate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div class="rate-tips">
        <p>💡 <b>关于爆率偏差：</b>全服真实抽卡次数越多，实际爆率就越逼近系统设定的理论值。小范围的随机波动（±0.5%以内）属于大数定律下的正常科学波动，若出现异常大偏差请检查抽卡权重算法。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

import request from '../../../services/request.js';

const loading = ref(false);
const stats = ref({
  totalUsers: 0,
  totalPulls: 0,
  totalGold: 0,
  totalDiamond: 0,
  rates: [],
});

/**
 * 格式化大数值展示
 */
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + ' M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' K';
  }
  return num.toString();
};

/**
 * 计算偏差百分比
 */
const getDeviationLabel = (actual, theoretical) => {
  if (stats.value.totalPulls === 0) return '0.00% (数据不足)';
  const dev = actual - theoretical;
  const prefix = dev > 0 ? '+' : '';
  return `${prefix}${dev.toFixed(2)}%`;
};

/**
 * 获取偏差等级样式类
 */
const getDeviationClass = (actual, theoretical) => {
  if (stats.value.totalPulls === 0) return 'dev-neutral';
  const dev = Math.abs(actual - theoretical);
  if (dev < 0.2) return 'dev-perfect';
  if (dev < 0.5) return 'dev-good';
  return 'dev-warning';
};

/**
 * 获取看板数据
 */
const fetchStats = async () => {
  loading.value = true;
  try {
    const data = await request.get('/admin/stats');
    stats.value = data;
  } catch (error) {
    ElMessage.error(error.message || '获取全服数据统计失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style lang="scss" scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ========== 统计卡片样式 ==========
.stat-cards {
  margin-bottom: 5px;
}

.stat-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  height: 120px;
  border: 1px solid #e4e7ed;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: 16px 20px;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.stat-title {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 6px 0;
}

.stat-footer {
  font-size: 11px;
  color: #a8abb2;
}

.stat-icon {
  font-size: 40px;
  opacity: 0.85;
}

// ========== 爆率表格卡片 ==========
.rate-monitor-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

// 稀有度色彩徽章
.rarity-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-align: center;
  width: 32px;

  &.rarity-n { background: linear-gradient(135deg, #B0B0B0, #8C8C8C); }
  &.rarity-r { background: linear-gradient(135deg, #5B9BD5, #41719C); }
  &.rarity-sr { background: linear-gradient(135deg, #9B59B6, #7030A0); }
  &.rarity-ssr { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &.rarity-ur { background: linear-gradient(135deg, #EC4899, #BE185D); }
}

.actual-rate-text {
  font-weight: 600;
  color: #303133;
}

// 爆率偏差样式
.dev-perfect {
  color: #67c23a;
  font-weight: 600;
  &::before { content: '🟢 '; }
}

.dev-good {
  color: #409eff;
  font-weight: 600;
  &::before { content: '🔵 '; }
}

.dev-neutral {
  color: #909399;
}

.dev-warning {
  color: #e6a23c;
  font-weight: 600;
  &::before { content: '🟡 '; }
}

.rate-tips {
  margin-top: 20px;
  background-color: #f4f4f5;
  border-left: 4px solid #909399;
  padding: 10px 16px;
  border-radius: 4px;

  p {
    margin: 0;
    font-size: 12px;
    color: #606266;
    line-height: 1.6;
  }
}
</style>
