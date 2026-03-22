/* ══════ SESSION OVERLAY ══════ */
let sessExs = [], sessIdx = 0, sessSet = 1, sessRunning = false, sessPaused = false;
let sessTimerInterval = null, sessTimerRemain = 0, sessTimerTotal = 0;
let restTimerInterval = null, restRemain = 0, restTotal = 30;
let sessElapsedSecs = 0, sessElapsedInterval = null;
let sessTimerStarted = false; // has the current set timer been started?
let sessAutoPlay = false;     // auto-start timer after rest/next set
let _countdownInterval = null; // FIX: global so closeSession/skip/prev can clear it

function fmtSecs(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return (m > 0 ? m + ':' + String(sec).padStart(2,'0') : String(sec));
}
function fmtMM(s) { // always MM:SS
  const m = Math.floor(s / 60), sec = s % 60;
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

/* ══════════════════════════════════════════
   LANDSCAPE SESSION MODE
   وضع أفقي محسّن للتمرين
══════════════════════════════════════════ */

let _landscapeMode = false;
let _orientationHandler = null;

function toggleLandscapeMode() {
  _landscapeMode = !_landscapeMode;
  const overlay = document.getElementById('session-overlay');
  if (_landscapeMode) {
    overlay.classList.add('landscape-mode');
    // طلب orientation lock على الجوال
    try {
      screen.orientation?.lock('landscape').catch(() => {});
    } catch(e) {}
    _syncLandscapeUI();
  } else {
    overlay.classList.remove('landscape-mode');
    try { screen.orientation?.unlock(); } catch(e) {}
  }
}

// مزامنة الـ UI في landscape مع الحالة الحالية
function _syncLandscapeUI() {
  if (!_landscapeMode) return;
  const ex = sessExs[sessIdx];
  if (!ex) return;

  // اسم + مجموعة
  const lsName = document.getElementById('sess-ls-name');
  const lsSet  = document.getElementById('sess-ls-set');
  const lsNum  = document.getElementById('sess-ls-num');
  if (lsName) lsName.textContent = getExName(ex);
  if (lsSet)  lsSet.textContent  = `مجموعة ${sessSet}/${ex.sets}`;
  if (lsNum)  lsNum.textContent  = `${sessIdx+1}/${sessExs.length}`;

  // GIF / صورة
  const lsImg = document.getElementById('sess-ls-img');
  if (lsImg) {
    const customImg = S.customImages?.[ex.id];
    const gifSrc    = getExGif(ex.id);
    if (customImg) {
      lsImg.innerHTML = `<img src="${customImg}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
    } else if (gifSrc) {
      lsImg.innerHTML = `<img src="${gifSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
    } else {
      lsImg.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;">${ex.icon}</div>`;
    }
  }

  // مؤقت
  _syncLandscapeTimer();
}

function _syncLandscapeTimer() {
  if (!_landscapeMode) return;
  const lsTimer = document.getElementById('sess-ls-timer');
  const lsBar   = document.getElementById('sess-ls-bar');
  const lsHint  = document.getElementById('sess-ls-hint');
  const lsMain  = document.getElementById('sess-ls-main');
  const ex = sessExs[sessIdx];
  if (!ex) return;

  if (ex.type === 'timer') {
    if (lsTimer) lsTimer.textContent = fmtMM(sessTimerRemain);
    if (lsBar && sessTimerTotal > 0)
      lsBar.style.width = (sessTimerRemain/sessTimerTotal*100) + '%';
    if (lsMain) lsMain.textContent = sessTimerStarted
      ? `⏹ إنهاء المجموعة ${sessSet}`
      : `▶ ابدأ المجموعة ${sessSet}`;
    if (lsHint) lsHint.textContent = ex.reps + ' ثانية';
  } else {
    if (lsTimer) lsTimer.textContent = ex.reps;
    if (lsBar)   lsBar.style.width   = '100%';
    if (lsMain)  lsMain.textContent  = `✓ أنهيت المجموعة ${sessSet}`;
    if (lsHint)  lsHint.textContent  = getRepsLabel(ex);
  }

  // وقت الجلسة الكلي
  const lsElapsed = document.getElementById('sess-ls-elapsed');
  if (lsElapsed) lsElapsed.textContent = fmtMM(sessElapsedSecs);
}

// تحديث landscape عند تغيير المؤقت
// يُستدعى من updateSessTimerUI
function _updateLandscapeOnTick() {
  if (_landscapeMode) _syncLandscapeTimer();
}

// إيقاف الـ landscape عند إغلاق الجلسة
function _resetLandscapeMode() {
  _landscapeMode = false;
  const overlay = document.getElementById('session-overlay');
  if (overlay) overlay.classList.remove('landscape-mode');
  try { screen.orientation?.unlock(); } catch(e) {}
}

// مراقبة تدوير الشاشة تلقائياً
function _initOrientationWatcher() {
  if (_orientationHandler) return;
  _orientationHandler = () => {
    const isLandscape = window.innerWidth > window.innerHeight;
    const overlay = document.getElementById('session-overlay');
    const isOpen = overlay?.classList.contains('open');
    if (isOpen && isLandscape && !_landscapeMode) {
      // تحول تلقائي عند تدوير الجهاز
      _landscapeMode = true;
      overlay.classList.add('landscape-mode');
      _syncLandscapeUI();
    } else if (!isLandscape && _landscapeMode) {
      _landscapeMode = false;
      overlay.classList.remove('landscape-mode');
    }
  };
  window.addEventListener('resize', _orientationHandler);
}


function updateSessElapsed() {
  sessElapsedSecs++;
  const el = document.getElementById('sess-elapsed');
  if (el) el.textContent = fmtMM(sessElapsedSecs);
  // تحديث landscape elapsed
  const lsEl = document.getElementById('sess-ls-elapsed');
  if (lsEl) lsEl.textContent = fmtMM(sessElapsedSecs);
}

function startGuidedSession() {
  const sched = getDaySchedule(S.currentDay);
  if (sched.type === 'rest') { showMiniToast(window.T('restDay')+' — استرح اليوم 😴'); return; }
  if (!sched.exercises.length) { showMiniToast(window.T("noEx")); return; }
  // FIX: نسخ عميق لمنع تلوث getDaySchedule عند تعديل sessExs
  sessExs = sched.exercises.map(e => ({...e}));
  sessIdx = 0; sessSet = 1;
  sessElapsedSecs = 0; sessTimerStarted = false;
  clearInterval(sessElapsedInterval);
  sessElapsedInterval = setInterval(updateSessElapsed, 1000);
  history.pushState({page: 'session'}, '', '#session');
  document.getElementById('session-overlay').classList.add('open');
  // تفعيل مراقب التدوير
  if (typeof _initOrientationWatcher === 'function') _initOrientationWatcher();
  // إعادة ضبط landscape عند العودة للخلف
  const _lsPopHandler = () => { if (typeof _resetLandscapeMode === 'function') _resetLandscapeMode(); };
  window.addEventListener('popstate', _lsPopHandler, { once: true });
  buildSessTrack();
  buildSessList();
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l=>{window._wakeLock=l;}).catch(()=>{});
  startCountdown(() => loadSessEx());
}
function closeSession() {
  try{if(window._wakeLock)window._wakeLock.release();}catch(e){} window._wakeLock=null;
  clearInterval(sessTimerInterval);
  clearInterval(restTimerInterval);
  clearInterval(sessElapsedInterval);
  clearInterval(_countdownInterval); // FIX: مسح العد التنازلي
  _countdownInterval = null;
  sessTimerStarted = false;
  sessPaused = false; // FIX: إعادة تعيين حالة الإيقاف
  window._restCb = null;
  if (typeof _resetLandscapeMode === 'function') _resetLandscapeMode();
  const ov = document.getElementById('session-overlay');
  ov.classList.add('closing');
  setTimeout(() => {
    ov.classList.remove('open','closing');
    document.getElementById('sess-cel').classList.remove('show');
    document.getElementById('countdown-screen').classList.remove('show');
    document.getElementById('sess-list').classList.remove('open');
    document.exitFullscreen?.();
    // Cleanup: إزالة عناصر المشاركة المؤقتة
    document.getElementById('cel-share-cta')?.remove();
    document.getElementById('level-share-toast')?.remove();
    document.getElementById('ritual-toast')?.remove();
  }, 280);
  if (location.hash === '#session') history.back();
}
function confirmCloseSession() {
  const msg = currentLang==='en' ? 'End the session?' : currentLang==='fr' ? 'Terminer la séance?' : 'هل تريد إنهاء الجلسة؟';
  if (confirm(msg)) closeSession();
}
function buildSessTrack() {
  const track = document.getElementById('sess-track');
  track.innerHTML = sessExs.map((ex, i) => 
    `<div class="s-dot ${i===0?'active':''}" id="sdot-${i}" title="${_escHtml(ex.nameAr)}"></div>`
  ).join('');
}

