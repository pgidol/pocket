/**
 * Pinia Store 统一导出
 * standard.md §2: 所有 Pinia Store 必须在此具名导出，禁止直接从单文件导入
 */

export { useAuthStore } from './auth.js';
export { useUserStore } from './user.js';
export { useCardStore } from './card.js';
export { useGachaStore } from './gacha.js';
export { useUiStore } from './ui.js';
export { useBattleStore } from './battle.js';
export { useTeamStore } from './team.js';

