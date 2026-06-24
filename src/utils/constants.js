/**
 * 全局常量定义
 */

/** 稀有度配置 */
export const RARITY_CONFIG = {
  N: {
    label: 'N',
    name: '普通',
    color: '#888888',
    bgClass: 'rarity-n',
    frameClass: 'card-frame-n',
    probability: 0.45,
  },
  R: {
    label: 'R',
    name: '稀有',
    color: '#4A90D9',
    bgClass: 'rarity-r',
    frameClass: 'card-frame-r',
    probability: 0.30,
  },
  SR: {
    label: 'SR',
    name: '超稀有',
    color: '#A855F7',
    bgClass: 'rarity-sr',
    frameClass: 'card-frame-sr',
    probability: 0.17,
  },
  SSR: {
    label: 'SSR',
    name: '传说',
    color: '#F59E0B',
    bgClass: 'rarity-ssr',
    frameClass: 'card-frame-ssr',
    probability: 0.07,
  },
  UR: {
    label: 'UR',
    name: '究极稀有',
    color: '#EC4899',
    bgClass: 'rarity-ur',
    frameClass: 'card-frame-ur',
    probability: 0.01,
  },
};

/** 稀有度排序权重 */
export const RARITY_ORDER = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };

/** 抽卡费用 */
export const GACHA_COST = {
  single: 160,   // 单抽 160 钻石
  ten: 1600,     // 十连 1600 钻石
};

/** 保底计数 */
export const PITY_THRESHOLD = {
  SR: 10,        // 每 10 抽保底 SR
  SSR: 90,       // 每 90 抽保底 SSR
};

/** 阵营配置 */
export const FACTION_CONFIG = {
  celestial: { label: '天界', icon: '☀️', color: '#FFD700' },
  demon: { label: '魔界', icon: '🌙', color: '#9B59B6' },
  mortal: { label: '人间', icon: '🌸', color: '#F2A7B3' },
};

/** 签到奖励表（7日循环） */
export const CHECKIN_REWARDS = [
  { day: 1, type: 'gold', amount: 100, label: '100 金币' },
  { day: 2, type: 'gold', amount: 150, label: '150 金币' },
  { day: 3, type: 'diamond', amount: 5, label: '5 钻石' },
  { day: 4, type: 'gold', amount: 200, label: '200 金币' },
  { day: 5, type: 'diamond', amount: 10, label: '10 钻石' },
  { day: 6, type: 'gold', amount: 300, label: '300 金币' },
  { day: 7, type: 'diamond', amount: 20, label: '20 钻石 + 随机SR卡' },
];

/** 路由名称 */
export const ROUTE_NAMES = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  REGISTER: 'Register',
  HOME: 'Home',
  GACHA: 'Gacha',
  COLLECTION: 'Collection',
  BAG: 'Bag',
  SHOP: 'Shop',
  CHECKIN: 'CheckIn',
  ACHIEVEMENT: 'Achievement',
  FRIEND: 'Friend',
  TRADE: 'Trade',
  PROFILE: 'Profile',
  BATTLE_MAP: 'BattleMap',
  TEAM_FORM: 'TeamForm',
  BATTLE: 'Battle',
  CARD_UPGRADE: 'CardUpgrade',
  EQUIPMENT: 'Equipment',
};

/** 阵营克制关系（前端展示用） */
export const SERIES_ADVANTAGE = {
  celestial: 'demon',
  demon: 'mortal',
  mortal: 'celestial',
};

/** 章节配置 */
export const CHAPTER_CONFIG = [
  { chapter: 1, name: '第一章·天界序曲', icon: '☀️', color: '#FFD700' },
  { chapter: 2, name: '第二章·魔界动荡', icon: '🌙', color: '#9B59B6' },
  { chapter: 3, name: '第三章·人间决战', icon: '🌸', color: '#F2A7B3' },
];

/** 体力常量 */
export const MAX_STAMINA = 120;

/** 装备槽位配置 */
export const EQUIPMENT_SLOTS = {
  head: { label: '头部', icon: '🪖' },
  armor: { label: '护甲', icon: '🛡️' },
  legs: { label: '腿部', icon: '🦿' },
  boots: { label: '鞋子', icon: '👢' },
  weapon: { label: '武器', icon: '⚔️' },
  accessory: { label: '饰品', icon: '💍' },
};