function updateSessTrack() {
  sessExs.forEach((_, i) => {
    const dot = document.getElementById('sdot-' + i);
    if (!dot) return;
    dot.className = 's-dot';
    if (i < sessIdx) dot.classList.add('done');
    else if (i === sessIdx) dot.classList.add('active');
  });
}
function buildSessList() {
  const el = document.getElementById('sl-items');
  el.innerHTML = sessExs.map((ex, i) => `
    <div class="sl-item${i===sessIdx?' cur':''}${i<sessIdx?' done-i':''}" 
         id="sl-item-${i}" draggable="true"
         ondragstart="slDragStart(event,${i})" ondragover="slDragOver(event,${i})" ondrop="slDrop(event,${i})" ondragend="slDragEnd()"
         ontouchstart="slTouchStart(event,${i})" ontouchmove="slTouchMove(event)" ontouchend="slTouchEnd(event)"
         onclick="jumpToEx(${i})">
      <div class="sl-drag">⠿</div>
      <div class="sl-num">${i+1}</div>
      <div class="sl-info"><div class="sl-name">${_escHtml(getExName(ex))}</div><div class="sl-meta">${ex.sets} × ${ex.reps} ${getRepsLabel(ex)}</div></div>
    </div>`).join('');
}

let _slDragIdx = null;
let _slTouchY = 0;

function slDragStart(e, i) { _slDragIdx = i; e.currentTarget.style.opacity = '0.5'; }
function slDragOver(e, i) { e.preventDefault(); }
function slDrop(e, i) {
  e.preventDefault();
  slReorder(_slDragIdx, i);
}
function slDragEnd() { _slDragIdx = null; document.querySelectorAll('.sl-item').forEach(el => el.style.opacity = ''); }

