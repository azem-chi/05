/* ══════ FAB DRAGGING ══════ */
function initFab(el, posKey, clickCb) {
  const pos = S[posKey] || {top:100,right:16};
  el.style.top = pos.top+'px';
  el.style.right = pos.right+'px';
  el.style.left = 'auto';

  let dragging = false;
  let moved = false;
  let holdTimer = null;
  let startX, startY, startElLeft, startElTop;

  function getElPos() {
    const r = el.getBoundingClientRect();
    return {left: r.left, top: r.top};
  }
  function beginDrag(cx, cy) {
    dragging = true;
    moved = false;
    el.classList.add('dragging');
    const p = getElPos();
    startX = cx; startY = cy;
    startElLeft = p.left; startElTop = p.top;
  }
  function moveDrag(cx, cy) {
    if (!dragging) return;
    const dx = cx - startX, dy = cy - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    const nl = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startElLeft + dx));
    const nt = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startElTop + dy));
    el.style.left = nl + 'px';
    el.style.right = 'auto';
    el.style.top = nt + 'px';
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    const r = el.getBoundingClientRect();
    S[posKey] = {top: r.top, right: window.innerWidth - r.right};
    saveState();
  }

  // Click handler — only fires if NOT a drag
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (moved) { moved = false; return; }
    if (clickCb) clickCb();
  });

  // Mouse drag
  el.addEventListener('mousedown', e => {
    e.preventDefault();
    holdTimer = setTimeout(() => beginDrag(e.clientX, e.clientY), 400);
  });
  document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', () => {
    clearTimeout(holdTimer);
    endDrag();
  });

  // Touch drag
  el.addEventListener('touchstart', e => {
    const t = e.touches[0];
    holdTimer = setTimeout(() => beginDrag(t.clientX, t.clientY), 400);
  }, {passive: true});
  el.addEventListener('touchmove', e => {
    clearTimeout(holdTimer);
    if (dragging) { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }
  }, {passive: false});
  el.addEventListener('touchend', () => {
    clearTimeout(holdTimer);
    endDrag();
  });
}

/* ══════ STARFIELD (replaced by BG system) ══════ */
function initStarfield() { /* handled by initBG */ }

/* ══════ NETWORK ══════ */
function updateNetworkStatus() {
  const dot    = document.getElementById('net-dot');
  const banner = document.getElementById('offline-banner');
  const isOnline = navigator.onLine;
  if (dot)    dot.style.background = isOnline ? 'var(--success)' : 'var(--danger)';
  if (banner) {
    if (!isOnline) {
      banner.classList.add('show');
    } else {
      banner.classList.remove('show');
    }
  }
}

/* ══════ MAGHRIB (Ghardaïa, Algeria) ══════ */


