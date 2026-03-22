/* ══════ AUDIO (Web Audio API) ══════ */
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type='sine', vol=0.3) {
  if (!S.soundOn) return;
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    // DynamicsCompressor يرفع الصوت المنخفض ويمنع التشويه
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value      = 12;
    comp.ratio.value     = 4;
    comp.attack.value    = 0.003;
    comp.release.value   = 0.1;
    o.connect(g);
    g.connect(comp);
    comp.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    // رفع معامل الصوت: ضرب في 1.8 لتعويض ضعف الإخراج
    const effectiveVol = Math.min(1.0, (S.volume / 100) * vol * 1.8);
    g.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  } catch(e){}
}
// رُفعت قيم vol للأصوات الرئيسية لضمان وضوح الإخراج
function playBeep()  { playTone(880, 0.22, 'sine',     0.7); }
function playTick()  { if(S.tickOn) playTone(440, 0.05, 'sine', 0.35); }
function playStart() { playTone(660, 0.12, 'sine', 0.6); setTimeout(() => playTone(880, 0.18, 'sine', 0.65), 120); }
function playRest()  { playTone(440, 0.18, 'sine', 0.6); setTimeout(() => playTone(330, 0.22, 'sine', 0.55), 150); }
function playFanfare() {
  if (!S.soundOn) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'triangle', 0.75), i * 150));
}

/* ══════════════════════════════════════════
   MOTIVATIONAL ARABIC TTS
   يستخدم Web Speech API المدمج في المتصفح
══════════════════════════════════════════ */
const MOTIVATIONAL_SPEECHES = [
  (name, day, cal) => `أحسنت يا ${name}! أنهيت اليوم ${day} من البرنامج. أنت أقوى مما تتخيل. استمر!`,
  (name, day, cal) => `رائع يا ${name}! ${cal} سعرة حرقتها اليوم. جسمك يشكرك. غداً أفضل!`,
  (name, day, cal) => `يا ${name}، كل يوم تتدرب فيه هو استثمار في نفسك. يوم ${day} مكتمل. فخور بك!`,
  (name, day, cal) => `أنت بطل يا ${name}! اليوم ${day} انتهى. الانضباط يصنع الفرق. لا تتوقف!`,
  (name, day, cal) => `ممتاز يا ${name}! أنهيت تمريناً آخر. ${cal} سعرة أقل. هدفك أقرب!`,
  (name, day, cal) => `يا ${name}، الجهد لا يكذب. اليوم ${day} مكتمل. استرح جيداً واستعد للغد!`,
  (name, day, cal) => `عظيم يا ${name}! كل تمرين يبني نسخة أفضل منك. يوم ${day} منجز!`,
];

function speakMotivation(day, cal) {
  if (!S.ttsOn) return;
  if (!window.speechSynthesis) return;
  const name = S.user?.name || 'بطل';
  const idx = (day - 1) % MOTIVATIONAL_SPEECHES.length;
  const text = MOTIVATIONAL_SPEECHES[idx](name, day, cal);
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ar-SA';
  utt.rate = 0.9;
  utt.pitch = 1.0;
  utt.volume = Math.min(1.0, ((S.volume || 80) / 100) * 1.8);

  function _speak() {
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar')) || null;
    if (arVoice) utt.voice = arVoice;
    setTimeout(() => window.speechSynthesis.speak(utt), 900);
  }

  // FIX: getVoices() قد يكون فارغاً — ننتظر voiceschanged إذا لزم
  // FIX-DOUBLE: نمنع تنفيذ _speak مرتين إذا حدث voiceschanged بعد setTimeout
  let _spokenOnce = false;
  function _speakOnce() {
    if (_spokenOnce) return;
    _spokenOnce = true;
    _speak();
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    _speakOnce();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', _speakOnce, { once: true });
    // fallback بعد ثانية إذا لم يحدث voiceschanged
    setTimeout(_speakOnce, 1800);
  }
}

function testMotivationSpeech() {
  const orig = S.ttsOn;
  S.ttsOn = true;
  speakMotivation(S.currentDay || 1, 250);
  S.ttsOn = orig;
}

/* ══════ SOUND SHEET ══════ */
function openSoundSheet()  { document.getElementById('sound-sheet').classList.add('open'); }
function closeSoundSheet() { document.getElementById('sound-sheet').classList.remove('open'); }

