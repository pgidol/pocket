<template>
  <div class="admin-pools">
    <!-- 1. 卡池头部控制条 -->
    <el-card class="action-card" shadow="always">
      <div class="action-header">
        <span class="header-title">🎰 全服限定与常驻卡池配置</span>
        <el-button type="success" @click="openCreateDialog">✨ 新建卡池</el-button>
      </div>
    </el-card>

    <!-- 2. 数据表格区 -->
    <el-card class="table-card" shadow="always">
      <el-table :data="poolsList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="卡池名称" width="180" />

        <el-table-column prop="type" label="卡池类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'limited' ? 'warning' : 'info'" effect="dark">
              {{ row.type === 'limited' ? '限定 UP 池' : '常驻池' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="UP 加成角色" min-width="250">
          <template #default="{ row }">
            <div v-if="row.upCards && row.upCards.length > 0" class="up-tags">
              <el-tag
                v-for="card in row.upCards"
                :key="card.id"
                size="small"
                :class="['up-card-tag', `rarity-${card.rarity.toLowerCase()}`]"
              >
                {{ card.name }} ({{ card.rarity }})
              </el-tag>
            </div>
            <span v-else class="text-muted">无 UP 角色</span>
          </template>
        </el-table-column>

        <el-table-column label="起止时间" width="280">
          <template #default="{ row }">
            <div v-if="row.startTime || row.endTime" class="time-range">
              <div>起: {{ formatDate(row.startTime) }}</div>
              <div>止: {{ formatDate(row.endTime) }}</div>
            </div>
            <span v-else>永久有效</span>
          </template>
        </el-table-column>

        <el-table-column prop="isActive" label="是否激活" width="120">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              active-text="启用"
              inactive-text="禁用"
              inline-prompt
              @change="toggleActive(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 卡池配置表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑卡池配置' : '创建抽卡池'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="poolFormRef"
        :model="poolForm"
        :rules="poolRules"
        label-position="right"
        label-width="100px"
      >
        <el-form-item label="卡池名称" prop="name">
          <el-input v-model="poolForm.name" placeholder="如：命运之轮、天界初耀限定池" />
        </el-form-item>

        <el-form-item label="卡池类型" prop="type">
          <el-radio-group v-model="poolForm.type">
            <el-radio label="standard">常驻卡池 (standard)</el-radio>
            <el-radio label="limited">限定 UP 卡池 (limited)</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 只有限定池支持配置 UP 角色 -->
        <el-form-item
          v-if="poolForm.type === 'limited'"
          label="UP 加成角色"
          prop="upCards"
        >
          <el-select
            v-model="poolForm.upCards"
            multiple
            filterable
            placeholder="请多选卡牌指派为 UP 角色"
            style="width: 100%;"
          >
            <el-option
              v-for="card in allAvailableCards"
              :key="card.id"
              :label="`[${card.rarity}] ${card.name} - ${getFactionText(card.series)}`"
              :value="card.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="活动时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            style="width: 100%;"
            @change="handleTimeRangeChange"
          />
          <div class="time-tip">不设置时间范围则默认该卡池永久开启。</div>
        </el-form-item>

        <el-form-item label="默认启用" prop="isActive">
          <el-switch v-model="poolForm.isActive" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitPoolForm">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

import request from '../../../services/request.js';

const loading = ref(false);
const submitLoading = ref(false);
const poolsList = ref([]);
const allAvailableCards = ref([]); // 用来在多选框中列出的所有卡牌

// 弹窗表单状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const poolFormRef = ref(null);
const currentPoolId = ref(null);
const timeRange = ref([]);

const poolForm = reactive({
  name: '',
  type: 'standard',
  upCards: [],
  startTime: null,
  endTime: null,
  isActive: true,
});

const poolRules = {
  name: [{ required: true, message: '卡池名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '请选择卡池类型', trigger: 'change' }],
};

const getFactionText = (series) => {
  const map = { celestial: '天界', demon: '魔界', mortal: '人间' };
  return map[series] || '未知';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化日期选择器数据
 */
const handleTimeRangeChange = (val) => {
  if (val && val.length === 2) {
    poolForm.startTime = val[0];
    poolForm.endTime = val[1];
  } else {
    poolForm.startTime = null;
    poolForm.endTime = null;
  }
};

/**
 * 获取所有卡池
 */
const fetchPools = async () => {
  loading.value = true;
  try {
    const data = await request.get('/admin/pools');
    poolsList.value = data;
  } catch (error) {
    ElMessage.error(error.message || '获取卡池配置失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 获取所有可用卡牌（用于 UP 多选字典）
 */
const fetchAvailableCards = async () => {
  try {
    // 拉取所有卡牌（且只拉取未下架的卡牌进行分配）
    const res = await request.get('/admin/cards', {
      params: { page: 1, limit: 150, includeDeleted: 'false' },
    });
    allAvailableCards.value = res.list;
  } catch (error) {
    console.error('拉取卡牌字典失败:', error);
  }
};

/**
 * 切换启用/禁用状态
 */
const toggleActive = async (row) => {
  try {
    await request.put(`/admin/pools/${row.id}`, {
      isActive: row.isActive,
    });
    ElMessage.success(`卡池 [${row.name}] 状态已更新为：${row.isActive ? '开启' : '关闭'}`);
  } catch (error) {
    row.isActive = !row.isActive; // 失败则恢复 UI 开关状态
    ElMessage.error(error.message || '状态切换失败');
  }
};

/**
 * 打开新建卡池
 */
const openCreateDialog = () => {
  isEdit.value = false;
  currentPoolId.value = null;
  poolForm.name = '';
  poolForm.type = 'standard';
  poolForm.upCards = [];
  poolForm.startTime = null;
  poolForm.endTime = null;
  poolForm.isActive = true;
  timeRange.value = [];
  dialogVisible.value = true;
};

/**
 * 打开编辑卡池
 */
const openEditDialog = (row) => {
  isEdit.value = true;
  currentPoolId.value = row.id;
  poolForm.name = row.name;
  poolForm.type = row.type;
  poolForm.upCards = row.upCards ? row.upCards.map((c) => c.id) : [];
  poolForm.startTime = row.startTime;
  poolForm.endTime = row.endTime;
  poolForm.isActive = row.isActive;

  if (row.startTime && row.endTime) {
    timeRange.value = [row.startTime, row.endTime];
  } else {
    timeRange.value = [];
  }
  dialogVisible.value = true;
};

/**
 * 保存卡池数据
 */
const submitPoolForm = async () => {
  if (!poolFormRef.value) return;

  await poolFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;

    // 清洗数据：如果是常驻池，清空 UP 卡牌设置
    const submitData = { ...poolForm };
    if (submitData.type === 'standard') {
      submitData.upCards = [];
    }

    try {
      if (isEdit.value) {
        await request.put(`/admin/pools/${currentPoolId.value}`, submitData);
        ElMessage.success('卡池配置更新成功！');
      } else {
        await request.post('/admin/pools', submitData);
        ElMessage.success('卡池配置创建成功！');
      }
      dialogVisible.value = false;
      fetchPools();
    } catch (error) {
      ElMessage.error(error.message || '保存失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

/**
 * 物理删除卡池
 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`您确定要永久删除卡池 [${row.name}] 吗？\n该操作无法撤销！`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await request.delete(`/admin/pools/${row.id}`);
      ElMessage.success(`卡池 [${row.name}] 已成功删除！`);
      fetchPools();
    } catch (error) {
      ElMessage.error(error.message || '删除卡池失败');
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchPools();
  fetchAvailableCards();
});
</script>

<style lang="scss" scoped>
.admin-pools {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.table-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

// UP卡牌标识
.up-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.up-card-tag {
  color: white !important;
  font-weight: 600;
  border: none;

  &.rarity-n { background: linear-gradient(135deg, #B0B0B0, #8C8C8C); }
  &.rarity-r { background: linear-gradient(135deg, #5B9BD5, #41719C); }
  &.rarity-sr { background: linear-gradient(135deg, #9B59B6, #7030A0); }
  &.rarity-ssr { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &.rarity-ur { background: linear-gradient(135deg, #EC4899, #BE185D); }
}

.time-range {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.time-tip {
  font-size: 11px;
  color: #909399;
  margin-top: 5px;
}

.text-muted {
  font-size: 13px;
  color: #909399;
}
</style>