/* ══════ MINI TOAST ══════ */
let toastTimer;
/* ══════ GROQ HOW-TO MODAL ══════ */
function showGroqHowTo() {
  const isEn = currentLang==='en', isFr = currentLang==='fr';
  const T = (ar,en,fr) => isEn?en:isFr?fr:ar;
  const existing = document.getElementById('groq-howto-modal');
  if (existing) { existing.remove(); return; }
  const modal = document.createElement('div');
  modal.id = 'groq-howto-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--dark);border-radius:24px;width:100%;max-width:380px;padding:24px;border:1.5px solid rgba(212,168,67,.3);box-shadow:0 20px 60px rgba(0,0,0,.5);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="font-size:17px;font-weight:900;color:var(--gold);">🔑 ${T('كيف تحصل على مفتاح Groq المجاني؟','How to get a free Groq API key?','Comment obtenir une clé Groq gratuite?')}</div>
        <button onclick="document.getElementById('groq-howto-modal').remove()" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer;line-height:1;">✕</button>
      </div>
      ${[
        ['1','🌐', T('افتح console.groq.com','Open console.groq.com','Ouvre console.groq.com'), T('في المتصفح مباشرة','directly in your browser','dans ton navigateur')],
        ['2','👤', T('أنشئ حساباً مجانياً','Create a free account','Crée un compte gratuit'), T('Google أو بريد إلكتروني','Google or email','Google ou email')],
        ['3','🔑', T('اضغط "API Keys" ثم "Create API Key"','Click "API Keys" then "Create API Key"','Clique "API Keys" puis "Create API Key"'), ''],
        ['4','📋', T('انسخ المفتاح (يبدأ بـ gsk_)','Copy the key (starts with gsk_)','Copie la clé (commence par gsk_)'), T('الصقه في الحقل أدناه','Paste it in the field below','Colle-la dans le champ ci-dessous')],
      ].map(([n,ic,t,sub])=>`
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${n}</div>
          <div>
            <div style="font-size:13px;color:var(--txt);font-weight:700;">${ic} ${t}</div>
            ${sub?`<div style="font-size:11px;color:var(--dim);margin-top:3px;">${sub}</div>`:''}
          </div>
        </div>`).join('')}
      <div style="background:rgba(212,168,67,.08);border-radius:12px;padding:10px 14px;margin-top:4px;border:1px solid rgba(212,168,67,.2);">
        <div style="font-size:11px;color:var(--dim);">✅ ${T('المفتاح مجاني تماماً — لا يحتاج بطاقة بنكية','100% free — no credit card required','Gratuit — pas de carte bancaire')}</div>
        <div style="font-size:11px;color:var(--dim);margin-top:4px;">⚡ ${T('يعطيك وصولاً لـ Llama 3.1 70B مجاناً','Gives you access to Llama 3.1 70B for free','Accès à Llama 3.1 70B gratuitement')}</div>
      </div>
      <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style="display:block;width:100%;margin-top:14px;padding:13px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);text-align:center;font-family:'Cairo',sans-serif;font-size:14px;font-weight:900;text-decoration:none;box-sizing:border-box;">
        🌐 ${T('افتح console.groq.com/keys','Open console.groq.com/keys','Ouvrir console.groq.com/keys')}
      </a>
    </div>`;
  document.body.appendChild(modal);
}

/* ══════ GIF HOW-TO MODAL ══════ */
function showGifHowTo() {
  const existing = document.getElementById('gif-howto-modal');
  if (existing) { existing.remove(); return; }
  const modal = document.createElement('div');
  modal.id = 'gif-howto-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--dark);border-radius:24px;width:100%;max-width:380px;padding:24px;border:1.5px solid rgba(99,102,241,.3);box-shadow:0 20px 60px rgba(0,0,0,.5);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="font-size:17px;font-weight:900;color:#818cf8;">🎬 كيف تحصل على صور متحركة للتمارين؟</div>
        <button onclick="document.getElementById('gif-howto-modal').remove()" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer;line-height:1;">✕</button>
      </div>

      <div style="font-size:12px;color:var(--dim);margin-bottom:14px;">يمكنك رفع صور عادية أو GIF متحركة. إليك أفضل المصادر المجانية:</div>

      ${[
        ['GIPHY', '🎞️', 'giphy.com', 'ابحث عن اسم التمرين بالإنجليزي مثل "push up" أو "squat" ثم احفظ الـ GIF', '#ff6b6b'],
        ['Tenor', '🔍', 'tenor.com', 'نفس طريقة GIPHY — مصدر ممتاز لتمارين اللياقة', '#f97316'],
        ['Google Images', '🖼️', 'images.google.com', 'ابحث عن اسم التمرين + "gif" مثل "burpee gif" ثم اختر أدوات → متحركة', '#3b82f6'],
        ['Pinterest', '📌', 'pinterest.com', 'مصدر غني جداً لـ GIFs التمارين بجودة عالية', '#e11d48'],
      ].map(([name,ic,url,desc,color])=>`
        <div style="background:var(--card);border-radius:14px;padding:14px;margin-bottom:10px;border:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <div style="font-size:16px;">${ic}</div>
            <div style="font-size:13px;font-weight:900;color:${color};">${name}</div>
            <div style="font-size:10px;color:var(--dim);margin-right:auto;">${url}</div>
          </div>
          <div style="font-size:11px;color:var(--dim);line-height:1.6;">${desc}</div>
        </div>`).join('')}

      <div style="background:rgba(99,102,241,.08);border-radius:12px;padding:12px;border:1px solid rgba(99,102,241,.2);margin-top:4px;">
        <div style="font-size:11px;color:#818cf8;font-weight:700;margin-bottom:6px;">💡 نصيحة:</div>
        <div style="font-size:11px;color:var(--dim);line-height:1.7;">
          ابحث باسم التمرين بالإنجليزي للحصول على نتائج أكثر.<br>
          أفضل حجم: GIF بعرض 200-400px يعمل بسلاسة.<br>
          يمكن رفع صورة عادية JPG أو PNG أيضاً.
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function _updateInstallBtns() {
  const _standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const show = !_standalone && !!deferredPrompt;
  ['dt-install-btn','tv-install-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

function homeInstallNow(btn) {
  if (!deferredPrompt) return;
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    deferredPrompt = null;
    if (choice.outcome === 'accepted') {
      // Hide mobile banner
      const banner = document.getElementById('home-install-banner');
      if (banner) {
        banner.style.transition = 'opacity .4s,transform .4s';
        banner.style.opacity = '0'; banner.style.transform = 'scale(0.95)';
        setTimeout(() => banner.remove(), 420);
      }
      // Hide desktop/TV buttons
      ['dt-install-btn','tv-install-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      showMiniToast('✅ ' + (currentLang==='en'?'App installed!':currentLang==='fr'?'App installée!':'تم تثبيت التطبيق! 🎉'));
    } else {
      if (btn) { btn.textContent = (btn.id==='dt-install-btn'||btn.id==='tv-install-btn') ? '📲 تثبيت' : window.T('installNowBtn','تثبيت الآن'); btn.disabled = false; }
    }
  });
}

function showMiniToast(msg) {
  const el = document.getElementById('mini-toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ══════ PWA ══════ */
let deferredPrompt = null;
// Handle browser Back button during session
window.addEventListener('popstate', (e) => {
  const ov = document.getElementById('session-overlay');
  if (ov && ov.classList.contains('open')) {
    clearInterval(sessTimerInterval);
    clearInterval(restTimerInterval);
    clearInterval(sessElapsedInterval);
    clearInterval(_countdownInterval); // FIX: مسح العد التنازلي
    sessPaused = false; // FIX: إعادة تعيين الإيقاف
    window._restCb = null;
    ov.classList.add('closing');
    setTimeout(() => {
      ov.classList.remove('open','closing');
      document.getElementById('sess-cel').classList.remove('show');
      document.getElementById('countdown-screen').classList.remove('show');
      document.getElementById('sess-list').classList.remove('open');
      document.exitFullscreen?.();
    }, 280);
  }
});

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  document.getElementById('pwa-btn').classList.add('show');
  updateInstallSection();
  _updateInstallBtns();
  if (typeof obRefreshInstallStep === 'function') obRefreshInstallStep();
  // Re-render home banner if workout tab is visible
  const wt = document.getElementById('tab-workout');
  if (wt && wt.classList.contains('active')) renderWorkoutTab();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.getElementById('pwa-btn').classList.remove('show');
  updateInstallSection();
  // Hide all install buttons/banners
  const banner = document.getElementById('home-install-banner');
  if (banner) { banner.style.transition='opacity .4s,transform .4s'; banner.style.opacity='0'; banner.style.transform='scale(0.95)'; setTimeout(()=>banner.remove(),420); }
  ['dt-install-btn','tv-install-btn'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
});

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isInStandaloneMode() {
  return (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone);
}

function updateInstallSection() {
  const section = document.getElementById('install-section');
  if (!section) return;
  const L = LANGS[currentLang]||LANGS.ar;
  const btn = document.getElementById('settings-install-btn');
  const iosHint = document.getElementById('install-ios-hint');
  const _ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const _standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (_standalone)   { section.style.display='none'; return; }
  if (_ios)          { section.style.display='block'; if(btn)btn.style.display='none'; if(iosHint)iosHint.style.display='block'; return; }
  if (deferredPrompt){ section.style.display='block'; if(btn){btn.style.display='block';btn.textContent=L.installBtnAndroid||'📲 تثبيت الآن';btn.onclick=installPWAFromSettings;} if(iosHint)iosHint.style.display='none'; return; }
  section.style.display='none';
}

function installPWAFromSettings() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById('pwa-btn').classList.remove('show');
      updateInstallSection();
    });
  }
}

function installPWA() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(()=>{ deferredPrompt=null; document.getElementById('pwa-btn').classList.remove('show'); updateInstallSection(); }); }
}

/* ══════ SERVICE WORKER ══════ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    // ✅ إذا وُجد SW جديد في انتظار التنشيط → نُنشّطه فوراً
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // SW جديد جاهز → أرسل له SKIP_WAITING ثم أعد تحميل الصفحة
          newSW.postMessage('SKIP_WAITING');
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          }, { once: true });
        }
      });
    });
  }).catch(()=>{});

  // استقبال إشعار SW_UPDATED من الـ service worker عند تنشيطه
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED') {
      // إعادة التحميل التلقائية بعد ثانية (لإتاحة إنهاء أي حفظ جارٍ)
      setTimeout(() => window.location.reload(), 1000);
    }
  });
}

/* ══════ ANIMATED BACKGROUNDS ══════ */
const BG_CONFIGS = {
  default: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      // Deep dark gradient
      const g = ctx.createRadialGradient(W*0.3,H*0.2,0,W/2,H/2,Math.max(W,H));
      g.addColorStop(0,'#0D1829'); g.addColorStop(0.6,'#080E1A'); g.addColorStop(1,'#07090F');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Cyan + white stars
      this.stars.forEach(s => {
        const a = 0.3 + 0.7*Math.sin(t*s.sp + s.ph);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.cyan?'56,189,248':'200,220,255'},${a})`; ctx.fill();
        if(s.cyan && s.r > 1) {
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*4,0,Math.PI*2);
          ctx.fillStyle=`rgba(56,189,248,${a*0.12})`; ctx.fill();
        }
      });
      // Subtle aurora band
      const ay = H * 0.25;
      const ag = ctx.createLinearGradient(0, ay-60, 0, ay+60);
      ag.addColorStop(0,'rgba(56,189,248,0)');
      ag.addColorStop(0.5,`rgba(56,189,248,${0.04+0.03*Math.sin(t*0.4)})`);
      ag.addColorStop(1,'rgba(56,189,248,0)');
      ctx.fillStyle=ag; ctx.fillRect(0, ay-60, W, 120);
    },
    init(W,H) {
      this.stars = Array.from({length:160},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:Math.random()*1.6+0.2, sp:0.4+Math.random()*1.8,
        ph:Math.random()*Math.PI*2, cyan:Math.random()<0.25
      }));
    }
  },

  fire: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      const g = ctx.createLinearGradient(0,H,0,0);
      g.addColorStop(0,'#1A0200'); g.addColorStop(0.5,'#2A0800'); g.addColorStop(1,'#0D0500');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Embers
      this.embers.forEach(e => {
        e.y -= e.vy; e.x += Math.sin(t*e.wx+e.ph)*0.8;
        e.life -= 0.005;
        if(e.life<=0 || e.y<-10) { e.y=H+10; e.x=Math.random()*W; e.life=0.7+Math.random()*0.3; }
        const a = e.life;
        const r = e.r*(0.5+e.life*0.5);
        ctx.beginPath(); ctx.arc(e.x,e.y,r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${e.hot?'255,140,0':'255,80,0'},${a})`; ctx.fill();
        ctx.shadowColor=e.hot?'#FF8C00':'#FF4500'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,220,100,${a*0.8})`; ctx.fill();
        ctx.shadowBlur=0;
        if(r>2) {
          ctx.beginPath(); ctx.arc(e.x,e.y,r*1.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,200,50,${a*0.3})`; ctx.fill();
        }
      });
      // Flame glow at bottom
      const fg = ctx.createLinearGradient(0,H,0,H*0.6);
      fg.addColorStop(0,'rgba(255,69,0,0.15)'); fg.addColorStop(1,'rgba(255,69,0,0)');
      ctx.fillStyle=fg; ctx.fillRect(0,0,W,H);
    },
    init(W,H) {
      this.embers = Array.from({length:80},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:1+Math.random()*3, vy:0.5+Math.random()*2,
        wx:0.5+Math.random()*2, ph:Math.random()*Math.PI*2,
        life:Math.random(), hot:Math.random()<0.5
      }));
    }
  },

  ocean: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#00070F'); g.addColorStop(0.6,'#000D1A'); g.addColorStop(1,'#001529');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Bubbles
      this.bubbles.forEach(b => {
        b.y -= b.vy; b.x += Math.sin(t*b.wx+b.ph)*0.5;
        if(b.y < -20) { b.y=H+20; b.x=Math.random()*W; }
        const a = 0.1+0.3*Math.sin(t*2+b.ph);
        ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
        ctx.strokeStyle=`rgba(0,180,216,${a})`; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle=`rgba(0,180,216,${a*0.2})`; ctx.fill();
      });
      // Waves
      for(let w=0;w<3;w++) {
        ctx.beginPath();
        const yBase = H*(0.4+w*0.15);
        const amp = 15-w*3, freq=0.008+w*0.003, speed=t*(0.3+w*0.1);
        for(let x=0;x<=W;x+=4) {
          const y = yBase + amp*Math.sin(x*freq+speed);
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
        ctx.fillStyle=`rgba(0,150,199,${0.12-w*0.03})`; ctx.fill();
      }
    },
    init(W,H) {
      this.bubbles = Array.from({length:60},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:2+Math.random()*8, vy:0.3+Math.random()*1,
        wx:0.5+Math.random()*2, ph:Math.random()*Math.PI*2
      }));
    }
  },

  nature: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#020A05'); g.addColorStop(1,'#071A0E');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Falling leaves
      this.leaves.forEach(l => {
        l.y += l.vy; l.x += Math.sin(t*l.wx+l.ph)*1.2;
        l.rot += l.rspeed;
        if(l.y>H+20) { l.y=-20; l.x=Math.random()*W; }
        ctx.save();
        ctx.translate(l.x,l.y); ctx.rotate(l.rot);
        const lc = l.type===0?'82,183,136':l.type===1?'45,106,79':'149,213,178';
        ctx.fillStyle=`rgba(${lc},${l.a})`;
        ctx.beginPath();
        ctx.ellipse(0,0,l.w,l.h,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
      // Ground glow
      const gg = ctx.createLinearGradient(0,H,0,H*0.7);
      gg.addColorStop(0,'rgba(45,106,79,0.1)'); gg.addColorStop(1,'rgba(45,106,79,0)');
      ctx.fillStyle=gg; ctx.fillRect(0,0,W,H);
    },
    init(W,H) {
      this.leaves = Array.from({length:50},()=>({
        x:Math.random()*W, y:Math.random()*H,
        w:4+Math.random()*8, h:2+Math.random()*4,
        vy:0.4+Math.random()*1.2, wx:0.5+Math.random()*2,
        ph:Math.random()*Math.PI*2, rot:Math.random()*Math.PI*2,
        rspeed:(Math.random()-0.5)*0.05, a:0.3+Math.random()*0.5,
        type:Math.floor(Math.random()*3), bright:Math.random()<0.3
      }));
    }
  },

  neon: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#050008'; ctx.fillRect(0,0,W,H);
      // Grid lines
      ctx.lineWidth=0.5;
      const gs=60, pers=0.6;
      const vanY=H*0.45;
      for(let x=0;x<=W;x+=gs) {
        const a=0.15+0.2*Math.abs(Math.sin(t*0.5+x*0.01));
        ctx.strokeStyle=`rgba(249,0,191,${a})`; ctx.beginPath();
        ctx.moveTo(x,vanY); ctx.lineTo(x+(x-W/2)*pers*0.5, H); ctx.stroke();
      }
      for(let row=0;row<8;row++) {
        const y=vanY+(H-vanY)*Math.pow(row/8,1.5);
        const a=0.1+0.15*(row/8);
        ctx.strokeStyle=`rgba(249,0,191,${a})`; ctx.beginPath();
        ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      }
      // Laser beams
      this.beams.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if(b.x<-50||b.x>W+50||b.y<-50||b.y>H+50) {
          b.x=Math.random()*W; b.y=b.vy>0?-20:H+20;
        }
        const a=0.4+0.4*Math.sin(t*3+b.ph);
        ctx.strokeStyle=`rgba(${b.cyan?'0,255,198':'249,0,191'},${a})`;
        ctx.lineWidth=b.w; ctx.shadowColor=b.cyan?'#00FFC6':'#F900BF'; ctx.shadowBlur=12;
        ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+b.dx*30,b.y+b.dy*30); ctx.stroke();
        ctx.shadowBlur=0;
      });
    },
    init(W,H) {
      this.beams = Array.from({length:12},()=>{
        const ang = Math.random()*Math.PI*2;
        return {
          x:Math.random()*W, y:Math.random()*H,
          vx:Math.cos(ang)*1.5, vy:Math.sin(ang)*1.5,
          dx:Math.cos(ang), dy:Math.sin(ang),
          w:0.5+Math.random()*1.5, ph:Math.random()*Math.PI*2,
          cyan:Math.random()<0.4
        };
      });
    }
  },

  purple: {
    draw(ctx, W, H, t) {
      ctx.clearRect(0,0,W,H);
      const g = ctx.createRadialGradient(W*0.3,H*0.3,0,W*0.3,H*0.3,Math.max(W,H)*0.8);
      g.addColorStop(0,'#180028'); g.addColorStop(0.5,'#0F0019'); g.addColorStop(1,'#07000F');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Nebula clouds
      this.clouds.forEach(c => {
        c.t += 0.002;
        const x=c.x+Math.sin(c.t)*20, y=c.y+Math.cos(c.t*0.7)*15;
        const cg = ctx.createRadialGradient(x,y,0,x,y,c.r);
        cg.addColorStop(0,`rgba(157,78,221,${c.a})`);
        cg.addColorStop(0.5,`rgba(124,47,190,${c.a*0.4})`);
        cg.addColorStop(1,'rgba(157,78,221,0)');
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(x,y,c.r,0,Math.PI*2); ctx.fill();
      });
      // Stars
      this.stars.forEach(s => {
        const a = 0.2+0.7*Math.sin(t*s.sp+s.ph);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.purple?'199,125,255':'255,255,255'},${a})`; ctx.fill();
      });
    },
    init(W,H) {
      this.clouds = Array.from({length:6},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:80+Math.random()*120, a:0.05+Math.random()*0.1, t:Math.random()*Math.PI*2
      }));
      this.stars = Array.from({length:120},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:0.5+Math.random()*1.5, sp:0.5+Math.random()*2,
        ph:Math.random()*Math.PI*2, purple:Math.random()<0.3
      }));
    }
  },

  light: {
    init(W, H) {
      this.orbs = Array.from({length: 6}, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 80 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        hue: [200, 210, 195, 220, 185, 205][i],
        phase: Math.random() * Math.PI * 2,
      }));
      this.particles = Array.from({length: 22}, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.4,
        a: 0.3 + Math.random() * 0.5,
      }));
    },
    draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      // Pure white base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      // Subtle mesh gradient overlay
      const mg = ctx.createLinearGradient(0, 0, W, H);
      mg.addColorStop(0, 'rgba(224,242,254,0.5)');
      mg.addColorStop(0.5, 'rgba(240,249,255,0.3)');
      mg.addColorStop(1, 'rgba(219,234,254,0.4)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      // Floating soft orbs
      this.orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const pulse = 0.06 + 0.04 * Math.sin(t * 0.7 + o.phase);
        const og = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        og.addColorStop(0, `hsla(${o.hue},80%,65%,${pulse})`);
        og.addColorStop(0.6, `hsla(${o.hue},70%,70%,${pulse * 0.4})`);
        og.addColorStop(1, `hsla(${o.hue},60%,75%,0)`);
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });
      // Floating sparkle particles
      this.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        const flicker = p.a * (0.7 + 0.3 * Math.sin(t * 2 + p.x));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14,165,233,${flicker * 0.35})`;
        ctx.fill();
      });
      // Top-left soft glow accent
      const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.6);
      tg.addColorStop(0, `rgba(56,189,248,${0.06 + 0.02 * Math.sin(t * 0.5)})`);
      tg.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);
      // Bottom-right soft glow accent
      const bg2 = ctx.createRadialGradient(W, H, 0, W, H, W * 0.5);
      bg2.addColorStop(0, `rgba(99,102,241,${0.05 + 0.02 * Math.sin(t * 0.4 + 1)})`);
      bg2.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = bg2; ctx.fillRect(0, 0, W, H);
    }
  }
};

let bgCanvas, bgCtx, bgW, bgH, bgT=0, bgRAF=null, bgCurrent='default';

function initBG() {
  bgCanvas = document.getElementById('starfield');
  if(!bgCanvas) return;
  bgCtx = bgCanvas.getContext('2d');
  bgW = bgCanvas.width = window.innerWidth;
  bgH = bgCanvas.height = window.innerHeight;
  window.addEventListener('resize', ()=>{
    bgW = bgCanvas.width = window.innerWidth;
    bgH = bgCanvas.height = window.innerHeight;
    const cfg = BG_CONFIGS[bgCurrent];
    if(cfg && cfg.init) cfg.init(bgW, bgH);
  });
  setBG(bgCurrent);
}

function setBG(theme) {
  bgCurrent = theme;
  const cfg = BG_CONFIGS[theme] || BG_CONFIGS.default;
  if(cfg.init) cfg.init(bgW, bgH);
  if(bgRAF) cancelAnimationFrame(bgRAF);
  function loop() {
    bgT += 0.016;
    cfg.draw(bgCtx, bgW, bgH, bgT);
    bgRAF = requestAnimationFrame(loop);
  }
  loop();
}

/* ══════ MODE SYSTEM ══════ */
const MODES = ['mobile','desktop'];
function cycleMode() {
  const idx = MODES.indexOf(S.mode||'mobile');
  S.mode = MODES[(idx+1) % MODES.length];
  saveState();
  applyMode();
  showMiniToast(S.mode==='mobile'?'📱 جوال':'🖥️ كمبيوتر');
}
function applyMode() {
  const m = S.mode||'mobile';
  document.body.classList.remove('desktop-mode','tv-mode');
  // Close coach modal if switching away from desktop/tv
  const coachModal = document.getElementById('coach-modal');
  if (coachModal) coachModal.style.display = 'none';
  if(m==='desktop') { document.body.classList.add('desktop-mode'); dtRender(); }
  // Keyboard bar: desktop only
  const kbBar = document.getElementById('kb-bar');
  if (kbBar) kbBar.style.display = m === 'desktop' ? 'flex' : 'none';
  // Update mode button text
  const icons={mobile:'📱',desktop:'🖥️'};
  const modeBtn = document.getElementById('mode-hdr-btn');
  if(modeBtn) modeBtn.textContent = icons[m]||'📱';
}

/* ══════ DESKTOP MODE ══════ */
function dtRender() {
  dtBuildDayStrip();
  dtRenderExList();
  dtUpdateStats();
  dtBuildThemeDots();
  dtUpdateTimer();
  initDraggablePanels();
  _updateInstallBtns();
}
function initDraggablePanels() {
  // Make dt-panels within each column reorderable via drag
  document.querySelectorAll('.dt-left, .dt-right').forEach(col => {
    const panels = col.querySelectorAll('.dt-panel');
    panels.forEach(panel => {
      if (panel._dragInited) return;
      panel._dragInited = true;
      panel.setAttribute('draggable','true');
      panel.addEventListener('dragstart', e => {
        panel.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        col._dragging = panel;
      });
      panel.addEventListener('dragend', () => {
        panel.classList.remove('dragging');
        col.querySelectorAll('.dt-panel').forEach(p => p.classList.remove('drag-over'));
      });
      panel.addEventListener('dragover', e => {
        e.preventDefault();
        if (col._dragging && col._dragging !== panel) {
          col.querySelectorAll('.dt-panel').forEach(p => p.classList.remove('drag-over'));
          panel.classList.add('drag-over');
        }
      });
      panel.addEventListener('drop', e => {
        e.preventDefault();
        panel.classList.remove('drag-over');
        if (col._dragging && col._dragging !== panel) {
          const allP = [...col.querySelectorAll('.dt-panel')];
          const fromIdx = allP.indexOf(col._dragging);
          const toIdx = allP.indexOf(panel);
          if (fromIdx < toIdx) col.insertBefore(col._dragging, panel.nextSibling);
          else col.insertBefore(col._dragging, panel);
        }
        col._dragging = null;
      });
    });
  });
}

function dtBuildDayStrip() {
  const strip = document.getElementById('dt-day-strip');
  if(!strip) return;
  const progDays = S.user?.programDays || 30;
  strip.innerHTML = '';
  for(let d=1;d<=progDays;d++) {
    const sched = getDaySchedule(d);
    const btn = document.createElement('button');
    btn.className = 'dt-day-btn' +
      (d===S.currentDay?' active':'') +
      (S.completedDays.includes(d)?' done':'') +
      (sched.type==='rest'?' rest':'');
    btn.innerHTML = `<span class="dn">${d}</span><span style="font-size:8px">${sched.label}</span>`;
    btn.onclick = ()=>{ S.currentDay=d; saveState(); dtRender(); render(); };
    strip.appendChild(btn);
  }
  setTimeout(()=>{ const a=strip.querySelector('.active'); if(a) a.scrollIntoView({inline:'center',block:'nearest'}); },100);
  if (!strip._wheelInited) {
    strip._wheelInited = true;
    strip.addEventListener('wheel', e => { if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return; e.preventDefault(); const rtl = document.documentElement.dir==='rtl'; strip.scrollLeft += e.deltaY*2.5*(rtl?-1:1); }, {passive:false}); // FIX#10: RTL scroll direction
  }
}
function dtRenderExList() {
  const el = document.getElementById('dt-ex-list');
  if(!el) return;
  const sched = getDaySchedule(S.currentDay);
  if(sched.type==='rest') {
    el.innerHTML=`<div style="padding:20px;text-align:center;color:var(--dim)"><div style="font-size:40px">😴</div><div style="margin-top:8px;font-size:13px">${window.T('restDay')}</div></div>`;
    return;
  }
  el.innerHTML = sched.exercises.map((ex,i)=>{
    const doneKey=S.currentDay+'_'+ex.id;
    const done=S.completedExercises[doneKey];
    const img=S.customImages?.[ex.id];
    const gifSrc=getExGif(ex.id);
    const thumbContent=img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:gifSrc?`<img src="${gifSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:`${ex.icon}`;
    return `<div class="dt-ex-card${done?' dt-done':''}" id="dtex-${ex.id}" onclick="dtSelectEx('${ex.id}')">
      <div class="dt-ex-thumb">${thumbContent}</div>
      <div class="dt-ex-info">
        <div class="dt-ex-name">${_escHtml(currentLang==='ar'?ex.nameAr:(ex.nameEn||ex.nameAr))}</div>
        <div class="dt-ex-meta">${ex.sets}×${ex.reps} ${getRepsLabel(ex)} • ${_escHtml(ex.muscles)}</div>
      </div>
      ${done?'<span style="color:var(--green);font-size:14px">✓</span>':''}
    </div>`;
  }).join('');
  // Auto-show the first (or current active) exercise in center panel
  const firstEx = sched.exercises[0];
  if (firstEx) {
    const center = document.getElementById('dt-center');
    if (center && center.querySelector('.dt-center-empty')) {
      // Center is still empty → show first exercise
      dtSelectEx(firstEx.id);
    } else if (center && !center.querySelector('.dt-ex-detail')) {
      dtSelectEx(firstEx.id);
    }
  }
}
function dtSelectEx(id) {
  const sched = getDaySchedule(S.currentDay);
  const ex = sched.exercises.find(e=>e.id===id);
  if(!ex) return;
  document.querySelectorAll('.dt-ex-card').forEach(c=>c.classList.remove('dt-active'));
  document.getElementById('dtex-'+id)?.classList.add('dt-active');
  const center = document.getElementById('dt-center');
  if(!center) return;
  const doneKey=S.currentDay+'_'+ex.id;
  const done=S.completedExercises[doneKey];
  const img=S.customImages?.[ex.id];
  const gifSrc=getExGif(ex.id);
  const illustContent=img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover">`:gifSrc?`<img src="${gifSrc}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:90px">${ex.icon}</span>`;
  center.innerHTML = `
    <div class="dt-ex-detail">
      <div class="dt-illus">${illustContent}</div>
      <div class="dt-ex-detail-body">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px;">
          <div class="dt-ex-name-big">${_escHtml(currentLang==='ar'?ex.nameAr:ex.nameEn||ex.nameAr)}</div>
          <button onclick="openExEditor('${ex.id}',${S.currentDay})" style="padding:4px 10px;border-radius:8px;background:rgba(212,168,67,.12);border:1px solid rgba(212,168,67,.3);color:var(--gold);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;">✏️</button>
        </div>
        <div style="font-size:13px;color:var(--dim);margin-bottom:12px;">${_escHtml(ex.nameEn)}</div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <span style="background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.25);border-radius:20px;padding:5px 14px;font-size:13px;color:var(--gold);font-weight:700;">${ex.sets} ${window.T('sets')}</span>
          <span style="background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.25);border-radius:20px;padding:5px 14px;font-size:13px;color:var(--gold);font-weight:700;">${ex.reps} ${getRepsLabel(ex)}</span>
          <span style="background:var(--card);border:1px solid var(--border);border-radius:20px;padding:5px 14px;font-size:12px;color:var(--dim);">${_escHtml(ex.muscles)}</span>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button onclick="dtMarkDone('${ex.id}')" style="flex:1;max-width:180px;padding:12px;border-radius:12px;background:${done?'var(--green)':'var(--card)'};color:${done?'#000':'var(--gold)'};border:2px solid ${done?'var(--green)':'rgba(212,168,67,.3)'};font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:.2s;">
            ${done?'✅ مكتمل':'☑️ إكمال'}
          </button>
          <button onclick="startGuidedSession()" style="flex:1;max-width:180px;padding:12px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--gd));color:var(--night);border:none;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:.2s;">
            ▶ ابدأ الجلسة
          </button>
        </div>
      </div>
    </div>`;
}
function dtMarkDone(id) {
  const key = S.currentDay + '_' + id;
  // لا تُضف إذا كان مكتملاً مسبقاً
  if (S.completedExercises[key]) { dtRenderExList(); dtSelectEx(id); return; }
  S.completedExercises[key] = true;
  const _allEx = [...EXERCISES, ...(S.customExercises||[])];
  const _ex = _allEx.find(e => e.id === id);
  const _cal = calcExCal(_ex, parseFloat(S.user?.weight) || 70);
  S.calories += _cal;
  // FIX: تتبع السعرات في _manualExCal لمنع التكرار مع showSessCelebration
  if (!S._manualExCal) S._manualExCal = {};
  S._manualExCal[key] = (S._manualExCal[key] || 0) + _cal;
  saveState();
  dtRenderExList(); dtSelectEx(id); dtUpdateStats(); renderHeaderStats();
  checkBadges();
}
function dtUpdateStats() {
  const els=[['dt-st-day',S.currentDay],['dt-st-done',S.completedDays.length],['dt-st-str',S.streak],['dt-st-cal',S.calories]];
  els.forEach(([id,val])=>{ const e=document.getElementById(id); if(e) e.textContent=val; });
}
function dtBuildThemeDots() {
  const el = document.getElementById('dt-theme-dots');
  if(!el) return;
  el.innerHTML = THEMES.map(t=>`<div class="dt-th-dot${S.theme===t.id?' active':''}" style="background:${t.dot}" onclick="setTheme('${t.id}')" title="${t.name}"></div>`).join('');
}
function dtUpdateTimer() {
  const el = document.getElementById('dt-t-disp');
  if(el) el.textContent = formatTime(timerRemain);
}
function formatTime(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

/* ══════ TV MODE ══════ */
