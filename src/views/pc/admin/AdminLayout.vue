<template>
  <el-container class="admin-layout">
    <!-- 1. 左侧侧边栏导航 -->
    <el-aside width="240px" class="admin-aside">
      <div class="aside-logo">
        <span class="logo-icon">🎴</span>
        <span class="logo-text">Pocket Admin</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="aside-menu"
        background-color="#1f1f2e"
        text-color="#c0c4cc"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/admin/cards">
          <el-icon><Grid /></el-icon>
          <span>卡牌管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/pools">
          <el-icon><Calendar /></el-icon>
          <span>卡池管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <!-- 2. 顶部工具栏 -->
      <el-header height="60px" class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>Pocket 后台管理</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRouteLabel }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <span class="user-avatar">👤</span>
              <span class="user-name">系统管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="toGame">🎮 返回手机版游戏</el-dropdown-item>
                <el-dropdown-item command="logout" divided style="color: #f56c6c;">
                  🚪 退出后台登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 3. 主内容区域 -->
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Odometer,
  Grid,
  Calendar,
  User,
  ArrowDown,
} from '@element-plus/icons-vue';

import { useAuthStore } from '../../../stores/index.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 计算当前激活的菜单高亮项
const activeMenu = computed(() => {
  return route.path;
});

// 计算当前路由的面包屑描述文字
const currentRouteLabel = computed(() => {
  const map = {
    '/admin/dashboard': '数据看板',
    '/admin/cards': '卡牌数据管理',
    '/admin/pools': '限定卡池配置',
    '/admin/users': '玩家账户数据管理',
  };
  return map[route.path] || '主页';
});

/**
 * 顶部下拉菜单处理
 */
const handleCommand = (command) => {
  if (command === 'toGame') {
    router.push('/');
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出管理后台登录吗？', '退出确认', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await authStore.logout();
      ElMessage.success('已安全退出管理后台！');
      router.push({ name: 'AdminLogin' });
    }).catch(() => {});
  }
};
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
}

// ========== 侧边栏样式 ==========
.admin-aside {
  background-color: #1f1f2e;
  border-right: 1px solid #14141e;
  display: flex;
  flex-direction: column;
}

.aside-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #1a1a26;
  border-bottom: 1px solid #14141e;

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: white;
  }
}

.aside-menu {
  border-right: none;
  flex: 1;
  padding-top: 15px;

  :deep(.el-menu-item) {
    margin: 4px 10px;
    border-radius: 8px;
    height: 50px;
    line-height: 50px;

    &.is-active {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
    }
  }
}

// ========== 主容器样式 ==========
.main-container {
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

// ========== 顶部导航条 ==========
.admin-header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: $radius-sm;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  .user-avatar {
    font-size: 18px;
  }

  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
}

// ========== 内容区域 ==========
.admin-main {
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

// ========== 页面切换过渡动画 ==========
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(15px);
}
</style>
