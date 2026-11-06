// يجعل الموقع يعمل كتطبيق، ويفتح بدون إنترنت بعد أول زيارة
const CACHE = "bustan-v3";
const FILES = ["./", "index.html", "style.css", "app.js", "data.js", "logo.svg", "logo-girl.svg", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return; // ملفات الصوت تُترك للمتصفح
  const url = new URL(req.url);
  // ملفات الموقع والخطوط والآيات: الشبكة أولًا، ثم النسخة المحفوظة
  if (url.origin === location.origin || url.host.includes("fonts.g") || url.host === "api.alquran.cloud") {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: url.origin === location.origin }).then((r) => r || caches.match("index.html")))
    );
  }
});
