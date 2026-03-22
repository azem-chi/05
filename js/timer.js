/* ══════ TIMER ══════ */
let timerInterval = null, timerTotal = 60, timerRemain = 60, timerRunning = false;
function setTimer(secs, fromTabata) {
  timerReset(fromTabata);
  timerTotal = secs;
  timerRemain = secs;
  updateTimerUI();
}
function timerToggle() {
  if (timerTotal === 0) { setTimer(60); }
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'▶ تشغيل':currentLang==='fr'?'▶ Démarrer':'▶ Start');
    document.getElementById('t-lbl').textContent = (window.T ? window.T('timerPaused','موقف مؤقتاً') : 'موقف مؤقتاً');
  } else {
    if (timerRemain <= 0) { timerRemain = timerTotal; }
    timerRunning = true;
    document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'⏸ إيقاف':currentLang==='fr'?'⏸ Pause':'⏸ Pause');
    document.getElementById('t-lbl').textContent = (window.T ? window.T('timerRunning','يعمل') : 'يعمل');
    timerInterval = setInterval(() => {
      timerRemain--;
      if (S.tickOn) playTick();
      updateTimerUI();
      if (timerRemain <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'▶ تشغيل':currentLang==='fr'?'▶ Démarrer':'▶ Start');
        document.getElementById('t-lbl').textContent = (window.T ? window.T('timerDone','انتهى ✅') : 'انتهى ✅');
        playBeep();
      }
    }, 1000);
  }
}
function timerReset(fromTabata) {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemain = timerTotal;
  // FIX: لا نوقف التاباتا إذا كانت هي من استدعت هذه الدالة
  if (!fromTabata && tabState.running) {
    tabState.running = false;
    tabState.curRound = 1;
    tabState.phase = 'work';
  }
  document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'▶ تشغيل':currentLang==='fr'?'▶ Démarrer':'▶ Start');
  document.getElementById('t-lbl').textContent = (window.T ? window.T('timerReady','مستعد') : 'مستعد');
  updateTimerUI();
}
function updateTimerUI() {
  const m = Math.floor(timerRemain/60), s = timerRemain%60;
  const timeStr = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  document.getElementById('t-display').textContent = timeStr;
  const pct = timerTotal > 0 ? timerRemain/timerTotal : 0;
  const dash = 2*Math.PI*88;
  document.getElementById('t-fill').style.strokeDashoffset = dash*(1-pct);
  // Sync desktop timer display
  const dtDisp = document.getElementById('dt-t-disp');
  if (dtDisp) dtDisp.textContent = timeStr;
}

/* Tabata */
const tabState = {work:20,rest:10,rounds:8,curRound:1,phase:'work',running:false};
function tabAdj(k,v) {
  S.tabata[k] = Math.max(k==='rounds'?1:5, (S.tabata[k]||tabState[k]) + v);
  saveState();
  document.getElementById('tab-'+k).textContent = S.tabata[k];
}
function startTabata() {
  tabState.work = S.tabata.work; tabState.rest = S.tabata.rest; tabState.rounds = S.tabata.rounds;
  tabState.curRound = 1; tabState.phase = 'work'; tabState.running = true;
  tabataNextPhase();
}

