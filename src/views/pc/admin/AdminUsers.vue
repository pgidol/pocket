<template>
  <div class="admin-users">
    <!-- 1. 过滤检索区 -->
    <el-card class="filter-card" shadow="always">
      <el-form :inline="true" :model="filters" class="demo-form-inline">
        <el-form-item label="模糊搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户ID、用户名或昵称..."
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 数据表格区 -->
    <el-card class="table-card" shadow="always">
      <el-table :data="usersList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="用户 ID" width="220" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" show-overflow-tooltip />
        <el-table-column prop="level" label="等级" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">Lv.{{ row.level }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="gold" label="金币" width="130">
          <template #default="{ row }">
            <span class="currency-text gold-text">💰 {{ formatNumber(row.gold) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="diamond" label="钻石" width="130">
          <template #default="{ row }">
            <span class="currency-text diamond-text">💎 {{ formatNumber(row.diamond) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalPulls" label="累计抽卡数" width="120" align="center" />

        <el-table-column prop="lastCheckIn" label="最近签到" width="170">
          <template #default="{ row }">
            <span>{{ formatDate(row.lastCheckIn) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'banned' ? 'danger' : 'success'" size="small">
              {{ row.status === 'banned' ? '已封禁' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openCurrencyDialog(row)">
              调整资金
            </el-button>

            <el-button
              v-if="row.status !== 'banned'"
              size="small"
              type="danger"
              @click="toggleStatus(row, 'banned')"
            >
              封禁账号
            </el-button>
            <el-button
              v-else
              size="small"
              type="success"
              @click="toggleStatus(row, 'active')"
            >
              解封账号
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

    <!-- 3. 资金调整弹窗 -->
    <el-dialog
      v-model="currencyDialogVisible"
      title="调整玩家账户资金"
      width="460px"
      destroy-on-close
    >
      <el-form
        ref="currencyFormRef"
        :model="currencyForm"
        :rules="currencyRules"
        label-position="right"
        label-width="80px"
      >
        <div class="user-meta-info">
          <p><b>用户名：</b>{{ currentUser.username }}</p>
          <p><b>当前昵称：</b>{{ currentUser.nickname || '无' }}</p>
        </div>

        <el-form-item label="金币数量" prop="gold">
          <el-input-number
            v-model="currencyForm.gold"
            :min="0"
            :max="99999999"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="钻石数量" prop="diamond">
          <el-input-number
            v-model="currencyForm.diamond"
            :min="0"
            :max="99999999"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="currencyDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitCurrencyForm">
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
const usersList = ref([]);

// 检索过滤器
const filters = reactive({
  keyword: '',
});

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

// 弹窗表单状态
const currencyDialogVisible = ref(false);
const currencyFormRef = ref(null);
const currentUser = ref({});

const currencyForm = reactive({
  gold: 0,
  diamond: 0,
});

const currencyRules = {
  gold: [{ required: true, message: '请输入金币数量', trigger: 'blur' }],
  diamond: [{ required: true, message: '请输入钻石数量', trigger: 'blur' }],
};

/**
 * 格式化时间
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '暂无记录';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化货币数字
 */
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
};

/**
 * 获取玩家列表
 */
const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/users', {
      params: {
        keyword: filters.keyword,
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    usersList.value = res.list;
    pagination.total = res.total;
  } catch (error) {
    ElMessage.error(error.message || '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchUsers();
};

const resetFilters = () => {
  filters.keyword = '';
  pagination.page = 1;
  fetchUsers();
};

// 分页变更
const handleSizeChange = (size) => {
  pagination.limit = size;
  fetchUsers();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  fetchUsers();
};

/**
 * 打开资金调整对话框
 */
const openCurrencyDialog = (row) => {
  currentUser.value = row;
  currencyForm.gold = row.gold;
  currencyForm.diamond = row.diamond;
  currencyDialogVisible.value = true;
};

/**
 * 提交资金修改表单
 */
const submitCurrencyForm = async () => {
  if (!currencyFormRef.value) return;

  await currencyFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;

    try {
      await request.put(`/admin/users/${currentUser.value.id}/currency`, {
        gold: currencyForm.gold,
        diamond: currencyForm.diamond,
      });
      ElMessage.success(`成功调整用户 [${currentUser.value.username}] 的资金！`);
      currencyDialogVisible.value = false;
      fetchUsers();
    } catch (error) {
      ElMessage.error(error.message || '调整资金失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

/**
 * 一键封禁/解封用户状态
 */
const toggleStatus = (row, newStatus) => {
  const isBan = newStatus === 'banned';
  const actionText = isBan ? '封禁' : '解封';

  ElMessageBox.confirm(
    `您确定要 ${actionText} 用户 [${row.username}] 吗？${
      isBan ? '\n封禁后，该用户将无法登录游戏或调用任何游戏接口。' : ''
    }`,
    `账号${actionText}确认`,
    {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: isBan ? 'warning' : 'info',
    }
  ).then(async () => {
    try {
      await request.put(`/admin/users/${row.id}/status`, {
        status: newStatus,
      });
      ElMessage.success(`用户 [${row.username}] 已被成功${actionText}！`);
      fetchUsers();
    } catch (error) {
      ElMessage.error(error.message || `${actionText}失败`);
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchUsers();
});
</script>

<style lang="scss" scoped>
.admin-users {
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

.currency-text {
  font-weight: 600;

  &.gold-text {
    color: #e6a23c;
  }

  &.diamond-text {
    color: #409eff;
  }
}

.user-meta-info {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #409eff;

  p {
    margin: 4px 0;
    font-size: 13px;
    color: #606266;
  }
}
</style>
