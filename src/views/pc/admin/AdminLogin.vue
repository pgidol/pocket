<template>
  <div class="admin-login-container">
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <span class="logo-emoji">🎰</span>
        <h2 class="login-title">Pocket 管理后台</h2>
        <p class="login-subtitle">请登录您的管理员账号</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入管理员用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item class="actions-item">
          <el-button
            type="primary"
            :loading="loading"
            class="submit-btn"
            @click="handleLogin"
          >
            登录后台
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

import { useAuthStore } from '../../../stores/index.js';
import request from '../../../services/request.js';

const router = useRouter();
const authStore = useAuthStore();

const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
});

const loginRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
};

/**
 * 解码 JWT Token 提取角色
 * @param {string} token
 * @returns {string|null}
 */
const getRoleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'user';
  } catch {
    return null;
  }
};

/**
 * 处理后台登录
 */
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      // 1. 调用通用登录 API
      const result = await authStore.login({
        username: loginForm.username,
        password: loginForm.password,
      });

      // 2. 校验角色是否是 admin
      const role = getRoleFromToken(result.accessToken);
      if (role !== 'admin') {
        // 越权拦截：立刻清理 Token
        authStore.clearAuth();
        ElMessage.error('登录失败：该账号不具备管理员权限！');
        return;
      }

      ElMessage.success('管理员登录成功！');
      // 3. 跳转管理后台主页
      router.push({ name: 'AdminDashboard' });
    } catch (error) {
      ElMessage.error(error.message || '登录失败，请检查账号和密码');
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style lang="scss" scoped>
.admin-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1f1f2e 0%, #11111a 100%);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 10px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f1f2e;
  margin: 0 0 6px 0;
}

.login-subtitle {
  font-size: 13px;
  color: #707080;
  margin: 0;
}

.actions-item {
  margin-top: 15px;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  border: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}
</style>
