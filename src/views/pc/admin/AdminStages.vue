<template>
  <div class="admin-stages">
    <!-- 1. 过滤检索区 -->
    <el-card class="filter-card" shadow="always">
      <el-form :inline="true" :model="filters" class="demo-form-inline">
        <el-form-item label="名称搜索">
          <el-input v-model="filters.keyword" placeholder="搜索关卡名称..." clearable />
        </el-form-item>

        <el-form-item label="章节">
          <el-select v-model="filters.chapter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="第1章" :value="1" />
            <el-option label="第2章" :value="2" />
            <el-option label="第3章" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="难度">
          <el-select v-model="filters.difficulty" placeholder="全部" clearable style="width: 120px;">
            <el-option label="普通" value="normal" />
            <el-option label="困难" value="hard" />
            <el-option label="地狱" value="hell" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">⚔️ 新建关卡</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 数据表格区 -->
    <el-card class="table-card" shadow="always">
      <el-table :data="stagesList" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="章节-关卡" width="110">
          <template #default="{ row }">
            <span class="stage-num-badge">{{ row.chapter }}-{{ row.stageNum }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="关卡名称" width="180" show-overflow-tooltip />

        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="difficultyTagType(row.difficulty)" size="small">
              {{ difficultyLabel(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="推荐战力" width="110">
          <template #default="{ row }">
            <span class="power-text">⚔️ {{ row.recommendPower }}</span>
          </template>
        </el-table-column>

        <el-table-column label="体力消耗" width="90">
          <template #default="{ row }">
            <span>⚡ {{ row.staminaCost }}</span>
          </template>
        </el-table-column>

        <el-table-column label="奖励" width="200">
          <template #default="{ row }">
            <div class="rewards-row">
              <span class="reward-item">📦 {{ row.rewards?.exp || 0 }} EXP</span>
              <span class="reward-item">💰 {{ row.rewards?.gold || 0 }}</span>
              <span v-if="row.rewards?.diamond" class="reward-item">💎 {{ row.rewards.diamond }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="敌人数量" width="90">
          <template #default="{ row }">
            <span>{{ row.enemies?.length || 0 }} / 5</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />

        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 3. 关卡新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑关卡信息' : '创建新关卡'"
      width="680px"
      destroy-on-close
    >
      <el-form
        ref="stageFormRef"
        :model="stageForm"
        :rules="stageRules"
        label-position="right"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="章节号" prop="chapter">
              <el-input-number v-model="stageForm.chapter" :min="1" :max="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关卡号" prop="stageNum">
              <el-input-number v-model="stageForm.stageNum" :min="1" :max="20" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="关卡名称" prop="name">
          <el-input v-model="stageForm.name" placeholder="请输入关卡名称" />
        </el-form-item>

        <el-form-item label="关卡描述">
          <el-input v-model="stageForm.description" type="textarea" :rows="2" placeholder="请输入关卡描述..." />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="stageForm.difficulty" style="width: 100%;">
                <el-option label="普通" value="normal" />
                <el-option label="困难" value="hard" />
                <el-option label="地狱" value="hell" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推荐战力">
              <el-input-number v-model="stageForm.recommendPower" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="体力消耗">
              <el-input-number v-model="stageForm.staminaCost" :min="1" :max="30" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 通关奖励 -->
        <el-divider content-position="left">通关奖励</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="经验值">
              <el-input-number v-model="stageForm.rewards.exp" :min="0" :step="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="金币">
              <el-input-number v-model="stageForm.rewards.gold" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="钻石">
              <el-input-number v-model="stageForm.rewards.diamond" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 敌方阵容 -->
        <el-divider content-position="left">敌方阵容（最多5个）</el-divider>
        <div class="enemies-section">
          <div v-for="(enemy, index) in stageForm.enemies" :key="index" class="enemy-row">
            <el-select
              v-model="enemy.cardId"
              filterable
              placeholder="选择卡牌"
              style="flex: 1;"
            >
              <el-option
                v-for="card in allCards"
                :key="card.id"
                :label="`${card.name} (${card.rarity})`"
                :value="card.id"
              />
            </el-select>
            <el-input-number v-model="enemy.level" :min="1" :max="60" placeholder="等级" style="width: 120px;" />
            <el-input-number v-model="enemy.stars" :min="0" :max="5" placeholder="星级" style="width: 120px;" />
            <el-button type="danger" :icon="Delete" circle size="small" @click="removeEnemy(index)" />
          </div>
          <el-button
            v-if="stageForm.enemies.length < 5"
            type="primary"
            plain
            size="small"
            @click="addEnemy"
          >
            + 添加敌人
          </el-button>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitStageForm">
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
import { Delete } from '@element-plus/icons-vue';

import request from '../../../services/request.js';

const loading = ref(false);
const submitLoading = ref(false);
const stagesList = ref([]);
const allCards = ref([]);

// 检索过滤器
const filters = reactive({
  keyword: '',
  chapter: '',
  difficulty: '',
});

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

// 表单弹窗控制
const dialogVisible = ref(false);
const isEdit = ref(false);
const stageFormRef = ref(null);
const currentStageId = ref(null);

const createDefaultForm = () => ({
  chapter: 1,
  stageNum: 1,
  name: '',
  description: '',
  difficulty: 'normal',
  recommendPower: 1000,
  staminaCost: 6,
  rewards: { exp: 50, gold: 100, diamond: 0 },
  enemies: [],
});

const stageForm = reactive(createDefaultForm());

const stageRules = {
  chapter: [{ required: true, message: '章节号不能为空', trigger: 'blur' }],
  stageNum: [{ required: true, message: '关卡号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '关卡名称不能为空', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
};

const difficultyLabel = (d) => {
  const map = { normal: '普通', hard: '困难', hell: '地狱' };
  return map[d] || d;
};

const difficultyTagType = (d) => {
  const map = { normal: 'success', hard: 'warning', hell: 'danger' };
  return map[d] || '';
};

/**
 * 获取关卡列表
 */
const fetchStages = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/stages', {
      params: {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    stagesList.value = res.list;
    pagination.total = res.total;
  } catch (error) {
    ElMessage.error(error.message || '获取关卡列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 获取所有卡牌（用于敌方阵容下拉选择）
 */
const fetchAllCards = async () => {
  try {
    const res = await request.get('/admin/cards', {
      params: { limit: 200, includeDeleted: 'false' },
    });
    allCards.value = res.list || [];
  } catch {
    // 静默处理
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchStages();
};

const resetFilters = () => {
  filters.keyword = '';
  filters.chapter = '';
  filters.difficulty = '';
  pagination.page = 1;
  fetchStages();
};

const handleSizeChange = (size) => {
  pagination.limit = size;
  fetchStages();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  fetchStages();
};

/**
 * 重置表单
 */
const resetForm = () => {
  const defaults = createDefaultForm();
  Object.assign(stageForm, defaults);
};

const openCreateDialog = () => {
  isEdit.value = false;
  currentStageId.value = null;
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  isEdit.value = true;
  currentStageId.value = row.id;
  stageForm.chapter = row.chapter;
  stageForm.stageNum = row.stageNum;
  stageForm.name = row.name;
  stageForm.description = row.description || '';
  stageForm.difficulty = row.difficulty;
  stageForm.recommendPower = row.recommendPower;
  stageForm.staminaCost = row.staminaCost;
  stageForm.rewards = { ...row.rewards };
  stageForm.enemies = (row.enemies || []).map((e) => ({
    cardId: e.cardId?.id || e.cardId,
    level: e.level || 1,
    stars: e.stars || 0,
  }));
  dialogVisible.value = true;
};

const addEnemy = () => {
  if (stageForm.enemies.length < 5) {
    stageForm.enemies.push({ cardId: '', level: 1, stars: 0 });
  }
};

const removeEnemy = (index) => {
  stageForm.enemies.splice(index, 1);
};

const submitStageForm = async () => {
  if (!stageFormRef.value) return;

  await stageFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;

    try {
      // 过滤掉未选择卡牌的敌人
      const submitData = {
        ...stageForm,
        enemies: stageForm.enemies.filter((e) => e.cardId),
      };

      if (isEdit.value) {
        await request.put(`/admin/stages/${currentStageId.value}`, submitData);
        ElMessage.success('关卡数据更新成功！');
      } else {
        await request.post('/admin/stages', submitData);
        ElMessage.success('新关卡创建成功！');
      }
      dialogVisible.value = false;
      fetchStages();
    } catch (error) {
      ElMessage.error(error.message || '操作失败，请检查填写内容');
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除关卡 [${row.chapter}-${row.stageNum} ${row.name}] 吗？\n此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/admin/stages/${row.id}`);
      ElMessage.success(`关卡 [${row.name}] 已删除！`);
      fetchStages();
    } catch (error) {
      ElMessage.error(error.message || '删除失败');
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchStages();
  fetchAllCards();
});
</script>

<style lang="scss" scoped>
.admin-stages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;

  .el-form-item {
    margin-bottom: 0;
  }
}

.table-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.stage-num-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 12px;
  min-width: 48px;
}

.power-text {
  font-weight: 600;
  color: #e6a23c;
}

.rewards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reward-item {
  font-size: 12px;
  color: #606266;
}

// 敌方阵容编辑
.enemies-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.enemy-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
