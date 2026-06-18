const CACHE_NAME = 'pocket-pwa-v1';

// 安装事件 (Install Event)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 激活事件 (Activate Event)
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 监听 fetch 事件，满足浏览器对 PWA 可安装性的基础要求。
// 采用直接网络请求透传（Pass-through）的方式，避免在开发环境下缓存旧代码。
self.addEventListener('fetch', (event) => {
  // 只处理同源的 GET 请求
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(fetch(event.request));
});
