// ============================================================
// AZEM (عزم) — Service Worker v7
// Strategy: Cache-First (assets) + Network-First (fonts)
// ============================================================

const APP_CACHE  = 'azem-app-v28';
const FONT_CACHE = 'azem-fonts-v2';
const VERSION    = '9.4.0';

// Core files — must be cached at install time (بدون gifs.js الثقيل)
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192-2.png',
  './icon-512-2.png',
  './css/styles.css',
  './js/data.js?v=28',
  './js/audio.js?v=28',
  './js/i18n.js?v=28',
  './js/timer.js?v=28',
  './js/session.js?v=28',
  './js/render.js?v=28',
  './js/editor.js?v=28',
  './js/ui.js?v=28',
  './js/coach.js?v=28',
  './js/firebase.js?v=28',
  './js/charts.js?v=28',
  './js/nutrition.js?v=28',
];

// FIX: gifs.js (~8MB) يُخزَّن مؤقتاً بشكل منفصل — فشله لا يُوقف تثبيت SW
const OPTIONAL_ASSETS = [
  './gifs.js',
];

// ---- Install: cache all core assets ----
self.addEventListener('install', e => {
  console.log(`[SW ${VERSION}] Installing...`);
  e.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => {
        // FIX: تخزين الملفات الاختيارية (gifs.js) بشكل مستقل — الخطأ يُسجَّل فقط
        return caches.open(APP_CACHE).then(cache =>
          Promise.allSettled(
            OPTIONAL_ASSETS.map(url =>
              cache.add(url).catch(err =>
                console.warn(`[SW] Optional asset failed to cache: ${url}`, err)
              )
            )
          )
        );
      })
      .then(() => {
        console.log(`[SW ${VERSION}] Core assets cached ✓`);
        return self.skipWaiting();
      })
  );
});

// ---- Fetch: smart routing ----
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension
  if(e.request.method !== 'GET') return;
  if(url.protocol === 'chrome-extension:') return;

  // Google Fonts — Stale-While-Revalidate
  if(url.hostname.includes('fonts.googleapis.com') ||
     url.hostname.includes('fonts.gstatic.com')){
    e.respondWith(staleWhileRevalidate(e.request, FONT_CACHE));
    return;
  }

  // Core app assets — Cache-First
  if(url.origin === self.location.origin){
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // Everything else — Network with cache fallback
  e.respondWith(networkFirst(e.request));
});

// ---- Strategies ----

// Cache-First: serve from cache, background update
async function cacheFirst(req){
  const cached = await caches.match(req);
  if(cached){
    // Background update
    update(req, APP_CACHE);
    return cached;
  }
  return networkWithCacheSave(req, APP_CACHE);
}

