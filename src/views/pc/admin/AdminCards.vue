<template>
  <div class="admin-cards">
    <!-- 1. 过滤检索区 -->
    <el-card class="filter-card" shadow="always">
      <el-form :inline="true" :model="filters" class="demo-form-inline">
        <el-form-item label="名称搜索">
          <el-input v-model="filters.keyword" placeholder="搜索卡牌名称..." clearable />
        </el-form-item>

        <el-form-item label="稀有度">
          <el-select v-model="filters.rarity" placeholder="全部" clearable style="width: 120px;">
            <el-option label="N" value="N" />
            <el-option label="R" value="R" />
            <el-option label="SR" value="SR" />
            <el-option label="SSR" value="SSR" />
            <el-option label="UR" value="UR" />
          </el-select>
        </el-form-item>

        <el-form-item label="阵营">
          <el-select v-model="filters.series" placeholder="全部" clearable style="width: 120px;">
            <el-option label="☀️ 天界" value="celestial" />
            <el-option label="🌙 魔界" value="demon" />
            <el-option label="🌸 人间" value="mortal" />
          </el-select>
        </el-form-item>

        <el-form-item label="下架状态">
          <el-select v-model="filters.includeDeleted" placeholder="全部" style="width: 140px;">
            <el-option label="包含已下架" value="true" />
            <el-option label="仅限上架卡牌" value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">✨ 新建卡牌</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 数据表格区 -->
    <el-card class="table-card" shadow="always">
      <el-table :data="cardsList" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="图片预览" width="90">
          <template #default="{ row }">
            <div :class="['card-avatar', `rarity-${row.rarity.toLowerCase()}`]">
              <span v-if="!row.imageUrl" class="fallback-emoji">{{ getFactionIcon(row.series) }}</span>
              <img v-else :src="row.imageUrl" class="avatar-img" />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="卡牌名称" width="160" show-overflow-tooltip />

        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <span :class="['rarity-badge', `rarity-${row.rarity.toLowerCase()}`]">
              {{ row.rarity }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="series" label="阵营" width="120">
          <template #default="{ row }">
            <span>{{ getFactionLabel(row.series) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="背景故事说明" min-width="250" show-overflow-tooltip />

        <el-table-column prop="isDeleted" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isDeleted ? 'danger' : 'success'" size="small">
              {{ row.isDeleted ? '已下架' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            
            <el-button
              v-if="!row.isDeleted"
              size="small"
              type="danger"
              @click="toggleDelete(row, true)"
            >
              下架
            </el-button>
            <el-button
              v-else
              size="small"
              type="warning"
              @click="toggleDelete(row, false)"
            >
              上架
            </el-button>
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

    <!-- 3. 卡牌新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑卡牌信息' : '创建新角色卡牌'"
      width="540px"
      destroy-on-close
    >
      <el-form
        ref="cardFormRef"
        :model="cardForm"
        :rules="cardRules"
        label-position="right"
        label-width="90px"
      >
        <el-form-item label="卡牌名称" prop="name">
          <el-input v-model="cardForm.name" placeholder="请输入卡牌角色姓名" />
        </el-form-item>

        <el-form-item label="稀有度" prop="rarity">
          <el-radio-group v-model="cardForm.rarity">
            <el-radio-button label="N" />
            <el-radio-button label="R" />
            <el-radio-button label="SR" />
            <el-radio-button label="SSR" />
            <el-radio-button label="UR" />
          </el-radio-group>
        </el-form-item>

        <el-form-item label="阵营系列" prop="series">
          <el-select v-model="cardForm.series" placeholder="请选择角色归属阵营" style="width: 100%;">
            <el-option label="☀️ 天界 (celestial)" value="celestial" />
            <el-option label="🌙 魔界 (demon)" value="demon" />
            <el-option label="🌸 人间 (mortal)" value="mortal" />
          </el-select>
        </el-form-item>

        <el-form-item label="插画图片" prop="imageUrl">
          <el-input v-model="cardForm.imageUrl" placeholder="请输入卡牌插画 URL 网址..." />
        </el-form-item>

        <el-form-item label="背景说明" prop="description">
          <el-input
            v-model="cardForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入角色的背景故事或设定介绍..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitCardForm">
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

import request from '../../../services/request.js';

const loading = ref(false);
const submitLoading = ref(false);
const cardsList = ref([]);

// 检索过滤器
const filters = reactive({
  keyword: '',
  rarity: '',
  series: '',
  includeDeleted: 'true',
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
const cardFormRef = ref(null);
const currentCardId = ref(null);

const cardForm = reactive({
  name: '',
  rarity: 'N',
  series: 'mortal',
  imageUrl: '',
  description: '',
});

const cardRules = {
  name: [{ required: true, message: '卡牌角色名称不能为空', trigger: 'blur' }],
  rarity: [{ required: true, message: '请选择稀有度', trigger: 'change' }],
  series: [{ required: true, message: '请选择阵营', trigger: 'change' }],
};

/**
 * 翻译阵营标签
 */
const getFactionLabel = (series) => {
  const map = { celestial: '☀️ 天界', demon: '🌙 魔界', mortal: '🌸 人间' };
  return map[series] || '未知';
};

/**
 * 获取阵营Emoji
 */
const getFactionIcon = (series) => {
  const map = { celestial: '☀️', demon: '🌙', mortal: '🌸' };
  return map[series] || '🎴';
};

/**
 * 获取卡牌列表
 */
const fetchCards = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/cards', {
      params: {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    cardsList.value = res.list;
    pagination.total = res.total;
  } catch (error) {
    ElMessage.error(error.message || '获取卡牌列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchCards();
};

const resetFilters = () => {
  filters.keyword = '';
  filters.rarity = '';
  filters.series = '';
  filters.includeDeleted = 'true';
  pagination.page = 1;
  fetchCards();
};

// 分页改变
const handleSizeChange = (size) => {
  pagination.limit = size;
  fetchCards();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  fetchCards();
};

/**
 * 打开新建卡牌弹窗
 */
const openCreateDialog = () => {
  isEdit.value = false;
  currentCardId.value = null;
  cardForm.name = '';
  cardForm.rarity = 'N';
  cardForm.series = 'mortal';
  cardForm.imageUrl = '';
  cardForm.description = '';
  dialogVisible.value = true;
};

/**
 * 打开编辑卡牌弹窗
 */
const openEditDialog = (row) => {
  isEdit.value = true;
  currentCardId.value = row.id;
  cardForm.name = row.name;
  cardForm.rarity = row.rarity;
  cardForm.series = row.series;
  cardForm.imageUrl = row.imageUrl;
  cardForm.description = row.description;
  dialogVisible.value = true;
};

/**
 * 提交表单数据
 */
const submitCardForm = async () => {
  if (!cardFormRef.value) return;

  await cardFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;

    try {
      if (isEdit.value) {
        // 更新
        await request.put(`/admin/cards/${currentCardId.value}`, cardForm);
        ElMessage.success('卡牌数据更新成功！');
      } else {
        // 创建
        await request.post('/admin/cards', cardForm);
        ElMessage.success('新卡牌创建成功！');
      }
      dialogVisible.value = false;
      fetchCards();
    } catch (error) {
      ElMessage.error(error.message || '操作失败，请检查填写内容');
    } finally {
      submitLoading.value = false;
    }
  });
};

/**
 * 下架（软删除）/ 上架（恢复）切换
 */
const toggleDelete = (row, isDeleteAction) => {
  const actionText = isDeleteAction ? '下架' : '上架';
  const apiPath = isDeleteAction ? `/admin/cards/${row.id}` : `/admin/cards/${row.id}/restore`;

  ElMessageBox.confirm(
    `您确定要 ${actionText} 卡牌 [${row.name}] 吗？${
      isDeleteAction ? '\n下架后，玩家图鉴和新抽卡池将不再展示/产出该卡牌。' : ''
    }`,
    `${actionText}确认`,
    {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: isDeleteAction ? 'warning' : 'info',
    }
  ).then(async () => {
    try {
      if (isDeleteAction) {
        await request.delete(apiPath);
      } else {
        await request.post(apiPath);
      }
      ElMessage.success(`卡牌 [${row.name}] 已成功${actionText}！`);
      fetchCards();
    } catch (error) {
      ElMessage.error(error.message || `${actionText}失败`);
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchCards();
});
</script>

<style lang="scss" scoped>
.admin-cards {
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

// ========== 列表卡片预览缩略图 ==========
.card-avatar {
  width: 50px;
  height: 66px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  padding: 1.5px;

  &.rarity-n { background: linear-gradient(135deg, #B0B0B0, #8C8C8C); }
  &.rarity-r { background: linear-gradient(135deg, #5B9BD5, #41719C); }
  &.rarity-sr { background: linear-gradient(135deg, #9B59B6, #7030A0); }
  &.rarity-ssr { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &.rarity-ur { background: linear-gradient(135deg, #EC4899, #BE185D); }
}

.fallback-emoji {
  font-size: 20px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

// 稀有度色彩徽章
.rarity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-align: center;
  min-width: 28px;

  &.rarity-n { background: linear-gradient(135deg, #B0B0B0, #8C8C8C); }
  &.rarity-r { background: linear-gradient(135deg, #5B9BD5, #41719C); }
  &.rarity-sr { background: linear-gradient(135deg, #9B59B6, #7030A0); }
  &.rarity-ssr { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &.rarity-ur { background: linear-gradient(135deg, #EC4899, #BE185D); }
}
</style>
