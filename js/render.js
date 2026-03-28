/* ══════ RENDER ══════ */

/* ══════ HOME TAB ══════ */
function renderHome() {
  const tab = document.getElementById('tab-home');
  if (!tab) return;
  // FIX-XSS: escape الاسم قبل حقنه في innerHTML
  const name = S.user?.name ? _escHtml(S.user.name) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? (currentLang === 'en' ? 'Good morning' : currentLang === 'fr' ? 'Bonjour' : 'صباح الخير')
    : hour < 17
      ? (currentLang === 'en' ? 'Good afternoon' : currentLang === 'fr' ? 'Bon après-midi' : 'مساء النور')
      : (currentLang === 'en' ? 'Good evening' : currentLang === 'fr' ? 'Bonsoir' : 'مساء الخير');
  const _idTitle  = typeof updateIdentityTitle === 'function' ? updateIdentityTitle() : '';
  const greetFull = name
    ? greeting + ' ' + name + (_idTitle ? ` · ${_idTitle}` : '') + ' 👋'
    : greeting + ' 👋';

  const totalDays = S.user?.programDays || 30;
  const doneDays  = (S.completedDays || []).length;
  const streak    = S.streak || 0;
  const calories  = S.calories || 0;
  const progress  = Math.min(100, Math.round((doneDays / totalDays) * 100));
  const isDone    = (S.completedDays||[]).includes(S.currentDay);

  // Get today exercises count
  const todaySched = getDaySchedule(S.currentDay);
  const todayExCount = todaySched.type === 'rest' ? 0 : (todaySched.exercises || []).length;
  const todayIsRest  = todaySched.type === 'rest';

  // Motivational phrase based on streak
  // Near Miss + Sunk Cost + Identity (أولوية على الرسائل العادية)
  const _nearMiss   = typeof getNearMissMessage  === 'function' ? getNearMissMessage()  : null;
  const _sunkCost   = typeof getSunkCostMessage  === 'function' ? getSunkCostMessage()  : null;
  const _identity   = typeof updateIdentityTitle === 'function' ? updateIdentityTitle() : '';
  const _lossWarn   = typeof getLossAversionMessage === 'function' ? getLossAversionMessage() : null;

  const motiv = _nearMiss || _lossWarn?.msg ||
    (streak >= 7
      ? (currentLang === 'en' ? '🔥 ' + streak + ' day streak! Keep it up!' : currentLang === 'fr' ? '🔥 ' + streak + ' jours d\'affilée!' : '🔥 ' + streak + ' يوم متتالي! استمر!')
      : streak >= 3
        ? (currentLang === 'en' ? '💪 ' + streak + ' days strong!' : currentLang === 'fr' ? '💪 ' + streak + ' jours de suite!' : '💪 ' + streak + ' أيام قوي!')
        : (_sunkCost || (currentLang === 'en' ? 'Every rep counts 💪' : currentLang === 'fr' ? 'Chaque effort compte 💪' : 'كل تمرين يصنع الفرق 💪')));

  tab.innerHTML = `
    <div style="padding:20px 16px 100px;">
      <!-- تحية -->
      <div style="margin-bottom:20px;">
        <div style="font-size:22px;font-weight:900;color:var(--txt);line-height:1.3;">${greetFull}</div>
        <div style="font-size:13px;color:var(--dim);margin-top:4px;">${motiv}</div>
      </div>

      <!-- إحصاء سريع -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 10px;text-align:center;">
          <div style="font-size:26px;font-weight:900;color:var(--gold);">${S.currentDay}</div>
          <div style="font-size:11px;color:var(--dim);margin-top:2px;">${currentLang === 'en' ? 'Day' : currentLang === 'fr' ? 'Jour' : 'اليوم'}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 10px;text-align:center;">
          <div style="font-size:26px;font-weight:900;color:#f97316;">${streak}</div>
          <div style="font-size:11px;color:var(--dim);margin-top:2px;">${currentLang === 'en' ? 'Streak 🔥' : currentLang === 'fr' ? 'Série 🔥' : 'سلسلة 🔥'}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 10px;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:#22c55e;">${calories > 999 ? (calories/1000).toFixed(1)+'k' : calories}</div>
          <div style="font-size:11px;color:var(--dim);margin-top:2px;">${currentLang === 'en' ? 'Calories ⚡' : currentLang === 'fr' ? 'Calories ⚡' : 'سعرة ⚡'}</div>
        </div>
      </div>

      <!-- شريط التقدم الكلي -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:700;color:var(--txt);">${currentLang === 'en' ? 'Program Progress' : currentLang === 'fr' ? 'Progression' : 'تقدم البرنامج'}</span>
          <span style="font-size:12px;color:var(--gold);font-weight:800;">${doneDays}/${totalDays} ${currentLang === 'en' ? 'days' : currentLang === 'fr' ? 'jours' : 'يوم'}</span>
        </div>
        <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--gl),var(--gd));border-radius:4px;transition:width .6s ease;"></div>
        </div>
        <div style="font-size:11px;color:var(--dim);margin-top:6px;text-align:end;">${progress}%</div>
      </div>

      <!-- زر مشاركة سريعة — يظهر بعد 3 أيام -->
      ${(S.completedDays||[]).length >= 3 ? `
        <button onclick="shareProgress()" style="width:100%;padding:10px;border-radius:14px;background:rgba(212,168,67,.07);border:1.5px dashed rgba(212,168,67,.25);color:var(--gold);font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px;">
          📤 شارك تقدمك مع أصدقائك
        </button>` : ''}

      <!-- زر ابدأ اليوم -->
      <div style="margin-bottom:12px;">
        ${isDone
          ? `<button onclick="switchTab('workout', document.getElementById('tab-btn-workout'))"
               style="width:100%;padding:16px;border-radius:18px;background:rgba(74,222,128,.12);border:2px solid #4ade80;color:#4ade80;font-family:'Cairo',sans-serif;font-size:16px;font-weight:900;cursor:pointer;">
               ✅ ${currentLang === 'en' ? 'Day Complete!' : currentLang === 'fr' ? 'Journée terminée !' : 'اليوم مكتمل!'}
             </button>`
          : todayIsRest
            ? `<button onclick="switchTab('workout', document.getElementById('tab-btn-workout'))"
                 style="width:100%;padding:16px;border-radius:18px;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1));border:2px solid rgba(99,102,241,.4);color:#818cf8;font-family:'Cairo',sans-serif;font-size:16px;font-weight:900;cursor:pointer;">
                 😴 ${currentLang === 'en' ? 'Rest Day — View Details' : currentLang === 'fr' ? 'Jour de repos — Voir détails' : 'يوم راحة — عرض التفاصيل'}
               </button>`
            : `<button onclick="startGuidedSession()"
                 style="width:100%;padding:16px;border-radius:18px;background:linear-gradient(135deg,var(--gl),var(--gd));border:none;color:var(--night);font-family:'Cairo',sans-serif;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 4px 20px rgba(212,168,67,.3);">
                 ▶ ${window.T ? window.T('startToday', 'ابدأ تدريب اليوم') : 'ابدأ تدريب اليوم'} (${todayExCount} ${currentLang === 'en' ? 'exercises' : currentLang === 'fr' ? 'exercices' : 'تمرين'})
               </button>`
        }
      </div>

      <!-- ملاحظة سريعة: اليوم والمرحلة -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
        ${(()=>{
          const ph = typeof getPhase === 'function' ? getPhase(S.currentDay) : null;
          const phName = ph && typeof getPhaseName === 'function' ? getPhaseName(ph) : '';
          const icon = ph ? ph.icon : '🏋️';
          const dayLabel = currentLang === 'en' ? 'Day' : currentLang === 'fr' ? 'Jour' : 'اليوم';
          const restLabel = currentLang === 'en' ? 'Rest' : currentLang === 'fr' ? 'Repos' : 'راحة';
          const exLabel = currentLang === 'en' ? 'exercises' : currentLang === 'fr' ? 'exercices' : 'تمرين';
          const sub = todayIsRest ? restLabel : (todayExCount + ' ' + exLabel);
          return '<span style="font-size:28px;">' + icon + '</span>'
            + '<div><div style="font-size:13px;font-weight:800;color:var(--txt);">' + _escHtml(phName) + '</div>'
            + '<div style="font-size:11px;color:var(--dim);margin-top:2px;">' + dayLabel + ' ' + S.currentDay + ' · ' + sub + '</div></div>';
        })()}
      </div>
      ${_renderCommitmentWidget()}
    </div>`;
}