function slTouchStart(e, i) {
  _slDragIdx = i;
  _slTouchY = e.touches[0].clientY;
  e.currentTarget.style.opacity = '0.6';
}
function slTouchMove(e) {
  e.preventDefault();
  _slTouchY = e.touches[0].clientY;
  // Highlight target
  const els = document.querySelectorAll('.sl-item');
  els.forEach(el => el.style.background = '');
  const target = document.elementFromPoint(e.touches[0].clientX, _slTouchY);
  const item = target?.closest('.sl-item');
  if (item) item.style.background = 'rgba(212,168,67,.15)';
}
function slTouchEnd(e) {
  const target = document.elementFromPoint(e.changedTouches[0].clientX, _slTouchY);
  const item = target?.closest('.sl-item');
  if (item) {
    const toIdx = parseInt(item.id.replace('sl-item-',''));
    if (!isNaN(toIdx)) slReorder(_slDragIdx, toIdx);
  }
  _slDragIdx = null;
  document.querySelectorAll('.sl-item').forEach(el => { el.style.opacity = ''; el.style.background = ''; });
}

function slReorder(from, to) {
  if (from === null || from === to) return;
  if (from < sessIdx || to < sessIdx) { showMiniToast(currentLang==='en'?'⚠️ Cannot reorder completed exercise':currentLang==='fr'?'⚠️ Impossible de réordonner un exercice terminé':'⚠️ لا يمكن إعادة ترتيب تمرين مكتمل'); return; }
  const moved = sessExs.splice(from, 1)[0];
  sessExs.splice(to, 0, moved);
  buildSessList();
  buildSessTrack();
  showMiniToast(currentLang==='en'?'✅ Reordered':currentLang==='fr'?'✅ Réordonné':'✅ تم إعادة الترتيب');
}
function toggleSessList() {
  document.getElementById('sess-list').classList.toggle('open');
}
function jumpToEx(i) {
  sessIdx = i; sessSet = 1;
  clearInterval(sessTimerInterval);
  clearInterval(restTimerInterval);
  document.getElementById('sess-list').classList.remove('open');
  document.getElementById('sess-rest-scr').classList.remove('show');
  document.getElementById('sess-ex-wrap').style.display = '';
  loadSessEx();
}

function startCountdown(cb) {
  const screen = document.getElementById('countdown-screen');
  const numEl = document.getElementById('cdn-num');
  const exEl = document.getElementById('cdn-ex');
  const ex = sessExs[sessIdx];
  if (ex) exEl.textContent = getExName(ex);
  screen.classList.add('show');
  let n = 3;
  numEl.textContent = n;
  const beepTones = [0, 440, 550, 660];
  playTone(beepTones[n] || 440, 0.25, 'sine', 0.5);
  clearInterval(_countdownInterval); // مسح أي عد سابق
  _countdownInterval = setInterval(() => {
    n--;
    if (n > 0) {
      numEl.textContent = n;
      playTone(beepTones[n] || 440, 0.25, 'sine', 0.5);
    } else {
      clearInterval(_countdownInterval);
      _countdownInterval = null;
      screen.classList.remove('show');
      playTone(880, 0.1, 'sine', 0.6);
      setTimeout(() => playTone(880, 0.1, 'sine', 0.6), 120);
      setTimeout(() => playTone(1100, 0.2, 'sine', 0.7), 240);
      cb();
    }
  }, 1000);
}