// Network-First: try network, fall back to cache
async function networkFirst(req){
  try{
    const res = await fetch(req);
    if(res && res.ok && res.type !== 'opaque'){
      const cache = await caches.open(APP_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch(_){
    const cached = await caches.match(req);
    return cached || offlineFallback();
  }
}

// Stale-While-Revalidate: return cached immediately, update in background
async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if(res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(()=>{});
  return cached || fetchPromise;
}

async function networkWithCacheSave(req, cacheName){
  try{
    const res = await fetch(req);
    if(res && res.ok){
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch(_){
    return offlineFallback();
  }
}

// Background cache update (don't wait)
function update(req, cacheName){
  fetch(req).then(res => {
    if(res && res.ok){
      caches.open(cacheName).then(c => c.put(req, res.clone()));
    }
  }).catch(()=>{});
}

// Offline fallback page
async function offlineFallback(){
  const cached = await caches.match('./index.html');
  if(cached) return cached;
  return new Response(
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>AZEM — غير متصل</title>
    <style>body{background:#07090F;color:#D4A843;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}h1{font-size:3em}p{color:#6B6357}</style>
    </head><body><h1>⚡</h1><h2>AZEM (عزم)</h2><p>لا يوجد اتصال بالإنترنت</p><p>سيعمل التطبيق عند إعادة الاتصال</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ════════════════════════════════════════════
// AZEM Smart Notification System v2
// ════════════════════════════════════════════

// ── IndexedDB helpers ──
function dbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('azem-sw', 2);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('config')) db.createObjectStore('config');
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGet(key) {
  try {
    const db = await dbOpen();
    return new Promise(resolve => {
      const tx = db.transaction('config', 'readonly');
      const req = tx.objectStore('config').get(key);
      req.onsuccess = () => resolve(req.result != null ? req.result : null);
      req.onerror   = () => resolve(null);
    });
  } catch(e) { return null; }
}
async function dbSet(key, value) {
  try {
    const db = await dbOpen();
    return new Promise(resolve => {
      const tx = db.transaction('config', 'readwrite');
      tx.objectStore('config').put(value, key);
      tx.oncomplete = resolve;
      tx.onerror    = resolve;
    });
  } catch(e) {}
}

// ── بناء رسالة إشعار ذكية حسب السياق ──
function buildNotifContent(cfg) {
  const name       = cfg.name       || 'بطل';
  const day        = cfg.day        || 1;
  const streak     = cfg.streak     || 0;
  const donePct    = cfg.donePct    || 0;
  const isDoneToday  = cfg.isDoneToday  || false;
  const isRestDay    = cfg.isRestDay    || false;
  const daysMissed   = cfg.daysMissed   || 0;
  const personality  = cfg.personality  || 'balanced';
  const daysLeft     = cfg.daysLeft     || 99;
  const coachMsg     = cfg.coachMsg     || '';

  // تذكير شرب الماء
  if (cfg.waterReminder && cfg.waterInterval) {
    const lastWater = cfg.lastWaterNotif || 0;
    const intervalMs = (cfg.waterInterval || 2) * 3600 * 1000;
    if (nowTs - lastWater > intervalMs) {
      const cups = cfg.waterCups || 0;
      const target = cfg.waterTarget || 8;
      return {
        title: '💧 تذكير الماء',
        body: `شربت ${cups} من ${target} أكواب — اشرب كوباً الآن!`,
        tag: 'azem-water'
      };
    }
  }

  if (coachMsg) {
    return { title: '🤖 المدرب الذكي · AZEM', body: coachMsg.slice(0, 140), tag: 'azem-coach' };
  }
  // Loss Aversion — سلسلة في خطر
  if (!isDoneToday && !isRestDay && streak >= 2 && daysMissed === 0) {
    const h = new Date().getHours();
    const trainH = parseInt((cfg.trainTime||'18:00').split(':')[0]);
    const diff = ((trainH - h) + 24) % 24;
    if (diff <= 2 && diff > 0) {
      return {
        title: `⚠️ سلسلة ${streak} يوم في خطر!`,
        body: `${name}! متبقي ${diff} ${diff===1?'ساعة':'ساعتان'} — لا تدع ${streak} يوماً تضيع!`,
        tag: 'azem-loss-warn'
      };
    }
  }
  if (isDoneToday) {
    return { title: '✅ أحسنت! · AZEM', body: `${name}، اليوم ${day} مكتمل! تعافَّ جيداً 💪`, tag: 'azem-done' };
  }
  if (isRestDay) {
    return { title: '😴 يوم راحة · AZEM', body: `${name}، اليوم راحة مبرمجة — جسمك يبني العضلات الآن.`, tag: 'azem-rest' };
  }
  if (daysMissed >= 2) {
    const body = personality === 'needs_push'
      ? `${name}! ${daysMissed} أيام بدون تمرين — تمرين واحد اليوم يكفي! 🔥`
      : `${name}، غبت ${daysMissed} أيام. كل شيء بخير؟ عد بأي وقت 💪`;
    return { title: '⚡ AZEM يفتقدك!', body, tag: 'azem-absence' };
  }
  if (daysLeft <= 3 && daysLeft > 0) {
    return { title: `🏁 ${daysLeft} أيام للإنجاز!`, body: `${name}، الخط النهائي أمامك! 🏆`, tag: 'azem-finish' };
  }
  if (streak >= 7) {
    return { title: `🔥 ${streak} أيام متواصلة!`, body: `${name}! تمرين اليوم ${day} في انتظارك 💪`, tag: 'azem-streak' };
  }
  const bodies = [
    `${name}، تمرين اليوم ${day} في انتظارك! ${donePct}% مكتمل 💪`,
    `${name}، حان وقت AZEM! ${streak > 0 ? `سلسلتك ${streak} أيام` : 'ابدأ سلسلتك اليوم'} 🔥`,
  ];
  return { title: 'AZEM (عزم) 🏋️', body: bodies[Math.floor(Date.now()/86400000) % bodies.length], tag: 'azem-reminder' };
}

// ── التحقق وإرسال الإشعار ──
async function checkAndNotify() {
  const cfg = await dbGet('reminder');
  if (!cfg || !cfg.trainTime) return;
  const now = new Date();
  const [h, m] = cfg.trainTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;
  const diffMins = (now.getHours() - h) * 60 + (now.getMinutes() - m);
  if (Math.abs(diffMins) > 1) return;
  const lastSent = await dbGet('lastNotifSent') || 0;
  if (Date.now() - lastSent < 23 * 3600 * 1000) return;
  await dbSet('lastNotifSent', Date.now());
  const content = buildNotifContent(cfg);
  await self.registration.showNotification(content.title, {
    body: content.body, icon: './icon-192-2.png', badge: './icon-192-2.png',
    tag: content.tag, renotify: false, vibrate: [200, 100, 200],
    data: { url: './' },
    actions: [{ action: 'open', title: '▶ افتح' }, { action: 'snooze', title: '⏰ +ساعة' }]
  });
}

// ── معالج النقر على الإشعار ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'snooze') {
    dbSet('lastNotifSent', Date.now() - 22 * 3600 * 1000);
    return;
  }
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const azem = clients.find(c => c.url.includes(self.registration.scope));
      if (azem) return azem.focus();
      return self.clients.openWindow('./');
    })
  );
});

// ---- Listen for messages from app ----
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION') e.source.postMessage({ type: 'VERSION', version: VERSION });
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    dbSet('reminder', e.data.config);
  }
  if (e.data?.type === 'CANCEL_REMINDER') {
    dbSet('reminder', null);
    dbSet('lastNotifSent', 0);
  }
  if (e.data?.type === 'COACH_NOTIFY') {
    const body = (e.data.message || '').slice(0, 150);
    const name = e.data.name || 'بطل';
    if (body) {
      self.registration.showNotification('🤖 المدرب الذكي · AZEM', {
        body, icon: './icon-192-2.png', tag: 'azem-coach-instant',
        vibrate: [100, 50, 100], data: { url: './' }
      });
    }
  }
});;

