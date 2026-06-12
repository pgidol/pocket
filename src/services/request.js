import axios from 'axios';

/**
 * Axios 实例与无感刷新引擎
 * standard.md §5: 响应拦截器捕获 401 后，开启全局刷新锁，
 * 挂起后续并发请求至 requestsQueue，刷新成功后重放队列
 */

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** @type {boolean} 全局刷新锁 */
let isRefreshing = false;

/** @type {Array<{resolve: Function, reject: Function}>} 挂起的请求队列 */
let requestsQueue = [];

/**
 * 处理挂起的请求队列
 * @param {string|null} token - 新的 Access Token，null 表示刷新失败
 */
const processQueue = (token) => {
  requestsQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(new Error('Token 刷新失败'));
    }
  });
  requestsQueue = [];
};

// 请求拦截器 — 注入 Access Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 — 统一处理响应格式 + 无感刷新
request.interceptors.response.use(
  (response) => {
    // standard.md §4: 200 → 直接返回 response.data.data
    return response.data.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;

    // 401 - Access Token 失效
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 40101 - Refresh Token 彻底失效 → 清除状态，重定向登录
      if (responseData?.code === 40101) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 普通 401 → 触发无感刷新
      if (isRefreshing) {
        // 已经在刷新中 → 挂起当前请求
        return new Promise((resolve, reject) => {
          requestsQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return request(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Refresh Token 不存在');
        }

        // 直接用 axios 请求，避免触发拦截器
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // 存储新 Token
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 重放挂起的请求队列
        processQueue(newAccessToken);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        // 刷新失败 → 清除状态，重定向登录
        processQueue(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 其他错误 → Toast 弹出 message
    const message = responseData?.message || '网络请求异常';
    console.error(`[API Error] ${message}`);

    return Promise.reject({
      code: responseData?.code || error.response?.status || 500,
      message,
      data: responseData?.data || null,
    });
  }
);

export default request;
