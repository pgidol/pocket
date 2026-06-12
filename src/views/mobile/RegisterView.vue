<template>
  <div class="register-page">
    <!-- 装饰背景 -->
    <div class="register-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
    </div>

    <div class="register-content">
      <!-- 返回 -->
      <button class="back-btn" @click="router.back()">
        ← 返回
      </button>

      <div class="register-header">
        <div class="logo-icon">✨</div>
        <h1 class="logo-text text-display">开启冒险</h1>
        <p class="logo-subtitle">创建账号，踏入二次元幻境</p>
      </div>

      <div class="register-card card-container">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="register-username"
              v-model="form.username"
              type="text"
              class="form-input"
              placeholder="3-20个字符"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">昵称（选填）</label>
          <div class="input-wrapper">
            <span class="input-icon">✏️</span>
            <input
              id="register-nickname"
              v-model="form.nickname"
              type="text"
              class="form-input"
              placeholder="你的显示名称"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="register-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="至少6个字符"
              autocomplete="new-password"
            />
            <button class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="register-confirm-password"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="再次输入密码"
              autocomplete="new-password"
              @keyup.enter="handleRegister"
            />
          </div>
        </div>

        <!-- 注册赠送提示 -->
        <div class="bonus-tip">
          <span class="bonus-icon">🎁</span>
          <span class="bonus-text">注册即赠送 <strong>1000金币</strong> + <strong>50钻石</strong></span>
        </div>

        <button
          id="register-submit"
          class="btn-primary register-btn"
          :class="{ 'is-loading': isLoading }"
          :disabled="isLoading"
          @click="handleRegister"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>创建账号</span>
        </button>

        <div class="form-footer">
          <span class="footer-text">已有账号？</span>
          <router-link :to="{ name: 'Login' }" class="footer-link">去登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore, useUserStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const uiStore = useUiStore();

const isLoading = ref(false);
const showPassword = ref(false);

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
});

const handleRegister = async () => {
  if (!form.username.trim()) {
    uiStore.toast('请输入用户名', 'warning');
    return;
  }
  if (form.password.length < 6) {
    uiStore.toast('密码至少6个字符', 'warning');
    return;
  }
  if (form.password !== form.confirmPassword) {
    uiStore.toast('两次密码不一致', 'warning');
    return;
  }

  isLoading.value = true;
  try {
    const result = await authStore.register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim() || undefined,
    });
    userStore.setProfile(result.user);
    uiStore.toast('注册成功！欢迎来到 Pocket！', 'success');
    router.push({ name: ROUTE_NAMES.HOME });
  } catch (error) {
    uiStore.toast(error.message || '注册失败', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.register-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);

  &-1 {
    width: 280px;
    height: 280px;
    background: rgba($color-secondary, 0.15);
    top: -60px;
    left: -40px;
    animation: float-gentle 9s ease-in-out infinite;
  }

  &-2 {
    width: 220px;
    height: 220px;
    background: rgba($color-accent, 0.12);
    bottom: 5%;
    right: -30px;
    animation: float-gentle 11s ease-in-out infinite reverse;
  }
}

@keyframes float-gentle {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(15px, -12px); }
}

.register-content {
  width: 100%;
  max-width: 380px;
  position: relative;
  z-index: 1;
}

.back-btn {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 16px;
  padding: 4px 0;

  &:active {
    color: $color-primary;
  }
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: scale-in 0.5s ease backwards;
}

.logo-text {
  font-size: 28px;
  background: linear-gradient(135deg, $color-secondary, $color-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.logo-subtitle {
  font-size: 13px;
  color: $text-tertiary;
}

.register-card {
  animation: scale-in 0.5s ease 0.2s backwards;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 6px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: $bg-main;
  border: 1.5px solid $border-color;
  border-radius: $radius-md;
  padding: 0 14px;
  transition: all $transition-normal;

  &:focus-within {
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.12);
  }
}

.input-icon {
  font-size: 16px;
  margin-right: 10px;
}

.form-input {
  flex: 1;
  height: 44px;
  font-size: 15px;
  color: $text-primary;
  background: transparent;

  &::placeholder {
    color: $text-tertiary;
  }
}

.toggle-pwd {
  font-size: 16px;
  padding: 4px;
}

.bonus-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba($color-accent, 0.1);
  border: 1px solid rgba($color-accent, 0.2);
  border-radius: $radius-sm;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.bonus-icon {
  font-size: 20px;
}

.bonus-text {
  font-size: 12px;
  color: $text-secondary;

  strong {
    color: $color-accent-dark;
  }
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;

  &.is-loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.footer-text {
  font-size: 13px;
  color: $text-tertiary;
}

.footer-link {
  font-size: 13px;
  font-weight: 600;
  color: $color-primary;
  margin-left: 4px;
}
</style>
