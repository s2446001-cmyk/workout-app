// ===== PWA Service Worker =====
// バージョンを上げる（v1 → v2 …）と、古いキャッシュを捨てて作り直します。
// ファイルを更新しても反映されないときは、ここの番号を上げてください。
const CACHE = "kintore-v13";

// オフライン用に最初にキャッシュしておくファイル
const ASSETS = [
  "./",
  "index.html",
  "timer.html",
  "exercise.html",
  "record.html",
  "calorie.html",
  "graph.html",
  "style.css",
  "script.js",
  "ai.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// インストール：主要ファイルを先読みキャッシュ（1つ失敗しても止めない）
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// 有効化：古いバージョンのキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取得：
//  同一サイトのファイル → ネット優先（編集が即反映。オフライン時はキャッシュ）
//  外部（Chart.jsなど）   → キャッシュ優先（一度読めばオフラインでも動く）
self.addEventListener("fetch", (e) => {

  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
      )
    );
  }
});