function openSettingsSheet() {
  const sheet = document.getElementById('settings-sheet');
  sheet.style.display = 'flex';
  // Populate fields
  document.getElementById('settings-apikey').value = S.apiKey || '';
  document.getElementById('set-name').value = S.user?.name || '';
  document.getElementById('set-weight').value = S.user?.weight || '';
  document.getElementById('set-height').value = S.user?.height || '';
  // إضافة العمر والجنس
  const ageEl = document.getElementById('set-age');
  if (ageEl) ageEl.value = S.user?.age || '';
  const gEl = S.user?.gender || 'male';
  const gmBtn = document.getElementById('set-gender-male');
  const gfBtn = document.getElementById('set-gender-female');
  if (gmBtn) { gmBtn.style.background = gEl==='male' ? 'rgba(99,102,241,.2)' : 'var(--bg)'; gmBtn.style.borderColor = gEl==='male' ? '#6366f1' : 'var(--border)'; }
  if (gfBtn) { gfBtn.style.background = gEl==='female' ? 'rgba(236,72,153,.2)' : 'var(--bg)'; gfBtn.style.borderColor = gEl==='female' ? '#ec4899' : 'var(--border)'; }
  document.getElementById('set-traintime').value = S.user?.trainTime || '';
  const sdEl = document.getElementById('set-startdate');
  if (sdEl) sdEl.value = S.user?.startDate || new Date().toISOString().split('T')[0];
  // Update TTS toggle state
  const ttsBtn = document.getElementById('tts-toggle');
  if (ttsBtn) ttsBtn.classList.toggle('on', S.ttsOn !== false);
  // Update program switcher highlight
  const prog = S.user?.program || 'standard';
  const btnStd = document.getElementById('pgm-btn-standard');
  const btnBeg = document.getElementById('pgm-btn-beginner');
  if (btnStd) { btnStd.style.background = prog==='standard'?'rgba(212,168,67,.2)':'var(--bg)'; btnStd.style.border = '2px solid '+(prog==='standard'?'var(--gold)':'var(--border)'); }
  if (btnBeg) { btnBeg.style.background = prog==='beginner'?'rgba(34,197,94,.2)':'var(--bg)'; btnBeg.style.border = '2px solid '+(prog==='beginner'?'#22c55e':'var(--border)'); }
  // Update install section state
  updateInstallSection();
  // Sync notification toggle
  if (typeof _syncSettingsNotifToggle === 'function') _syncSettingsNotifToggle();
}
function closeSettingsSheet() { document.getElementById('settings-sheet').style.display = 'none'; }
function saveApiKey() {
  const key = document.getElementById('settings-apikey').value.trim();
  // ── Validation: يجب أن يبدأ بـ gsk_ أو يكون فارغاً ──
  if (key && !key.startsWith('gsk_')) {
    showMiniToast('⚠️ مفتاح Groq يجب أن يبدأ بـ gsk_');
    return;
  }
  S.apiKey = key; // فارغ = استخدام SHARED_GROQ_KEY
  saveState();
  // تحديث حقل الإدخال بالقيمة الصحيحة
  const inp = document.getElementById('settings-apikey');
  if (inp) inp.value = key;
  const msg = key
    ? (currentLang==='en'?'✅ Key saved':currentLang==='fr'?'✅ Clé sauvegardée':'✅ تم حفظ مفتاحك الشخصي')
    : (currentLang==='en'?'🗑️ Key removed — using shared key':currentLang==='fr'?'🗑️ Clé supprimée':'🗑️ تم الحذف — يستخدم المفتاح المشترك');
  showMiniToast(msg);
}
function setSettingsGender(g) {
  if (!S.user) S.user = {};
  S.user.gender = g;
  const mBtn = document.getElementById('set-gender-male');
  const fBtn = document.getElementById('set-gender-female');
  if (mBtn) { mBtn.style.background = g==='male' ? 'rgba(99,102,241,.2)' : 'var(--bg)'; mBtn.style.borderColor = g==='male' ? '#6366f1' : 'var(--border)'; }
  if (fBtn) { fBtn.style.background = g==='female' ? 'rgba(236,72,153,.2)' : 'var(--bg)'; fBtn.style.borderColor = g==='female' ? '#ec4899' : 'var(--border)'; }
}

