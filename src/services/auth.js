import request from './request.js';

/**
 * 鉴权 API 服务
 */

/**
 * 用户注册
 * @param {{ username: string, password: string, nickname?: string }} data
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
export const registerApi = (data) => request.post('/auth/register', data);

/**
 * 用户登录
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
export const loginApi = (data) => request.post('/auth/login', data);

/**
 * 刷新 Token
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export const refreshTokenApi = (refreshToken) =>
  request.post('/auth/refresh', { refreshToken });

/**
 * 用户登出
 * @returns {Promise<null>}
 */
export const logoutApi = () => request.post('/auth/logout');