// ── Commitment Device — أيام الوعد الأسبوعية ──
function _renderCommitmentWidget() {
  const DAYS_AR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
  const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const days = currentLang==='en' ? DAYS_EN : currentLang==='fr' ? DAYS_FR : DAYS_AR;
  const committed = S.commitmentDays || [];
  const today = new Date().getDay();

  return `
    <div style="margin-top:10px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:800;color:var(--txt);">
          🗓️ ${currentLang==='en'?'My training days':currentLang==='fr'?'Mes jours d\'entraînement':'أيام تمريني'}
        </div>
        ${committed.length === 0
          ? `<div style="font-size:10px;color:var(--dim);">اضغط لتحديد أيامك</div>`
          : `<div style="font-size:10px;color:var(--gold);">${committed.length} أيام/أسبوع ✓</div>`
        }
      </div>
      <div style="display:flex;gap:4px;justify-content:space-between;">
        ${days.map((d,i) => {
          const isCommitted = committed.includes(i);
          const isToday     = i === today;
          return `<button onclick="toggleCommitDay(${i})"
            style="flex:1;padding:6px 2px;border-radius:10px;border:1.5px solid ${isCommitted?'var(--gold)':'rgba(255,255,255,.1)'};
            background:${isCommitted?'rgba(212,168,67,.2)':'rgba(255,255,255,.04)'};
            color:${isCommitted?'var(--gold)':isToday?'var(--txt)':'var(--dim)'};
            font-family:'Cairo',sans-serif;font-size:10px;font-weight:${isCommitted?'800':'500'};cursor:pointer;
            ${isToday?'box-shadow:0 0 0 1.5px rgba(255,255,255,.2);':''}">
            ${d}${isToday?'<br><span style="font-size:8px;opacity:.6;">●</span>':''}
          </button>`;
        }).join('')}
      </div>
    </div>`;
}

function toggleCommitDay(dayIdx) {
  if (!S.commitmentDays) S.commitmentDays = [];
  const idx = S.commitmentDays.indexOf(dayIdx);
  if (idx >= 0) {
    S.commitmentDays.splice(idx, 1);
  } else {
    S.commitmentDays.push(dayIdx);
    // إشعار عند اختيار يوم جديد
    if (S.commitmentDays.length === 3) {
      showMiniToast('💪 وعدت بـ 3 أيام — سنذكّرك!');
    }
  }
  saveState();
  renderHome();
  // تحديث config الإشعار بأيام الوعد
  try {
    if (typeof scheduleTrainingNotif === 'function' &&
        typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      scheduleTrainingNotif();
    }
  } catch(e) {}
}

function switchTab(tab, btn) {
  // Redirect tips to coach (tab-tips has no content)
  if (tab === 'tips') { switchTab('coach', document.querySelector(".tab-btn[onclick*='coach']") || btn); return; }
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (btn) btn.classList.add('active');
  // إظهار شريط الأيام فقط في تبويب تدريب
  const stripCont = document.getElementById('day-strip-container');
  if (stripCont) stripCont.style.display = tab === 'workout' ? 'block' : 'none';
  // FIX-COACH-LAYOUT: تحديث ارتفاع الهيدر كـ CSS variable لضبط coach tab بدقة
  if (tab === 'coach') {
    const hdr = document.querySelector('.app-header');
    if (hdr) document.documentElement.style.setProperty('--header-h', hdr.offsetHeight + 'px');
  }
  if (tab === 'home')     renderHome();
  if (tab === 'progress') renderProgress();
  if (tab === 'coach')    renderCoach();
}

function render() {
  renderDayStrip();
  renderWorkoutTab();
  renderHome();
  renderHeaderStats();
  // إظهار شريط الأيام إذا كان تبويب تدريب نشطاً
  const stripCont = document.getElementById('day-strip-container');
  if (stripCont) {
    const workoutActive = document.getElementById('tab-workout')?.classList.contains('active');
    stripCont.style.display = workoutActive ? 'block' : 'none';
  }
  if (document.body.classList.contains('desktop-mode')) dtRender();
  if (document.body.classList.contains('tv-mode') && typeof tvRender === 'function') tvRender();
}

/* ── عرض بطاقة المستوى ── */
function _renderLevelCard() {
  let card = document.getElementById('level-card-section');
  if (!card) {
    // حقن قبل phases-list
    const phasesSec = document.getElementById('phases-list')?.closest('.sec-card');
    if (!phasesSec) return;
    card = document.createElement('div');
    card.id = 'level-card-section';
    card.className = 'sec-card';
    card.style.cssText = 'margin-bottom:12px;background:linear-gradient(135deg,rgba(212,168,67,.08),rgba(212,168,67,.03));border-color:rgba(212,168,67,.2);';
    phasesSec.insertAdjacentElement('beforebegin', card);
  }
  const level = typeof getCurrentLevel === 'function' ? getCurrentLevel() : {lvl:1,name:'مبتدئ',icon:'🌱',color:'#6B7280'};
  const next  = typeof getNextLevel   === 'function' ? getNextLevel()   : null;
  const done  = (S.completedDays||[]).length;
  const pct   = next ? Math.min(100, Math.round(((done-level.minDays)/(next.minDays-level.minDays))*100)) : 100;

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="width:56px;height:56px;border-radius:16px;background:rgba(212,168,67,.15);border:2px solid rgba(212,168,67,.3);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">${level.icon}</div>
      <div style="flex:1;">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
          <span style="font-size:16px;font-weight:900;color:var(--gold);">مستوى ${level.lvl}</span>
          <span style="font-size:13px;color:var(--txt);font-weight:700;">${level.name}</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;margin-bottom:4px;">
          <div id="level-progress-bar" style="height:100%;width:${pct}%;background:${level.color};border-radius:4px;transition:width .6s ease;"></div>
        </div>
        <div id="level-progress-text" style="font-size:10px;color:var(--dim);">
          ${next ? `${done-level.minDays}/${next.minDays-level.minDays} يوم للمستوى ${next.lvl} — ${next.name} ${next.icon}` : '🏆 أعلى مستوى — أسطورة AZEM!'}
        </div>
      </div>
    </div>`;
}

/* ── عرض التحدي الأسبوعي ── */
function _renderWeeklyChallenge() {
  let card = document.getElementById('weekly-challenge-section');
  if (!card) {
    const phasesSec = document.getElementById('phases-list')?.closest('.sec-card');
    if (!phasesSec) return;
    card = document.createElement('div');
    card.id = 'weekly-challenge-section';
    card.className = 'sec-card';
    card.style.cssText = 'margin-bottom:12px;background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.04));border-color:rgba(99,102,241,.25);';
    // Insert after level card
    const lvlCard = document.getElementById('level-card-section');
    const anchor = lvlCard || phasesSec;
    anchor.insertAdjacentElement('afterend', card);
  }
  const ch = typeof initOrRefreshChallenge === 'function' ? initOrRefreshChallenge() : null;
  if (!ch) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const prog = ch.progress || 0;
  const pct  = Math.min(100, Math.round((prog / ch.target) * 100));
  const color = ch.done ? '#22c55e' : pct >= 60 ? '#f97316' : '#6366f1';

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:800;color:#818cf8;">🎯 تحدي الأسبوع</div>
      ${ch.done ? '<div style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(34,197,94,.15);color:#22c55e;font-weight:700;">✅ مكتمل!</div>' : ''}
    </div>
    <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:10px;">${ch.desc}</div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="flex:1;height:10px;background:rgba(255,255,255,.07);border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:5px;transition:width .6s ease;"></div>
      </div>
      <div style="font-size:13px;font-weight:900;color:${color};flex-shrink:0;">${prog}/${ch.target}</div>
    </div>`;
}


