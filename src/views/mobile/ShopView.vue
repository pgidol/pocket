<template>
  <div class="shop-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push({ name: ROUTE_NAMES.HOME })">←</button>
      <h1 class="header-title text-display">商店</h1>
      <div class="header-currency">
        <span class="currency gold">💰 {{ userStore.gold }}</span>
        <span class="currency diamond">💎 {{ userStore.diamond }}</span>
      </div>
    </header>

    <div class="shop-content">
      <!-- 钻石兑换金币 -->
      <section class="shop-section">
        <h3 class="section-title"><span class="section-icon">💰</span> 钻石兑换金币</h3>
        <div class="product-grid">
          <div
            v-for="item in goldExchangePacks"
            :key="item.id"
            class="product-card gold-exchange-card"
            :class="{ featured: item.featured }"
            @click="handleBuy(item)"
          >
            <div v-if="item.tag" class="product-tag gold-tag">{{ item.tag }}</div>
            <span class="product-icon">{{ item.icon }}</span>
            <h4 class="product-name">{{ item.name }}</h4>
            <p class="product-desc">{{ item.desc }}</p>
            <div class="product-price diamond-price">
              <span class="price-icon">💎</span>
              <span class="price-value">{{ item.price }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 道具商店 -->
      <section class="shop-section">
        <h3 class="section-title"><span class="section-icon">🧪</span> 特殊道具</h3>
        <div class="product-list">
          <div
            v-for="item in specialItems"
            :key="item.id"
            class="product-row"
            @click="handleBuy(item)"
          >
            <span class="row-icon">{{ item.icon }}</span>
            <div class="row-info">
              <h4 class="row-name">{{ item.name }}</h4>
              <p class="row-desc">{{ item.desc }}</p>
            </div>
            <div class="row-price">
              <span class="price-icon">{{ item.currency === 'gold' ? '💰' : '💎' }}</span>
              <span class="price-value">{{ item.price }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 购买确认弹窗 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showConfirm" class="confirm-overlay" @click="showConfirm = false">
          <div class="confirm-popup" @click.stop>
            <h3 class="confirm-title">确认购买</h3>
            <div class="confirm-item">
              <span class="confirm-icon">{{ confirmItem?.icon }}</span>
              <span class="confirm-name">{{ confirmItem?.name }}</span>
            </div>
            <p class="confirm-cost">
              花费 {{ confirmItem?.currency === 'gold' ? '💰' : '💎' }} {{ confirmItem?.price }}
            </p>
            <div class="confirm-actions">
              <button class="btn-secondary" @click="showConfirm = false">取消</button>
              <button class="btn-primary" @click="confirmBuy" :disabled="isBuying">
                {{ isBuying ? '购买中...' : '确认' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 底部 Tab -->
    <nav class="bottom-tabs">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="tab-item">
        <span class="tab-icon">🏠</span><span class="tab-label">主页</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.GACHA }" class="tab-item">
        <span class="tab-icon">🎰</span><span class="tab-label">抽卡</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.COLLECTION }" class="tab-item">
        <span class="tab-icon">📖</span><span class="tab-label">图鉴</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.PROFILE }" class="tab-item">
        <span class="tab-icon">👤</span><span class="tab-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore, useUiStore } from '../../stores/index.js';
import { ROUTE_NAMES } from '../../utils/constants.js';
import request from '../../services/request.js';

const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();

onMounted(() => {
  userStore.fetchProfile();
});

const showConfirm = ref(false);
const confirmItem = ref(null);
const isBuying = ref(false);

const goldExchangePacks = [
  { id: 'gold_100', name: '金币小包', desc: '10,000 金币', icon: '💰', price: 100, currency: 'diamond', tag: null, featured: false },
  { id: 'gold_200', name: '金币中包', desc: '22,000 金币', icon: '💰', price: 200, currency: 'diamond', tag: '推荐', featured: true },
  { id: 'gold_500', name: '金币大包', desc: '60,000 金币', icon: '💰', price: 500, currency: 'diamond', tag: '超值', featured: false },
  { id: 'gold_1000', name: '金币至尊包', desc: '130,000 金币', icon: '💰', price: 1000, currency: 'diamond', tag: '最划算', featured: true },
];

const specialItems = [
  { id: 'lucky_charm', name: '幸运符', desc: '下次抽卡 SSR 概率 +5%（单次生效）', icon: '🍀', price: 50, currency: 'diamond' },
  { id: 'pity_reset', name: '命运转盘', desc: '重置 SSR 保底计数器为 80', icon: '🎡', price: 30, currency: 'diamond' },
  { id: 'single_ticket', name: '单抽券', desc: '免费进行一次单抽', icon: '🎫', price: 800, currency: 'gold' },
];

const handleBuy = (item) => {
  confirmItem.value = item;
  showConfirm.value = true;
};

const confirmBuy = async () => {
  isBuying.value = true;
  try {
    const result = await request.post('/shop/buy', {
      itemId: confirmItem.value.id,
    });
    userStore.updateCurrency({ gold: result.gold, diamond: result.diamond });
    uiStore.toast(`成功购买 ${confirmItem.value.name}！`, 'success');
    showConfirm.value = false;
  } catch (error) {
    uiStore.toast(error.message || '购买失败', 'error');
  } finally {
    isBuying.value = false;
  }
};
</script>

<style lang="scss" scoped>
.shop-page {
  min-height: 100vh;
  background: $bg-main;
  padding-bottom: 70px;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: rgba($bg-elevated, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: $z-sticky;
}

.back-btn {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
}

.header-currency {
  display: flex;
  gap: 10px;
}

.currency {
  font-size: 12px;
  font-weight: 600;
}

.shop-content {
  padding: 16px;
}

// 区块
.shop-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 18px;
}

// 钻石礼包网格
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16px;
  text-align: center;
  border: 1.5px solid $border-color;
  box-shadow: $shadow-sm;
  position: relative;
  transition: all $transition-normal;
  cursor: pointer;

  &.featured {
    border-color: rgba($color-accent, 0.4);
    box-shadow: 0 4px 16px rgba($color-accent, 0.15);
  }

  &:active {
    transform: scale(0.96);
  }
}