function tabataNextPhase() {
  if (!tabState.running) return;
  if (tabState.phase === 'work') {
    setTimer(tabState.work, true);
    document.getElementById('t-lbl').textContent = (currentLang==='en' ? `🔥 Round ${tabState.curRound}/${tabState.rounds} — Work` : currentLang==='fr' ? `🔥 Tour ${tabState.curRound}/${tabState.rounds} — Travail` : `🔥 جولة ${tabState.curRound}/${tabState.rounds} — عمل`);
    showMiniToast(currentLang==='en' ? `🔥 Round ${tabState.curRound} — ${tabState.work}s work` : currentLang==='fr' ? `🔥 Tour ${tabState.curRound} — ${tabState.work}s travail` : `🔥 جولة ${tabState.curRound} — عمل ${tabState.work}ث`);
  } else {
    setTimer(tabState.rest, true);
    document.getElementById('t-lbl').textContent = (currentLang==='en' ? `😤 Rest — Round ${tabState.curRound}/${tabState.rounds}` : currentLang==='fr' ? `😤 Repos — Tour ${tabState.curRound}/${tabState.rounds}` : `😤 راحة — جولة ${tabState.curRound}/${tabState.rounds}`);
    showMiniToast(currentLang==='en' ? `😤 Rest ${tabState.rest}s` : currentLang==='fr' ? `😤 Repos ${tabState.rest}s` : `😤 راحة ${tabState.rest}ث`);
  }
  // Override the timer's onend to drive tabata progression
  clearInterval(timerInterval);
  timerRunning = true;
  document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'⏸ إيقاف':currentLang==='fr'?'⏸ Pause':'⏸ Pause');
  timerInterval = setInterval(() => {
    timerRemain--;
    if (S.tickOn) playTick();
    updateTimerUI();
    if (timerRemain <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      playBeep();
      // Advance tabata state
      if (tabState.phase === 'work') {
        tabState.phase = 'rest';
        if (tabState.rest > 0) {
          tabataNextPhase();
        } else {
          // No rest — go directly to next round
          tabState.phase = 'work';
          tabState.curRound++;
          if (tabState.curRound > tabState.rounds) {
            tabataFinish();
          } else {
            tabataNextPhase();
          }
        }
      } else {
        tabState.phase = 'work';
        tabState.curRound++;
        if (tabState.curRound > tabState.rounds) {
          tabataFinish();
        } else {
          tabataNextPhase();
        }
      }
    }
  }, 1000);
}

function tabataFinish() {
  tabState.running = false;
  document.getElementById('t-lbl').textContent = (currentLang==='ar'?'🏆 تاباتا منتهية!':currentLang==='fr'?'🏆 Tabata terminé!':'🏆 Tabata done!');
  document.getElementById('t-play-btn').textContent = (currentLang==='ar'?'▶ تشغيل':currentLang==='fr'?'▶ Démarrer':'▶ Start');
  const tabWorkMins = (tabState.rounds * tabState.work) / 60;
  const tabKg = parseFloat(S.user?.weight) || 70;
  const tabCal = Math.max(20, Math.round(9.0 * tabKg * tabWorkMins / 60));
  S.calories += tabCal;
  // تسجيل في trainingLog حتى يظهر في الرسم البياني
  if (!S.trainingLog) S.trainingLog = {};
  const tabKey = 'tabata_' + Date.now();
  S.trainingLog[tabKey] = {
    day: S.currentDay, ts: Date.now(),
    date: new Date().toLocaleDateString('ar-SA'),
    type: 'تاباتا', exercises: ['تاباتا'], exCount: tabState.rounds,
    calories: tabCal, duration: Math.round((tabState.rounds * (tabState.work + tabState.rest)) / 60)
  };
  saveState();
  const msg = currentLang==='en'
    ? `🏆 ${tabState.rounds} Tabata rounds done! 🔥 ${tabCal} cal`
    : currentLang==='fr'
      ? `🏆 ${tabState.rounds} tours Tabata terminés! 🔥 ${tabCal} cal`
      : `🏆 أنهيت ${tabState.rounds} جولات تاباتا! 🔥 ${tabCal} سعرة`;
  showMiniToast(msg);
  if (typeof launchConfetti === 'function') launchConfetti();
  playFanfare?.();
}