/* ── عرض الهدف الأسبوعي للسعرات ── */
function _renderWeeklyCalGoal() {
  const statsEl = document.getElementById('p-remain')?.closest('.sec-card');
  if (!statsEl) return;

  let goalCard = document.getElementById('weekly-cal-goal-card');
  if (!goalCard) {
    goalCard = document.createElement('div');
    goalCard.id = 'weekly-cal-goal-card';
    goalCard.className = 'sec-card';
    goalCard.style.cssText = 'margin-bottom:12px;';
    statsEl.insertAdjacentElement('afterend', goalCard);
  }

  const weekGoal   = typeof calcWeeklyCalGoal  === 'function' ? calcWeeklyCalGoal()  : 2500;
  const weekBurned = typeof calcWeeklyCalBurned === 'function' ? calcWeeklyCalBurned() : 0;
  const pct = Math.min(100, Math.round((weekBurned / weekGoal) * 100));
  const barColor = pct >= 100 ? '#22c55e' : pct >= 60 ? '#D4A843' : '#f97316';
  const daysLeft = 7 - new Date().getDay();

  goalCard.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:800;color:var(--txt);">🎯 هدف الأسبوع</div>
      <button onclick="_editWeeklyGoal()" style="padding:4px 10px;border-radius:8px;background:rgba(212,168,67,.1);border:1px solid rgba(212,168,67,.2);color:var(--gold);font-size:11px;cursor:pointer;">✏️ تعديل</button>
    </div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:8px;">
      <span style="font-size:28px;font-weight:900;color:${barColor};">${weekBurned.toLocaleString('ar')}</span>
      <span style="font-size:13px;color:var(--dim);">/ ${weekGoal.toLocaleString('ar')} كال</span>
      <span style="font-size:11px;color:var(--dim);margin-right:auto;">${daysLeft} يوم متبقي</span>
    </div>
    <div style="height:10px;background:rgba(255,255,255,.07);border-radius:5px;overflow:hidden;margin-bottom:6px;">
      <div style="height:100%;width:${pct}%;background:${barColor};border-radius:5px;transition:width .6s;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);">
      <span>${pct}% مكتمل</span>
      <span>${Math.max(0, weekGoal - weekBurned).toLocaleString('ar')} كال متبقية</span>
    </div>
    ${pct >= 100 ? '<div style="text-align:center;margin-top:8px;font-size:13px;color:#22c55e;font-weight:700;">🎉 حققت هدف الأسبوع!</div>' : ''}
  `;
}

function _editWeeklyGoal() {
  const cur = typeof calcWeeklyCalGoal === 'function' ? calcWeeklyCalGoal() : 2500;
  const val = prompt('أدخل هدف السعرات الأسبوعي (كال):', cur);
  if (!val || isNaN(parseInt(val))) return;
  S.weeklyCalGoal = Math.max(500, parseInt(val));
  saveState();
  _renderWeeklyCalGoal();
  showMiniToast(`✅ هدف الأسبوع: ${S.weeklyCalGoal} كال`);
}


/* ══════════════════════════════════════════
   FIRST OPEN RITUAL — طقس الفتح اليومي
   يُشغَّل مرة واحدة فقط عند أول فتح كل يوم
   يُنشئ عادة "افتح AZEM كل صباح"
══════════════════════════════════════════ */
function checkFirstOpenToday() {
  const todayKey = new Date().toISOString().split('T')[0];
  const lastOpen = localStorage.getItem('azem_last_open') || '';
  if (lastOpen === todayKey) return; // فُتح اليوم بالفعل
  localStorage.setItem('azem_last_open', todayKey);

  const streak  = S.streak || 0;
  const done    = (S.completedDays||[]).length;
  const name    = S.user?.name || 'بطل';
  const hour    = new Date().getHours();
  const isDoneToday = (S.completedDays||[]).includes(S.currentDay);
  const level   = typeof getCurrentLevel === 'function' ? getCurrentLevel() : {icon:'💪', name:'رياضي'};

  // اختيار رسالة الترحيب حسب السياق
  let title, body, emoji;

  if (streak >= 7 && !isDoneToday) {
    title = `${streak} يوم متواصل ${level.icon}`;
    body  = `لا تكسر السلسلة اليوم يا ${name} — تمرين واحد يكفي!`;
    emoji = '🔥';
  } else if (isDoneToday) {
    title = `أحسنت ${name}! ✅`;
    body  = `أكملت تمرينك اليوم — استرح جيداً وكن جاهزاً للغد.`;
    emoji = '🏆';
  } else if (hour < 10) {
    title = `صباح النشاط ☀️`;
    body  = `${name}! أفضل وقت للتمرين هو الآن — جسمك جاهز.`;
    emoji = '⚡';
  } else if (hour >= 20) {
    title = `مساء ${name} 🌙`;
    body  = streak > 0
      ? `لا تنم قبل تمرينك — سلسلتك ${streak} يوم تنتظرك!`
      : `يوم جيد لبدء سلسلتك الأولى! 10 دقائق تكفي.`;
    emoji = '🌙';
  } else {
    const msgs = [
      { t: `اليوم ${S.currentDay} في انتظارك`, b: `${done} يوم مكتمل — استمر!`, e: '💪' },
      { t: `${level.icon} مستوى ${level.lvl} — ${level.name}`, b: `${name}! كل جلسة ترفعك أعلى.`, e: '🎯' },
      { t: `أهلاً ${name}!`, b: `تمرين اليوم يُحرق أكثر مما تتخيل.`, e: '🔥' },
    ];
    const pick = msgs[done % msgs.length];
    title = pick.t; body = pick.b; emoji = pick.e;
  }

  // عرض ritual toast خاص — أكبر وأبطأ من المعتاد
  setTimeout(() => _showRitualToast(emoji, title, body), 800);
}

function _showRitualToast(emoji, title, body) {
  let toast = document.getElementById('ritual-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ritual-toast';
    toast.style.cssText = [
      'position:fixed', 'top:70px', 'left:50%',
      'transform:translateX(-50%) translateY(-20px)',
      'z-index:99997', 'background:var(--card)',
      'border:1.5px solid rgba(212,168,67,.35)',
      'border-radius:18px', 'padding:14px 20px',
      'display:flex', 'align-items:center', 'gap:12px',
      'box-shadow:0 8px 32px rgba(0,0,0,.4)',
      'max-width:340px', 'width:calc(100% - 32px)',
      'opacity:0', 'transition:all .4s cubic-bezier(.34,1.56,.64,1)',
      'cursor:pointer',
    ].join(';');
    toast.onclick = () => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(), 400); };
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div style="font-size:32px;flex-shrink:0;">${emoji}</div>
    <div>
      <div style="font-size:14px;font-weight:900;color:var(--txt);margin-bottom:3px;">${title}</div>
      <div style="font-size:12px;color:var(--dim);line-height:1.5;">${body}</div>
    </div>`;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  // يختفي تلقائياً بعد 5 ثواني
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }
  }, 5000);
}