function loadSessEx() {
  updateSessTrack();
  const ex = sessExs[sessIdx];
  if (!ex) { showSessCelebration(); return; }
  sessTimerStarted = false;
  clearInterval(sessTimerInterval);

  // Header num
  document.getElementById('sess-ex-num').textContent = `${sessIdx+1}/${sessExs.length}`;

  // Name + EN
  document.getElementById('sess-ex-name').textContent = getExName(ex);
  document.getElementById('sess-ex-en').textContent = ex.nameEn || '';

  // Set info
  document.getElementById('sess-cur-set').textContent = sessSet;
  document.getElementById('sess-tot-sets').textContent = ex.sets;

  // Status pill
  const pill = document.getElementById('sess-pill');
  if (pill) { pill.textContent = window.T ? window.T('getReady','استعد 🌙') : 'استعد 🌙'; pill.className = 'sess-pill'; }

  // Image
  const customImg = S.customImages?.[ex.id];
  const gifSrc = getExGif(ex.id);
  const sessIconEl = document.getElementById('sess-icon');
  if (customImg) {
    sessIconEl.innerHTML = `<img src="${customImg}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`;
  } else if (gifSrc) {
    sessIconEl.innerHTML = `<img src="${gifSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`;
  } else {
    sessIconEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:72px;border-radius:20px;background:${ex.color||'#333'}22;">${ex.icon}</div>`;
  }

  // Adj controls
  const restVal = document.getElementById('adj-rest-val');
  const workVal = document.getElementById('adj-work-val');
  const setsVal = document.getElementById('adj-sets-val');
  const workLbl = document.getElementById('adj-work-lbl');
  const exRest = (typeof ex.rest === 'number' && ex.rest > 0) ? ex.rest : 30;
  if (restVal) restVal.innerHTML = exRest + '<span style="font-size:9px;opacity:.6;">ث</span>';
  if (setsVal) setsVal.textContent = ex.sets;

  // Timer or reps
  if (ex.type === 'timer') {
    document.getElementById('sess-timer-wrap').style.display = '';
    document.getElementById('sess-reps-wrap').style.display = 'none';
    sessTimerTotal = ex.reps; sessTimerRemain = ex.reps;
    if (workVal) workVal.innerHTML = ex.reps + '<span style="font-size:9px;opacity:.6;">ث</span>';
    if (workLbl) workLbl.textContent = currentLang==='en' ? 'Work s' : currentLang==='fr' ? 'Travail s' : 'ث عمل';
    updateSessTimerUI();
    const hint = document.getElementById('sess-timer-hint');
    if (hint) hint.textContent = currentLang==='en'
      ? `Tap to start set ${sessSet} — ${ex.reps}s`
      : currentLang==='fr'
        ? `Toucher pour démarrer série ${sessSet} — ${ex.reps}s`
        : `اضغط لبدء المجموعة ${sessSet} — ${ex.reps} ثانية`;
    document.getElementById('sess-main-lbl').textContent = currentLang==='en'
      ? `▶ Start Set ${sessSet}`
      : currentLang==='fr'
        ? `▶ Démarrer Série ${sessSet}`
        : `▶ ابدأ المجموعة ${sessSet}`;
    if (sessAutoPlay) {
      setTimeout(() => { if (!sessPaused) startSessTimerNow(); }, 300);
    }
  } else {
    document.getElementById('sess-timer-wrap').style.display = 'none';
    document.getElementById('sess-reps-wrap').style.display = '';
    const repsStr = ex.reps + ' ' + getRepsLabel(ex);
    document.getElementById('sess-reps-num').textContent = ex.type === 'distance' ? ex.reps + ' م' : ex.reps;
    document.querySelector('#sess-reps-wrap .sess-reps-lbl').textContent = getRepsLabel(ex);
    if (workVal) workVal.innerHTML = ex.reps + '<span style="font-size:9px;opacity:.6;">' + (ex.type==='distance'?'م':'×') + '</span>';
    if (workLbl) workLbl.textContent = ex.type==='distance'
      ? (currentLang==='en'?'Meters':currentLang==='fr'?'Mètres':'متر')
      : (currentLang==='en'?'Reps':currentLang==='fr'?'Rép.':'تكرار');
    const hint = document.getElementById('sess-timer-hint');
    if (hint) hint.textContent = currentLang==='en'
      ? `Tap when done with set ${sessSet}`
      : currentLang==='fr'
        ? `Toucher quand la série ${sessSet} est terminée`
        : `اضغط عند الانتهاء من المجموعة ${sessSet}`;
    document.getElementById('sess-main-lbl').textContent = sessSet < ex.sets
      ? (currentLang==='en' ? `✓ Set ${sessSet} Done` : currentLang==='fr' ? `✓ Série ${sessSet} terminée` : `✓ أنهيت المجموعة ${sessSet}`)
      : (currentLang==='en' ? `✓ Last set! Done` : currentLang==='fr' ? `✓ Dernière série! Terminé` : `✓ آخر مجموعة! انتهيت`);
    // progress full for reps
    const pb = document.getElementById('sess-prog-bar');
    if (pb) pb.style.width = '100%';
  }

  // Track dots
  document.querySelectorAll('.s-dot').forEach((d,i) => {
    d.className = 's-dot' + (i<sessIdx?' done':i===sessIdx?' active':'');
  });
  buildSessList();
  // تحديث landscape UI
  if (typeof _syncLandscapeUI === 'function') _syncLandscapeUI();
}

function startSessTimerNow() {
  if (sessTimerStarted) return;
  sessTimerStarted = true;
  const pill = document.getElementById('sess-pill');
  if (pill) { pill.textContent = currentLang==='en'?'🏃 Running':currentLang==='fr'?'🏃 En cours':'🏃 جارٍ'; pill.className = 'sess-pill running'; }
  document.getElementById('sess-main-lbl').textContent = currentLang==='en'
    ? `⏹ End Set ${sessSet}`
    : currentLang==='fr'
      ? `⏹ Terminer Série ${sessSet}`
      : `⏹ إنهاء المجموعة ${sessSet}`;
  clearInterval(sessTimerInterval);
  sessTimerInterval = setInterval(() => {
    if (sessPaused) return;
    sessTimerRemain--;
    if (S.tickOn) playTick();
    updateSessTimerUI();
        const _tu = document.querySelector('.sess-digital-timer');
    if (_tu) _tu.classList.toggle('urgent', sessTimerRemain > 0 && sessTimerRemain <= 5);
    if (sessTimerRemain <= 0) {
      clearInterval(sessTimerInterval);
      sessTimerStarted = false;
      playBeep();
      sessNextSet();
    }
  }, 1000);
}

// startSessTimer: removed — dead code (لم تكن تُستدعى)

function updateSessTimerUI() {
  const el = document.getElementById('sess-t-time');
  if (el) el.textContent = fmtMM(sessTimerRemain);
  const pct = sessTimerTotal > 0 ? sessTimerRemain/sessTimerTotal : 1;
  const pb = document.getElementById('sess-prog-bar');
  if (pb) pb.style.width = (pct*100) + '%';
  // Ticking animation
  const timerEl = document.querySelector('.sess-digital-timer');
  if (timerEl) timerEl.classList.toggle('ticking', sessTimerStarted && sessTimerRemain > 0);
  // تحديث landscape إذا كان مفعلاً
  if (typeof _updateLandscapeOnTick === 'function') _updateLandscapeOnTick();
}

function sessMainAction() {
  // Rest screen showing → skip rest
  const restScr = document.getElementById('sess-rest-scr');
  if (restScr && restScr.classList.contains('show')) {
    clearInterval(restTimerInterval);
    restScr.classList.remove('show');
    document.getElementById('sess-ex-wrap').style.display = '';
    const cb = window._restCb;
    window._restCb = null;
    if (cb) { playStart(); cb(); }
    return;
  }
  const ex = sessExs[sessIdx];
  if (!ex) return;
  if (ex.type === 'timer') {
    if (!sessTimerStarted) {
      // First tap: start the timer
      startSessTimerNow();
    } else {
      // Second tap: finish set early
      clearInterval(sessTimerInterval);
      sessTimerStarted = false;
      sessNextSet();
    }
  } else {
    // Reps/distance: tap = done with this set
    sessNextSet();
  }
}

