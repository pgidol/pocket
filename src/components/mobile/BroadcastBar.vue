<template>
  <transition-group name="broadcast-slide" tag="div" class="broadcast-bar">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="broadcast-msg"
      :class="`msg-${msg.rarity.toLowerCase()}`"
    >
      <span class="msg-icon">{{ msg.rarity === 'UR' ? '🌟' : '⭐' }}</span>
      <span class="msg-text">
        <strong>{{ msg.username }}</strong> 抽到了
        <span :class="['rarity-inline', `rarity-${msg.rarity.toLowerCase()}`]">{{ msg.rarity }}</span>
        「{{ msg.cardName }}」！
      </span>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useUiStore } from '../../stores/index.js';

const messages = ref([]);
let socket = null;
let messageId = 0;
const uiStore = useUiStore();

const addMessage = (data) => {
  const msg = { ...data, id: ++messageId };
  messages.value.push(msg);

  // 最多显示3条，超出则移除最旧的
  if (messages.value.length > 3) {
    messages.value.shift();
  }

  // 5秒后自动移除
  setTimeout(() => {
    const idx = messages.value.findIndex((m) => m.id === msg.id);
    if (idx > -1) {
      messages.value.splice(idx, 1);
    }
  }, 5000);
};

onMounted(() => {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 3000,
  });

  socket.on('gacha:rare-pull', (data) => {
    addMessage(data);
  });

  socket.on('kick', (data) => {
    uiStore.toast(data.message || '您的账号已在其他设备登录，已强制下线。', 'error');
    // 清除状态
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (socket) {
      socket.disconnect();
    }
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  });

  socket.on('connect_error', () => {
    // standard.md §5: 客户端需主动断开，等待刷新后重连
    socket.disconnect();
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
});
</script>

<style lang="scss" scoped>
.broadcast-bar {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 56px);
  left: 12px;
  right: 12px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}

.broadcast-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
  pointer-events: auto;

  &.msg-ssr {
    background: rgba(255, 215, 0, 0.15);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #8B6914;
  }

  &.msg-ur {
    background: rgba(236, 72, 153, 0.15);
    border: 1px solid rgba(236, 72, 153, 0.3);
    color: #9B1B5C;
  }
}

.msg-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.msg-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    font-weight: 600;
  }
}

.rarity-inline {
  font-weight: 700;
  padding: 0 4px;
  border-radius: 3px;

  &.rarity-ssr {
    background: rgba(255, 215, 0, 0.2);
    color: #B8860B;
  }

  &.rarity-ur {
    background: rgba(236, 72, 153, 0.2);
    color: #C2185B;
  }
}

// 过渡动画
.broadcast-slide-enter-active {
  transition: all 0.4s ease;
}

.broadcast-slide-leave-active {
  transition: all 0.3s ease;
}

.broadcast-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.broadcast-slide-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.broadcast-slide-move {
  transition: transform 0.3s ease;
}
</style>