function _renderProgressPhotoCard() {
  const container = document.getElementById('tab-progress');
  if (!container) return;

  let card = document.getElementById('progress-photo-card');
  if (!card) {
    card = document.createElement('div');
    card.id = 'progress-photo-card';
    card.className = 'sec-card';
    card.style.marginBottom = '12px';
    // إدراج بعد weekly-cal-goal-card إذا وُجد
    const wcCard = document.getElementById('weekly-cal-goal-card');
    if (wcCard) wcCard.insertAdjacentElement('afterend', card);
    else container.insertAdjacentElement('afterbegin', card);
  }

  const lang = currentLang || S.lang || 'ar';
  const _t = (ar,en) => lang==='en'?en:ar;
  let photos = [];
  try { photos = JSON.parse(localStorage.getItem('azem_photos')||'[]'); } catch(e){}
  const last = photos[photos.length-1];

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:800;color:var(--txt);">
        📸 ${_t('صور التقدم','Progress Photos')}
      </div>
      <button onclick="openProgressPhotoSection()"
        style="padding:6px 12px;border-radius:10px;
        background:linear-gradient(135deg,var(--gl),var(--gd));
        border:none;color:var(--night);font-family:'Cairo',sans-serif;
        font-size:11px;font-weight:900;cursor:pointer;">
        ${photos.length > 0 ? _t('عرض الكل','View All') + ` (${photos.length})` : _t('+ إضافة','+ Add')}
      </button>
    </div>
    ${last ? `
      <div style="display:flex;gap:10px;align-items:center;">
        <img src="${last.data}"
          style="width:60px;height:80px;border-radius:10px;object-fit:cover;flex-shrink:0;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--txt);">
            ${_t('آخر صورة','Last photo')}: ${last.date}
          </div>
          <div style="font-size:11px;color:var(--dim);margin-top:3px;">
            ${_t('يوم','Day')} ${last.day} · ${photos.length} ${_t('صور إجمالاً','photos total')}
          </div>
          ${photos.length >= 2 ? `
            <button onclick="openProgressPhotoSection()"
              style="margin-top:6px;padding:4px 10px;border-radius:8px;
              background:rgba(212,168,67,.1);border:1px solid rgba(212,168,67,.2);
              color:var(--gold);font-family:'Cairo',sans-serif;font-size:10px;cursor:pointer;">
              ${_t('قارن مع البداية','Compare with start')}
            </button>` : ''}
        </div>
      </div>` : `
      <div style="text-align:center;padding:12px;color:var(--dim);font-size:12px;">
        ${_t('التقاط صورة كل أسبوع لمشاهدة تحولك 💪','Take a photo weekly to see your transformation 💪')}
      </div>`}`;
}


function _renderLeaderboardCard() {
  const container = document.getElementById('tab-progress');
  if (!container) return;

  let card = document.getElementById('leaderboard-card');
  if (!card) {
    card = document.createElement('div');
    card.id = 'leaderboard-card';
    card.className = 'sec-card';
    card.style.marginBottom = '12px';
    const photoCard = document.getElementById('progress-photo-card');
    if (photoCard) photoCard.insertAdjacentElement('afterend', card);
  }

  const lang = currentLang || S.lang || 'ar';
  const _t = (ar,en) => lang==='en'?en:ar;
  const isLoggedIn = !!window._fbUser;

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--txt);">
          🏆 ${_t('لوحة المتصدرين','Leaderboard')}
        </div>
        <div style="font-size:11px;color:var(--dim);margin-top:2px;">
          ${isLoggedIn
            ? _t(`XP الخاص بك: ${S.xp||0} ⚡`, `Your XP: ${S.xp||0} ⚡`)
            : _t('سجّل دخولك للمشاركة','Sign in to participate')}
        </div>
      </div>
      <button onclick="openLeaderboard()"
        style="padding:8px 14px;border-radius:12px;
        background:${isLoggedIn ? 'linear-gradient(135deg,var(--gl),var(--gd))' : 'rgba(255,255,255,.08)'};
        border:${isLoggedIn ? 'none' : '1px solid var(--border)'};
        color:${isLoggedIn ? 'var(--night)' : 'var(--dim)'};
        font-family:'Cairo',sans-serif;font-size:12px;font-weight:800;cursor:pointer;">
        ${_t('عرض','View')}
      </button>
    </div>`;
}


function renderHeaderStats() {
  const streakEl = document.getElementById('hdr-streak');
  const calEl    = document.getElementById('hdr-cal');
  if (streakEl) streakEl.textContent = S.streak;
  if (calEl)    calEl.textContent    = S.calories > 999 ? (S.calories/1000).toFixed(1)+'k' : S.calories;
  // XP bar
  try { if (typeof _updateXPBar === 'function') _updateXPBar(); } catch(e) {}
  // تجميدات السلسلة
  const freezeBtn = document.getElementById('hdr-freeze-btn');
  if (freezeBtn) {
    const n = S.streakFreezes || 0;
    freezeBtn.textContent = n > 0 ? `🧊×${n}` : '';
    freezeBtn.title = n > 0 ? `تجميد السلسلة (${n} متبقي)` : 'لا تجميدات متبقية';
    freezeBtn.style.opacity = n > 0 ? '.9' : '.3';
  }
  // تحديث شارة المستوى + شريط التقدم
  try { if (typeof _updateLevelUI === 'function') _updateLevelUI(); } catch(e) {}
  // تحديث التحدي الأسبوعي
  try {
    if (typeof initOrRefreshChallenge === 'function') initOrRefreshChallenge();
    if (typeof _updateChallengeProgress === 'function') _updateChallengeProgress();
  } catch(e) {}
  // تحقق من الترقية
  try { if (typeof checkLevelUp === 'function') checkLevelUp(); } catch(e) {}
}