/* ══════ ROPE TRACKER ══════ */
let ropeInterval = null, ropeRunning = false, ropeStart = 0;
function ropeToggle() {
  if (ropeRunning) {
    clearInterval(ropeInterval);
    ropeRunning = false;
    // Calorie calculation for rope session: MET 10 × kg × elapsed minutes / 60
    const ropeElapsedMins = (Date.now() - ropeStart) / 60000;
    const ropeKg = parseFloat(S.user?.weight) || 70;
    const ropeCal = Math.max(5, Math.round(10.0 * ropeKg * ropeElapsedMins / 60));
    S.calories += ropeCal;
    S.ropeSessions++;
    // FIX: تراكم الإجماليات عند إيقاف الجلسة — كانت S.ropeMeters وS.ropeMins لا تتراكم أبداً
    const sessionJumps  = Math.floor(ropeElapsedMins * 100);
    const sessionMeters = Math.floor(sessionJumps * 1.8);
    const sessionMins   = Math.max(1, Math.round(ropeElapsedMins));
    S.ropeJumps  = (S.ropeJumps  || 0) + sessionJumps;
    S.ropeMeters = (S.ropeMeters || 0) + sessionMeters;
    S.ropeMins   = (S.ropeMins   || 0) + sessionMins;
    // تسجيل في trainingLog حتى يظهر في الرسم البياني
    if (!S.trainingLog) S.trainingLog = {};
    S.trainingLog['rope_' + Date.now()] = {
      day: S.currentDay, ts: Date.now(),
      date: new Date().toLocaleDateString('ar-SA'),
      type: 'حبل', exercises: ['نط الحبل'], exCount: 1,
      calories: ropeCal, duration: sessionMins
    };
    saveState();
    document.getElementById('rope-btn').textContent = window.T ? window.T('startRope','▶ ابدأ') : '▶ ابدأ';
    const ropeMsg = currentLang==='en' ? `🪢 Done! 🔥 ${ropeCal} cal` : currentLang==='fr' ? `🪢 Terminé! 🔥 ${ropeCal} cal` : `🪢 أحسنت! 🔥 ${ropeCal} سعرة`;
    showMiniToast(ropeMsg);
    checkBadges();
  } else {
    ropeRunning = true;
    ropeStart = Date.now();
    document.getElementById('rope-btn').textContent = (currentLang==='ar'?'⏹ إيقاف':currentLang==='fr'?'⏹ Arrêter':'⏹ Stop');
    ropeInterval = setInterval(() => {
      const elapsed = (Date.now() - ropeStart) / 60000;
      const jumps = Math.floor(elapsed * 100);   // total jumps this session
      const meters = Math.floor(jumps * 1.8);
      const mins = Math.floor(elapsed);
      // Live calorie counter
      const liveKg = parseFloat(S.user?.weight) || 70;
      const liveCal = Math.round(10.0 * liveKg * elapsed / 60);
      // FIX-H: don't accumulate in S.ropeJumps during interval (causes exponential growth)
      // Just display the current session value live; S.ropeJumps updated once on stop
      document.getElementById('rope-jumps').textContent = jumps;
      document.getElementById('rope-meters').textContent = meters;
      document.getElementById('rope-mins').textContent = mins;
      document.getElementById('rope-sessions').textContent = S.ropeSessions;
      // Update live cal display if element exists
      const ropeCalEl = document.getElementById('rope-live-cal');
      if (ropeCalEl) ropeCalEl.textContent = liveCal;
    }, 1000);
  }
}
function ropeReset() {
  clearInterval(ropeInterval);
  ropeRunning = false;
  S.ropeJumps = 0; S.ropeMeters = 0; S.ropeMins = 0;
  saveState();
  const ropeBtn = document.getElementById('rope-btn');
  if (ropeBtn) ropeBtn.textContent = window.T ? window.T('startRope','▶ ابدأ') : '▶ ابدأ';
  const rj = document.getElementById('rope-jumps'); if (rj) rj.textContent = '0';
  const rm = document.getElementById('rope-meters'); if (rm) rm.textContent = '0';
  const rmi = document.getElementById('rope-mins'); if (rmi) rmi.textContent = '0';
  const rs = document.getElementById('rope-sessions'); if (rs) rs.textContent = S.ropeSessions;
}