function sessAdjust(type, delta) {
  const ex = sessExs[sessIdx];
  if (!ex) return;
  if (type === 'rest') {
    ex.rest = Math.max(5, ((typeof ex.rest === 'number' && ex.rest > 0) ? ex.rest : 30) + delta);
    const el = document.getElementById('adj-rest-val');
    if (el) el.innerHTML = ex.rest + '<span style="font-size:9px;opacity:.6;">ث</span>';
  } else if (type === 'work') {
    if (ex.type === 'timer') {
      ex.reps = Math.max(10, ex.reps + delta);
      const el = document.getElementById('adj-work-val');
      if (el) el.innerHTML = ex.reps + '<span style="font-size:9px;opacity:.6;">ث</span>';
      // Update timer if not started yet
      if (!sessTimerStarted) {
        sessTimerTotal = ex.reps; sessTimerRemain = ex.reps;
        updateSessTimerUI();
        const hint = document.getElementById('sess-timer-hint');
        if (hint) hint.textContent = currentLang==='en'
          ? `Tap to start set ${sessSet} — ${ex.reps}s`
          : currentLang==='fr'
            ? `Toucher pour démarrer série ${sessSet} — ${ex.reps}s`
            : `اضغط لبدء المجموعة ${sessSet} — ${ex.reps} ثانية`;
      }
    } else {
      ex.reps = Math.max(1, ex.reps + delta);
      const el = document.getElementById('adj-work-val');
      if (el) el.innerHTML = ex.reps + '<span style="font-size:9px;opacity:.6;">×</span>';
      document.getElementById('sess-reps-num').textContent = ex.reps;
    }
  } else if (type === 'sets') {
    ex.sets = Math.max(1, ex.sets + delta);
    document.getElementById('adj-sets-val').textContent = ex.sets;
    document.getElementById('sess-tot-sets').textContent = ex.sets;
    document.getElementById('sess-main-lbl').textContent = ex.type === 'timer'
      ? (currentLang==='en'?`▶ Start Set ${sessSet}`:currentLang==='fr'?`▶ Démarrer Série ${sessSet}`:`▶ ابدأ المجموعة ${sessSet}`)
      : (sessSet < ex.sets
          ? (currentLang==='en'?`✓ Set ${sessSet} Done`:currentLang==='fr'?`✓ Série ${sessSet} terminée`:`✓ أنهيت المجموعة ${sessSet}`)
          : (currentLang==='en'?`✓ Last set! Done`:currentLang==='fr'?`✓ Dernière série!`:`✓ آخر مجموعة! انتهيت`));
  }
  showMiniToast('✓');
}

function toggleAutoPlay() {
  sessAutoPlay = !sessAutoPlay;
  const btn = document.getElementById('sess-auto-btn');
  if (btn) btn.classList.toggle('on', sessAutoPlay);
  const autoMsg = sessAutoPlay
    ? (currentLang==='en'?'⚡ Auto-play: ON':currentLang==='fr'?'⚡ Auto: Activé':'⚡ التلقائي: تشغيل')
    : (currentLang==='en'?'⚡ Auto-play: OFF':currentLang==='fr'?'⚡ Auto: Désactivé':'⚡ التلقائي: إيقاف');
  showMiniToast(autoMsg);
}

function sessNextSet() {
  const ex = sessExs[sessIdx]; // FIX#1: always read fresh from array
  if (!ex) { showSessCelebration(); return; }
  if (sessSet < ex.sets) {
    sessSet++;
    const restSecs = (typeof ex.rest === 'number' && ex.rest > 0) ? ex.rest : 30;
    showSessRest(restSecs, () => loadSessEx());
  } else {
    const key = S.currentDay + '_' + ex.id;
    if (!S.completedExercises) S.completedExercises = {};
    S.completedExercises[key] = true;
    saveState();
    // Mark current dot as done before moving on
    const doneDot = document.getElementById('sdot-' + sessIdx);
    if (doneDot) { doneDot.className = 's-dot done'; }
    sessIdx++;
    sessSet = 1;
    // Micro-celebration عند نصف الجلسة
    if (sessIdx === Math.floor(sessExs.length / 2)) {
      try { microCelebrate('half_session'); } catch(e) {}
    }
    if (sessIdx >= sessExs.length) {
      showSessCelebration();
    } else {
      updateSessTrack();
      const nextEx = sessExs[sessIdx];
      const betweenRest = (typeof nextEx?.rest === 'number' && nextEx.rest > 0) ? nextEx.rest : 45;
      showSessRest(betweenRest, () => startCountdown(() => loadSessEx()), sessIdx);
    }
  }
}