function renderDayStrip() {
  const strip = document.getElementById('day-strip');
  if (!strip) return;
  const progDays = S.user?.programDays || 30;
  strip.innerHTML = '';
  for (let d = 1; d <= progDays; d++) {
    const sched = getDaySchedule(d);
    const pill = document.createElement('div');
    pill.className = 'day-pill';
    if (d === S.currentDay) pill.classList.add('active');
    if (S.completedDays.includes(d)) pill.classList.add('completed');
    if (sched.type === 'rest') pill.classList.add('rest-day');
    if (d > S.currentDay) pill.classList.add('future');
    pill.innerHTML = `<span class="d-num">${d}</span><span class="d-type">${getScheduleLabel(sched)}</span>`;
    pill.onclick = () => selectDay(d);
    // Long press to edit (future feature placeholder)
    let pressTimer;
    pill.addEventListener('mousedown', () => { pressTimer = setTimeout(() => showMiniToast('محرر الجدول قريباً ✨'), 600); });
    pill.addEventListener('mouseup', () => clearTimeout(pressTimer));
    pill.addEventListener('touchstart', e => { pressTimer = setTimeout(() => showMiniToast('محرر الجدول قريباً ✨'), 600); }, {passive:true});
    pill.addEventListener('touchend', () => clearTimeout(pressTimer));
    strip.appendChild(pill);
  }
  // Scroll to current day
  setTimeout(() => {
    const active = strip.querySelector('.active');
    if (active) active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }, 100);
  // Enable drag-to-scroll on mouse
  if (!strip._dragInited) {
    strip._dragInited = true;
    let isDown = false, startX, scrollLeft;
    strip.addEventListener('mousedown', e => { isDown=true; startX=e.pageX-strip.offsetLeft; scrollLeft=strip.scrollLeft; strip.style.cursor='grabbing'; });
    strip.addEventListener('mouseleave', () => { isDown=false; strip.style.cursor='grab'; });
    strip.addEventListener('mouseup', () => { isDown=false; strip.style.cursor='grab'; });
    strip.addEventListener('mousemove', e => { if(!isDown) return; e.preventDefault(); const x=e.pageX-strip.offsetLeft; strip.scrollLeft=scrollLeft-(x-startX); });
    // Mouse wheel scrolls horizontally when hovering over the strip
    strip.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // let natural horizontal scroll work
      e.preventDefault();
      strip.scrollLeft += e.deltaY * 2.5;
    }, { passive: false });
  }
}

function selectDay(d) {
  S.currentDay = d;
  saveState();
  render();
}

function renderWorkoutTab() {
  const tab = document.getElementById('tab-workout');
  const sched = getDaySchedule(S.currentDay);
  const phase = getPhase(S.currentDay);
  const phaseProgress = Math.min(100, ((S.currentDay - phase.start) / (phase.end - phase.start + 1)) * 100);
  const totalProgress = Math.min(100, (S.completedDays.length / (S.user?.programDays || 30)) * 100);
  const isDone = S.completedDays.includes(S.currentDay);
  const _quotes = getQuotes(); const quote = _quotes[(S.currentDay - 1) % _quotes.length];

  if (sched.type === 'rest') {
    tab.innerHTML = `
      <div class="phase-card">
        <div class="phase-icon">${phase.icon}</div>
        <div class="phase-info"><div class="phase-name">${getPhaseName(phase)}</div><div class="phase-days">${window.T('days2')} ${phase.days}</div></div>
      </div>
      <div class="rest-card" style="margin:16px;border-radius:20px;background:var(--card);padding:28px;text-align:center;">
        <div style="font-size:56px;margin-bottom:12px;">😴</div>
        <div style="font-size:20px;font-weight:900;color:var(--txt);margin-bottom:8px;">${window.T('restDayTitle')}</div>
        <div style="font-size:13px;color:var(--dim);margin-bottom:20px;line-height:1.7;">${window.T('restDaySub').replace('\n','<br>')}</div>
        <button onclick="openActiveRest()" style="width:100%;padding:14px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer;margin-bottom:10px;">${window.T('activeRest')}</button>
        <div style="font-size:12px;color:var(--dim);">${STRETCH_EXERCISES.length} ${window.T('stretchExLabel','تمارين تمدد')} • ${STRETCH_EXERCISES.reduce((s,e)=>s+e.dur,0)} ${window.T('lblSecs','ثانية')}</div>
      </div>
      <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px;">
        <button onclick="toggleDayDone()" style="width:100%;padding:13px;border-radius:14px;background:${isDone?'rgba(74,222,128,.15)':'rgba(212,168,67,.1)'};border:1.5px solid ${isDone?'#4ade80':'rgba(212,168,67,.3)'};color:${isDone?'#4ade80':'var(--gold)'};font-family:'Cairo',sans-serif;font-size:14px;font-weight:800;cursor:pointer;">
          ${isDone ? window.T('recordedRest') : window.T('recordRest')}
        </button>
        <button onclick="openDayEditor(${S.currentDay})" style="width:100%;padding:11px;border-radius:14px;background:rgba(255,255,255,.05);border:1.5px solid var(--border);color:var(--dim);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
          ✏️ تعديل اليوم — إضافة تمارين
        </button>
      </div>`;
    return;
  }

  const exHTML = sched.exercises.map((ex, i) => {
    const doneKey = S.currentDay + '_' + ex.id;
    const isDoneEx = (S.completedExercises[doneKey] === true);
    const customImg = S.customImages?.[ex.id];
    const gifSrc = getExGif(ex.id);
    const imgHTML = customImg
      ? `<img class="ex-gif" src="${customImg}" alt="${ex.nameAr}" onerror="this.remove()">`
      : gifSrc
        ? `<img class="ex-gif" src="${gifSrc}" alt="${ex.nameAr}" onerror="this.remove()">`
        : `<div class="ex-placeholder" style="font-size:32px;">${ex.icon}</div>`;
    return `<div class="ex-card ${isDoneEx?'done-ex':''}" id="ex-card-${ex.id}">
      <div class="ex-main">
        <div class="ex-img-wrap" data-gif-id="${ex.id}" onclick="triggerImgUpload('${ex.id}')" style="background:var(--card);">
          ${imgHTML}
          <div class="ex-upload-overlay">📷</div>
          <input type="file" accept="image/*" style="display:none" id="img-inp-${ex.id}" onchange="handleImgUpload('${ex.id}',this)">
        </div>
        <div class="ex-info">
          <div class="ex-name">${_escHtml(currentLang==="ar"?ex.nameAr:(ex.nameEn||ex.nameAr))}</div>
          <div class="ex-name-en">${_escHtml(ex.nameEn)}</div>
          <div class="chips">
            <span class="chip sets">${ex.sets} × ${ex.reps} ${getRepsLabel(ex)}</span>
            <span class="chip muscles">${_escHtml(ex.muscles)}</span>
            <span class="chip" style="background:rgba(249,115,22,.12);color:#f97316;border-color:rgba(249,115,22,.25);">🔥 ~${calcExCal(ex)} ${window.T('exCalChip','كالوري')}</span>
          </div>
        </div>
      </div>
      <div class="ex-bottom">
        <div class="ex-check ${isDoneEx?'checked':''}" onclick="toggleExDone('${ex.id}')">
          ${isDoneEx?'✓':''}
        </div>
        <button class="ex-expand" onclick="toggleSteps('${ex.id}')">${window.T('steps')} ▼</button>
        <button class="ex-edit-btn" onclick="openExEditor('${ex.id}',${S.currentDay})">✏️</button>
      </div>
      <div class="ex-steps" id="steps-${ex.id}">
        ${(ex.steps||[]).map((s,i)=>`<div class="ex-step"><div class="step-num">${i+1}</div><div>${_escHtml(s)}</div></div>`).join('')}
      </div>
    </div>`;
  }).join('');

  tab.innerHTML = `
    <div class="phase-card">
      <div class="phase-icon">${phase.icon}</div>
      <div class="phase-info">
        <div class="phase-name">${getPhaseName(phase)} — ${window.T('dayLabel','يوم')} ${S.currentDay}</div>
        <div class="phase-days">${getScheduleLabel(sched)} • ${getExercisesLabel(sched.exercises.length)}</div>
      </div>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--bg-card)" stroke-width="5"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${2*Math.PI*18}" stroke-dashoffset="${2*Math.PI*18*(1-phaseProgress/100)}"
          transform="rotate(-90 22 22)" style="filter:drop-shadow(0 0 4px var(--glow))"/>
        <text x="22" y="26" text-anchor="middle" class="prog-ring-val" font-size="10" font-weight="900" fill="var(--primary)">${Math.round(phaseProgress)}%</text>
      </svg>
    </div>
    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${totalProgress}%"></div></div>
    ${(()=>{
      const _standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (_standalone) return '';
      const _ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (deferredPrompt) {
        return `<div id="home-install-banner" style="margin:0 0 2px;padding:10px 14px;background:linear-gradient(135deg,rgba(var(--gl-rgb,14,165,233),.12),rgba(var(--gd-rgb,2,132,199),.08));border-radius:14px;border:1.5px solid var(--border-strong);display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;flex-shrink:0;">📲</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:800;color:var(--txt);">${window.T('installAppTitle','ثبّت التطبيق على جهازك')}</div>
            <div style="font-size:10px;color:var(--dim);">${window.T('installAppSub','وصول فوري — يعمل بدون نت — تذكيرات')}</div>
          </div>
          <button onclick="homeInstallNow(this)" style="padding:8px 14px;border-radius:10px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);border:none;font-family:'Cairo',sans-serif;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;flex-shrink:0;">${window.T('installNowBtn','تثبيت الآن')}</button>
        </div>`;
      }
      if (_ios) {
        return `<div id="home-install-banner" style="margin:0 0 2px;padding:10px 14px;background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(2,132,199,.06));border-radius:14px;border:1.5px solid var(--border-strong);display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;flex-shrink:0;">📲</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:800;color:var(--txt);">${window.T('installAppTitle','ثبّت التطبيق')}</div>
            <div style="font-size:10px;color:var(--dim);">اضغط <strong>⬆️ مشاركة</strong> ثم "إضافة إلى الشاشة الرئيسية"</div>
          </div>
          <button onclick="this.closest('#home-install-banner').remove()" style="background:none;border:none;color:var(--dim);font-size:18px;cursor:pointer;flex-shrink:0;">✕</button>
        </div>`;
      }
      return '';
    })()}
    <button class="start-btn" onclick="startGuidedSession()">${window.T('startToday','▶ ابدأ تدريب اليوم')}</button>
    <button class="done-btn ${isDone?'done':''}" onclick="toggleDayDone()">
      ${isDone ? "✅ "+window.T("dayDone") : "☑️ "+window.T("markDone")}
    </button>
    <div style="display:flex;justify-content:center;gap:16px;margin:8px 16px;padding:10px 16px;background:rgba(249,115,22,.08);border-radius:14px;border:1px solid rgba(249,115,22,.2);">
      <span style="font-size:12px;color:var(--dim);">${window.T('estimatedCalToday','🔥 السعرات المقدرة لليوم:')}</span>
      <span style="font-size:13px;font-weight:900;color:#f97316;">~${calcScheduleCal(sched, parseFloat(S.user?.weight)||70)} ${window.T('calLabel','كالوري')}</span>
      <span style="font-size:11px;color:var(--dim);">( ${window.T('weightLbl','وزن')} ${parseFloat(S.user?.weight)||70} ${window.T('kgLbl','كغ')} )</span>
    </div>
    <div class="daily-quote"><div class="quote-text">"${_escHtml(quote.text)}"</div><div class="quote-attr">— ${_escHtml(quote.attr)}</div></div>
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;">
      <span>${window.T('exercisesTodayLbl','تمارين اليوم')}</span>
      <button onclick="openDayEditor(${S.currentDay})" style="font-size:11px;padding:4px 10px;border-radius:8px;background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.3);color:var(--gold);cursor:pointer;font-weight:700;">${window.T('editExercises','✏️ تعديل التمارين')}</button>
    </div>
    ${exHTML}`;
}

