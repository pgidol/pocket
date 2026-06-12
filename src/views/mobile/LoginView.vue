<template>
  <div class="login-page">
    <!-- 装饰背景 -->
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
      <div class="floating-petals">
        <span v-for="i in 8" :key="i" class="petal" :style="petalStyle(i)">🌸</span>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="login-content">
      <!-- Logo 区域 -->
      <div class="login-header">
        <div class="logo-icon">🎴</div>
        <h1 class="logo-text text-display">Pocket</h1>
        <p class="logo-subtitle">收集属于你的二次元幻境</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-card card-container">
        <h2 class="form-title">欢迎回来</h2>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="login-username"
              v-model="form.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              autocomplete="username"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button
          id="login-submit"
          class="btn-primary login-btn"
          :class="{ 'is-loading': isLoading }"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>登 录</span>
        </button>

        <div class="form-footer">
          <span class="footer-text">还没有账号？</span>
          <router-link :to="{ name: 'Register' }" class="footer-link">立即注册</router-link>
        </div>
      </div>

      <!-- 底部装饰 -->
      <div class="login-footer">
        <span class="footer-version">v1.0.0</span>
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
  password: '',
});

/**
 * 花瓣漂浮样式
 * @param {number} index
 * @returns {Object}
 */
const petalStyle = (index) => ({
  left: `${Math.random() * 100}%`,
  animationDuration: `${6 + Math.random() * 8}s`,
  animationDelay: `${index * 0.8}s`,
  fontSize: `${14 + Math.random() * 10}px`,
  opacity: 0.3 + Math.random() * 0.4,
});

/**
 * 登录处理
 */
const handleLogin = async () => {
  if (!form.username.trim() || !form.password) {
    uiStore.toast('请填写用户名和密码', 'warning');
    return;
  }

  isLoading.value = true;
  try {
    const result = await authStore.login({
      username: form.username.trim(),
      password: form.password,
    });
    userStore.setProfile(result.user);
    uiStore.toast('登录成功，欢迎回来！', 'success');
    router.push({ name: ROUTE_NAMES.HOME });
  } catch (error) {
    uiStore.toast(error.message || '登录失败', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

// 装饰背景
.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);

  &-1 {
    width: 300px;
    height: 300px;
    background: rgba($color-primary, 0.15);
    top: -80px;
    right: -60px;
    animation: float-gentle 8s ease-in-out infinite;
  }

  &-2 {
    width: 200px;
    height: 200px;
    background: rgba($color-secondary, 0.12);
    bottom: 10%;
    left: -40px;
    animation: float-gentle 10s ease-in-out infinite reverse;
  }

  &-3 {
    width: 150px;
    height: 150px;
    background: rgba($color-accent, 0.1);
    top: 40%;
    right: 20%;
    animation: float-gentle 12s ease-in-out infinite;
  }
}

@keyframes float-gentle {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -15px); }
}

.floating-petals {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.petal {
  position: absolute;
  top: -30px;
  animation: sakura-drift linear infinite;
}

@keyframes sakura-drift {
  0% {
    transform: translateY(-10vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% {
    transform: translateY(110vh) translateX(80px) rotate(720deg);
    opacity: 0;
  }
}

// 主内容
.login-content {
  width: 100%;
  max-width: 380px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 56px;
  margin-bottom: 8px;
  animation: scale-in 0.6s ease backwards;
}

.logo-text {
  font-size: 36px;
  background: linear-gradient(135deg, $color-primary, $color-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  animation: scale-in 0.6s ease 0.1s backwards;
}

.logo-subtitle {
  font-size: 13px;
  color: $text-tertiary;
  letter-spacing: 2px;
  animation: scale-in 0.6s ease 0.2s backwards;
}

// 表单卡片
.login-card {
  animation: scale-in 0.6s ease 0.3s backwards;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 24px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 8px;
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
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  height: 46px;
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
  flex-shrink: 0;
}

// 登录按钮
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  letter-spacing: 4px;

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

// 底部
.form-footer {
  text-align: center;
  margin-top: 20px;
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

  &:active {
    opacity: 0.7;
  }
}

.login-footer {
  text-align: center;
  margin-top: 32px;
}

.footer-version {
  font-size: 11px;
  color: $text-tertiary;
  letter-spacing: 1px;
}
</style>
