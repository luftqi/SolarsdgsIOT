/**
 * Service Worker for SolarSDGs IoT PWA
 * Phase 2.3: 離線支援與快取策略
 */

const CACHE_NAME = 'solarsdgs-iot-v1.0.0'
const RUNTIME_CACHE = 'solarsdgs-runtime'

// 需要快取的靜態資源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// 安裝事件 - 快取靜態資源
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// 啟動事件 - 清理舊快取
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch 事件 - 網路優先策略 (Network First)
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 跳過非 GET 請求
  if (request.method !== 'GET') {
    return
  }

  // 跳過 WebSocket 和 API 請求
  const url = new URL(request.url)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return
  }

  // API 請求使用網路優先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // 靜態資源使用快取優先策略
  event.respondWith(cacheFirst(request))
})

/**
 * 快取優先策略 (Cache First)
 * 適用於: 靜態資源 (CSS, JS, 圖片)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    console.log('[ServiceWorker] Cache hit:', request.url)
    return cached
  }

  try {
    const response = await fetch(request)

    // 只快取成功的響應
    if (response.status === 200) {
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error)

    // 返回離線頁面
    return new Response('離線模式', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

/**
 * 網路優先策略 (Network First)
 * 適用於: API 請求、動態內容
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request)

    // 只快取成功的響應
    if (response.status === 200) {
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error('[ServiceWorker] Network failed, using cache:', error)

    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    // 返回錯誤響應
    return new Response(JSON.stringify({
      success: false,
      message: '網路連接失敗，請檢查網路設定'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 訊息事件 - 與頁面通訊
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
