import { defineStore } from 'pinia';

import { loginApi, registerApi, logoutApi } from '../services/auth.js';

/**
 * 鉴权 Store
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {string|null} */
    accessToken: localStorage.getItem('accessToken') || null,
    /** @type {string|null} */
    refreshToken: localStorage.getItem('refreshToken') || null,
    /** @type {boolean} */
    isLoggedIn: !!localStorage.getItem('accessToken'),
  }),

  actions: {
    /**
     * 用户登录
     * @param {{ username: string, password: string }} credentials
     */
    async login(credentials) {
      const result = await loginApi(credentials);
      this.setTokens(result.accessToken, result.refreshToken);
      return result;
    },

    /**
     * 用户注册
     * @param {{ username: string, password: string, nickname?: string }} data
     */
    async register(data) {
      const result = await registerApi(data);
      this.setTokens(result.accessToken, result.refreshToken);
      return result;
    },

    /**
     * 设置 Token
     * @param {string} accessToken
     * @param {string} refreshToken
     */
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.isLoggedIn = true;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },

    /**
     * 用户登出
     */
    async logout() {
      try {
        await logoutApi();
      } catch {
        // 静默处理
      } finally {
        this.clearAuth();
      }
    },

    /**
     * 清除鉴权状态
     */
    clearAuth() {
      this.accessToken = null;
      this.refreshToken = null;
      this.isLoggedIn = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});