function showSessRest(secs, cb, nextIdx) {
  // ── Super Set: إذا كان التمرين التالي في نفس الزوج — تخطي الراحة ──
  if (typeof isSuperSetWith === 'function' && nextIdx !== undefined) {
    const curEx  = sessExs[sessIdx];
    const nextEx = sessExs[nextIdx];
    if (curEx && nextEx && isSuperSetWith(curEx.id) === nextEx.id) {
      showMiniToast('⚡ Super Set!');
      if (cb) cb();
      return;
    }
  }
  // nextIdx: index of the exercise to show as "التالي" in the rest screen
  // defaults to sessIdx (between-sets rest: same exercise) or explicit index (between-exercises rest)
  const resolvedNext = (nextIdx !== undefined ? nextIdx : sessIdx);
  const nextEx = sessExs[resolvedNext] || sessExs[sessIdx];
  const isLastEx = resolvedNext >= sessExs.length;
  document.getElementById('sess-ex-wrap').style.display = 'none';
  document.getElementById('sess-rest-scr').classList.add('show');
  document.getElementById('rest-nxt').textContent = isLastEx
    ? (window.T ? window.T('sessionDone','الجلسة منتهية! 🏆') : 'الجلسة منتهية! 🏆')
    : (window.T('nextExercise','التالي:') + ' ' + getExName(nextEx));
  document.getElementById('sess-main-lbl').textContent = window.T ? window.T('skipRest','تخطي الراحة ▶') : 'تخطي الراحة ▶';
  restRemain = secs;
  restTotal = secs;
  // Store cb so skip button can call it
  window._restCb = cb;
  updateRestUI();
  playRest();
  clearInterval(restTimerInterval);
  restTimerInterval = setInterval(() => {
    if (sessPaused) return; // FIX: احترام حالة الإيقاف المؤقت
    restRemain--;
    updateRestUI();
    // Beep at last 3 seconds
    if (S.tickOn !== false && restRemain > 3) playTone(330, 0.05, 'sine', 0.12);
    if (restRemain > 0 && restRemain <= 3) playTone(660, 0.12, 'sine', 0.4);
    // تأثير بصري عند آخر 3 ثواني في الراحة
    const restBar = document.getElementById('rest-prog-bar');
    if (restBar) restBar.classList.toggle('urgent', restRemain > 0 && restRemain <= 3);
    if (restRemain <= 0) {
      clearInterval(restTimerInterval);
      if (restBar) restBar.classList.remove('urgent');
      document.getElementById('sess-rest-scr').classList.remove('show');
      document.getElementById('sess-ex-wrap').style.display = '';
      window._restCb = null;
      playStart();
      cb();
    }
  }, 1000);
}

function updateRestUI() {
  const el = document.getElementById('rest-t-time');
  // FIX: fmtSecs بدل fmtMM — يعرض "30" مثل القيمة الأولية وليس "00:30"
  if (el) el.textContent = fmtSecs(restRemain);
  const pb = document.getElementById('rest-prog-bar');
  if (pb) pb.style.width = (restTotal > 0 ? (restRemain/restTotal)*100 : 0) + '%';
}

function sessPause() {
  const btn = document.getElementById('sess-pause-btn');
  if (!sessPaused) {
    clearInterval(sessTimerInterval);
    clearInterval(restTimerInterval);
    clearInterval(sessElapsedInterval); // إيقاف مؤقت الجلسة الكلي
    sessPaused = true;
    if (btn) btn.textContent = '▶';
  } else {
    sessPaused = false;
    // استئناف مؤقت الجلسة الكلي
    sessElapsedInterval = setInterval(updateSessElapsed, 1000);
    if (btn) btn.textContent = '⏸';
    // FIX: استعادة نص الزر الرئيسي حسب الحالة الحالية
    const ex = sessExs[sessIdx];
    if (ex && sessTimerStarted) {
      document.getElementById('sess-main-lbl').textContent = currentLang==='en'
        ? `⏹ End Set ${sessSet}` : currentLang==='fr' ? `⏹ Terminer Série ${sessSet}` : `⏹ إنهاء المجموعة ${sessSet}`;
    }

    const restScr = document.getElementById('sess-rest-scr');
    const onRestScreen = restScr && restScr.classList.contains('show');

    if (onRestScreen && restRemain > 0) {
      const cb = window._restCb;
      clearInterval(restTimerInterval);
      restTimerInterval = setInterval(() => {
        if (sessPaused) return; // FIX: guard للإيقاف المؤقت في مؤقت الراحة المُعاد
        restRemain--;
        updateRestUI();
        if (S.tickOn !== false && restRemain > 3) playTone(330, 0.05, 'sine', 0.12);
        if (restRemain > 0 && restRemain <= 3) playTone(660, 0.12, 'sine', 0.4);
        if (restRemain <= 0) {
          clearInterval(restTimerInterval);
          restScr.classList.remove('show');
          document.getElementById('sess-ex-wrap').style.display = '';
          window._restCb = null;
          playStart();
          if (cb) cb();
        }
      }, 1000);
    } else if (onRestScreen && restRemain <= 0) {
      // FIX: الراحة انتهت أثناء الإيقاف — انتقل فوراً للتمرين التالي
      const cb = window._restCb;
      window._restCb = null;
      restScr.classList.remove('show');
      document.getElementById('sess-ex-wrap').style.display = '';
      playStart();
      if (cb) cb();
    } else if (sessTimerStarted && sessTimerRemain > 0) {
      clearInterval(sessTimerInterval);
      sessTimerInterval = setInterval(() => {
        sessTimerRemain--;
        if (S.tickOn !== false) playTick();
        updateSessTimerUI();
        if (sessTimerRemain <= 0) {
          clearInterval(sessTimerInterval);
          sessTimerStarted = false;
          playBeep();
          sessNextSet();
        }
      }, 1000);
    }
  }
}

function sessPrev() {
  if (sessIdx > 0) { sessIdx--; sessSet = 1; }
  clearInterval(sessTimerInterval);
  clearInterval(restTimerInterval);
  clearInterval(_countdownInterval); // FIX: مسح العد التنازلي
  _countdownInterval = null;
  document.getElementById('sess-rest-scr').classList.remove('show');
  document.getElementById('sess-ex-wrap').style.display = '';
  loadSessEx();
}