.product-tag {
  position: absolute;
  top: -1px;
  right: -1px;
  background: linear-gradient(135deg, $color-accent, #FF8A65);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 0 $radius-lg 0 $radius-md;
}

.product-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 12px;
}

.product-price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba($color-accent, 0.1);
  padding: 4px 12px;
  border-radius: $radius-full;
}

.price-icon {
  font-size: 14px;
}

.price-value {
  font-size: 14px;
  font-weight: 700;
  color: $color-accent-dark;
}

// 道具列表
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 14px 16px;
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all $transition-normal;

  &:active {
    transform: scale(0.98);
    background: $bg-overlay;
  }
}

// 钻石兑换金币卡片
.gold-exchange-card {
  &.featured {
    border-color: rgba($color-warning, 0.4);
    box-shadow: 0 4px 16px rgba($color-warning, 0.15);
  }
}

.gold-tag {
  background: linear-gradient(135deg, $color-warning, #FFD54F) !important;
}

.diamond-price {
  background: rgba($color-info, 0.1) !important;

  .price-value {
    color: #5B9BD5 !important;
  }
}

.row-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.row-desc {
  font-size: 11px;
  color: $text-tertiary;
  margin-top: 2px;
}

.row-price {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

// 确认弹窗
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.confirm-popup {
  background: $bg-elevated;
  border-radius: $radius-xl;
  padding: 28px 24px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  animation: scale-in 0.3s ease;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.confirm-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.confirm-icon {
  font-size: 28px;
}

.confirm-name {
  font-size: 16px;
  font-weight: 600;
}

.confirm-cost {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;

  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 10px;
    font-size: 14px;
  }
}

// 底部 Tab
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba($bg-elevated, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid $border-color;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: $z-sticky;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  color: $text-tertiary;
  &.active { color: $color-primary; }
}

.tab-icon { font-size: 22px; }
.tab-label { font-size: 10px; font-weight: 500; }
</style>