// ---- إشعار الصفحة عند توفر نسخة جديدة ----
self.addEventListener('activate', e => {
  console.log(`[SW ${VERSION}] Activating...`);
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k !== APP_CACHE && k !== FONT_CACHE)
        .map(k => {
          console.log(`[SW] Deleting old cache: ${k}`);
          return caches.delete(k);
        })
    )).then(() => {
      // أبلغ النوافذ فقط عند التحديث الحقيقي — لا عند أول تثبيت
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        // self.clients.claim() أولاً حتى نتحكم في النوافذ
        return self.clients.claim().then(() => {
          // أرسل SW_UPDATED فقط إذا كان هناك نوافذ مفتوحة فعلاً (تحديث وليس تثبيت)
          if (clients.length > 0) {
            clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: VERSION }));
          }
        });
      });
    })
  );
});

// ── Periodic Sync (للمتصفحات التي تدعمه) ──
self.addEventListener('periodicsync', e => {
  if (e.tag === 'azem-reminder') {
    e.waitUntil(checkAndNotify());
  }
});

// ── Fallback: فحص دوري كل دقيقة عندما SW نشط ──
// يعمل عندما التطبيق مفتوح أو SW في الخلفية
let _notifCheckInterval = null;
function startNotifCheck() {
  if (_notifCheckInterval) return;
  _notifCheckInterval = setInterval(() => { checkAndNotify(); }, 60 * 1000);
  // فحص فوري عند البدء
  setTimeout(() => checkAndNotify(), 3000);
}
self.addEventListener('activate', () => { startNotifCheck(); });
// إعادة البدء عند استقبال أي رسالة (يعني SW نشط)
self.addEventListener('fetch', () => {
  if (!_notifCheckInterval) startNotifCheck();
});
