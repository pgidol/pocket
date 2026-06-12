import { defineStore } from 'pinia';

/**
 * UI 状态 Store
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    /** @type {boolean} 导航抽屉是否展开 */
    isDrawerOpen: false,
    /** @type {boolean} 是否显示开屏动画 */
    showSplash: true,
    /** @type {boolean} 是否正在加载 */
    isLoading: false,
    /** @type {string} 全局 Toast 消息 */
    toastMessage: '',
    /** @type {'success'|'error'|'info'|'warning'} Toast 类型 */
    toastType: 'info',
    /** @type {boolean} 是否显示 Toast */
    showToast: false,
  }),

  actions: {
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },

    openDrawer() {
      this.isDrawerOpen = true;
    },

    closeDrawer() {
      this.isDrawerOpen = false;
    },

    hideSplash() {
      this.showSplash = false;
    },

    setLoading(val) {
      this.isLoading = val;
    },

    /**
     * 显示 Toast
     * @param {string} message
     * @param {'success'|'error'|'info'|'warning'} [type='info']
     * @param {number} [duration=2500]
     */
    toast(message, type = 'info', duration = 2500) {
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, duration);
    },
  },
});