function toggleSteps(id) {
  const el = document.getElementById('steps-' + id);
  if (el) el.classList.toggle('show');
}
function toggleExDone(id) {
  const key = S.currentDay + '_' + id;
  S.completedExercises[key] = !S.completedExercises[key];
  saveState();
  const allExArr = [...EXERCISES, ...(S.customExercises||[])];
  const ex = allExArr.find(e => e.id === id);
  const cal = calcExCal(ex);
  if (S.completedExercises[key]) {
    S.calories += cal;
    if (!S._manualExCal) S._manualExCal = {};
    S._manualExCal[key] = (S._manualExCal[key] || 0) + cal;
    // Micro-celebration
    try { microCelebrate('exercise_done'); } catch(e) {}
  } else {
    S.calories = Math.max(0, S.calories - cal);
    if (S._manualExCal) delete S._manualExCal[key];
  }
  saveState();
  renderWorkoutTab();
  renderHeaderStats();
  checkBadges();
}
function toggleDayDone() {
  const maxDay = S.user?.programDays || 30;
  if (S.completedDays.includes(S.currentDay)) {
    // FIX: خصم السعرات من السجل عند الإلغاء
    const logKey = 'day_' + S.currentDay;
    const logEntry = (S.trainingLog || {})[logKey];
    if (logEntry && logEntry.calories) {
      S.calories = Math.max(0, S.calories - logEntry.calories);
    }
    S.completedDays = S.completedDays.filter(d => d !== S.currentDay);
    delete (S.trainingLog||{})[S.currentDay];
    delete (S.trainingLog||{})[logKey];
    // FIX: رجوع currentDay فقط إذا كان المستخدم قد تقدم بسبب هذا اليوم تحديداً
    // نحفظ رقم اليوم المُلغى قبل تعديل completedDays
    updateStreak();
  } else {
    // FIX: منع التكرار عند الاستدعاء المتعدد
    if (!S.completedDays.includes(S.currentDay)) S.completedDays.push(S.currentDay);
    const _sched = getDaySchedule(S.currentDay);
    const _kg = parseFloat(S.user?.weight) || 70;
    const _dayCal = calcScheduleCal(_sched, _kg) || 150;
    S.calories += _dayCal;
    // Track morning workouts for 'early_bird' badge (before 10am)
    const hour = new Date().getHours();
    if (hour < 10) S.morningWorkouts = (S.morningWorkouts || 0) + 1;
    // Log training details
    if (!S.trainingLog) S.trainingLog = {};
    const sched = _sched;
    const logKey = 'day_' + S.currentDay;
    S.trainingLog[logKey] = {
      date: new Date().toLocaleDateString('ar-SA'),
      day: S.currentDay,
      type: sched.label || sched.type,
      exercises: sched.exercises.map(e => e.nameAr),
      exerciseIds: sched.exercises.map(e => e.id),
      exCount: sched.exercises.length,
      calories: _dayCal,
      duration: Math.max(20, sched.exercises.length * 5),
      ts: Date.now()
    };
    updateStreak();
    checkBadges();
    speakMotivation(S.currentDay, _dayCal);
    if (S.currentDay < maxDay) S.currentDay++;
  }
  saveState();
  // تحديث config الإشعار بعد تغيير حالة اليوم
  try {
    if (typeof scheduleTrainingNotif === 'function' &&
        typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setTimeout(scheduleTrainingNotif, 300);
    }
  } catch(e) {}
  render();
}
function updateStreak() {
  if (!S.completedDays.length) { S.streak = 0; return; }
  const maxDone = Math.max(...S.completedDays);
  let streak = 0;
  let d = maxDone;
  // أيام الراحة تُحسب فقط إذا كانت بين أيام مكتملة — لا قبل أول يوم مكتمل
  while (d >= 1) {
    const sched = getDaySchedule(d);
    const isRest = sched.type === 'rest';
    const isDone = S.completedDays.includes(d);
    if (isDone) {
      streak++;
      d--;
    } else if (isRest && streak > 0) {
      // راحة بين أيام مكتملة — تُحسب فقط إذا سبقها يوم مكتمل
      streak++;
      d--;
    } else {
      break;
    }
  }
  S.streak = streak;
}
function triggerImgUpload(id) { document.getElementById('img-inp-' + id)?.click(); }