function sessSkip() {
  clearInterval(sessTimerInterval);
  clearInterval(restTimerInterval);
  clearInterval(_countdownInterval); // FIX: مسح العد التنازلي
  _countdownInterval = null;
  const restScr = document.getElementById('sess-rest-scr');
  if (restScr) restScr.classList.remove('show');
  document.getElementById('sess-ex-wrap').style.display = '';
  sessPaused = false;
  window._restCb = null;
  // Mark as skipped in track
  const dot = document.getElementById('sdot-' + sessIdx);
  if (dot) { dot.classList.remove('active','done'); dot.classList.add('skipped'); }
  sessIdx++;
  sessSet = 1;
  if (sessIdx >= sessExs.length) {
    showSessCelebration();
  } else {
    updateSessTrack();
    startCountdown(() => loadSessEx());
  }
}

function showSessCelebration() {
  // FIX: إيقاف عداد الجلسة الكلي فور ظهور الاحتفال
  clearInterval(sessElapsedInterval);
  // Save training log first
  const logDay = S.currentDay;
  const totalSets = sessExs.reduce((a,e)=>a+e.sets,0);
  const dur = Math.max(10, Math.round(sessExs.reduce((s,e)=>
    s + (e.type==='timer' ? e.reps*e.sets : 45*e.sets), 0) / 60));
  const kg = parseFloat(S.user?.weight)||70;
  const totalCal = Math.round(sessExs.reduce((sum, ex) => sum + calcExCal(ex, kg), 0) * 1.15);
  if (!S.trainingLog) S.trainingLog = {};
  const logKey = 'day_'+logDay;
  // لا تستبدل السجل إذا كان اليوم مكتملاً مسبقاً — فقط حدّث السعرات إذا كانت أعلى
  if (S.completedDays.includes(logDay) && S.trainingLog[logKey]) {
    if (totalCal > (S.trainingLog[logKey].calories || 0)) {
      S.trainingLog[logKey].calories = totalCal;
    }
  } else {
    S.trainingLog[logKey] = {
      day: logDay,
      ts: Date.now(),
      date: new Date().toLocaleDateString('ar-EG'),
      exCount: sessExs.length,
      sets: totalSets,
      totalSets: totalSets,
      calories: totalCal,
      duration: dur,
      exercises: sessExs.map(e=>e.nameAr),
      exerciseIds: sessExs.map(e=>e.id)
    };
  }
  // Complete the day
  if (!S.completedDays.includes(S.currentDay)) {
    S.completedDays.push(S.currentDay);
    // FIX: خصم السعرات التي أُضيفت يدوياً من toggleExDone لتجنب التكرار
    const alreadyAdded = S._manualExCal
      ? Object.values(S._manualExCal).reduce((a, b) => a + b, 0)
      : 0;
    const netCal = Math.max(0, totalCal - alreadyAdded);
    S.calories += netCal;
    S._manualExCal = {}; // تصفير بعد إضافة السعرات الكاملة
    // Track morning workouts for 'early_bird' badge (before 10am)
    const sessionHour = new Date().getHours();
    if (sessionHour < 10) S.morningWorkouts = (S.morningWorkouts || 0) + 1;
    updateStreak();
    const maxDay = S.user?.programDays || 30;
    if (S.currentDay < maxDay) S.currentDay++;
    saveState();
    checkBadges();
    // ── Toast تسجيل الدخول بعد أول جلسة ──
    if (!window._fbUser && (S.completedDays||[]).length === 1) {
      setTimeout(() => _showFirstSessionLoginToast(), 3000);
    }
  }
  document.getElementById('cel-sub').textContent = currentLang==='en'
    ? `Day ${logDay} of program complete 🎯`
    : currentLang==='fr'
      ? `Jour ${logDay} du programme terminé 🎯`
      : `يوم ${logDay} من البرنامج مكتمل 🎯`;
  const exLbl  = currentLang==='en'?'Exercises':currentLang==='fr'?'Exercices':'تمرين';
  const setLbl = currentLang==='en'?'Sets':currentLang==='fr'?'Séries':'مجموعة';
  const calLbl = currentLang==='en'?'Cal':currentLang==='fr'?'Cal':'سعرة';
  const minLbl = currentLang==='en'?'Min':currentLang==='fr'?'Min':'دقيقة';
  document.getElementById('cel-stats').innerHTML = `
    <div class="cel-s"><div class="cel-s-val">${sessExs.length}</div><div class="cel-s-lbl">${exLbl}</div></div>
    <div class="cel-s"><div class="cel-s-val">${totalSets}</div><div class="cel-s-lbl">${setLbl}</div></div>
    <div class="cel-s"><div class="cel-s-val">${totalCal}</div><div class="cel-s-lbl">${calLbl}</div></div>
    <div class="cel-s"><div class="cel-s-val">${dur}</div><div class="cel-s-lbl">${minLbl}</div></div>`;
  document.getElementById('sess-cel').classList.add('show');
  launchConfetti();
  playFanfare();
  speakMotivation(logDay, totalCal);

  // ── شاشة المشاركة بعد 1.5 ثانية ──
  setTimeout(() => _injectShareCTA(logDay, totalCal, dur, sessExs.length), 1500);

  // ── Psychology Hooks + ذاكرة المدرب + إشعارات ──
  setTimeout(() => {
    try { runPsychologyHooks(logDay); } catch(e) {}
    try {
      // XP للجلسة
      const xpGain = XP_PER_SESSION + (S.streak||0) * XP_PER_STREAK_DAY;
      addXP(xpGain, 'session');
      setTimeout(() => showMiniToast(`+${xpGain} XP ⚡`), 1200);
    } catch(e) {}
    try { updateCoachMemory(); } catch(e) {}
    try {
      if (typeof scheduleTrainingNotif === 'function' &&
          typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        scheduleTrainingNotif();
      }
    } catch(e) {}
  }, 500);
  render();
}