function saveProfile() {
  if (!S.user) S.user = {};
  const rawWeight = parseFloat(document.getElementById('set-weight').value) || 0;
  const rawHeight = parseFloat(document.getElementById('set-height').value) || 0;
  const ageEl = document.getElementById('set-age');
  const rawAge = ageEl ? parseFloat(ageEl.value) || 0 : 0;

  // FIX: تحقق من صحة القيم قبل الحفظ
  if (rawWeight < 0 || rawWeight > 400) { showMiniToast('⚠️ أدخل وزناً صحيحاً (كغ)'); return; }
  if (rawHeight < 0 || rawHeight > 300) { showMiniToast('⚠️ أدخل طولاً صحيحاً (سم)'); return; }
  if (rawAge < 0 || rawAge > 120) { showMiniToast('⚠️ أدخل عمراً صحيحاً'); return; }

  S.user.name     = document.getElementById('set-name').value.trim();
  if (rawWeight > 0) S.user.weight = rawWeight;
  if (rawHeight > 0) S.user.height = rawHeight;
  if (rawAge    > 0) S.user.age    = rawAge;
  S.user.trainTime = document.getElementById('set-traintime').value;
  // gender محفوظ مباشرة عند الضغط على الأزرار (setSettingsGender)
  const sd = document.getElementById('set-startdate')?.value;
  if (sd) {
    S.user.startDate = sd;
    S.startDate = sd;
    // إعادة حساب currentDay من تاريخ البداية الجديد
    const start = new Date(sd);
    const today = new Date();
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffDays = Math.floor((today - start) / 86400000) + 1;
    const maxDay = S.user?.programDays || 30;
    S.currentDay = Math.max(1, Math.min(diffDays, maxDay));
  }
  saveState();
  // مزامنة مع Sheets إذا كان مسجلاً
  if (window._fbUser && window.sendToSheets) window.sendToSheets(window._fbUser, {});
  // تحديث config الإشعار بعد حفظ الملف الشخصي (وقت التدريب قد تغير)
  try {
    if (typeof scheduleTrainingNotif === 'function' &&
        typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setTimeout(scheduleTrainingNotif, 500);
    }
  } catch(e) {}
  showMiniToast(currentLang==='en'?'✅ Profile saved':currentLang==='fr'?'✅ Profil sauvegardé':'✅ تم حفظ الملف الشخصي');
  closeSettingsSheet();
}
function switchProgram(prog) {
  // FIX#6: double confirmation + backup
  const progName = prog === 'beginner'
    ? (currentLang==='en'?'Beginner (21 days)':currentLang==='fr'?'Débutant (21 jours)':'المبتدئين (21 يوم)')
    : (currentLang==='en'?'Advanced (30 days)':currentLang==='fr'?'Avancé (30 jours)':'المتقدم (30 يوم)');
  const confirm1 = currentLang==='en'
    ? `Switch to ${progName} program?\nDay will reset to 1.`
    : currentLang==='fr'
      ? `Passer au programme ${progName}?\nLe jour sera remis à 1.`
      : `هل تريد التبديل لبرنامج ${progName}?\nسيعود اليوم الحالي إلى 1.`;
  if (!confirm(confirm1)) return;
  const hasProgress = (S.completedDays||[]).length > 3;
  if (hasProgress) {
    const confirm2 = currentLang==='en'
      ? `⚠️ Warning: You have ${S.completedDays.length} completed days.\nAre you sure? This cannot be undone.`
      : currentLang==='fr'
        ? `⚠️ Attention: Vous avez ${S.completedDays.length} jours complétés.\nÊtes-vous sûr? Impossible d'annuler.`
        : `⚠️ تنبيه: لديك ${S.completedDays.length} يوماً مكتملاً.\nهل أنت متأكد؟ لا يمكن التراجع.`;
    if (!confirm(confirm2)) return;
  }
  // Backup current progress
  S._programBackup = {
    program: S.user?.program,
    programDays: S.user?.programDays,
    currentDay: S.currentDay,
    completedDays: [...(S.completedDays||[])],
    calories: S.calories,
    streak: S.streak,
    backedUpAt: Date.now()
  };
  if (!S.user) S.user = {};
  S.user.program = prog;
  S.user.programDays = prog === 'beginner' ? 21 : 30;
  S.currentDay = 1;
  S.completedDays = [];
  S.completedExercises = {};
  S.calories = 0;
  S.streak = 0;
  saveState();
  const pgmDesc = document.getElementById('pgm-desc');
  if (pgmDesc) pgmDesc.textContent = prog==='beginner'
    ? (currentLang==='en'?'🌱 Gentle beginner program: 3 training days × 4 weeks, lighter exercises with rest.':currentLang==='fr'?'🌱 Programme débutant: 3 jours entraînement × 4 semaines, exercices légers.':'🌱 برنامج مريح للبدء: 3 أيام تدريب × 4 أسابيع، تمارين أخف وراحة كافية.')
    : (currentLang==='en'?'🔥 Advanced program: HIIT + strength + core. Suitable for those with base fitness.':currentLang==='fr'?'🔥 Programme avancé: HIIT + force + core. Pour ceux qui ont une base de condition physique.':'🔥 برنامج متكامل: HIIT + قوة + كور. مناسب لمن لديهم لياقة أساسية.');
  closeSettingsSheet();
  render();
  showMiniToast(prog === 'beginner'
    ? (currentLang==='en'?'🌱 Beginner 21-day program — let\'s go!':currentLang==='fr'?'🌱 Programme débutant 21 jours — allons-y!':'🌱 برنامج المبتدئين 21 يوم — يلا نبدأ!')
    : (currentLang==='en'?'🔥 Advanced program — ready!':currentLang==='fr'?'🔥 Programme avancé — prêt!':'🔥 البرنامج المتقدم — جاهز!'));
}
function toggleTTS() {
  S.ttsOn = !S.ttsOn; saveState();
  document.getElementById('tts-toggle').classList.toggle('on', S.ttsOn);
  showMiniToast(S.ttsOn
    ? (currentLang==='en'?'🎙️ Motivational voice ON':currentLang==='fr'?'🎙️ Voix motivante activée':'🎙️ الصوت التحفيزي مفعّل')
    : (currentLang==='en'?'🔇 Motivational voice OFF':currentLang==='fr'?'🔇 Voix motivante désactivée':'🔇 الصوت التحفيزي متوقف'));
}
function toggleSound() {
  S.soundOn = !S.soundOn; saveState();
  document.getElementById('snd-toggle').classList.toggle('on', S.soundOn);
}
function toggleTick() {
  S.tickOn = !S.tickOn; saveState();
  document.getElementById('tick-toggle').classList.toggle('on', S.tickOn);
}
function setVolume(v) { S.volume = parseInt(v); saveState(); }