// ضغط الصورة إلى 400px عرض وJPEG 70% قبل الحفظ في localStorage
function _compressImage(dataUrl, cb) {
  const img = new Image();
  img.onload = function() {
    const MAX = 400;
    let w = img.width, h = img.height;
    if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    cb(canvas.toDataURL('image/jpeg', 0.70));
  };
  img.onerror = function() { cb(dataUrl); }; // fallback
  img.src = dataUrl;
}

function handleImgUpload(id, inp) {
  const file = inp.files[0];
  if (!file) return;
  // حد أقصى 8MB قبل الضغط (بعده سيصبح صغيراً جداً)
  if (file.size > 8 * 1024 * 1024) {
    showMiniToast('⚠️ الصورة كبيرة جداً (الحد 8MB)');
    inp.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _compressImage(e.target.result, compressed => {
      if (!S.customImages) S.customImages = {};
      S.customImages[id] = compressed;
      saveState();
      renderWorkoutTab();
      showMiniToast('✅ تم حفظ الصورة');
    });
  };
  reader.readAsDataURL(file);
}

/* ══════ PROGRESS TAB ══════ */
function renderProgress() {
  // تحديث المستوى والتحدي أولاً
  try {
    if (typeof _updateLevelUI === 'function') _updateLevelUI();
    if (typeof initOrRefreshChallenge === 'function') initOrRefreshChallenge();
    if (typeof _updateChallengeProgress === 'function') _updateChallengeProgress();
  } catch(e) {}
  _renderLevelCard();
  _renderWeeklyChallenge();
  // Endowed Progress — عرض +2 للمستخدمين الجدد
  const _ep = typeof getEndowedProgress === 'function' ? getEndowedProgress() : null;
  const _displayDone = _ep ? _ep.display : S.completedDays.length;
  document.getElementById('p-done').textContent = _displayDone;
  document.getElementById('p-streak').textContent = S.streak;
  // Calories: sum from training log for accuracy
  const logCal = Object.values(S.trainingLog||{}).reduce((s,e)=>s+(e.calories||0),0);
  const displayCal = logCal || S.calories || 0;
  document.getElementById('p-cal').textContent = displayCal;
  const progDays = S.user?.programDays || 30;
  document.getElementById('p-remain').textContent = progDays - S.completedDays.length;
  // Show start date info below stats if available
  const sdInfo = document.getElementById('start-date-info');
  if (sdInfo && S.user?.startDate) {
    const sd = new Date(S.user.startDate);
    const endD = new Date(sd);
    endD.setDate(endD.getDate() + progDays);
    sdInfo.innerHTML = `<span>📅 البدء: ${sd.toLocaleDateString('ar-SA')}</span><span style="margin:0 8px;color:var(--dim);">|</span><span>🏁 الانتهاء: ${endD.toLocaleDateString('ar-SA')}</span>`;
    sdInfo.style.display = 'flex';
  }
  _renderWeeklyCalGoal();
  _renderProgressPhotoCard();
  _renderLeaderboardCard();
  renderPhases();
  renderWeeklyBars();
  renderCalendar();
  renderBadges();
  renderSmartStats();
  renderTrainingLogSection();
  renderNutrition();
  // FIX: استدعاء الرسوم البيانية مباشرة — patch على window لا يعمل مع function declarations
  if (typeof renderAllCharts === 'function') renderAllCharts();
}