// ── حقن CTA المشاركة في شاشة الاحتفال ──
function _injectShareCTA(day, cal, dur, exCount) {
  const cel = document.getElementById('sess-cel');
  if (!cel || document.getElementById('cel-share-cta')) return;

  const done    = (S.completedDays||[]).length;
  const total   = S.user?.programDays || 30;
  const streak  = S.streak || 0;
  const name    = S.user?.name || 'بطل';
  const level   = typeof getCurrentLevel === 'function' ? getCurrentLevel() : {icon:'💪',name:'رياضي'};
  const pct     = Math.round(done/total*100);

  // رسالة المشاركة الجاهزة
  const shareMsg = _buildShareMessage(name, day, cal, streak, pct, level);

  // هل هو milestone؟
  const isMilestone = [7,14,21,30].includes(done) || streak >= 7 || pct >= 50;

  const div = document.createElement('div');
  div.id = 'cel-share-cta';
  div.style.cssText = 'width:100%;padding:0 20px;margin-top:4px;display:flex;flex-direction:column;gap:8px;animation:slideUp .4s ease;';
  div.innerHTML = `
    ${isMilestone ? `
      <div style="background:linear-gradient(135deg,rgba(212,168,67,.2),rgba(212,168,67,.05));border:1px solid rgba(212,168,67,.4);border-radius:14px;padding:10px 14px;text-align:center;font-size:13px;color:var(--gold);font-weight:700;">
        🏆 ${done === 7 ? 'أسبوع كامل!' : done === 14 ? '14 يوم — نصف الطريق!' : done === 21 ? 'عادة راسخة — 21 يوم!' : done === 30 ? 'أكملت البرنامج!' : streak >= 7 ? `سلسلة ${streak} أيام!` : `${pct}% من البرنامج!`}
        أنجزت شيئاً يفخر به الكثيرون ✨
      </div>` : ''}
    <div style="display:flex;gap:8px;">
      <button onclick="_shareSessionNow()" style="flex:2;padding:12px;border-radius:14px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;color:#fff;font-family:'Cairo',sans-serif;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
        <span style="font-size:18px;">📤</span> شارك إنجازك
      </button>
      <button onclick="_challengeFriendNow()" style="flex:1;padding:12px;border-radius:14px;background:rgba(99,102,241,.2);border:1.5px solid rgba(99,102,241,.4);color:#818cf8;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
        🏅 تحدّ صديق
      </button>
    </div>`;

  cel.appendChild(div);

  // حفظ رسالة المشاركة للاستخدام عند الضغط
  window._pendingShareMsg = shareMsg;
  window._pendingShareDay = day;
  window._pendingShareCal = cal;
}

// بناء رسالة المشاركة الذكية
function _buildShareMessage(name, day, cal, streak, pct, level) {
  const lines = [
    `💪 ${name} أكمل يوم ${day} في تطبيق AZEM (عزم)!`,
    `🔥 سلسلة ${streak} يوم متواصل · ⚡ ${cal} سعرة محترقة`,
    streak >= 7  ? `🏆 ${streak} أيام بدون انقطاع — هذا انضباط حقيقي!` :
    pct >= 50    ? `📊 ${pct}% من البرنامج مكتمل — أكثر من النصف!` :
    day <= 3     ? `🌱 بداية رحلة جديدة — اليوم ${day}!` :
                   `📈 تقدم حقيقي — ${pct}% مكتمل`,
    ``,
    `👆 جرّب AZEM مجاناً: chi-hani.github.io/AZEM`,
  ];
  return lines.join('\n');
}

// مشاركة الجلسة
async function _shareSessionNow() {
  const msg = window._pendingShareMsg || '';
  // محاولة توليد بطاقة مرئية
  try {
    if (typeof generateAchievementCard === 'function') {
      const dataUrl = await generateAchievementCard();
      if (dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'azem-achievement.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'إنجازي في AZEM', text: msg });
          return;
        }
      }
    }
  } catch(e) {}
  // fallback نصي
  if (navigator.share) {
    navigator.share({ title: 'AZEM (عزم) 💪', text: msg }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(msg).then(() => showMiniToast('✅ تم نسخ الرسالة — الصقها الآن!'));
  }
}

// تحدي صديق
function _challengeFriendNow() {
  const day    = window._pendingShareDay || (S.currentDay||1);
  const streak = S.streak || 0;
  const name   = S.user?.name || 'بطل';
  const link   = 'chi-hani.github.io/AZEM';
  const msg = `🏅 تحدّيتك ${name}!

أكملت ${day} يوم في تطبيق AZEM وسلسلتي ${streak} يوم.

هل تقدر تتفوق عليّ؟ 😄
👆 ${link}`;

  if (navigator.share) {
    navigator.share({ title: 'تحدي AZEM', text: msg }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(msg).then(() => showMiniToast('✅ رسالة التحدي جاهزة — الصقها!'));
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.getElementById('session-overlay').requestFullscreen?.();
  else document.exitFullscreen?.();
}

function launchConfetti() {
  const colors = ['var(--primary)','var(--secondary)','var(--accent)','#fff','var(--success)'];
  for (let i=0;i<60;i++) {
    const el=document.createElement('div');
    el.className='confetti-piece';
    el.style.cssText=`left:${Math.random()*100}vw;top:-10px;background:${colors[i%colors.length]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;animation:cfFall ${1.5+Math.random()*2}s linear ${Math.random()*0.5}s forwards;`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }
}