/* ══════════════════════════════════════════
   NUTRITION PLAN — يُفوَّض دائماً لـ nutrition.js
   renderNutritionDiary معرّفة هناك وتُعيَّن على window.renderNutrition
══════════════════════════════════════════ */
function renderNutrition() {
  // FIX: nutrition.js يُحمَّل بعدنا — نستدعي الدالة المُصدَّرة منه
  if (typeof renderNutritionDiary === 'function') {
    renderNutritionDiary();
  }
}
function renderPhases() {
  const list = document.getElementById('phases-list');
  if (!list) return;

  // FIX: استخدام مراحل البرنامج الصحيحة حسب نوع البرنامج
  const isBeginner = S.user?.program === 'beginner';
  const activePHASES = isBeginner ? [
    { nameKey:'phaseDiscovery', name:'الاكتشاف', icon:'🌱', days:'1-7',   start:1,  end:7  },
    { nameKey:'phaseBuilt',     name:'البناء',    icon:'⚡', days:'8-14',  start:8,  end:14 },
    { nameKey:'phaseMastery',   name:'الإتقان',   icon:'🏆', days:'15-21', start:15, end:21 },
  ] : PHASES;

  list.innerHTML = activePHASES.map(p => {
    const cur  = S.currentDay;
    const done = S.completedDays.filter(d => d >= p.start && d <= p.end).length;
    const total = p.end - p.start + 1;
    const pct   = Math.min(100, (done / total) * 100);
    const cls   = cur >= p.start && cur <= p.end ? 'ph-active' : done >= total ? 'ph-done' : '';
    const displayName = typeof getPhaseName === 'function' ? getPhaseName(p) : p.name;
    return `<div class="phase-item ${cls}">
      <div class="ph-icon">${p.icon}</div>
      <div class="ph-info">
        <div class="ph-name">${displayName} (${p.days})</div>
        <div class="ph-days">${done}/${total} ${window.T ? window.T('days2','أيام') : 'أيام'}</div>
        <div class="ph-bar"><div class="ph-fill" style="width:${pct}%"></div></div>
      </div>
    </div>`;
  }).join('');
}
function renderWeeklyBars() {
  const el = document.getElementById('weekly-bars');
  if (!el) return;
  const progDays = S.user?.programDays || 30;
  const numWeeks = Math.ceil(progDays / 7);

  // Build weekly stats: days completed + calories
  const weeks = Array.from({length: numWeeks}, (_, i) => {
    const w = i + 1;
    const start = (w-1)*7+1, end = Math.min(w*7, progDays);
    const done = S.completedDays.filter(d => d>=start && d<=end).length;
    const cal = Object.values(S.trainingLog||{})
      .filter(e => e.day >= start && e.day <= end)
      .reduce((s,e)=>s+(e.calories||0),0);
    return { w, start, end, done, max: end-start+1, cal };
  });

  const maxDone = Math.max(...weeks.map(w=>w.done), 1);
  const maxCal  = Math.max(...weeks.map(w=>w.cal), 1);

  // Toggle between "days" and "calories" views
  const view = el.dataset.view || 'days';
  const vals = view === 'cal' ? weeks.map(w=>w.cal) : weeks.map(w=>w.done);
  const maxVal = view === 'cal' ? maxCal : maxDone;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;color:var(--dim);">${view==='days'?'أيام التدريب الأسبوعية':'السعرات الأسبوعية'}</div>
      <div style="display:flex;gap:6px;">
        <button onclick="document.getElementById('weekly-bars').dataset.view='days';renderWeeklyBars();"
          style="padding:4px 10px;border-radius:8px;background:${view==='days'?'rgba(212,168,67,.2)':'var(--card)'};border:1px solid ${view==='days'?'var(--gold)':'var(--border)'};color:${view==='days'?'var(--gold)':'var(--dim)'};font-size:11px;cursor:pointer;font-family:'Cairo',sans-serif;">📅 أيام</button>
        <button onclick="document.getElementById('weekly-bars').dataset.view='cal';renderWeeklyBars();"
          style="padding:4px 10px;border-radius:8px;background:${view==='cal'?'rgba(249,115,22,.2)':'var(--card)'};border:1px solid ${view==='cal'?'#f97316':'var(--border)'};color:${view==='cal'?'#f97316':'var(--dim)'};font-size:11px;cursor:pointer;font-family:'Cairo',sans-serif;">🔥 كالوري</button>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:90px;padding:0 4px;">
      ${weeks.map((w, i) => {
        const val = vals[i];
        const h = maxVal > 0 ? Math.max(4, Math.round((val / maxVal) * 78)) : 4;
        const cur = S.currentDay >= w.start && S.currentDay <= w.end;
        const color = cur
          ? (view==='cal'?'#f97316':'var(--gold)')
          : val > 0
            ? (view==='cal'?'rgba(249,115,22,.5)':'rgba(212,168,67,.45)')
            : 'rgba(255,255,255,.06)';
        const lbl = view==='cal' ? (val>=1000?(val/1000).toFixed(1)+'k':val||'') : (val||'');
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;">
          <div style="font-size:9px;color:${cur?'var(--gold)':'var(--dim)'};font-weight:${cur?'900':'400'};">${lbl}</div>
          <div style="width:100%;border-radius:5px 5px 3px 3px;background:${color};height:${h}px;transition:height .5s ease;cursor:default;min-height:4px;"
            title="أسبوع ${w.w}: ${view==='cal'?val+' كالوري':val+'/'+w.max+' أيام'}"></div>
          <div style="font-size:10px;color:${cur?'var(--gold)':'var(--dim)'};font-weight:${cur?'800':'400'};">أ${w.w}</div>
        </div>`;
      }).join('')}
    </div>
    ${weeks.some(w=>w.done>0) ? `
    <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
      <div style="background:var(--card);border-radius:10px;padding:8px 12px;flex:1;text-align:center;min-width:80px;">
        <div style="font-size:16px;font-weight:900;color:var(--gold);">${weeks.reduce((s,w)=>s+w.done,0)}</div>
        <div style="font-size:10px;color:var(--dim);">يوم مكتمل</div>
      </div>
      <div style="background:var(--card);border-radius:10px;padding:8px 12px;flex:1;text-align:center;min-width:80px;">
        <div style="font-size:16px;font-weight:900;color:#f97316;">${weeks.reduce((s,w)=>s+w.cal,0)}</div>
        <div style="font-size:10px;color:var(--dim);">إجمالي كالوري</div>
      </div>
      <div style="background:var(--card);border-radius:10px;padding:8px 12px;flex:1;text-align:center;min-width:80px;">
        <div style="font-size:16px;font-weight:900;color:#4ade80;">${Math.round(weeks.filter(w=>w.done>0).reduce((s,w)=>s+w.done,0)/Math.max(1,weeks.filter(w=>w.done>0).length))}</div>
        <div style="font-size:10px;color:var(--dim);">متوسط/أسبوع</div>
      </div>
    </div>` : ''}
  `;
}
function renderCalendar() {
  const el = document.getElementById('cal-grid');
  if (!el) return;
  const progDays = S.user?.programDays || 30;
  el.innerHTML = Array.from({length:progDays},(_,i)=>{
    const d = i+1;
    const sched = getDaySchedule(d);
    let cls = 'cal-cell';
    if (S.completedDays.includes(d)) cls += ' cc-done';
    else if (d === S.currentDay) cls += ' cc-today';
    else if (sched.type === 'rest') cls += ' cc-rest';
    else if (d > S.currentDay) cls += ' cc-future';
    return `<div class="${cls}" title="يوم ${d}">${d}</div>`;
  }).join('');
}
function renderBadges() {
  const el = document.getElementById('badges-grid');
  if (!el) return;
  el.innerHTML = BADGES.map(b => {
    const unlocked = S.unlockedBadges.includes(b.id);
    return `<div class="badge-item${unlocked?' unlocked':''}" title="${b.desc}">
      <div class="b-icon">${b.icon}</div>
      <div class="b-name">${b.name}</div>
    </div>`;
  }).join('');
}
function renderTips() {
  const el = document.getElementById('tips-list');
  if (!el) return;
  el.innerHTML = TIPS.map(t => `<div class="tip-card"><div class="tip-cat">${t.cat}</div><div class="tip-text">${t.text}</div></div>`).join('');
}
function saveMeasurements() {
  const date = new Date().toISOString().split('T')[0];
  const w = parseFloat(document.getElementById('m-weight').value) || 0;
  const waist = parseFloat(document.getElementById('m-waist').value) || 0;
  const chest = parseFloat(document.getElementById('m-chest').value) || 0;
  if (!S.bodyMeasurements) S.bodyMeasurements = {};
  S.bodyMeasurements[date] = { weight: w, waist, chest, date, ts: Date.now() };
  // تحديث S.user.weight كآخر وزن مُسجَّل
  if (w > 0) S.user.weight = w;
  saveState();
  // تحديث مخطط الوزن فوراً
  try { if (typeof renderWeightChart === 'function') renderWeightChart(); } catch(e) {}
  // تحديث config الإشعار
  try { if (typeof scheduleTrainingNotif === 'function' &&
      typeof Notification !== 'undefined' && Notification.permission === 'granted')
    scheduleTrainingNotif(); } catch(e) {}
  showMiniToast('✅ تم حفظ القياسات — ' + (w > 0 ? w + ' كغ' : ''));
}

