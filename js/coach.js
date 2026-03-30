
/* ══════════════════════════════════════════
   خطة غذائية أسبوعية من المدرب الذكي
══════════════════════════════════════════ */
async function generateWeeklyMealPlan() {
  const _userKey   = (S.apiKey||'').startsWith('gsk_') ? S.apiKey : '';
  const _sharedKey = (typeof SHARED_GROQ_KEY!=='undefined'&&SHARED_GROQ_KEY) ? SHARED_GROQ_KEY : '';
  const apiKey = _userKey || _sharedKey;

  if (!apiKey && !window._fbUser) {
    _showCoachLoginPrompt('اقترح لي خطة غذائية أسبوعية');
    return;
  }

  showMiniToast('🥗 جارٍ توليد الخطة الغذائية...');

  const u = S.user || {};
  const goal = u.goal || 'fitness';
  const goalMap = { burn:'حرق الدهون', muscle:'بناء العضلات', fitness:'تحسين اللياقة', health:'الصحة العامة' };
  const lang = currentLang || S.lang || 'ar';
  const isAr = lang === 'ar';

  const prompt = isAr
    ? `أنشئ خطة غذائية أسبوعية لشخص:
- الوزن: ${u.weight||70}كغ، الطول: ${u.height||170}سم، العمر: ${u.age||25}
- الهدف: ${goalMap[goal]||goal}
- الجنس: ${u.gender==='female'?'أنثى':'ذكر'}

أجب بـ JSON فقط بهذا الشكل:
{"days":[{"day":"الاثنين","meals":[{"name":"فطور","foods":["بيضتان مسلوقتان","شريحة خبز أسمر"],"cal":350},{"name":"غداء","foods":["صدر دجاج مشوي 150غ","أرز بني كوب"],"cal":550},{"name":"عشاء","foods":["سلطة خضار","تونة علبة"],"cal":300},{"name":"وجبة خفيفة","foods":["حفنة لوز"],"cal":160}],"total_cal":1360}]}`
    : `Create a 7-day meal plan for:
- Weight: ${u.weight||70}kg, Height: ${u.height||170}cm, Age: ${u.age||25}
- Goal: ${goal}, Gender: ${u.gender||'male'}
Reply in JSON only: {"days":[{"day":"Monday","meals":[{"name":"Breakfast","foods":["2 boiled eggs"],"cal":150},{"name":"Lunch","foods":["grilled chicken 150g"],"cal":400},{"name":"Dinner","foods":["vegetable salad"],"cal":200},{"name":"Snack","foods":["handful almonds"],"cal":160}],"total_cal":910}]}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+apiKey },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{ role:'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g,'').trim();
    const plan = JSON.parse(clean);
    _showWeeklyMealPlan(plan);
  } catch(e) {
    showMiniToast('⚠️ فشل توليد الخطة — حاول مجدداً');
  }
}

function _showWeeklyMealPlan(plan) {
  const days = plan.days || [];
  if (!days.length) { showMiniToast('⚠️ لم يتم توليد خطة'); return; }

  let modal = document.getElementById('meal-plan-modal');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'meal-plan-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.85);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };

  const lang = currentLang || S.lang || 'ar';
  const _t = (ar,en) => lang==='en'?en:ar;

  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:20px;width:calc(100%-32px);max-width:520px;
      padding:20px;margin:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:18px;font-weight:900;color:var(--txt);">
          🥗 ${_t('خطتك الغذائية الأسبوعية','Your Weekly Meal Plan')}
        </div>
        <button onclick="document.getElementById('meal-plan-modal').remove()"
          style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer;">✕</button>
      </div>
      ${days.map(d => `
        <div style="margin-bottom:14px;background:var(--card);border-radius:14px;
          border:1px solid var(--border);overflow:hidden;">
          <div style="padding:10px 14px;background:rgba(212,168,67,.08);
            border-bottom:1px solid var(--border);
            display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:14px;font-weight:900;color:var(--gold);">${d.day}</div>
            <div style="font-size:12px;color:var(--dim);">${d.total_cal||0} ${_t('كال','cal')}</div>
          </div>
          <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px;">
            ${(d.meals||[]).map(m=>`
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:3px;">
                  ${m.name} — <span style="color:var(--dim)">${m.cal||0} ${_t('كال','cal')}</span>
                </div>
                <div style="font-size:11px;color:var(--dim);">
                  ${(m.foods||[]).join(' · ')}
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
      <button onclick="document.getElementById('meal-plan-modal').remove()"
        style="width:100%;padding:12px;border-radius:14px;background:transparent;
        border:1px solid var(--border);color:var(--dim);
        font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;margin-top:4px;">
        ${_t('إغلاق','Close')}
      </button>
    </div>`;

  document.body.appendChild(modal);
}

/* ══════════════════════════════════════════
   LOCAL AI COACH ENGINE
   يعمل بدون API Key — ردود ذكية تعتمد على بيانات المستخدم
══════════════════════════════════════════ */
function localCoachReply(msg, S) {
  // قراءة السياق من آخر رسالة في التاريخ
  const _lastAssistant = [...(S.coachHistory||[])].reverse().find(m => m.role === 'assistant');
  const _lastQ = typeof _lastAssistant?.content === 'string' ? _lastAssistant.content : '';

  const _lang = (typeof currentLang !== 'undefined' ? currentLang : 'ar') || 'ar';
  const _isEn = _lang === 'en', _isFr = _lang === 'fr';
  // دالة ترجمة سريعة
  const _t = (ar, en, fr) => _isEn ? en : _isFr ? fr : ar;

  const u = S.user || {};
  const name = u.name || _t('بطل','Champion','Champion');
  const kg = parseFloat(u.weight) || 70;
  const cm = parseFloat(u.height) || 170;
  const age = parseFloat(u.age) || 25;
  const gender = u.gender || 'male';
  const isFemale = gender === 'female';
  const bmi = cm > 0 ? (kg / Math.pow(cm/100, 2)).toFixed(1) : '—';
  // حساب السعرات الأساسية (Mifflin-St Jeor) حسب الجنس والعمر
  const bmr = isFemale
    ? Math.round(10*kg + 6.25*cm - 5*age - 161)
    : Math.round(10*kg + 6.25*cm - 5*age + 5);
  const goal = u.goal || 'burn';
  const goalAr = {burn:'حرق الدهون', muscle:'بناء العضلات', fitness:'تحسين اللياقة', health:'الصحة العامة'}[goal] || 'عام';
  const day = S.currentDay || 1;
  const done = (S.completedDays||[]).length;
  const streak = S.streak || 0;
  const cal = S.calories || 0;
  const progDays = u.programDays || 30;
  const pct = Math.round(done/progDays*100);
  const todaySched = (() => { try { return getDaySchedule(day); } catch(e) { return null; } })();
  const todayEx = todaySched?.exercises?.map(e=>e.nameAr).join('، ') || '—';
  const isDoneToday = (S.completedDays||[]).includes(day);
  const m = msg.trim().toLowerCase();

  // ── Intent detection helpers ──
  const has = (...kws) => kws.some(k => m.includes(k));

  // ── Context-aware: يجيب على "نعم/لا" بناءً على السؤال السابق ──
  if (has('نعم','أيوه','أيه','صح','ok','تمام','حسناً','يلا')) {
    if (_lastQ.includes('راحة نشطة') || _lastQ.includes('تمدد'))
      return `ممتاز! ابدأ الراحة النشطة الآن — اضغط زر "راحة نشطة" في الأسفل 🧘`;
    if (_lastQ.includes('برنامج') || _lastQ.includes('أسبوع'))
      return `${name}، للتطبيق الفعلي للبرنامج تحتاج مفتاح Groq API (مجاني). أضفه من الإعدادات ⚙️ وسأطبقه فوراً! 💪`;
  }
  if (has('لا','ما أبي','مو','لأ')) {
    if (_lastQ.includes('راحة'))
      return `حسناً ${name}! استمر في برنامجك 💪 تمارين اليوم: **${todayEx}**`;
  }

  // ── Greeting / welcome ──
  if (has('مرحبا','السلام','هاي','هلو','اهلا','كيف حالك','كيفك','صباح','مساء','hello','hi')) {
    const greetings = _isEn ? [
      `Hi ${name}! 💪 Day **${day}** of your program — ${done} days done. Goal: **${goalAr}**. How can I help?`,
      `Hey ${name}! 🔥 **${streak} day** streak — great work! Today: **${todayEx}**`,
      `Hello ${name}! ⚡ ${done} days completed — you're serious about change! Ask me anything.`,
    ] : _isFr ? [
      `Bonjour ${name}! 💪 Jour **${day}** du programme — ${done} jours complétés. Objectif: **${goalAr}**. Comment puis-je t'aider?`,
      `Salut ${name}! 🔥 Série de **${streak} jours** — excellent travail! Aujourd'hui: **${todayEx}**`,
      `Coucou ${name}! ⚡ ${done} jours terminés — tu es sérieux! Demande-moi n'importe quoi.`,
    ] : [
      `أهلاً ${name}! 💪 أنت في اليوم **${day}** من البرنامج وأكملت **${done} يوم** — رائع!\nهدفك الحالي: **${goalAr}**. كيف أقدر أساعدك اليوم؟`,
      `وعليك السلام ${name}! 🔥 سلسلتك **${streak} أيام** متواصلة — هذا إنجاز حقيقي!\nاليوم ${day} في انتظارك: **${todayEx}**. أخبرني إذا احتجت أي شيء.`,
      `هلا ${name}! ⚡ ${done} يوم مكتمل حتى الآن — أنت جاد في التغيير!\nاسألني عن التمارين، التغذية، أو البرنامج وأنا هنا.`,
    ];
    return greetings[day % greetings.length];
  }

  // ── Fatigue / rest ──
  if (has('تعبان','متعب','مرهق','ألم','وجع','إصابة','اصابة','لا أقدر','مو قادر','صعب اليوم')) {
    if (has('ألم','وجع','إصابة','اصابة')) {
      return `${name}، إذا كان الألم حاداً أو في مفصل — **توقف فوراً** وأعطِ جسمك راحة كاملة يوم أو يومين. 🩹\nتمارين خفيفة مؤقتاً:\n• **البلانك** بدلاً من التمارين ذات الاندفاع\n• **التمدد** 10-15 دقيقة\n• **المشي البطيء** 20 دقيقة\n\nإذا استمر الألم أكثر من 48 ساعة استشر طبيباً. صحتك أهم من أي برنامج.`;
    }
    return `${name}، التعب طبيعي جداً — جسمك يتكيّف ويتطور! 💪\nهنا خياران:\n\n**الخيار 1 — خفّف اليوم:**\n• قلّل المجموعات إلى 2 بدلاً من 3\n• زِد وقت الراحة 15 ثانية\n• تمارين بدون قفز فقط\n\n**الخيار 2 — راحة نشطة:**\n• اضغط "راحة نشطة" في الأسفل\n• 8 تمارين تمدد لطيفة (${STRETCH_EXERCISES.reduce((s,e)=>s+e.dur,0)} ثانية)\n\nبعد غد ستشعر أقوى بكثير! 🔥`;
  }

  // ── Calorie burn / how to burn faster ──
  if (has('حرق','سعرات','كالوري','يحرق','أحرق','أسرع','وزن','سمنة','دهون')) {
    const dailyCal = todaySched ? calcScheduleCal(todaySched, kg) : 150;
    const weekCal = dailyCal * 5;
    const targetCal = goal === 'burn' ? bmr - 300 : goal === 'muscle' ? bmr + 300 : bmr;
    return `${name}، بناءً على وزنك **${kg} كغ** وطولك **${cm} سم** وعمرك **${age} سنة** — إليك أرقامك الحقيقية:\n\n🔥 **جلسة اليوم:** ~${dailyCal} سعرة\n📅 **أسبوع تدريب (5 أيام):** ~${weekCal} سعرة\n⚡ **حرقت حتى الآن:** ${cal} سعرة إجمالية\n🧮 **سعراتك اليومية المقترحة:** ~${targetCal} سعرة (${isFemale ? 'أنثى' : 'ذكر'})\n\n**نصيحتي لتسريع الحرق:**\n• **HIIT قصير (20 دقيقة)** = نفس حرق الكارديو 45 دقيقة\n• البيربيز ونط الحبل الأعلى MET في البرنامج\n• اشرب ماء بارد قبل التمرين مباشرة`;
  }

  // ── Nutrition post-workout ──
  if (has('أكل','طعام','غذاء','تغذية','بعد التمرين','قبل التمرين','بروتين','بروتيين','كارب','دجاج','بيض')) {
    const proteinG = Math.round(kg * (goal === 'muscle' ? 2.0 : 1.6));
    const carbG = Math.round(kg * (goal === 'burn' ? 2.0 : 3.0));
    const fatG = Math.round(kg * 0.8);
    const calsLabel = isFemale ? `${bmr - 200} - ${bmr}` : `${bmr} - ${bmr + 200}`;
    return `${name}، هنا خطة تغذية مبنية على وزنك **${kg} كغ** وهدف **${goalAr}** ${isFemale ? '👩' : '👨'}:\n\n**السعرات اليومية المقترحة:** ${calsLabel} سعرة\n\n**احتياجك اليومي:**\n🥩 **بروتين:** ${proteinG}غ — (دجاج، بيض، تونا، لبن)\n🍚 **كارب:** ${carbG}غ — (أرز، شوفان، خبز أسمر)\n🥑 **دهون:** ${fatG}غ — (زيت زيتون، مكسرات، أفوكادو)\n\n**قبل التمرين (45-60 دقيقة):**\n• موزة + ملعقة عسل\n• أو كوب شوفان بالحليب\n\n**بعد التمرين (خلال 45 دقيقة) — الأهم:**\n• بيضتان + خبز أسمر\n• أو دجاج + أرز + خضار`;
  }

  // ── Today's workout info ──
  if (has('اليوم','تمارين اليوم','برنامج اليوم','ماذا','شو','ايش','وش')) {
    if (todaySched?.type === 'rest') {
      return `${name}، اليوم **${day}** يوم راحة مبرمج في برنامجك! 😴\nجسمك يبني العضلات أثناء الراحة — لا تتخطاها.\n\nإذا أردت التحرك خفيفاً: جرّب **الراحة النشطة** (8 تمارين تمدد، ${STRETCH_EXERCISES.reduce((s,e)=>s+e.dur,0)} ثانية فقط).`;
    }
    const calToday = calcScheduleCal(todaySched, kg);
    return `${name}، يوم **${day}** — ${todaySched?.label || 'تدريب'} 💪\n\nالتمارين:\n${(todaySched?.exercises||[]).map((e,i)=>`${i+1}. **${e.nameAr}** — ${e.sets}×${e.reps} ${e.type==='timer'?'ثانية':'تكرار'} (${calcExCal(e, kg)} كالوري)`).join('\n')}\n\n🔥 **إجمالي مقدر:** ~${calToday} سعرة\n⏱️ **المدة المتوقعة:** ~${Math.max(20, (todaySched?.exercises||[]).length * 5)} دقيقة`;
  }

  // ── Progress evaluation ──
  if (has('تقدم','إنجاز','كيف أنا','قيّم','قيم','نتائجي','تقييم')) {
    let eval_ = '';
    if (pct >= 80) eval_ = '🏆 ممتاز! أنت من الـ5% الذين يُكملون البرامج.';
    else if (pct >= 50) eval_ = '💪 أكثر من النصف — الأصعب ورائك!';
    else if (pct >= 25) eval_ = '⚡ بداية قوية — لا تتوقف الآن!';
    else eval_ = '🚀 رحلتك بدأت — كل يوم يهم!';
    return `${name}، تقييمك الحالي:\n\n${eval_}\n📊 **التقدم:** ${done}/${progDays} يوم (${pct}%)\n🔥 **السلسلة:** ${streak} أيام متواصلة\n⚡ **السعرات المحروقة:** ${cal}\n🎯 **الهدف:** ${goalAr}\n\n${streak >= 7 ? '🏅 أسبوع متواصل — شارة الثبات في متناول يدك!' : streak >= 3 ? '📈 3 أيام متتالية — أحسنت!' : 'حاول تتابع 3 أيام متتالية لتشعل سلسلتك! 🔥'}`;
  }

  // ── FIX#11: Adaptive AI — next session suggestion ──
  if (has('جلسة القادمة','جلسة قادمة','اقتراح جلسة','ماذا أتدرب','الجلسة القادمة','ايش أتدرب','وش أتدرب','شو أتدرب')) {
    const log = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day).slice(0,7);
    if (!log.length) {
      return `${name}، لا يوجد سجل تدريب بعد. أكمل جلستك الأولى وسأحلل أداءك! 💪`;
    }
    // Muscle fatigue analysis
    const muscleCount = {};
    log.forEach(e=>{
      const ids = e.exerciseIds || [];
      ids.forEach(id=>{
        const ex = [...EXERCISES,...(S.customExercises||[])].find(x=>x.id===id);
        if(ex?.muscles) ex.muscles.split(/[،,]/).forEach(m=>{const k=m.trim();if(k) muscleCount[k]=(muscleCount[k]||0)+1;});
      });
    });
    const tired = Object.entries(muscleCount).filter(([,v])=>v>=3).map(([k])=>k);
    const avgCal = Math.round(log.reduce((s,e)=>s+(e.calories||0),0)/log.length);
    const lastCal = log[0]?.calories||0;
    const trending = lastCal < avgCal * 0.85 ? 'منخفضة' : lastCal > avgCal * 1.15 ? 'مرتفعة' : 'طبيعية';
    const restDaysRecent = log.slice(0,3).filter(e=>!e.exercises?.length).length;
    const needsRest = tired.length >= 2 && restDaysRecent === 0;
    const todayExList = todaySched?.exercises?.map(e=>e.nameAr).join('، ') || '—';
    let suggestion = '';
    if (needsRest) {
      suggestion = `🔴 **توصية: راحة نشطة اليوم!**
العضلات المُرهقة: **${tired.join('، ')}**
ثلاثة أيام تدريب متتالية بدون راحة — الجسم يحتاج تعافٍ.

✅ **بدلاً من ذلك:**
• 10 دقائق تمدد
• مشي خفيف 20 دقيقة
• ماء كافٍ وبروتين`;
    } else {
      const intensityNote = trending === 'منخفضة'
        ? '⚡ **السعرات تنازلية — حان وقت رفع الكثافة!** زِد مجموعة واحدة لكل تمرين.'
        : trending === 'مرتفعة' ? '🔥 أداء ممتاز — حافظ على هذا المستوى!'
        : '✅ الكثافة مناسبة — استمر.';
      suggestion = `${intensityNote}

📋 **جلسة اليوم المقترحة (يوم ${day}):**
${todayExList}

${tired.length ? `⚠️ تجنب الإجهاد الزائد على: **${tired.join('، ')}**` : '✅ توزيع العضلات متوازن'}`;
    }
    return `${name}، إليك تحليل جلستك القادمة بناءً على آخر ${log.length} تمارين:

${suggestion}`;
  }

  // ── Program / schedule suggestion ──
  if (has('برنامج','اقترح','خطة','جدول','أسبوع','ورتين','روتين')) {
    return `${name}، بناءً على هدفك **${goalAr}** — هنا أسبوع مقترح:

**اليوم 1 — قلب وتحمل:** 🔥
• نط الحبل 3×60ث
• رفع الركبة 3×40ث
• متسلق الجبل 3×40ث

**اليوم 2 — قوة وكور:** 💪
• ضغط 3×15
• بلانك 3×45ث
• كرنش 3×20

**اليوم 3 — راحة نشطة** 😴

**اليوم 4 — HIIT:** ⚡
• بيربيز 3×10
• قرفصاء قفز 3×15
• قفز النجمة 3×20

**اليوم 5 — كور وثبات:** 🎯
• هولو هولد 3×30ث
• رفع الساقين 3×15
• لف روسي 3×20

**اليوم 6 — راحة** 😴

**اليوم 7 — راحة** 😴

هل أطبق هذا البرنامج على التطبيق الآن؟`;
  }

  // ── Motivation — مخصص حسب الشخصية ──
  if (has('تحفيز','همة','نشاط','محفور','كسلان','كسل','ما عندي خلق','مو شايف فايدة','يأس','متعب نفسياً')) {
    const mem = S.coachMemory || {};
    const personality = mem.personality || 'balanced';
    const achievement = done >= 21 ? `أنجزت ${done} يوماً` : done >= 14 ? `نصف البرنامج خلفك` : done >= 7 ? `أسبوع كامل أنجزته` : `${done} يوم في رصيدك`;
    if (personality === 'self_motivated') {
      return `${name}، ${achievement} — هذا ليس صدفة. 🏆\n\nالعقبة الحالية مؤقتة، لكن ما بنيته حقيقي. التحدي: تمرين واحد اليوم أفضل من صفر. جسمك يعرف الطريق — فقط ابدأ الحركة! 🔥`;
    }
    if (personality === 'needs_push') {
      return `${name}، بصراحة: ${streak > 0 ? `سلسلتك ${streak} أيام ستضيع إذا توقفت اليوم.` : `كل يوم تأخير يجعل العودة أصعب.`} ⚡\n\nمش لازم تكون مستعداً — فقط ابدأ. 5 دقائق فقط، تمرين واحد. الحماس يأتي بعد البداية مش قبلها. قم الآن! 💪`;
    }
    const motivations = [
      `${name}، ${achievement} — هذا إنجاز حقيقي. 💪\n\nالبداية فقط 5 دقائق. افتح التطبيق، ابدأ تمريناً واحداً. الجسم سيأخذك هو. "الانضباط يصنع ما يعجز عنه الحماس" — ابدأ الآن! 🔥`,
      `${name}، جسمك يتذكر كل تمرين حتى لو شعرت أنك لا تتقدم. 🧠\nأسرع نتيجة تراها: بعد 3 أسابيع متتالية. أنت في اليوم **${day}** — لا توقف الآن!`,
    ];
    return motivations[day % motivations.length];
  }

  // ── BMI / weight analysis ──
  if (has('bmi','الوزن المثالي','كم وزني المثالي','وزن طبيعي','وزن صحي')) {
    const bmiN = parseFloat(bmi);
    let bmiStatus = '';
    if (bmiN < 18.5) bmiStatus = 'نقص في الوزن';
    else if (bmiN < 25) bmiStatus = 'وزن مثالي ✅';
    else if (bmiN < 30) bmiStatus = 'زيادة طفيفة في الوزن';
    else bmiStatus = 'سمنة — ننصح بمتابعة طبيب';
    const idealW = Math.round((22.5 * Math.pow(cm/100, 2)));
    return `${name}، بناءً على بياناتك:\n\n📏 **الطول:** ${cm} سم\n⚖️ **الوزن:** ${kg} كغ\n📊 **BMI:** ${bmi} — ${bmiStatus}\n🎯 **الوزن المثالي لطولك:** ${idealW-3} – ${idealW+3} كغ\n\nالبرنامج الحالي مناسب جداً لهدفك. استمر! 💪`;
  }

  // ── Sleep / recovery ──
  if (has('نوم','استشفاء','تعافي','راحة','كم نوم','ساعات النوم')) {
    return `${name}، النوم هو "تمرين الليل" الخفي! 😴\n\n**التوصية للرياضيين:**\n• **7-9 ساعات** نوم ليلي\n• نم قبل 11 مساءً إذا تدرب صباحاً\n• تجنب الأكل الثقيل 2 ساعة قبل النوم\n\n**لتحسين جودة النوم:**\n• تمدد خفيف 5 دقائق قبل النوم\n• تقليل الشاشات 30 دقيقة قبل النوم\n• درجة حرارة منخفضة في الغرفة\n\nالعضلات تنمو أثناء النوم — لا تستهن به! 💪`;
  }

  // ── Water / hydration ──
  if (has('ماء','مياه','شرب','ترطيب')) {
    const waterL = (kg * 0.035).toFixed(1);
    return `${name}، احتياجك من الماء يومياً: **${waterL} لتر** (بناءً على وزنك ${kg} كغ) 💧\n\nأيام التمرين: أضف **500-700 مل** إضافية.\n\n**خطة عملية:**\n• كوب كبير فور الاستيقاظ\n• كوب قبل كل وجبة\n• 500مل قبل التمرين و500مل بعده\n• الهدف: بول شفاف أو أصفر فاتح جداً`;
  }

  // ── API Key suggestion ──
  if (has('api','مفتاح','groq','أذكى','أقوى','تحسين المدرب')) {
    return `${name}، أنا الآن في **الوضع المحلي** وأعرف بياناتك كاملة 🤖\n\nللحصول على ردود أكثر تخصصاً ودقة مع الذكاء الاصطناعي:\n1️⃣ افتح الإعدادات ⚙️\n2️⃣ أدخل مفتاح **Groq API** (مجاني من console.groq.com)\n3️⃣ استمتع بمدرب GPT-4 مستوى!\n\nبدون مفتاح: أنا ما زلت هنا أساعدك في كل شيء 💪`;
  }

  // ── Identity / capabilities ──
  if (has('من انت','من أنت','عرف نفسك','ماذا تفعل','ماذا يمكنك','قدرات','مميزات','ايش تسوي','وش تسوي','شو تسوي','ما هو دورك','دورك')) {
    return `${name}، أنا **كوتش فيت** 🤖 — مدربك الذكي في تطبيق AZEM!\n\nأستطيع مساعدتك في:\n💪 **التمارين** — شرح أي تمرين، تعديل الجدول\n🥗 **التغذية** — خطة أكل على وزنك ${kg}كغ وهدف ${goalAr}\n📊 **التقدم** — تقييم أدائك ومتابعة إنجازاتك\n💧 **الصحة** — ماء، نوم، تعافي\n🎨 **التطبيق** — تغيير الثيم، الوضع، البرنامج\n\nفقط اسألني بالعربية الدارجة وأنا أفهم! 🔥`;
  }

  // ── Stretching / flexibility ──
  if (has('تمدد','إطالة','مرونة','يوغا','ظهر','رقبة','مفصل')) {
    return `${name}، التمدد ضروري للتعافي وتجنب الإصابات! 🧘\n\n**روتين تمدد 10 دقائق (بعد كل جلسة):**\n• **رقبة:** 30 ثانية لكل جهة\n• **صدر وكتفين:** 45 ثانية\n• **ظهر علوي:** 45 ثانية\n• **أوتار الركبة:** 45 ثانية لكل ساق\n• **فخذ أمامي:** 45 ثانية لكل جانب\n• **تنفس عميق:** 1 دقيقة\n\nالتمدد يحسن الأداء بنسبة 15-20% في التمارين التالية. 💪`;
  }

  // ── Supplements / creatine / protein powder ──
  if (has('بروتين باودر','مكمل','كرياتين','supplement','protein powder','واي','whey')) {
    return `${name}، المكملات الغذائية ليست ضرورية لنتائج جيدة، لكن:\n\n**الأكثر فائدة للمبتدئين:**\n🥛 **بروتين واي:** مفيد إذا كنت تصعب الحصول على ${Math.round(kg*1.6)}غ يومياً من الطعام\n⚡ **كرياتين مونوهيدرات:** يزيد القوة 10-15% (3-5غ يومياً آمن)\n🌞 **فيتامين D3:** مهم إذا لم تتعرض لشمس كافية\n\n**الأساس الأهم:** الأكل الكافي من الطعام الطبيعي يكفي في مرحلتك. 💪`;
  }

  // ── Specific exercise explanation ──
  if (has('بيربيز','burpee','ضغط','pushup','قرفصاء','squat','بلانك','plank','نط الحبل','متسلق الجبل','رفع الركبة','كيف أؤدي','طريقة')) {
    const exMap = {
      'بيربيز': 'قف مستقيماً → ضع يديك على الأرض → ارجل للخلف (وضعية الضغط) → اضغطة كاملة → ارجل للأمام → قفز عالياً مع رفع الذراعين. **المسافة:** 3×10 مع 30 ثانية راحة.',
      'ضغط': 'يدان بعرض الكتفين → جسم مستقيم → انزل حتى تلامس صدرك الأرض → ارتفع ببطء. **المفتاح:** الجسم كالخشبة طوال الوقت.',
      'قرفصاء': 'قدمان بعرض الكتفين → انزل كأنك تجلس على كرسي → ركبتك لا تتجاوز أصابعك → ظهرك مستقيم.',
      'بلانك': 'ضع ساعديك على الأرض → جسم مستقيم من الرأس للعقب → بطنك مشدودة → تنفس بانتظام.',
      'نط الحبل': 'أمسك الحبل بيدين → حركة المعصم فقط للدوران → انط بكلا القدمين معاً → ابدأ ببطء ثم سرّع.',
    };
    const found = Object.entries(exMap).find(([k]) => m.includes(k));
    if (found) return `${name}، **${found[0]}** — طريقة الأداء الصحيحة:\n\n${found[1]}\n\n**أخطاء شائعة يجب تجنبها:** لا تحبس أنفاسك، راقب شكل جسمك في المرآة إذا أمكن.`;
  }

  // ── General health / wellbeing ──
  if (has('مناعة','صحة','مرض','دواء','سكر','ضغط','قلب','دهون الدم','كوليسترول')) {
    return `${name}، للحصول على أفضل النتائج الصحية من التمرين:\n\n**الفوائد الصحية للبرنامج:**\n❤️ يحسن صحة القلب خلال **3-4 أسابيع** من التمرين المنتظم\n🩺 يخفض ضغط الدم والكوليسترول\n🧠 يحسن المزاج والنوم\n💪 يقوي المناعة\n\n**مهم:** إذا كان لديك حالة طبية، استشر طبيبك قبل رفع شدة التمارين. برنامجنا الحالي مناسب لمعظم الأشخاص الأصحاء.`;
  }

  // ── Thank you / positive responses ──
  if (has('شكرا','مشكور','شكراً','ممتاز','رائع','حلو','جيد جدا','تمام','أحسنت','برافو','thanks','thank')) {
    return `${name}، العفو! 😊 هذا واجبي.\n\nاستمر في التدريب، وأنا دائماً هنا إذا احتجت أي مساعدة. 💪🔥\n\nتذكر: **الاتساق > الشدة** — يوم واحد كل أسبوع أفضل من أسبوع واحد ثم توقف!`;
  }

  // ── Default smart fallback — tries to be helpful with anything ──
  const q = msg.trim();
  if (q.endsWith('?') || q.endsWith('؟') || has('ماذا','كيف','متى','لماذا','هل','ما ','ايش','وش','شو','وين','أين')) {
    return `${name}، سؤال جيد! 🤔\n\nأنا متخصص في اللياقة البدنية وأقدر أساعدك في التمارين، التغذية، التعافي، والبرنامج. سؤالك يبدو خارج نطاق تخصصي مباشرة — لكن إذا له علاقة بالرياضة أو الصحة، أخبرني أكثر.\n\n**جرّب اسألني:**\n• "كيف أؤدي البيربيز صح؟"\n• "ما الأكل المناسب لهدف ${goalAr}؟"\n• "أنا في اليوم ${day} — كيف أكون؟" 💬`;
  }

  return _t(
    `${name}، أنا مدرب لياقتك الذكي! 💪 اليوم ${day} من برنامجك.\n\nتمارين اليوم: **${todayEx}**\nالسعرات المحروقة: **${cal}** 🔥\n\nاسألني عن التمارين أو التغذية! 🤖`,
    `${name}, I'm your smart fitness coach! 💪 Day ${day}.\n\nToday: **${todayEx}**\nCalories burned: **${cal}** 🔥\n\nAsk me about workouts or nutrition! 🤖`,
    `${name}, je suis ton coach fitness intelligent! 💪 Jour ${day}.\n\nAujourd'hui: **${todayEx}**\nCalories brûlées: **${cal}** 🔥\n\nPose-moi tes questions! 🤖`
  );
}


/* ══════════════════════════════════════════
   INTENT DETECTION — يُصنّف كل سؤال قبل الإرسال
   يُحدد: النموذج، الـ temperature، max_tokens، محتوى الـ prompt
══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   COACH MEMORY ENGINE
   ذاكرة طويلة المدى — تحليل أنماط — مبادرة استباقية
══════════════════════════════════════════ */

// ── تحليل وتحديث الذاكرة بعد كل جلسة أو تفاعل ──
function updateCoachMemory() {
  if (!S.coachMemory) S.coachMemory = {
    weakDays:[], skippedExercises:{}, personality:'',
    lastAdvice:'', promises:[], patterns:{},
    proactiveShown:0, achievements:[]
  };
  const mem = S.coachMemory;
  const log = Object.values(S.trainingLog || {}).sort((a,b) => b.day - a.day);

  // ── 1. اكتشاف الأيام الضعيفة (أيام يتكرر فيها الغياب) ──
  if (log.length >= 7) {
    const dayCount = {};
    const progDays = S.user?.programDays || 30;
    // احسب الأيام التي يُفترض التدريب فيها لكن لا يوجد سجل
    for (let d = 1; d <= Math.min(S.currentDay - 1, progDays); d++) {
      const sched = (() => { try { return getDaySchedule(d); } catch(e) { return null; } })();
      if (!sched || sched.type === 'rest') continue;
      const done = S.completedDays.includes(d);
      if (!done) {
        const weekday = ((d - 1) % 7);
        dayCount[weekday] = (dayCount[weekday] || 0) + 1;
      }
    }
    mem.weakDays = Object.entries(dayCount)
      .filter(([,v]) => v >= 2)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 2)
      .map(([d]) => parseInt(d));
  }

  // ── 2. اكتشاف التمارين المتخطاة ──
  // نقارن التمارين المبرمجة بما أُكمل فعلاً
  const completedExIds = Object.keys(S.completedExercises || {}).map(k => k.split('_')[1]);
  const scheduledCounts = {};
  const completedCounts = {};
  log.slice(0, 10).forEach(entry => {
    (entry.exerciseIds || []).forEach(id => {
      scheduledCounts[id] = (scheduledCounts[id] || 0) + 1;
    });
  });
  completedExIds.forEach(id => {
    completedCounts[id] = (completedCounts[id] || 0) + 1;
  });
  // تمارين ظهرت في الجدول لكن نسبة إكمالها منخفضة
  mem.skippedExercises = {};
  Object.entries(scheduledCounts).forEach(([id, total]) => {
    const done = completedCounts[id] || 0;
    if (total >= 3 && done / total < 0.5) {
      mem.skippedExercises[id] = Math.round((1 - done/total) * 100);
    }
  });

  // ── 3. تحليل شخصية المستخدم ──
  const streak = S.streak || 0;
  const pct = S.completedDays.length / (S.user?.programDays || 30);
  if (streak >= 7 || pct >= 0.8) mem.personality = 'self_motivated';
  else if (streak <= 2 && pct < 0.3) mem.personality = 'needs_push';
  else mem.personality = 'balanced';

  // ── 4. أنماط الأداء ──
  if (log.length >= 5) {
    const recent5 = log.slice(0, 5);
    const older5  = log.slice(5, 10);
    const recentAvg = recent5.reduce((s,e) => s + (e.calories||0), 0) / recent5.length;
    const olderAvg  = older5.length ? older5.reduce((s,e) => s + (e.calories||0), 0) / older5.length : recentAvg;
    mem.patterns.trend = recentAvg > olderAvg * 1.1 ? 'improving'
      : recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
    mem.patterns.avgCalPerSession = Math.round(recentAvg);

    // أفضل يوم في الأسبوع بناءً على السعرات
    const dayPerf = {};
    log.forEach(e => {
      if (e.ts) {
        const wd = new Date(e.ts).getDay();
        if (!dayPerf[wd]) dayPerf[wd] = {total:0, count:0};
        dayPerf[wd].total += (e.calories || 0);
        dayPerf[wd].count++;
      }
    });
    const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const bestEntry = Object.entries(dayPerf)
      .map(([d, v]) => ({day: parseInt(d), avg: v.total/v.count}))
      .sort((a,b) => b.avg - a.avg)[0];
    if (bestEntry) mem.patterns.bestDay = DAYS_AR[bestEntry.day];
  }

  // ── 5. لحظات الإنجاز تستحق التذكر ──
  const newAchievements = [];
  if (S.streak === 7 && !mem.achievements.includes('streak7'))
    newAchievements.push('streak7');
  if (S.completedDays.length === 14 && !mem.achievements.includes('half14'))
    newAchievements.push('half14');
  if (S.completedDays.length === 21 && !mem.achievements.includes('habit21'))
    newAchievements.push('habit21');
  mem.achievements = [...(mem.achievements||[]), ...newAchievements];

  // ── 6. تحديث الوعود المنجزة ──
  // إذا أكمل يوماً جديداً — نعتبر الوعود الأخيرة منجزة
  if (S.completedDays.includes(S.currentDay) && mem.promises?.length) {
    mem.promises = mem.promises.map(p => {
      if (!p.done && p.day && S.currentDay > p.day) return {...p, done: true};
      return p;
    });
  }

  saveState();
  return mem;
}

// ── بناء ملخص الذاكرة للـ system prompt ──
function buildMemorySummary(mem, S) {
  if (!mem) return '';
  const lines = [];
  const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const allEx = [...(typeof EXERCISES !== 'undefined' ? EXERCISES : []), ...(S.customExercises||[])];

  if (mem.personality)
    lines.push(`شخصية المستخدم: ${
      mem.personality === 'self_motivated' ? 'محفوز ذاتياً — يحتاج تحديات' :
      mem.personality === 'needs_push' ? 'يحتاج دفعاً ومتابعة قوية' : 'متوازن'
    }`);

  if (mem.weakDays?.length)
    lines.push(`أيام الضعف: ${mem.weakDays.map(d => DAYS_AR[d] || ('يوم'+d)).join('، ')} — تجنب التوقعات العالية فيها`);

  if (Object.keys(mem.skippedExercises||{}).length) {
    const top = Object.entries(mem.skippedExercises).sort((a,b)=>b[1]-a[1]).slice(0,2);
    lines.push(`تمارين يتخطاها: ${top.map(([id,pct])=>{
      const ex = allEx.find(e=>e.id===id);
      return (ex?.nameAr||id) + '(' + pct + '%)';
    }).join('، ')}`);
  }

  if (mem.patterns?.trend)
    lines.push(`اتجاه الأداء: ${
      mem.patterns.trend === 'improving' ? '📈 في تحسن مستمر' :
      mem.patterns.trend === 'declining' ? '📉 تراجع — يحتاج انتباه' : '➡️ مستقر'
    } | متوسط: ${mem.patterns.avgCalPerSession||0} كال/جلسة`);

  if (mem.patterns?.bestDay)
    lines.push(`أفضل أيامه: ${mem.patterns.bestDay}`);

  if (mem.lastAdvice)
    lines.push(`آخر نصيحة قدّمتها: "${mem.lastAdvice}"`);

  const pendingPromises = (mem.promises||[]).filter(p => !p.done).slice(0,2);
  if (pendingPromises.length)
    lines.push(`وعود معلقة: ${pendingPromises.map(p=>p.text).join(' | ')}`);

  if (mem.achievements?.length)
    lines.push(`إنجازات تستحق الاحتفاء: ${mem.achievements.slice(-3).join(', ')}`);

  return lines.length ? '\n🧠 ذاكرة المدرب:\n' + lines.map(l=>'• '+l).join('\n') : '';
}

// ── رسالة استباقية عند فتح التطبيق ──
function getProactiveMessage() {
  const mem = S.coachMemory;
  if (!mem) return null;
  const today = Math.floor(Date.now() / 86400000);
  // مرة واحدة فقط كل يوم
  if (mem.proactiveShown >= today) return null;

  const log = Object.values(S.trainingLog || {}).sort((a,b) => b.ts - a.ts);
  const lastSession = log[0];
  const name = S.user?.name || 'بطل';
  const now = Date.now();

  // ── حالات تستدعي مبادرة المدرب ──

  // غياب يومين+ مع كون البرنامج لا يزال نشطاً
  if (lastSession?.ts && (now - lastSession.ts) > 2 * 86400000 && !S.completedDays.includes(S.currentDay)) {
    const daysMissed = Math.floor((now - lastSession.ts) / 86400000);
    mem.proactiveShown = today;
    saveState();
    return {
      type: 'absence',
      msg: `${name}، لاحظت غيابك ${daysMissed} ${daysMissed===2?'يومين':'أيام'} 👀

كل شيء بخير؟ تذكر أن التوقف مؤقت لكن الاستسلام دائم. تمرين بسيط اليوم يكفي لإعادة السلسلة! 💪

تمارين اليوم ${S.currentDay}: **${getDaySchedule(S.currentDay).exercises?.map(e=>e.nameAr).slice(0,3).join('، ') || 'راحة'}**`,
      suggestions: ['▶ ابدأ الآن', '😴 يوم راحة اليوم', '🔄 خفف التمارين']
    };
  }

  // سلسلة 7 أيام — احتفاء + تحدي
  if (S.streak === 7 && !mem.achievements.includes('streak7_celebrated')) {
    mem.achievements = [...(mem.achievements||[]), 'streak7_celebrated'];
    mem.proactiveShown = today;
    saveState();
    return {
      type: 'celebration',
      msg: `🏆 ${name}! أسبوع كامل متواصل!

هذا ليس حظاً — هذا انضباط حقيقي. أنت الآن في أفضل 10% من مستخدمي التطبيق.

هذا الأسبوع سنرفع الكثافة قليلاً — أنت جاهز! 🔥`,
      suggestions: ['💪 رفع الكثافة', '📊 قيّم تقدمي', '🎯 تحدٍ جديد']
    };
  }

  // أداء متراجع — تنبيه لطيف
  if (mem.patterns?.trend === 'declining' && log.length >= 5) {
    const daysSinceNotified = today - (mem.proactiveShown || 0);
    if (daysSinceNotified >= 3) {
      mem.proactiveShown = today;
      saveState();
      return {
        type: 'concern',
        msg: `${name}، لاحظت أن أداءك هذا الأسبوع أقل من المعتاد.

هذا طبيعي تماماً — الجسم يمر بموجات. لكن أخبرني: هل هناك شيء يعيقك؟ 🤔

متوسطك الطبيعي: **${mem.patterns.avgCalPerSession} كال/جلسة**`,
        suggestions: ['😴 أنا متعب', '🔥 سأرجع بقوة', '🗓️ عدّل برنامجي']
      };
    }
  }

  // قرب إنهاء البرنامج — احتفاء مسبق
  const progDaysTotal = S.user?.programDays || 30;
  const daysLeft = progDaysTotal - (S.completedDays||[]).length;
  if (daysLeft <= 3 && daysLeft > 0) {
    const daysSinceNotified2 = today - (mem.proactiveShown || 0);
    if (daysSinceNotified2 >= 2) {
      mem.proactiveShown = today;
      saveState();
      return {
        type: 'almost_done',
        msg: `${name}! 🏁 لم يتبقَّ إلا **${daysLeft} ${daysLeft===1?'يوم':'أيام'}** لإنهاء البرنامج!\n\nأنت على بعد خطوات من الإنجاز الذي بدأت من أجله. لا تتوقف الآن — الخط النهائي أمامك! 🏆`,
        suggestions: ['💪 أنهِ الأسبوع', '📊 قيّم رحلتي', '🔥 ما التالي؟']
      };
    }
  }

  return null;
}

// ── استخراج وعود المستخدم من المحادثة ──
function extractPromises(userMsg, assistantReply) {
  if (!S.coachMemory) return;
  const mem = S.coachMemory;
  const m = (userMsg || '').toLowerCase();
  // كلمات تدل على وعد
  if (/سأ|سوف|هأ|بكرة|غداً|الأسبوع القادم|هذا الأسبوع|سأحاول|سأزيد/.test(m)) {
    const promise = { text: userMsg.slice(0, 80), day: S.currentDay, ts: Date.now(), done: false };
    mem.promises = [...(mem.promises||[]).slice(-4), promise];
  }
  // تحديث lastAdvice من رد المدرب
  if (assistantReply) {
    // استخرج أول نصيحة عملية
    const adviceMatch = assistantReply.match(/[•\-]\s*\*?\*?([^\n]{10,60})/);
    if (adviceMatch) mem.lastAdvice = adviceMatch[1].replace(/\*/g,'').trim().slice(0, 80);
  }
  saveState();
}

function detectIntent(msg, hasImg, hasPdf) {
  if (hasImg) return 'IMAGE';
  if (hasPdf) return 'PDF';
  const m = (msg || '').toLowerCase();

  // ── خطة شخصية مُولَّدة بالكامل ──
  if (/خطة شخصية|برنامج شخصي|ولّد|ابنيلي|صمم|generate|custom plan|personal plan/.test(m))
    return 'PERSONAL_PLAN';

  // ── برنامج / تعديل جدول ──
  if (/برنامج|خطة|جدول|أسبوع|عدّل يوم|عدل يوم|غير يوم|تمارين الأسبوع|روتين|ورتين|schedule|program|week/.test(m))
    return 'PROGRAM';

  // ── تقييم / تحليل أداء ──
  if (/قيّم|قيم|تقدم|تقدمي|كيف أنا|كيف انا|تحليل|إنجاز|انجاز|نتائجي|evaluate|progress|analyse/.test(m))
    return 'ANALYSIS';

  // ── تغذية / صحة ──
  if (/أكل|اكل|طعام|غذاء|تغذية|بروتين|كارب|دهون|ماء|مياه|وجبة|سعرات|كالوري|نوم|استشفاء|مكمل|واي|كرياتين|nutrition|food|protein|calories|sleep/.test(m))
    return 'NUTRITION';

  // ── تمرين محدد / شرح تقني ──
  if (/كيف أؤدي|كيف اؤدي|اشرح|طريقة|شكل|وضع|ضغط|قرفصاء|بيربيز|بلانك|burpee|pushup|squat|plank|form|how to/.test(m))
    return 'EXERCISE';

  // ── تحفيز / دعم نفسي ──
  if (/تحفيز|همة|كسلان|ما عندي خلق|مو شايف فايدة|يأس|متعب نفسياً|motivat|demotivat/.test(m))
    return 'MOTIVATION';

  return 'CHAT';
}

// إعدادات كل intent — نموذج + temperature + max_tokens + عدد رسائل التاريخ
const INTENT_CONFIG = {
  CHAT:         { model: 'llama-3.1-8b-instant',    temperature: 0.75, max_tokens: 500,  historyLen: 6  },
  MOTIVATION:   { model: 'llama-3.1-8b-instant',    temperature: 0.85, max_tokens: 500,  historyLen: 6  },
  NUTRITION:    { model: 'llama-3.1-8b-instant',    temperature: 0.40, max_tokens: 700,  historyLen: 4  },
  EXERCISE:     { model: 'llama-3.1-8b-instant',    temperature: 0.35, max_tokens: 600,  historyLen: 4  },
  ANALYSIS:     { model: 'llama-3.3-70b-versatile', temperature: 0.45, max_tokens: 900,  historyLen: 10 },
  PROGRAM:      { model: 'llama-3.3-70b-versatile', temperature: 0.20, max_tokens: 1600, historyLen: 6  },
  PERSONAL_PLAN:{ model: 'llama-3.3-70b-versatile', temperature: 0.20, max_tokens: 2000, historyLen: 4  },
  IMAGE:        { model: 'llama-3.3-70b-versatile', temperature: 0.55, max_tokens: 800,  historyLen: 4  },
  PDF:          { model: 'llama-3.3-70b-versatile', temperature: 0.20, max_tokens: 2000, historyLen: 4  },
};

// اقتراحات ديناميكية بعد كل رد

/* ══ استخراج الاقتراحات من رد المدرب ══ */
function _extractSuggestionsFromReply(reply) {
  if (!reply) return null;
  try {
    // الصيغة 1: ```SUGGESTIONS\n{...}\n```
    const m1 = reply.match(/```SUGGESTIONS[\s\S]*?(\{[\s\S]*?\})[\s\S]*?```/);
    if (m1) {
      const parsed = JSON.parse(m1[1].trim());
      const arr = parsed.s || parsed.suggestions || [];
      const clean = arr.filter(s => typeof s === 'string' && s.trim().length > 2)
                       .map(s => s.trim().slice(0, 40)).slice(0, 4);
      if (clean.length >= 2) return clean;
    }
    // الصيغة 2: SUGGESTIONS\n{...} بدون backticks
    const m2 = reply.match(/SUGGESTIONS\s*\n(\{[\s\S]*?\})/);
    if (m2) {
      const parsed = JSON.parse(m2[1].trim());
      const arr = parsed.s || parsed.suggestions || [];
      const clean = arr.filter(s => typeof s === 'string' && s.trim().length > 2)
                       .map(s => s.trim().slice(0, 40)).slice(0, 4);
      if (clean.length >= 2) return clean;
    }
    // الصيغة 3: مصفوفة JSON مباشرة بعد SUGGESTIONS
    const m3 = reply.match(/SUGGESTIONS\s*\n(\[[\s\S]*?\])/);
    if (m3) {
      const arr = JSON.parse(m3[1].trim());
      const clean = arr.filter(s => typeof s === 'string' && s.trim().length > 2)
                       .map(s => s.trim().slice(0, 40)).slice(0, 4);
      if (clean.length >= 2) return clean;
    }
  } catch(e) {}
  return null;
}
function _cleanReplyFromSuggestions(reply) {
  if (!reply) return reply;
  // الصيغة 1: ```SUGGESTIONS...```
  reply = reply.replace(/\n?```SUGGESTIONS[\s\S]*?```\n?/g, '');
  // الصيغة 2: SUGGESTIONS\n{...} بدون backticks
  reply = reply.replace(/\n?SUGGESTIONS\s*\n\{[\s\S]*?\}\n?/g, '');
  // الصيغة 3: SUGGESTIONS\n[...] مصفوفة
  reply = reply.replace(/\n?SUGGESTIONS\s*\n\[[\s\S]*?\]\n?/g, '');
  return reply.trim();
}

function getDynamicSuggestions(intent, lastReply) {
  const r = (lastReply || '').toLowerCase();
  // سياق خاص من الرد
  if (r.includes('تعب') || r.includes('راحة نشطة'))
    return ['🧘 ابدأ الراحة النشطة', '📅 خفف تمارين اليوم', '💪 أنا بخير، أكمل'];
  if (r.includes('برنامج') || r.includes('أسبوع') || r.includes('جدول'))
    return ['✅ طبّق هذا البرنامج', '🔄 عدّل تمرين معين', '📊 قيّم تقدمي أولاً'];
  if (r.includes('بروتين') || r.includes('سعرات') || r.includes('تغذية') || r.includes('أكل'))
    return ['🍗 خطة أكل أسبوعية', '⏱️ متى أتناول الطعام؟', '💧 كم ماء أشرب؟'];
  if (r.includes('ألم') || r.includes('إصابة') || r.includes('وجع'))
    return ['🩺 متى أعود للتمرين؟', '🧘 تمارين بديلة', '📅 تعديل البرنامج'];
  // حسب الـ intent الحالي
  switch(intent) {
    case 'PROGRAM':  return ['✅ طبّق البرنامج', '🔄 غيّر تمريناً', '📊 قيّم تقدمي'];
    case 'ANALYSIS': return ['💪 اقترح تحسيناً', '📅 عدّل أسبوع', '🔥 كيف أحرق أكثر؟'];
    case 'NUTRITION':return ['🍗 أعطني خطة أسبوع', '⏱️ توقيت الوجبات', '💊 مكملات مفيدة؟'];
    case 'EXERCISE': return ['🎬 تمرين مشابه؟', '⚡ نسخة أصعب', '💡 أخطاء شائعة؟'];
    case 'PERSONAL_PLAN': return ['✅ طبّق البرنامج', '🔄 عدّل أسبوعاً', '📊 قيّم أولاً'];
    case 'MOTIVATION':   return ['▶ ابدأ الآن', '📅 تمرين خفيف اليوم', '💪 أنا جاهز'];
    default:             return ['📅 تمارين اليوم', '🔥 كيف أحرق أكثر؟', '📊 قيّم تقدمي'];
  }
}

// بناء system prompt مُخصص حسب الـ intent
function buildSystemPrompt(intent, u, S) {
  const _lang = currentLang || 'ar';
  const _isEn = _lang === 'en', _isFr = _lang === 'fr';
  const _T = (ar, en, fr) => _isEn ? en : _isFr ? fr : ar;

  // ── الهوية الأساسية (مشتركة) ──
  const identity = _T(
    'أنت "كوتش فيت" — مدرب لياقة ذكي في تطبيق AZEM (عزم).',
    'You are "FitCoach" — a smart fitness coach in the AZEM app.',
    'Tu es "CoachFit" — un coach fitness intelligent dans l\'app AZEM.'
  );

  const langRule = _isEn
    ? 'ALWAYS reply in English — even if the user writes in Arabic.'
    : _isFr
      ? 'TOUJOURS répondre en français — même si l\'utilisateur écrit en arabe.'
      : 'ردّ دائماً بالعربية الواضحة — حتى لو كتب المستخدم بلغة أخرى. لا تخلط الحروف أبداً داخل الكلمة الواحدة.';

  // ── تعليمات الاقتراحات الذكية ──
  const suggestionsRule = _isEn
    ? `At the END of your reply, always add exactly this JSON block (hidden from user display):
\`\`\`SUGGESTIONS
{"s":["suggestion 1","suggestion 2","suggestion 3"]}
\`\`\`
Choose 3 short follow-up questions (max 30 chars each) that make sense given YOUR reply.
Example: if you explained push-ups → ["Show me the steps","Easier version?","How many sets?"]`
    : _isFr
      ? `À la FIN de ta réponse, ajoute toujours ce bloc JSON:
\`\`\`SUGGESTIONS
{"s":["suggestion 1","suggestion 2","suggestion 3"]}
\`\`\`
Choisis 3 questions courtes (max 30 chars) cohérentes avec ta réponse.`
      : `في نهاية ردك دائماً أضف هذا الـ JSON (لا يظهر للمستخدم):
\`\`\`SUGGESTIONS
{"s":["اقتراح 1","اقتراح 2","اقتراح 3"]}
\`\`\`
اختر 3 أسئلة قصيرة (أقل من 30 حرفاً) منطقية بناءً على ردك أنت.
مثال: إذا شرحت تمرين Push-Up → ["كيف أؤديه صح؟","نسخة أسهل؟","كم مجموعة؟"]
مثال: إذا تكلمت عن التغذية → ["ما الأكل بعد التمرين؟","كم بروتين أحتاج؟","خطة أسبوعية؟"]`;

  // ── بيانات المستخدم الأساسية (دائماً موجودة) ──
  const kg = parseFloat(u.weight) || 70;
  const cm = parseFloat(u.height) || 170;
  const age = parseFloat(u.age) || 25;
  const isFemale = u.gender === 'female';
  const bmr = Math.round(isFemale
    ? 10*kg + 6.25*cm - 5*age - 161
    : 10*kg + 6.25*cm - 5*age + 5);
  const bmi = cm > 0 ? (kg / Math.pow(cm/100, 2)).toFixed(1) : '—';
  const goalAr = {burn:'حرق الدهون',muscle:'بناء العضلات',fitness:'تحسين اللياقة',health:'الصحة العامة'}[u.goal||'burn'];
  const goalEn = {burn:'Fat Burn',muscle:'Muscle Building',fitness:'Improve Fitness',health:'General Health'}[u.goal||'burn'];
  const goalFr = {burn:'Brûler les graisses',muscle:'Musculation',fitness:'Forme physique',health:'Santé générale'}[u.goal||'burn'];
  const goalLabel = _T(goalAr, goalEn, goalFr);

  const coreData = `${_T('المستخدم:','User:','Utilisateur:')} ${u.name||'—'} | ${_T('العمر:','Age:','Âge:')} ${age} | ${_T('الجنس:','Gender:','Genre:')} ${isFemale?_T('أنثى','Female','Femme'):_T('ذكر','Male','Homme')}
${_T('الوزن:','Weight:','Poids:')} ${kg}kg | ${_T('الطول:','Height:','Taille:')} ${cm}cm | BMI:${bmi} | BMR:${bmr}kcal
${_T('الهدف:','Goal:','Objectif:')} ${goalLabel} | ${_T('اليوم:','Day:','Jour:')} ${S.currentDay||1}/${u.programDays||30} | ${_T('مكتمل:','Done:','Complété:')} ${(S.completedDays||[]).length} ${_T('يوم','days','jours')} | ${_T('سلسلة:','Streak:','Série:')} ${S.streak||0}`;

  // ── ذاكرة المدرب ──
  const mem = S.coachMemory || {};
  const memorySummary = buildMemorySummary(mem, S);

  // ── بيانات تمارين اليوم ──
  const todaySched = (() => { try { return getDaySchedule(S.currentDay||1); } catch(e) { return null; } })();
  const todayEx = todaySched?.exercises?.map(e=>`${e.nameAr}(${e.sets}×${e.reps}${e.type==='timer'?'ث':''})`).join('، ') || _T('راحة','Rest','Repos');
  const todayData = `${_T('تمارين اليوم:','Today:','Aujourd\'hui:')} ${todayEx}`;

  // ── سجل التدريب (فقط عند الحاجة) ──
  const log7 = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day).slice(0,7);
  const logSummary = log7.length
    ? log7.map(e=>`day${e.day}:${(e.exercises||[]).slice(0,3).join(',')}|${e.calories||0}cal`).join(' / ')
    : _T('لا يوجد سجل بعد','No log yet','Pas encore de journal');

  // ── تحليل التعب ──
  const muscleCount = {};
  log7.forEach(e=>(e.exerciseIds||[]).forEach(id=>{
    const ex = [...(typeof EXERCISES!=='undefined'?EXERCISES:[]),...(S.customExercises||[])].find(x=>x.id===id);
    if(ex?.muscles) ex.muscles.split(/[،,]/).forEach(m=>{const k=m.trim();if(k)muscleCount[k]=(muscleCount[k]||0)+1;});
  }));
  const tiredMuscle = Object.entries(muscleCount).sort((a,b)=>b[1]-a[1])[0];
  const fatigueNote = tiredMuscle && tiredMuscle[1]>=4
    ? `⚠️ ${_T('إرهاق:','Fatigue:','Fatigue:')} ${tiredMuscle[0]} (${tiredMuscle[1]} ${_T('جلسات','sessions','séances')})`
    : '';

  // ── قائمة التمارين المتاحة (للـ PROGRAM فقط) ──
  const allExList = [...(typeof EXERCISES!=='undefined'?EXERCISES:[]), ...(S.customExercises||[])]
    .map(e=>`${e.id}:${e.nameAr}`)
    .join(' | ');

  // ══ بناء الـ prompt حسب الـ intent ══

  if (intent === 'CHAT') {
    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}
${todayData}${memorySummary}

${_T(
      'ردّ بإيجاز ودفء. 2-4 جمل. ابدأ باسم المستخدم. إذا وجدت وعداً معلقاً أو نمطاً في الذاكرة، أشر إليه بلطف.',
      'Reply briefly and warmly. 2-4 sentences. Start with user name. If memory shows a pending promise or pattern, mention it gently.',
      'Réponds brièvement. 2-4 phrases. Si la mémoire montre un pattern, mentionne-le.'
    )}`;
  }

  if (intent === 'NUTRITION') {
    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}

${_T(
      'متخصص في التغذية الرياضية. ردود مبنية على الأرقام الحقيقية (الوزن، الهدف، BMR). عربية واضحة، قوائم منظمة.',
      'Nutrition specialist. Base answers on real numbers (weight, goal, BMR). Clear lists.',
      'Spécialiste en nutrition sportive. Basez les réponses sur les chiffres réels. Listes claires.'
    )}`;
  }

  if (intent === 'EXERCISE') {
    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}
${todayData}

${_T(
      'متخصص في تقنية الأداء الرياضي. اشرح الخطوات بوضوح. نبّه للأخطاء الشائعة. 4-6 جمل.',
      'Exercise technique specialist. Explain steps clearly. Warn about common mistakes. 4-6 sentences.',
      'Spécialiste en technique sportive. Explique clairement. Signale les erreurs courantes. 4-6 phrases.'
    )}`;
  }

  if (intent === 'ANALYSIS') {
    const avgCal = log7.length ? Math.round(log7.reduce((s,e)=>s+(e.calories||0),0)/log7.length) : 0;
    const pct = Math.round((S.completedDays||[]).length / (u.programDays||30) * 100);
    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}
${_T('التقدم:','Progress:','Progrès:')} ${pct}% | ${_T('متوسط سعرات/جلسة:','Avg cal/session:','Moy cal/séance:')} ${avgCal}
${_T('آخر 7 جلسات:','Last 7 sessions:','7 dernières séances:')} ${logSummary}
${fatigueNote}${memorySummary}

${_T(
  'محلل أداء رياضي. قدّم تقييماً دقيقاً مبنياً على الأرقام. حدّد نقاط القوة والضعف. اقترح تحسيناً واحداً محدداً. استخدم الذاكرة لتقديم ملاحظات شخصية حقيقية.',
  'Sports performance analyst. Give precise data-driven evaluation. Use memory insights for truly personalized observations.',
  'Analyste de performance. Évaluation précise. Utilise la mémoire pour des observations vraiment personnalisées.'
)}`;
  }

  if (intent === 'PROGRAM' || intent === 'PDF') {
    const fitcmdDocs = `FITCMD — ${_T('تحكم بالتطبيق:','App control:','Contrôle app:')}
\`\`\`FITCMD
{"cmd":"..."}
\`\`\`
setDay   → {"cmd":"setDay","day":1,"exercises":["rope","burpee","squat"]}
setRest  → {"cmd":"setRest","day":4}
setWeek  → {"cmd":"setWeek","days":[["rope","burpee"],"rest",["squat","pushup"],"rest",["climber"],"rest","rest"]}
setTheme → {"cmd":"setTheme","theme":"ocean"}
addExercise → {"cmd":"addExercise","exercise":{"id":"wall_sit","nameAr":"جلوس الجدار","nameEn":"Wall Sit","type":"timer","sets":3,"reps":30,"rest":30,"icon":"🧱","steps":[]}}
addExToDay  → {"cmd":"addExToDay","day":2,"exId":"wall_sit"}
${_T('IDs المدمجة:','Built-in IDs:','IDs intégrés:')} rope,burpee,highknee,sqjump,starjump,climber,boxing,plank,crunch,legrise,bicycle,russian,hollow,pushup,squat,chair
${_T('تمارين مخصصة:','Custom:','Personnalisés:')} ${(S.customExercises||[]).map(e=>e.id+':'+e.nameAr).join(', ')||'—'}
${_T('القواعد:','Rules:','Règles:')} setWeek=7 أيام بالضبط | ممنوع IDs وهمية | اعرض البرنامج قبل تطبيقه وانتظر موافقة`;

    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}
${todayData}
${_T('التمارين المتاحة:','Available exercises:','Exercices disponibles:')} ${allExList}
${_T('آخر 7 جلسات:','Last 7 sessions:','7 dernières séances:')} ${logSummary}
${fatigueNote}${memorySummary}

${fitcmdDocs}

${_T(
  'مبرمج لياقة خبير. عند اقتراح برنامج: اعرضه أولاً ثم انتظر الموافقة قبل تطبيق FITCMD. عند التعديل: نفّذ فوراً.',
  'Expert fitness programmer. When suggesting a program: show it first, then wait for approval before FITCMD. When editing: execute immediately.',
  'Programmateur fitness expert. Pour un programme: montre-le d\'abord, attends la validation. Pour une modification: exécute immédiatement.'
)}`;
  }


  // ══ PERSONAL_PLAN: خطة تدريب شخصية مُولَّدة بالكامل ══
  if (intent === 'PERSONAL_PLAN') {
    const avgCal = log7.length ? Math.round(log7.reduce((s,e)=>s+(e.calories||0),0)/log7.length) : 0;
    const pct = Math.round((S.completedDays||[]).length / (u.programDays||30) * 100);
    const mem2 = S.coachMemory || {};
    const DAYS_AR7 = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const weakDaysNames = (mem2.weakDays||[]).map(d=>DAYS_AR7[d]||('يوم'+d)).join('، ') || 'لا يوجد';
    const allExArr2 = [...(typeof EXERCISES!=='undefined'?EXERCISES:[]),...(S.customExercises||[])];
    const skippedNames = Object.entries(mem2.skippedExercises||{})
      .sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([id])=>{ const ex=allExArr2.find(e=>e.id===id); return ex?.nameAr||id; }).join('، ') || 'لا يوجد';
    const fitnessLevel = pct >= 70 ? 'متقدم' : pct >= 35 ? 'متوسط' : 'مبتدئ';
    const streakLevel = (S.streak||0) >= 7 ? 'ممتاز' : (S.streak||0) >= 3 ? 'جيد' : 'يحتاج تحسين';
    const fitcmdRef = 'IDs المدمجة: rope,burpee,highknee,sqjump,starjump,climber,boxing,plank,crunch,legrise,bicycle,russian,hollow,pushup,squat,chair';
    const customRef = (S.customExercises||[]).map(e=>e.id+':'+e.nameAr).join(', ') || '—';
    const personalPlanSys = [
      'أنت خبير تصميم برامج لياقة بدنية. مهمتك: توليد برنامج تدريب شخصي 100% مبني على تحليل عميق لهذا المستخدم.',
      'قاعدة اللغة: ردّ بالعربية الواضحة دائماً.',
      '',
      '══ تحليل المستخدم الشامل ══',
      'الاسم: ' + (u.name||'—') + ' | العمر: ' + age + ' | الجنس: ' + (isFemale?'أنثى':'ذكر'),
      'الوزن: ' + kg + 'kg | الطول: ' + cm + 'cm | BMI:' + bmi + ' | BMR:' + bmr + 'kcal/يوم',
      'الهدف: ' + goalAr + ' | البرنامج: ' + (u.programDays||30) + ' يوم | المكتمل: ' + pct + '% | السلسلة: ' + (S.streak||0) + ' يوم',
      'مستوى اللياقة: ' + fitnessLevel + ' | الالتزام: ' + streakLevel,
      '',
      '══ أداء الأسبوعين الأخيرين ══',
      'متوسط السعرات/جلسة: ' + avgCal + ' كال',
      'آخر 7 جلسات: ' + logSummary,
      fatigueNote,
      '',
      '══ أنماط مكتشفة ══',
      'أيام الضعف: ' + weakDaysNames,
      'تمارين يتهرب منها: ' + skippedNames,
      'شخصيته: ' + (mem2.personality==='self_motivated'?'محفوز ذاتياً':mem2.personality==='needs_push'?'يحتاج دفعاً':'متوازن'),
      'اتجاه الأداء: ' + (mem2.patterns?.trend==='improving'?'📈 في تحسن':mem2.patterns?.trend==='declining'?'📉 في تراجع':'➡️ مستقر'),
      'أفضل يوم: ' + (mem2.patterns?.bestDay||'غير محدد'),
      memorySummary,
      '',
      '══ التمارين المتاحة ══',
      allExList,
      '',
      '══ FITCMD — لتطبيق البرنامج ══',
      'اكتب في نهاية ردك: ```FITCMD\n{"cmd":"setDay","day":1,"exercises":["rope","burpee"]}\n```',
      'أو: ```FITCMD\n{"cmd":"setWeek","days":[["rope","burpee"],"rest",["squat","pushup"],"rest",["climber"],"rest","rest"]}\n```',
      fitcmdRef,
      'مخصص: ' + customRef,
      'القواعد: setWeek=7 مصفوفات بالضبط | لا IDs وهمية | اعرض البرنامج أولاً ثم انتظر موافقة',
      '',
      '══ تعليمات التوليد ══',
      '١. حلّل كل البيانات بعمق — لا تتجاهل أي رقم',
      '٢. صمّم برنامجاً يعالج نقاط الضعف ويبني على نقاط القوة',
      '٣. تجنّب التمارين التي يتهرب منها في أيام ضعفه',
      '٤. اعرض البرنامج بشكل واضح مع شرح المنطق',
      '٥. اسأل عن الموافقة قبل FITCMD',
      '٦. الهدف: برنامج يشعر أنه مصنوع له وحده'
    ].filter(Boolean).join('\n');
    return personalPlanSys;
  }

  // ══ MOTIVATION: دعم نفسي وتحفيز مخصص ══
  if (intent === 'MOTIVATION') {
    const mem3 = S.coachMemory || {};
    const pct3 = Math.round((S.completedDays||[]).length / (u.programDays||30) * 100);
    const motSys = [
      'أنت مدرب نفسي رياضي متخصص في التحفيز والدعم النفسي.',
      'قاعدة اللغة: ردّ بالعربية الدافئة المباشرة.',
      '',
      coreData,
      'التقدم: ' + pct3 + '% | السلسلة: ' + (S.streak||0) + ' يوم',
      memorySummary,
      '',
      'تعليمات حرجة:',
      '- لا تعطِ نصائح تمرين أو تغذية — هذا ليس وقتها',
      '- اعترف بمشاعر المستخدم أولاً ثم حفّزه',
      '- استخدم الذاكرة: اذكر إنجازاته الحقيقية',
      '- إذا شخصية needs_push: كن حازماً بلطف',
      '- إذا self_motivated: أشعل التحدي وذكّره بإنجازاته',
      '- اختتم بفعل واحد محدد يمكنه فعله الآن',
      '- 4-6 جمل فقط — لا تطوّل'
    ].filter(Boolean).join('\n');
    return motSys;
  }

    if (intent === 'IMAGE') {
    return `${identity}
${langRule}
${suggestionsRule}
${suggestionsRule}

${coreData}
${todayData}

${_T(
      'حلل الصورة المرفقة. إذا كانت تمريناً: قيّم الشكل والتقنية. إذا كانت وجبة: قدّر السعرات والمغذيات. كن دقيقاً وعملياً.',
      'Analyze the attached image. If exercise: evaluate form and technique. If meal: estimate calories and nutrients. Be precise and practical.',
      'Analyse l\'image jointe. Si exercice: évalue la forme. Si repas: estime les calories. Sois précis et pratique.'
    )}`;
  }

  // GENERAL fallback
  return `${identity}
${langRule}
${suggestionsRule}

${coreData}
${todayData}

${_T(
    'مدرب لياقة شامل. ردود مخصصة ودقيقة. 3-5 جمل.',
    'Comprehensive fitness coach. Personalized and precise replies. 3-5 sentences.',
    'Coach fitness complet. Réponses personnalisées et précises. 3-5 phrases.'
  )}`;
}


/* ══════════════════════════════════════════
   AI COACH
══════════════════════════════════════════ */
function openAICoach() {
  const mode = S.mode || 'mobile';
  if (mode === 'mobile') {
    const btn = document.getElementById('tab-btn-coach');
    switchTab('coach', btn || null);
  } else {
    // Desktop/TV: open modal, clear tab first to avoid duplicate coach-inp IDs
    const tabCoach = document.getElementById('tab-coach');
    if (tabCoach) tabCoach.innerHTML = '';
    const modal = document.getElementById('coach-modal');
    if (modal) {
      modal.style.display = 'flex';
      renderCoach();
    }
  }
}

function closeCoachModal() {
  const modal = document.getElementById('coach-modal');
  if (modal) modal.style.display = 'none';
  // Restore coach tab for next mobile use
  renderCoach();
}

function renderCoach() {
  // Render into active coach container: modal (desktop/tv) or tab (mobile)
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const target = isModalOpen
    ? document.getElementById('coach-modal-body')
    : document.getElementById('tab-coach');
  const tab = target || document.getElementById('tab-coach');
  if (!tab) return;
  const name = S.user?.name || 'المستخدم';
  const msgs = S.coachHistory || [];
  const hasTyping = msgs.length > 0 && msgs[msgs.length-1].role === 'user';

  tab.innerHTML = `<div style="display:flex;flex-direction:column;height:100%;">
    ${!isModalOpen ? `<div style="padding:14px 16px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🤖</div>
      <div style="flex:1;">
        <div style="font-size:15px;font-weight:900;color:var(--txt);">المدرب الذكي</div>
        <div style="font-size:11px;color:${S.apiKey || (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? '#4ade80' : '#f97316'};">${S.apiKey || (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? window.T('coachOnline') : '🤖 محلي — بدون API'}</div>
      </div>
      <button onclick="clearCoachHistory()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">مسح</button>
      <button onclick="startTutorial()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">❓</button>
    </div>` : `<div style="padding:8px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-shrink:0;">
      <button onclick="clearCoachHistory()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">مسح</button>
      <button onclick="startTutorial()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">❓</button>
    </div>`}
    <div id="coach-msgs" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
      ${msgs.length === 0 ? `
          <div style="text-align:center;padding:24px 16px;">
          <div style="font-size:40px;margin-bottom:10px;">💬</div>
          <div style="font-size:14px;color:var(--dim);line-height:1.9;">مرحباً ${_escHtml(name)}! 💪<br>اليوم ${S.currentDay||1} من برنامجك.<br>اسألني أي شيء أو أخبرني كيف حالك.</div>

          <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            ${(window._lastCoachSuggestions || ['📅 اقترح لي برنامج','🍗 ما الأكل بعد التمرين؟','😴 أنا متعب اليوم','🔥 كيف أحرق أسرع؟','📊 قيّم تقدمي','💧 كم أشرب ماء؟']).map(q=>
              `<button onclick="coachAsk('${q}')" style="padding:7px 12px;border-radius:20px;background:var(--card);border:1px solid var(--border);color:var(--txt);font-size:12px;cursor:pointer;font-family:'Cairo',sans-serif;transition:all .2s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">${q}</button>`
            ).join('')}
          </div>
        </div>` :
        msgs.map((m, idx)=>{
          // Handle multimodal content
          let dispText = '', dispImg = null;
          if (Array.isArray(m.content)) {
            const tp = m.content.find(p=>p.type==='text'); dispText = tp?.text||'';
            const ip = m.content.find(p=>p.type==='image_url'); dispImg = ip?.image_url?.url;
          } else { dispText = m.content || ''; }
          // FIX XSS: sanitize ALL messages before markdown formatting
          // نُعالج جميع الرسائل (مستخدم ومساعد) لأن المساعد قد يحتوي على اسم المستخدم
          const safeText = dispText
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
          const formattedText = safeText
            .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
            .replace(/\*(.+?)\*/g,'<em>$1</em>')
            .replace(/^• /gm,'<span style="color:var(--gold);">•</span> ');
          const msgId = 'cmsg-' + idx;
          const isLong = formattedText.length > 600 && m.role === 'assistant';
          const textHtml = formattedText ? `<div id="${msgId}" style="padding:10px 14px;font-size:13px;line-height:1.8;color:var(--txt);white-space:pre-wrap;${isLong?'max-height:220px;overflow:hidden;mask-image:linear-gradient(to bottom,black 60%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,black 60%,transparent 100%);':''}">${formattedText}</div>${isLong?`<button onclick="(function(el,btn){el.style.maxHeight='';el.style.maskImage='';el.style.webkitMaskImage='';btn.style.display='none';})(document.getElementById('${msgId}'),this)" style="width:100%;padding:6px;background:none;border-none;border-top:1px solid var(--border);color:var(--gold);font-size:11px;font-family:'Cairo',sans-serif;cursor:pointer;">▼ اقرأ أكثر</button>`:''}` : '';
          return `<div style="display:flex;gap:8px;align-items:flex-end;${m.role==='user'?'flex-direction:row-reverse':''}">
          <div style="width:32px;height:32px;border-radius:50%;background:${m.role==='user'?'rgba(212,168,67,.2)':'linear-gradient(135deg,var(--gold),var(--gd))'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${m.role==='user'?'👤':'🤖'}</div>
          <div style="max-width:82%;border-radius:${m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px'};background:${m.role==='user'?'rgba(212,168,67,.12)':'var(--card)'};border:1px solid ${m.role==='user'?'rgba(212,168,67,.25)':'var(--border)'};overflow:hidden;">
            ${dispImg?`<img src="${dispImg}" style="width:100%;max-width:220px;display:block;border-radius:inherit;" loading="lazy">`:''}
            ${textHtml}
          </div>
        </div>`;}).join('')
      }
      ${msgs.length > 0 && msgs[msgs.length-1].role === 'assistant' && !hasTyping ? `
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 0 40px;">
          ${(window._lastCoachSuggestions || ['📅 تمارين اليوم','🔥 كيف أحرق أكثر؟','📊 قيّم تقدمي']).map(q=>
            '<button onclick="coachAsk(\''+q+'\')" style="padding:5px 10px;border-radius:16px;background:rgba(212,168,67,.08);border:1px solid rgba(212,168,67,.2);color:var(--gold);font-size:11px;cursor:pointer;font-family:\'Cairo\',sans-serif;">'+q+'</button>'
          ).join('')}
        </div>` : ''}
      ${hasTyping ? `<div style="display:flex;gap:8px;align-items:center;">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
        <div style="background:var(--card);border-radius:14px;padding:12px 16px;"><span style="display:inline-flex;gap:4px;"><span style="animation:pulse 1s ease-in-out infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .2s infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .4s infinite;opacity:.5">●</span></span></div>
      </div>` : ''}
    </div>
    <div style="text-align:center;font-size:10px;color:var(--dim);padding:3px 12px;opacity:.65;">⚠️ المدرب في مرحلة تجريبية — قد تحدث أخطاء</div>
    <div style="padding:10px 12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px;">
      <!-- يسار (RTL): صوت + صورة -->
      <button id="coach-voice-btn" onclick="toggleVoiceInput()"
        style="width:40px;height:40px;border-radius:12px;background:var(--card);
        border:1.5px solid var(--border);font-size:18px;cursor:pointer;flex-shrink:0;
        display:flex;align-items:center;justify-content:center;transition:all .2s;">🎤</button>
      <label id="coach-img-btn" title="إرسال صورة" style="width:40px;height:40px;border-radius:12px;background:var(--card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;position:relative;">
        📷
        <input type="file" id="coach-img-inp" accept="image/*" style="display:none" onchange="coachImgSelected(this)">
      </label>
      <!-- preview صورة مختارة (يظهر مكان زر الصورة) -->
      <div id="coach-img-preview" style="display:none;position:relative;width:40px;height:40px;flex-shrink:0;">
        <img id="coach-img-thumb" style="width:40px;height:40px;border-radius:10px;object-fit:cover;border:1.5px solid var(--gold);">
        <button onclick="coachClearImg()" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%;background:#ef4444;border:none;color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
      </div>
      <!-- input في الوسط -->
      <input id="coach-inp" placeholder="${window.T('coachPlaceholder')}"
        style="flex:1;min-width:0;padding:11px 12px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;outline:none;"
        onkeydown="if(event.key==='Enter')coachSend()"
        onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
      <!-- يمين (RTL): PDF + إرسال -->
      <label id="coach-pdf-btn" title="رفع PDF" style="width:40px;height:40px;border-radius:12px;background:var(--card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;">
        📄
        <input type="file" id="coach-pdf-inp" accept=".pdf" style="display:none" onchange="coachPdfSelected(this)">
      </label>
      <button id="coach-send-btn" onclick="coachSend()" style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--gd));border:none;font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">↑</button>
    </div>
  </div>`;
  setTimeout(()=>{ const el=document.getElementById('coach-msgs'); if(el) el.scrollTop=el.scrollHeight; }, 120);
}

function clearCoachHistory() { S.coachHistory=[]; saveState(); renderCoach(); }
function coachAsk(q) {
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const container = isModalOpen ? document.getElementById('coach-modal-body') : document.getElementById('tab-coach');
  const i = container ? container.querySelector('#coach-inp') : document.getElementById('coach-inp');
  if (i) { i.value = q; }
  coachSend();
}

// ── صور المدرب ──
let coachPendingImg = null; // { base64, mediaType }

function coachImgSelected(input) {
  const file = input.files[0];
  if (!file) return;
  // حد أقصى 2MB للصور المرسلة للمدرب
  if (file.size > 2 * 1024 * 1024) {
    showMiniToast('⚠️ الصورة كبيرة جداً (الحد 2MB)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const [header, base64] = dataUrl.split(',');
    const mediaType = header.match(/:(.*?);/)[1];
    coachPendingImg = { base64, mediaType };
    const thumbEl   = document.getElementById('coach-img-thumb');
    const previewEl = document.getElementById('coach-img-preview');
    const imgBtnEl  = document.getElementById('coach-img-btn');
    if (thumbEl)   thumbEl.src = dataUrl;
    if (previewEl) previewEl.style.display = 'flex';
    if (imgBtnEl)  imgBtnEl.style.display  = 'none';
    // Focus input
    const inpFocus = document.getElementById('coach-inp');
    if (inpFocus) inpFocus.focus();
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function coachClearImg() {
  coachPendingImg = null;
  const previewEl = document.getElementById('coach-img-preview');
  const imgBtnEl  = document.getElementById('coach-img-btn');
  if (previewEl) previewEl.style.display = 'none';
  if (imgBtnEl)  imgBtnEl.style.display  = 'flex';
}

function coachPdfSelected(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showMiniToast('⚠️ الملف أكبر من 5MB'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    // Send as document type to Groq (treat as text extraction prompt)
    const inp = document.getElementById('coach-inp');
    if (inp) inp.value = `📄 لدي برنامج تدريبي في هذا الـ PDF — طبّقه على تطبيقي`;
    // Store PDF data for next send
    window._coachPendingPdf = { base64, name: file.name };
    showMiniToast('✅ تم تحميل الـ PDF — اضغط إرسال');
    document.getElementById('coach-pdf-btn').style.opacity = '0.5';
  };
  reader.readAsDataURL(file);
}



/* ══ شاشة تسجيل الدخول عند محاولة استخدام المدرب ══ */

/* ══ Toast تسجيل الدخول بعد أول جلسة ══ */
function _showFirstSessionLoginToast() {
  if (window._fbUser) return; // مسجّل بالفعل
  if (document.getElementById('first-session-toast')) return;

  const _lang = currentLang || S.lang || 'ar';
  const _t = (ar, en, fr) => _lang==='en' ? en : _lang==='fr' ? fr : ar;

  const toast = document.createElement('div');
  toast.id = 'first-session-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:90px', 'left:50%',
    'transform:translateX(-50%)',
    'z-index:99994', 'background:var(--card)',
    'border:1.5px solid rgba(212,168,67,.35)',
    'border-radius:18px', 'padding:16px 18px',
    'display:flex', 'flex-direction:column', 'gap:10px',
    'box-shadow:0 8px 32px rgba(0,0,0,.5)',
    'max-width:320px', 'width:calc(100% - 32px)',
    'animation:slideUp .4s cubic-bezier(.34,1.56,.64,1)',
  ].join(';');

  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:28px;">🎉</span>
      <div>
        <div style="font-size:14px;font-weight:900;color:var(--txt);">
          ${_t('أكملت أول تمرين!','First workout done!','Premier entraînement terminé!')}
        </div>
        <div style="font-size:12px;color:var(--dim);margin-top:2px;line-height:1.5;">
          ${_t(
            'سجّل دخولك حتى لا يضيع تقدمك إذا غيّرت هاتفك',
            'Sign in so your progress is never lost',
            'Connecte-toi pour ne jamais perdre ta progression'
          )}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="_coachLoginWithGoogle();document.getElementById('first-session-toast')?.remove()"
        style="flex:2;padding:10px;border-radius:12px;
        background:rgba(66,133,244,.15);border:1.5px solid rgba(66,133,244,.4);
        color:#4285f4;font-family:'Cairo',sans-serif;font-size:13px;font-weight:800;cursor:pointer;
        display:flex;align-items:center;justify-content:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        </svg>
        ${_t('تسجيل الدخول','Sign in','Connexion')}
      </button>
      <button onclick="document.getElementById('first-session-toast')?.remove()"
        style="flex:1;padding:10px;border-radius:12px;
        background:transparent;border:1px solid var(--border);
        color:var(--dim);font-family:'Cairo',sans-serif;font-size:12px;cursor:pointer;">
        ${_t('لاحقاً','Later','Plus tard')}
      </button>
    </div>`;

  document.body.appendChild(toast);
  // يختفي تلقائياً بعد 8 ثواني
  setTimeout(() => toast.remove(), 8000);
}
window._showFirstSessionLoginToast = _showFirstSessionLoginToast;

function _showCoachLoginPrompt(pendingMsg) {
  // احفظ الرسالة المعلقة
  window._coachPendingMsg = pendingMsg;

  // هل يوجد modal بالفعل؟
  if (document.getElementById('coach-login-modal')) return;

  const _lang = currentLang || S.lang || 'ar';
  const _t = (ar, en, fr) => _lang==='en' ? en : _lang==='fr' ? fr : ar;

  const modal = document.createElement('div');
  modal.id = 'coach-login-modal';
  modal.style.cssText = [
    'position:fixed','inset:0','z-index:99995',
    'background:rgba(0,0,0,.75)',
    'display:flex','align-items:flex-end','justify-content:center',
    'animation:fadeIn .2s ease',
  ].join(';');

  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:24px 24px 0 0;
      width:100%;max-width:520px;padding:28px 24px 40px;
      border-top:2px solid rgba(212,168,67,.2);
      animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);">

      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:44px;margin-bottom:10px;">🤖</div>
        <div style="font-size:18px;font-weight:900;color:var(--txt);margin-bottom:6px;">
          ${_t('المدرب الذكي','AI Coach','Coach IA')}
        </div>
        <div style="font-size:13px;color:var(--dim);line-height:1.6;">
          ${_t(
            'سجّل دخولك لتفعيل المدرب الذكي والحصول على توجيه شخصي',
            'Sign in to activate the AI coach and get personalized guidance',
            'Connecte-toi pour activer le coach IA'
          )}
        </div>
      </div>

      <button onclick="_coachLoginWithGoogle()"
        style="width:100%;padding:16px;border-radius:16px;
        background:rgba(66,133,244,.12);border:2px solid rgba(66,133,244,.4);
        color:#4285f4;font-family:'Cairo',sans-serif;font-size:15px;font-weight:800;
        cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;
        margin-bottom:10px;">
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        </svg>
        ${_t('تسجيل الدخول بـ Google','Sign in with Google','Continuer avec Google')}
      </button>

      <button onclick="document.getElementById('coach-login-modal').remove()"
        style="width:100%;padding:12px;border-radius:14px;
        background:transparent;border:1px solid var(--border);
        color:var(--dim);font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;">
        ${_t('لاحقاً','Later','Plus tard')}
      </button>
    </div>`;

  document.body.appendChild(modal);
  // إغلاق عند النقر خارج
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

function _coachLoginWithGoogle() {
  document.getElementById('coach-login-modal')?.remove();
  // بعد تسجيل الدخول — أرسل الرسالة المعلقة تلقائياً
  window._obLoginMode = false; // ليس من onboarding
  window._afterLoginSendCoach = true;
  if (typeof obFirebaseGoogleSignIn === 'function') {
    obFirebaseGoogleSignIn();
  }
}


/* ══════════════════════════════════════════
   VOICE INPUT — إدخال صوتي للمدرب
   Web Speech API — يعمل على Chrome/Android
══════════════════════════════════════════ */
let _voiceRecognition = null;
let _voiceActive = false;

function toggleVoiceInput() {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    showMiniToast('⚠️ متصفحك لا يدعم الإدخال الصوتي');
    return;
  }

  if (_voiceActive) {
    _stopVoice();
    return;
  }

  // طلب إذن الميكروفون صراحةً قبل بدء التسجيل
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // أوقف الـ stream فوراً — SpeechRecognition يفتح الخاص به
        stream.getTracks().forEach(t => t.stop());
        _startVoice();
      })
      .catch(err => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showMiniToast('⚠️ يجب السماح بالميكروفون من إعدادات المتصفح');
        } else {
          showMiniToast('⚠️ لا يمكن الوصول للميكروفون: ' + err.message);
        }
      });
  } else {
    // متصفح قديم — جرّب مباشرة
    _startVoice();
  }
}

function _startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  _voiceRecognition = new SR();

  const lang = currentLang || S.lang || 'ar';
  _voiceRecognition.lang = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
  _voiceRecognition.continuous = false;
  _voiceRecognition.interimResults = true;
  _voiceRecognition.maxAlternatives = 1;

  _voiceActive = true;
  _updateVoiceBtn(true);
  showMiniToast('🎤 يسمع...');

  _voiceRecognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript).join('');
    const inp = document.getElementById('coach-inp');
    if (inp) inp.value = transcript;
    // إذا انتهى الكلام — أرسل تلقائياً
    if (e.results[e.results.length - 1].isFinal) {
      setTimeout(() => {
        if (typeof coachSend === 'function') coachSend();
      }, 300);
    }
  };

  _voiceRecognition.onerror = (e) => {
    _voiceActive = false;
    _updateVoiceBtn(false);
    if (e.error !== 'no-speech') showMiniToast('⚠️ ' + e.error);
  };

  _voiceRecognition.onend = () => {
    _voiceActive = false;
    _updateVoiceBtn(false);
    // إرسال تلقائي إذا كان هناك نص
    const inp = document.getElementById('coach-inp');
    if (inp && inp.value.trim()) {
      setTimeout(() => coachSend(), 300);
    }
  };

  _voiceRecognition.start();
}

function _stopVoice() {
  if (_voiceRecognition) {
    try { _voiceRecognition.stop(); } catch(e) {}
    _voiceRecognition = null;
  }
  _voiceActive = false;
  _updateVoiceBtn(false);
}

function _updateVoiceBtn(active) {
  const btn = document.getElementById('voice-input-btn');
  if (!btn) return;
  btn.style.background = active
    ? 'rgba(239,68,68,.25)'
    : 'rgba(255,255,255,.06)';
  btn.style.borderColor = active
    ? 'rgba(239,68,68,.6)'
    : 'rgba(255,255,255,.12)';
  btn.textContent = active ? '⏹️' : '🎤';
  btn.title = active ? 'إيقاف' : 'إدخال صوتي';
}

/* ══ تشخيص اتصال المدرب ══ */
async function diagnoseCoach() {
  const _userKey   = (S.apiKey || '').startsWith('gsk_') ? S.apiKey : '';
  const _sharedKey = (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? SHARED_GROQ_KEY : '';
  const key = _userKey || _sharedKey;
  const lines = [];

  lines.push(`🔑 المفتاح: ${_userKey ? 'شخصي (' + _userKey.slice(0,8) + '...)' : _sharedKey ? 'مشترك (' + _sharedKey.slice(0,8) + '...)' : '❌ لا يوجد مفتاح!'}`);
  lines.push(`📡 الاتصال: ${navigator.onLine ? 'متصل ✅' : 'غير متصل ❌'}`);

  if (!key) {
    lines.push('⚠️ الحل: أضف مفتاح Groq من الإعدادات ⚙️');
    showMiniToast(lines.join(' | '));
    return;
  }

  lines.push('⏳ اختبار الاتصال بـ Groq...');
  showMiniToast(lines.join(' | '));

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key }
    });
    if (res.ok) {
      showMiniToast('✅ المفتاح يعمل! المدرب متصل بنجاح.');
    } else {
      const err = await res.json().catch(()=>({}));
      const msg = err.error?.message || 'HTTP ' + res.status;
      showMiniToast('❌ خطأ: ' + msg + ' — جرّب مفتاحاً جديداً من console.groq.com');
    }
  } catch(e) {
    showMiniToast('❌ فشل الاتصال بـ Groq — تحقق من الإنترنت');
  }
}


/* ══ Voice Input للمدرب ══ */

function toggleVoiceInput() {
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    showMiniToast('⚠️ المتصفح لا يدعم التعرف على الصوت');
    return;
  }
  if (_voiceActive) {
    _stopVoice();
    return;
  }
  // طلب إذن الميكروفون صراحةً قبل بدء التسجيل
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        _startVoice();
      })
      .catch(err => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showMiniToast('⚠️ يجب السماح بالميكروفون من إعدادات المتصفح');
        } else {
          showMiniToast('⚠️ لا يمكن الوصول للميكروفون: ' + err.message);
        }
      });
  } else {
    _startVoice();
  }
}

function _startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  _voiceRecognition = new SR();
  _voiceRecognition.lang = (currentLang === 'en') ? 'en-US' : (currentLang === 'fr') ? 'fr-FR' : 'ar-DZ';
  _voiceRecognition.continuous = false;
  _voiceRecognition.interimResults = true;

  _voiceRecognition.onstart = () => {
    _voiceActive = true;
    const btn = document.getElementById('coach-voice-btn');
    if (btn) {
      btn.textContent = '🔴';
      btn.style.background = 'rgba(239,68,68,.15)';
      btn.style.borderColor = 'rgba(239,68,68,.5)';
      btn.style.animation = 'timerUrgent .8s ease-in-out infinite';
    }
    showMiniToast('🎤 ' + (currentLang==='en'?'Listening...':currentLang==='fr'?'Écoute...':'أتسمع...'));
  };

  _voiceRecognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    const inp = document.getElementById('coach-inp');
    if (inp) inp.value = transcript;
  };

  _voiceRecognition.onend = () => {
    _voiceActive = false;
    const btn = document.getElementById('coach-voice-btn');
    if (btn) {
      btn.textContent = '🎤';
      btn.style.background = 'var(--card)';
      btn.style.borderColor = 'var(--border)';
      btn.style.animation = '';
    }
    // إرسال تلقائي إذا كان هناك نص
    const inp = document.getElementById('coach-inp');
    if (inp && inp.value.trim()) {
      setTimeout(() => coachSend(), 300);
    }
  };

  _voiceRecognition.onerror = (e) => {
    _voiceActive = false;
    const btn = document.getElementById('coach-voice-btn');
    if (btn) { btn.textContent = '🎤'; btn.style.background = 'var(--card)'; btn.style.animation = ''; }
    if (e.error !== 'no-speech') {
      showMiniToast('⚠️ ' + (currentLang==='en'?'Voice error':'خطأ في الصوت') + ': ' + e.error);
    }
  };

  _voiceRecognition.start();
}

function _stopVoice() {
  if (_voiceRecognition) { _voiceRecognition.stop(); _voiceRecognition = null; }
  _voiceActive = false;
}

async function coachSend() {
  // ── Find active input (modal desktop or tab mobile) ──
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const container = isModalOpen
    ? document.getElementById('coach-modal-body')
    : document.getElementById('tab-coach');
  const inp = container ? container.querySelector('#coach-inp') : document.getElementById('coach-inp');
  const msg = inp?.value?.trim();
  const hasImg = !!coachPendingImg;
  const hasPdf = !!window._coachPendingPdf;
  if (!msg && !hasImg && !hasPdf) return;

  // ── تحقق من تسجيل الدخول ──
  // المدرب الذكي يتطلب حساباً
  const _hasAccount = !!(window._fbUser);
  const _hasPersonalKey = (S.apiKey || '').startsWith('gsk_');
  if (!_hasAccount && !_hasPersonalKey) {
    // أظهر رسالة تسجيل الدخول بدل إرسال الرسالة
    _showCoachLoginPrompt(msg || '');
    if (inp) inp.value = msg || ''; // أعد النص للمستخدم
    return;
  }

  if (inp) inp.value = '';
  if (!S.coachHistory) S.coachHistory = [];

  // ── Build user content ──
  const userText = msg || (hasImg ? '📷' : hasPdf ? '📄' : '');
  let userContent;
  if (hasImg) {
    userContent = [
      { type:'image_url', image_url:{ url:`data:${coachPendingImg.mediaType};base64,${coachPendingImg.base64}` } },
      { type:'text', text: msg || 'حلل هذه الصورة' }
    ];
  } else if (hasPdf) {
    userContent = [{ type:'text', text: (msg || 'طبّق هذا البرنامج') + `\n\n[PDF: ${window._coachPendingPdf.name}]` }];
    window._coachPendingPdf = null;
    const pdfBtn = document.getElementById('coach-pdf-btn');
    if (pdfBtn) pdfBtn.style.opacity = '1';
  } else {
    userContent = userText;
  }
  if (coachPendingImg) { coachPendingImg = null; }

  S.coachHistory.push({role:'user', content: userContent});
  if (S.coachHistory.length > 40) S.coachHistory = S.coachHistory.slice(-40);
  saveState(); renderCoach();

  // Lock input
  const freshInp = document.getElementById('coach-inp');
  const freshBtn = document.getElementById('coach-send-btn');
  if (freshInp) freshInp.disabled = true;
  if (freshBtn) { freshBtn.textContent = '⏳'; freshBtn.disabled = true; }
  setTimeout(()=>{ const m=document.getElementById('coach-msgs'); if(m) m.scrollTop=m.scrollHeight; }, 80);

  // استخدم S.apiKey فقط إذا كان صحيحاً (يبدأ بـ gsk_)
  const _userKey   = (S.apiKey || '').startsWith('gsk_') ? S.apiKey : '';
  const _sharedKey = (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? SHARED_GROQ_KEY : '';
  const apiKey = _userKey || _sharedKey;

  // ── Offline: local engine ──
  if (!apiKey) {
    if (hasPdf) {
      S.coachHistory.push({role:'assistant', content:'⚠️ رفع PDF يتطلب مفتاح Groq — أضف مفتاحك من الإعدادات ⚙️'});
    } else {
      const localReply = localCoachReply(msg || '', S);
      S.coachHistory.push({role:'assistant', content: localReply});
    }
    saveState(); renderCoach();
    const _i = document.getElementById('coach-inp'); if (_i) _i.disabled = false;
    const _b = document.getElementById('coach-send-btn'); if (_b) { _b.textContent = '↑'; _b.disabled = false; }
    setTimeout(()=>{ const m=document.getElementById('coach-msgs'); if(m) m.scrollTop=m.scrollHeight; }, 100);
    return;
  }

  // ── Intent Detection ──
  const intent = detectIntent(msg, hasImg, hasPdf);
  const cfg = INTENT_CONFIG[intent] || INTENT_CONFIG.CHAT;
  const u = S.user || {};

  // ── Build dynamic system prompt ──
  const sys = buildSystemPrompt(intent, u, S);

  // ── Trim history based on intent ──
  const historyToSend = S.coachHistory.slice(-(cfg.historyLen)).map(m => {
    if (Array.isArray(m.content)) {
      // Keep last image in context
      const lastMediaIdx = S.coachHistory.reduce((last, mm, i) =>
        Array.isArray(mm.content) && mm.content.find(p=>p.type==='image_url') ? i : last, -1);
      const idx = S.coachHistory.indexOf(m);
      if (idx === lastMediaIdx) return {role:m.role, content:m.content};
      const t = m.content.find(p=>p.type==='text');
      return {role:m.role, content: t?.text || '📷'};
    }
    return {role:m.role, content:m.content};
  });

  // ── Streaming fetch ──
  let reply = '';
  let streamMsgId = null;

  function getStreamEl() {
    if (streamMsgId) return document.getElementById(streamMsgId);
    return null;
  }

  function insertStreamBubble() {
    const msgs = document.getElementById('coach-msgs');
    if (!msgs) return;
    streamMsgId = 'stream-' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = streamMsgId;
    bubble.style.cssText = 'display:flex;gap:8px;align-items:flex-end;';
    bubble.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
      <div id="${streamMsgId}-text" style="max-width:82%;border-radius:18px 18px 18px 4px;background:var(--card);border:1px solid var(--border);padding:10px 14px;font-size:13px;line-height:1.8;color:var(--txt);white-space:pre-wrap;min-width:40px;">
        <span style="display:inline-flex;gap:4px;"><span style="animation:pulse 1s ease-in-out infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .2s infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .4s infinite;opacity:.5">●</span></span>
      </div>`;
    msgs.appendChild(bubble);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function updateStreamBubble(text) {
    const el = document.getElementById(streamMsgId + '-text');
    if (!el) return;
    // Apply markdown formatting
    const safe = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const formatted = safe
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/^• /gm,'<span style="color:var(--gold);">•</span> ');
    el.innerHTML = formatted;
    const msgs = document.getElementById('coach-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  insertStreamBubble();

  try {
    const timeoutMs = cfg.model.includes('8b') ? 10000 : 25000;
    const _ctrl = new AbortController();
    const _timeout = setTimeout(() => _ctrl.abort(), timeoutMs);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      signal: _ctrl.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.max_tokens,
        temperature: cfg.temperature,
        stream: true,
        messages: [
          {role:'system', content: sys},
          ...historyToSend
        ]
      })
    });

    clearTimeout(_timeout);

    if (!res.ok) {
      const errData = await res.json().catch(()=>({error:{message:'HTTP '+res.status}}));
      throw new Error(errData.error?.message || 'HTTP ' + res.status);
    }

    // ── Read stream ──
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {stream: true});
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            reply += delta;
            updateStreamBubble(reply);
          }
        } catch(e) {}
      }
    }

    // ── Remove stream bubble — will be re-rendered by renderCoach ──
    const streamBubble = document.getElementById(streamMsgId);
    if (streamBubble) streamBubble.remove();

    // ── Execute FITCMD blocks ──
    const cmdRegex = /```FITCMD\s*([\s\S]*?)```/g;
    let cmdMatch;
    while ((cmdMatch = cmdRegex.exec(reply)) !== null) {
      try {
        const cmd = JSON.parse(cmdMatch[1].trim());
        coachExecCmd(cmd);
      } catch(e) {}
    }
    reply = reply.replace(/```FITCMD[\s\S]*?```/g, '').trim();

    // ── New exercise notification ──
    if (window._coachNewExId) {
      reply += '\n\n📷 **ملاحظة:** تمرين **' + window._coachNewExName + '** أُضيف بنجاح. يمكنك إضافة صورة له يدوياً من مكتبة التمارين.';
      window._coachNewExId = null;
      window._coachNewExName = null;
    }

  } catch(e) {
    // Remove stream bubble on error
    const streamBubble = document.getElementById(streamMsgId);
    if (streamBubble) streamBubble.remove();

    if (e.name === 'AbortError') {
      // Timeout — fallback to local silently for fast models
      if (cfg.model.includes('8b')) {
        reply = localCoachReply(msg || '', S);
      } else {
        reply = '⚠️ انتهت مهلة الاتصال. تحقق من الإنترنت وحاول مجدداً.';
      }
    } else {
      const _eMsg = e.message || '';
      if (_eMsg.toLowerCase().includes('invalid api key') || _eMsg.includes('401') || _eMsg.includes('invalid_api_key')) {
        // مفتاح منتهي أو غير صالح — امسحه وأخبر المستخدم بوضوح
        S.apiKey = '';
        saveState();
        reply = '🔑 انتهت صلاحية مفتاح Groq أو أنه غير صالح.\n\n**الحل:**\n1. افتح الإعدادات ⚙️\n2. احصل على مفتاح جديد مجاناً من [console.groq.com](https://console.groq.com)\n3. الصق المفتاح واضغط "حفظ"\n\nسأعمل بالوضع المحلي حتى إضافة مفتاح جديد 🤖';
      } else {
        reply = '⚠️ ' + (_eMsg || 'تحقق من مفتاح Groq والإنترنت.');
      }
    }
  }

  // ── تنظيف الرد من بلوك SUGGESTIONS قبل العرض ──
  reply = _cleanReplyFromSuggestions(reply);

  // ── Save and render final reply ──
  S.coachHistory.push({role:'assistant', content: reply});

  // Strip images from history to save localStorage
  if (!window._coachImgCache) window._coachImgCache = [];
  S.coachHistory.forEach((m,idx) => {
    if (Array.isArray(m.content)) {
      const img = m.content.find(p => p.type === 'image_url');
      const txt = m.content.find(p => p.type === 'text');
      if (img) window._coachImgCache.push({ idx, img, txt: txt?.text || '' });
    }
  });
  if (window._coachImgCache.length > 3) window._coachImgCache = window._coachImgCache.slice(-3);
  S.coachHistory = S.coachHistory.map(m => {
    if (Array.isArray(m.content)) {
      const txt = m.content.find(p => p.type === 'text');
      return { role: m.role, content: txt ? txt.text : '📷 [صورة]' };
    }
    return m;
  });
  if (S.coachHistory.length > 40) S.coachHistory = S.coachHistory.slice(-40);

  saveState();
  renderCoach();

  // Re-enable input
  const inpEl = document.getElementById('coach-inp');
  if (inpEl) inpEl.disabled = false;
  const sBtn = document.getElementById('coach-send-btn');
  if (sBtn) { sBtn.textContent = '↑'; sBtn.disabled = false; }
  if (coachPendingImg) coachClearImg();

  // ── تحديث الذاكرة + استخراج وعود ──
  try {
    updateCoachMemory();
    const lastUserMsg = (S.coachHistory.slice().reverse().find(m=>m.role==='user')?.content) || '';
    const userMsgText = typeof lastUserMsg === 'string' ? lastUserMsg : (lastUserMsg.find?.(p=>p.type==='text')?.text || '');
    extractPromises(userMsgText, reply);
  } catch(e) {}

  // ── استخراج الاقتراحات من رد المدرب ──
  try {
    const extracted = _extractSuggestionsFromReply(reply);
    if (extracted && extracted.length >= 2) {
      window._lastCoachSuggestions = extracted;
    } else {
      // fallback للاقتراحات الثابتة فقط إذا لم يُرسل المدرب اقتراحاته
      window._lastCoachSuggestions = getDynamicSuggestions(intent, reply);
    }
    window._lastCoachIntent = intent;
  } catch(e) {}

  setTimeout(() => {
    const msgs = document.getElementById('coach-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
}
function coachExecCmd(cmd) {
  if (!cmd || !cmd.cmd) return false;
  let changed = false;

  if (cmd.cmd === 'setDay' && cmd.day != null && Array.isArray(cmd.exercises)) {
    if (cmd.exercises.length === 0) return false;
    const _dayNum = Math.max(1, Math.min(Number(cmd.day), (S.user?.programDays||90)));
    const _allExIds = [...EXERCISES, ...(S.customExercises||[])].map(e => e.id);
    const validExs = cmd.exercises.filter(id => typeof id === 'string' && _allExIds.includes(id));
    if (validExs.length === 0) return false;
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[_dayNum] = validExs;
    saveState(); loadCustomSchedule();
    if (S.currentDay === _dayNum) renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setRest' && cmd.day != null) {
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[Number(cmd.day)] = 'rest';
    saveState();
    if (S.currentDay === Number(cmd.day)) renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setWeek' && Array.isArray(cmd.days)) {
    if (cmd.days.length === 0) return false;
    const _allExIds2 = [...EXERCISES, ...(S.customExercises||[])].map(e => e.id);
    let weekChanged = false;
    if (!S.customSchedule) S.customSchedule = {};
    cmd.days.forEach((v, i) => {
      const dayNum = i + 1;
      if (v === 'rest') {
        // يوم راحة صريح — فقط عند 'rest' النصية
        S.customSchedule[dayNum] = 'rest';
        weekChanged = true;
      } else if (v === null || v === undefined) {
        // null = لا تغيير لهذا اليوم — نتجاهله
      } else if (Array.isArray(v) && v.length > 0) {
        // مصفوفة تمارين — تحقق ان IDs صحيحة
        const validIds = v.filter(id => typeof id === 'string' && _allExIds2.includes(id));
        if (validIds.length > 0) {
          S.customSchedule[dayNum] = validIds;
          weekChanged = true;
        }
      }
      // اذا كانت القيمة undefined او مصفوفة فارغة نتجاهلها ولا نكتب فوق
    });
    if (!weekChanged) return false;
    saveState(); loadCustomSchedule(); renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setTheme' && cmd.theme) {
    const valid = ['default','fire','ocean','nature','neon','purple','light'];
    setTheme(valid.includes(cmd.theme) ? cmd.theme : 'default');
    changed = true;
  }
  if (cmd.cmd === 'setMode' && cmd.mode) {
    const map = {mobile:'mobile',جوال:'mobile',desktop:'desktop',كمبيوتر:'desktop'};
    S.mode = map[cmd.mode] || 'mobile';
    saveState(); applyMode();
    changed = true;
  }
  if (cmd.cmd === 'setSetting') {
    if (!S.user) S.user = {};
    if (cmd.setting === 'sound') { S.soundOn = !!cmd.value; saveState(); }
    if (cmd.setting === 'tick')  { S.tickOn  = !!cmd.value; saveState(); }
    if (cmd.setting === 'goal' && cmd.value)  { S.user.goal = cmd.value; saveState(); }
    if (cmd.setting === 'days' && cmd.value)  { S.user.programDays = parseInt(cmd.value); saveState(); }
    if (cmd.setting === 'trainTime' && cmd.value) { S.user.trainTime = cmd.value; saveState(); }
    changed = true;
  }
  if (cmd.cmd === 'setCurrentDay' && cmd.day != null) {
    S.currentDay = Math.max(1, Math.min(parseInt(cmd.day), (S.user && S.user.programDays) || 90));
    saveState(); renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'addCalories' && cmd.amount != null) {
    S.calories = (S.calories || 0) + parseInt(cmd.amount);
    saveState();
    changed = true;
  }

  // ── إنشاء تمرين جديد ──
  if (cmd.cmd === 'addExercise' && cmd.exercise) {
    // تأكد من أن الـ ID فريد
    const _allIds = [...EXERCISES, ...(S.customExercises||[])].map(e=>e.id);
    if (_allIds.includes(cmd.exercise.id)) {
      // ID مكرر — أضف suffix
      cmd.exercise.id = cmd.exercise.id + '_' + Date.now().toString(36).slice(-4);
    }
    const ex = cmd.exercise;
    if (!ex.id || !ex.nameAr) return false;
    if (!S.customExercises) S.customExercises = [];
    // Don't duplicate
    const exists = S.customExercises.find(e => e.id === ex.id);
    if (!exists) {
      const newEx = {
        id:       ex.id,
        nameAr:   ex.nameAr,
        nameEn:   ex.nameEn   || ex.nameAr,
        icon:     ex.icon     || '💪',
        color:    ex.color    || '#f59e0b',
        muscles:  ex.muscles  || '',
        type:     ex.type     || 'reps',
        sets:     parseInt(ex.sets)  || 3,
        reps:     parseInt(ex.reps)  || 10,
        repsLabel:ex.repsLabel || (ex.type === 'timer' ? 'ثانية' : 'تكرار'),
        rest:     parseInt(ex.rest)  || 30,
        steps:    Array.isArray(ex.steps) ? ex.steps : [],
        _coachCreated: true,
      };
      S.customExercises.push(newEx);
      saveState();
      window._coachNewExId = newEx.id;
      window._coachNewExName = newEx.nameAr || newEx.id;
      changed = true;
    }
  }

  // ── حذف تمرين مخصص ──
  if (cmd.cmd === 'deleteExercise' && cmd.exId) {
    if (S.customExercises) {
      S.customExercises = S.customExercises.filter(e => e.id !== cmd.exId);
      // تنظيف customSchedule من ID المحذوف
      if (S.customSchedule) {
        Object.keys(S.customSchedule).forEach(day => {
          if (Array.isArray(S.customSchedule[day])) {
            S.customSchedule[day] = S.customSchedule[day].filter(id => id !== cmd.exId);
            if (S.customSchedule[day].length === 0) S.customSchedule[day] = 'rest';
          }
        });
      }
      saveState(); renderWorkoutTab();
      changed = true;
    }
  }

  // ── إضافة التمرين للجدول اليومي ──
  if (cmd.cmd === 'addExToDay' && cmd.day != null && cmd.exId) {
    if (!S.customSchedule) S.customSchedule = {};
    const dayNum = Math.max(1, Math.min(Number(cmd.day), (S.user?.programDays||90)));
    const _allExCheck = [...EXERCISES, ...(S.customExercises||[])];
    if (!_allExCheck.find(e => e.id === cmd.exId)) return false; // ID غير موجود
    const current = S.customSchedule[dayNum] || getDaySchedule(dayNum).exercises.map(e => e.id);
    if (!current.includes(cmd.exId)) {
      S.customSchedule[dayNum] = [...current, cmd.exId];
      saveState(); loadCustomSchedule();
      if (S.currentDay === dayNum) renderWorkoutTab();
    }
    changed = true;
  }

  if (changed) { try { renderProgress(); } catch(e) {} }
  return changed;
}


/* ══════════════════════════════════════════
   EXERCISE LIBRARY (inside day editor)
══════════════════════════════════════════ */
const LIB_CATEGORY = {
  rope:'cardio', burpee:'cardio', highknee:'cardio', sqjump:'lower',
  starjump:'cardio', climber:'core', boxing:'cardio', plank:'core',
  crunch:'core', legrise:'core', bicycle:'core', russian:'core',
  hollow:'core', pushup:'upper', squat:'lower', chair:'upper',
};
let deLibFilter = 'all';

function deShowLibrary() {
  document.getElementById('de-panel-list').style.display = 'none';
  const lib = document.getElementById('de-panel-library');
  lib.style.display = 'flex';
  // Clear search
  const s = document.getElementById('de-lib-search');
  if (s) s.value = '';
  // Render filter chips
  const cats = [{id:'all',label:'الكل'},{id:'cardio',label:'كارديو'},{id:'core',label:'كور'},{id:'upper',label:'جسم علوي'},{id:'lower',label:'جسم سفلي'},{id:'custom',label:'مخصص'}];
  document.getElementById('de-lib-filters').innerHTML = cats.map((c,i) =>
    `<button data-cat="${c.id}" onclick="deSetFilter(this)" class="lib-chip${i===0?' lib-filter-active':''}" style="padding:6px 14px;border-radius:20px;border:1.5px solid ${i===0?'var(--gold)':'var(--border)'};background:${i===0?'rgba(212,168,67,.15)':'transparent'};color:${i===0?'var(--gold)':'var(--dim)'};font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.2s;">${c.label}</button>`
  ).join('');
  deRenderLibGrid();
}
function deSetFilter(btn) {
  document.querySelectorAll('.lib-chip').forEach(b => {
    b.classList.remove('lib-filter-active');
    b.style.borderColor = 'var(--border)';
    b.style.background = 'transparent';
    b.style.color = 'var(--dim)';
  });
  btn.classList.add('lib-filter-active');
  btn.style.borderColor = 'var(--gold)';
  btn.style.background = 'rgba(212,168,67,.15)';
  btn.style.color = 'var(--gold)';
  deRenderLibGrid();
}

function deHideLibrary() {
  document.getElementById('de-panel-library').style.display = 'none';
  document.getElementById('de-panel-list').style.display = 'flex';
}

function deRenderLibGrid() {
  const grid = document.getElementById('de-lib-grid');
  if (!grid) return;
  const searchEl = document.getElementById('de-lib-search');
  const query = (searchEl?.value || '').trim().toLowerCase();
  const activeFilter = document.querySelector('#de-lib-filters .lib-filter-active')?.dataset?.cat || 'all';
  const catMap = {
    cardio: ['rope','burpee','highknee','sqjump','starjump','climber','boxing'],
    core:   ['plank','crunch','legrise','bicycle','russian','hollow'],
    upper:  ['pushup','boxing','chair'],
    lower:  ['sqjump','squat','legrise','highknee','starjump']
  };
  // Use dayEditorDay (the day being edited), fallback to currentDay
  const editDay = dayEditorDay || S.currentDay || 1;
  const daySchedule = getDaySchedule(editDay);
  const currentExIds = S.customSchedule?.[editDay]
    ? S.customSchedule[editDay]
    : (daySchedule.exercises || []).map(e => typeof e === 'string' ? e : e.id);
  const allEx = [...EXERCISES, ...(S.customExercises || [])];

  const filtered = allEx.filter(ex => {
    if (activeFilter === 'custom') return !!(S.customExercises?.find(e => e.id === ex.id));
    if (activeFilter !== 'all' && !catMap[activeFilter]?.includes(ex.id)) return false;
    if (query) {
      const q = query.toLowerCase();
      return ex.nameAr.includes(q) || (ex.nameEn||'').toLowerCase().includes(q) || (ex.muscles||'').includes(q);
    }
    return true;
  });
  if (!filtered.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">لا توجد نتائج</div>';
    return;
  }

  // Grid layout: 2 columns
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';
  grid.style.padding = '8px 16px 80px';
  // ✅ force square cells on Android WebView
  requestAnimationFrame(() => {
    const gw = grid.offsetWidth || (window.innerWidth - 32);
    const cellW = Math.floor((gw - 42) / 2);
    if (cellW > 0) grid.style.gridAutoRows = cellW + 'px';
  });

  grid.innerHTML = filtered.map(ex => {
    const inDay = currentExIds.includes(ex.id);
    const isCustom = !!S.customExercises?.find(e=>e.id===ex.id);
    const customImg = S.customImages?.[ex.id];
    const gifSrc = getExGif(ex.id);
    const hasSrc = !!(customImg || gifSrc);
    const imgSrc = customImg || gifSrc || '';
    const borderColor = inDay ? 'var(--gold)' : 'var(--border)';
    const bgTint = ex.color ? ex.color + '22' : 'rgba(212,168,67,.1)';
    const iconFallback = `<div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:44px;">${ex.icon}</div>`;
    const mediaHTML = hasSrc
      ? `<img src="${imgSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">${iconFallback}`
      : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;">${ex.icon}</div>`;
    const checkmark = inDay ? `<div style="position:absolute;top:7px;left:7px;width:24px;height:24px;border-radius:50%;background:var(--gold);color:var(--night);font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2);">✓</div>` : '';
    const badge = isCustom ? `<div style="position:absolute;top:7px;right:7px;font-size:9px;padding:2px 7px;border-radius:6px;background:rgba(99,102,241,.9);color:#fff;font-weight:700;">مخصص</div>` : '';
    const statusBtn = `<div style="margin-top:6px;font-size:11px;font-weight:800;padding:3px 8px;border-radius:7px;display:inline-block;background:${inDay ? 'rgba(212,168,67,.15)' : 'rgba(128,128,128,.1)'};color:${inDay ? 'var(--gold)' : 'var(--dim)'};">${inDay ? '✓ مضاف' : '+ أضف'}</div>`;
    return `<div onclick="deLibAddEx('${ex.id}')" style="border-radius:16px;background:var(--card);border:2px solid ${borderColor};overflow:hidden;cursor:pointer;position:relative;aspect-ratio:1/1;">`
      + `<div style="position:absolute;inset:0;background:${bgTint};overflow:hidden;">`
      + mediaHTML + checkmark + badge
      + `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 100%);">`
      + `<div style="font-size:11px;font-weight:900;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escHtml(ex.nameAr)}</div>`
      + `<div style="font-size:9px;color:${inDay ? 'var(--gold)' : 'rgba(255,255,255,.6)'};margin-top:2px;font-weight:700;">${inDay ? '✓ مضاف' : '+ أضف'}</div>`
      + `</div>`
      + `</div></div>`;
  }).join('');
}

function deLibSearch() { deRenderLibGrid(); }


function deLibAddEx(exId) {
  const dayKey = (typeof dayEditorDay !== 'undefined' && dayEditorDay !== null) ? dayEditorDay : S.currentDay || 1;
  // إذا كان اليوم راحة — تحويله لتدريب أولاً
  if (S.customSchedule && S.customSchedule[dayKey] === 'rest') {
    S.customSchedule[dayKey] = [];
  }
  const list = getDayExerciseList(dayKey);
  if (!list.includes(exId)) {
    list.push(exId);
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[dayKey] = list;
    saveState();
    showMiniToast('تمت الإضافة ✅');
  } else {
    // Toggle off if already added
    const idx = list.indexOf(exId);
    list.splice(idx, 1);
    S.customSchedule[dayKey] = list;
    saveState();
    showMiniToast('تم الحذف 🗑️');
  }
  deRenderLibGrid();
  renderDayEditorList();
}

/* ── إضافة تمرين مخصص ── */
function openAddCustomEx() { document.getElementById('add-custom-ex-modal').style.display='flex'; }
function closeAddCustomEx() { document.getElementById('add-custom-ex-modal').style.display='none'; }

function saveCustomEx() {
  const nameAr = document.getElementById('cex-nameAr').value.trim();
  if (!nameAr) { document.getElementById('cex-nameAr').focus(); return; }
  const id = 'custom_' + Date.now();
  const ex = {
    id, isCustom:true, icon: document.getElementById('cex-icon').value.trim()||'💪',
    nameAr, nameEn: document.getElementById('cex-nameEn').value.trim()||nameAr,
    muscles: document.getElementById('cex-muscles').value.trim()||'عام',
    sets: parseInt(document.getElementById('cex-sets').value)||3,
    reps: parseInt(document.getElementById('cex-reps').value)||10,
    type: document.getElementById('cex-type').value,
    rest: parseInt(document.getElementById('cex-rest')?.value)||30,
    color:'#a855f7',
    repsLabel: {reps:'تكرار',timer:'ث',distance:'م'}[document.getElementById('cex-type').value]||'تكرار',
    steps: (document.getElementById('cex-steps').value.trim()||'').split('\n').filter(Boolean),
  };
  const imgData = document.getElementById('cex-img-preview').dataset.src;
  if (!S.customExercises) S.customExercises=[];
  S.customExercises.push(ex);
  if (imgData) { if(!S.customImages)S.customImages={}; S.customImages[id]=imgData; }
  saveState();
  // Reset form
  ['cex-nameAr','cex-nameEn','cex-icon','cex-muscles','cex-steps'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  ['cex-sets','cex-reps'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = id==='cex-sets'?'3':'10';
  });
  const p = document.getElementById('cex-img-preview');
  if (p) { p.style.backgroundImage=''; p.dataset.src=''; p.textContent='📷'; }
  closeAddCustomEx();
  if (typeof deRenderLibGrid === 'function') deRenderLibGrid();
  showMiniToast('تمت إضافة التمرين ✅');
}

function cexImgUpload(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 500 * 1024) {
    showMiniToast('⚠️ الصورة كبيرة جداً (الحد 500KB)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('cex-img-preview');
    // ✅ ضغط الصورة قبل الحفظ لتجنب تجاوز حد localStorage
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      p.style.backgroundImage = `url(${compressed})`;
      p.style.backgroundSize = 'cover';
      p.style.backgroundPosition = 'center';
      p.dataset.src = compressed;
      p.textContent = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ══════ DAY EDITOR ══════ */
let dayEditorDay = null;
let dayEditorDragSrc = null;

function openDayEditor(day) {
  dayEditorDay = day;
  const sched = getDaySchedule(day);
  document.getElementById('day-editor-label').textContent = `(${sched.day})`;
  renderDayEditorList();
  document.getElementById('day-editor-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';
}

function closeDayEditor() {
  document.getElementById('day-editor-modal').style.display = 'none';
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
  render();
  // Also refresh desktop/TV panels
  if (typeof dtRenderExList === 'function') dtRenderExList();
  
}

function getDayExerciseList(day) {
  // Returns the mutable list of exercise IDs for a day (custom or default)
  if (!S.customSchedule) S.customSchedule = {};
  const sched = getDaySchedule(day);
  if (!S.customSchedule[day]) {
    S.customSchedule[day] = [...sched.exercises.map(e => e.id)];
  }
  return S.customSchedule[day];
}

function renderDayEditorList() {
  const list = document.getElementById('day-editor-list');
  const exIds = getDayExerciseList(dayEditorDay);
  const allEx = [...EXERCISES, ...(S.customExercises||[])];

  list.innerHTML = exIds.map((id, i) => {
    const ex = allEx.find(e => e.id === id);
    if (!ex) return '';
    const gifSrc = getExGif(id);
    const thumb = gifSrc
      ? `<img src="${gifSrc}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;">`
      : `<div style="width:44px;height:44px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${ex.icon}</div>`;
    return `<div class="de-row" data-idx="${i}" data-id="${id}"
        ondragover="deDragOver(event)"
        ondrop="deDrop(event,${i})"
        ondragend="deDragEnd()"
        style="display:flex;align-items:center;gap:10px;background:var(--card);border:1.5px solid rgba(212,168,67,.12);border-radius:14px;padding:10px 12px;transition:opacity .25s,transform .2s,box-shadow .2s;">
      <div class="de-handle" data-idx="${i}" onpointerdown="deHandleDown(event,${i})" style="color:var(--gold);font-size:22px;cursor:grab;padding:4px 6px;touch-action:none;user-select:none;flex-shrink:0;border-radius:8px;background:rgba(212,168,67,.08);transition:background .15s;" onmouseenter="this.style.background='rgba(212,168,67,.18)'" onmouseleave="this.style.background='rgba(212,168,67,.08)'">☰</div>
      ${thumb}
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escHtml(ex.nameAr)}</div>
        <div style="font-size:11px;color:var(--dim);">${ex.sets}×${ex.reps} ${getRepsLabel(ex)} • ${_escHtml(ex.muscles)}</div>
      </div>
      <button onclick="dayEditorEditEx('${id}')" style="background:rgba(212,168,67,.12);border:1px solid rgba(212,168,67,.25);color:var(--gold);border-radius:8px;padding:6px 10px;font-size:14px;cursor:pointer;">✏️</button>
      <button onclick="dayEditorDeleteEx(${i})" style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.25);color:#e74c3c;border-radius:8px;padding:6px 10px;font-size:14px;cursor:pointer;">🗑️</button>
    </div>`;
  }).join('');
}


function dayEditorDeleteEx(idx) {
  const exIds = getDayExerciseList(dayEditorDay);
  exIds.splice(idx, 1);
  if (exIds.length === 0) {
    // آخر تمرين — تحويل اليوم لراحة تلقائياً
    S.customSchedule[dayEditorDay] = 'rest';
    saveState();
    closeDayEditor();
    showMiniToast('😴 تم تحويل اليوم لراحة');
    return;
  }
  saveState();
  renderDayEditorList();
}

function dayEditorAddEx(id) {
  // إذا كان اليوم راحة — تحويله لتدريب أولاً
  if (S.customSchedule && S.customSchedule[dayEditorDay] === 'rest') {
    S.customSchedule[dayEditorDay] = [];
  }
  const exIds = getDayExerciseList(dayEditorDay);
  if (!exIds.includes(id)) { exIds.push(id); saveState(); }
  renderDayEditorList();
}

function dayEditorEditEx(id) {
  closeDayEditor();
  openExEditor(id, dayEditorDay);
}

// ══════ Drag & Drop reorder ══════
function deDragOver(e) { e.preventDefault(); }
function deDragEnd() {}
function deDrop(e, targetIdx) { e.preventDefault(); }

function deHandleDown(e, srcIdx) {
  e.preventDefault();
  e.stopPropagation();

  const handle = e.currentTarget;
  const row    = handle.closest('.de-row');
  const list   = document.getElementById('day-editor-list');
  if (!row || !list) return;

  // ── Pointer capture: يضمن تتبع الإصبع حتى خارج العنصر ──
  handle.setPointerCapture(e.pointerId);
  handle.style.cursor = 'grabbing';

  const rowRect = row.getBoundingClientRect();
  const startY  = e.clientY;

  // ── Ghost ──
  const ghost = row.cloneNode(true);
  ghost.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:9999',
    'border-radius:14px',
    'background:var(--card)',
    'border:2px solid var(--gold)',
    'box-shadow:0 16px 40px rgba(0,0,0,.4),0 2px 8px rgba(212,168,67,.35)',
    'transform:scale(1.03) rotate(-0.8deg)',
    'opacity:0.95',
    'transition:none',
    'left:' + rowRect.left + 'px',
    'top:'  + rowRect.top  + 'px',
    'width:' + rowRect.width + 'px',
    'height:' + rowRect.height + 'px',
    'margin:0',
  ].join(';');
  document.body.appendChild(ghost);

  // ── Fade original ──
  row.style.opacity = '0.3';

  // ── Drop indicator ──
  const indicator = document.createElement('div');
  indicator.style.cssText = 'position:absolute;left:8px;right:8px;height:3px;border-radius:2px;pointer-events:none;z-index:200;display:none;background:linear-gradient(90deg,transparent,var(--gold),transparent);box-shadow:0 0 8px rgba(212,168,67,.5);';
  list.style.position = 'relative';
  list.appendChild(indicator);

  let dropIdx = srcIdx;

  function getRows() { return [...list.querySelectorAll('.de-row')]; }

  function onMove(ev) {
    ev.preventDefault();
    const y = ev.clientY;
    const dy = y - startY;

    // تحريك الـ ghost
    ghost.style.top = (rowRect.top + dy) + 'px';

    // تحديد موضع الإسقاط
    const rows = getRows();
    let newDrop = srcIdx;
    for (let i = 0; i < rows.length; i++) {
      if (i === srcIdx) continue;
      const r = rows[i].getBoundingClientRect();
      if (y > r.top + r.height * 0.5) newDrop = i;
    }
    dropIdx = newDrop;

    // تحريك الصفوف بصرياً
    rows.forEach((r, i) => {
      r.style.transition = 'transform .15s ease';
      if (i === srcIdx) return;
      if (srcIdx < newDrop && i > srcIdx && i <= newDrop)
        r.style.transform = 'translateY(-' + (rowRect.height + 8) + 'px)';
      else if (srcIdx > newDrop && i >= newDrop && i < srcIdx)
        r.style.transform = 'translateY(' + (rowRect.height + 8) + 'px)';
      else
        r.style.transform = '';
    });

    // خط الإسقاط
    if (newDrop !== srcIdx) {
      const tRow  = rows[newDrop];
      const tRect = tRow.getBoundingClientRect();
      const lRect = list.getBoundingClientRect();
      const lineY = (srcIdx < newDrop ? tRect.bottom : tRect.top) - lRect.top + list.scrollTop;
      indicator.style.top  = (lineY - 1.5) + 'px';
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  }

  function onUp() {
    ghost.remove();
    indicator.remove();
    handle.style.cursor = 'grab';

    getRows().forEach(r => {
      r.style.transition = '';
      r.style.transform  = '';
      r.style.opacity    = '';
    });

    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup',   onUp);
    handle.removeEventListener('pointercancel', onUp);

    if (dropIdx !== srcIdx) {
      const exIds = getDayExerciseList(dayEditorDay);
      const [moved] = exIds.splice(srcIdx, 1);
      exIds.splice(dropIdx, 0, moved);
      saveState();
      renderDayEditorList();
    }
  }

  // الاستماع على handle نفسه (بعد setPointerCapture تصله كل الأحداث)
  handle.addEventListener('pointermove',   onMove, {passive:false});
  handle.addEventListener('pointerup',     onUp);
  handle.addEventListener('pointercancel', onUp);
}

function saveExEditor() {
  const id  = document.getElementById('ex-editor-id').value;
  const day = parseInt(document.getElementById('ex-editor-day').value);
  const updated = {
    id,
    nameAr:    document.getElementById('ex-ed-nameAr').value,
    nameEn:    document.getElementById('ex-ed-nameEn').value,
    icon:      document.getElementById('ex-ed-icon').value || '💪',
    muscles:   document.getElementById('ex-ed-muscles').value,
    sets:      parseInt(document.getElementById('ex-ed-sets').value)  || 3,
    reps:      parseInt(document.getElementById('ex-ed-reps').value)  || 10,
    type:      document.getElementById('ex-ed-type').value,
    rest:      parseInt(document.getElementById('ex-ed-rest').value)  || 30,
    steps:     document.getElementById('ex-ed-steps').value.split('\n').filter(s => s.trim()),
    repsLabel: {reps:'تكرار', timer:'ث', distance:'م'}[document.getElementById('ex-ed-type').value] || 'تكرار'
  };

  const builtInIdx = EXERCISES.findIndex(e => e.id === id);
  const isBuiltIn  = builtInIdx >= 0;

  if (isBuiltIn) {
    // FIX: كان المنطق مقلوباً — التمارين المدمجة تُحدَّث في EXERCISES مباشرةً
    Object.assign(EXERCISES[builtInIdx], updated);
    // نحفظ نسخة في customExercises أيضاً لضمان التزامن مع السحابة
    if (!S.customExercises) S.customExercises = [];
    const ci = S.customExercises.findIndex(e => e.id === id);
    if (ci >= 0) S.customExercises[ci] = updated;
    else S.customExercises.push(updated);
  } else {
    // تمرين مخصص — يُحفظ في S.customExercises فقط
    if (!S.customExercises) S.customExercises = [];
    const ci = S.customExercises.findIndex(e => e.id === id);
    if (ci >= 0) S.customExercises[ci] = updated;
    else S.customExercises.push(updated);
  }

  saveState();
  closeExEditor();
  renderWorkoutTab();
  showMiniToast('✅ تم الحفظ');
}

function deleteExFromDay() {
  const id = document.getElementById('ex-editor-id').value;
  const day = parseInt(document.getElementById('ex-editor-day').value);
  if (!confirm('حذف هذا التمرين من اليوم؟')) return;
  if (!S.customSchedule) S.customSchedule = {};
  // FIX-I: use S.customSchedule directly, not legacy customSchedule
  const sched = S.customSchedule[day] || getDaySchedule(day).exercises.map(e=>e.id);
  S.customSchedule[day] = sched.filter(i=>i!==id);
  customSchedule[day] = S.customSchedule[day]; // keep legacy in sync
  saveState();
  closeExEditor();
  renderWorkoutTab();
  showMiniToast('🗑️ تم الحذف');
}

function addExToDay(exId, day) {
  if (!S.customSchedule) S.customSchedule = {};
  // FIX-I: use S.customSchedule directly
  if (!S.customSchedule[day]) S.customSchedule[day] = getDaySchedule(day).exercises.map(e=>e.id);
  if (!S.customSchedule[day].includes(exId)) {
    S.customSchedule[day].push(exId);
    customSchedule[day] = S.customSchedule[day]; // keep legacy in sync
    saveState();
  }
  closeExEditor();
  renderWorkoutTab();
  showMiniToast('✅ تمت الإضافة');
}

function showNewExForm() {
  document.getElementById('new-ex-form').style.display = 'block';
}

function createAndAddEx() {
  const nameAr = document.getElementById('new-ex-nameAr').value.trim();
  if (!nameAr) { showMiniToast('⚠️ أدخل اسم التمرين'); return; }
  const id = 'custom_' + Date.now();
  const ex = {
    id, nameAr,
    nameEn: document.getElementById('new-ex-nameEn').value || nameAr,
    icon: document.getElementById('new-ex-icon').value || '💪',
    muscles: document.getElementById('new-ex-muscles').value || 'الجسم كله',
    sets: parseInt(document.getElementById('new-ex-sets').value)||3,
    reps: parseInt(document.getElementById('new-ex-reps').value)||10,
    type: document.getElementById('new-ex-type').value,
    steps: [], color: '#D4A843',
    repsLabel: document.getElementById('new-ex-type').value==='timer'?'ث':'تكرار'
  };
  if (!S.customExercises) S.customExercises = [];
  S.customExercises.push(ex);
  EXERCISES.push(ex);
  const day = parseInt(document.getElementById('ex-editor-day').value);
  addExToDay(id, day);
}

// Load custom schedule on init
let customSchedule = {}; // legacy compat
function loadCustomSchedule() {
  if (S.customSchedule) {
    Object.assign(customSchedule, S.customSchedule);
  }
  if (S.customExercises) {
    S.customExercises.forEach(ex => {
      if (!EXERCISES.find(e=>e.id===ex.id)) EXERCISES.push(ex);
      else Object.assign(EXERCISES.find(e=>e.id===ex.id), ex);
    });
  }
}


/* ══════════════════════════════════════════════════════
   TUTORIAL — Spotlight onboarding (game style)
══════════════════════════════════════════════════════ */
function getTutorialSteps() {
  const _lang = (typeof currentLang !== 'undefined' ? currentLang : 'ar') || 'ar';
  const _isEn = _lang === 'en', _isFr = _lang === 'fr';
  const _t = (ar, en, fr) => _isEn ? en : _isFr ? fr : ar;
  return [
    {
      targetId: 'tab-btn-home', pos: 'bottom',
      title: _t('🏠 الصفحة الرئيسية','🏠 Home','🏠 Accueil'),
      desc:  _t(
        'نظرة سريعة على تقدمك — اليوم الحالي، السلسلة، السعرات، ومستواك.',
        'Quick overview of your progress — current day, streak, calories, and level.',
        'Aperçu rapide: jour actuel, série, calories et niveau.'
      )
    },
    {
      targetId: 'tab-btn-workout', pos: 'bottom',
      title: _t('🏋️ تبويب التدريب','🏋️ Workout Tab','🏋️ Entraînement'),
      desc:  _t(
        'برنامجك اليومي. اضغط يوماً لتعديل تمارينه. ابدأ الجلسة الموجهة خطوة بخطوة.',
        'Your daily program. Tap a day to edit exercises. Start a guided session step by step.',
        'Ton programme quotidien. Appuie sur un jour pour modifier. Lance une séance guidée.'
      )
    },
    {
      targetId: 'tab-btn-timer', pos: 'bottom',
      title: _t('⏱️ المؤقت','⏱️ Timer','⏱️ Minuteur'),
      desc:  _t(
        'مؤقت متعدد الأوضاع — تاباتا، EMOM، مؤقت عادي، نط الحبل.',
        'Multi-mode timer — Tabata, EMOM, regular timer, jump rope tracker.',
        'Minuteur multi-modes — Tabata, EMOM, minuteur normal, corde à sauter.'
      )
    },
    {
      targetId: 'tab-btn-progress', pos: 'bottom',
      title: _t('📊 التقدم','📊 Progress','📊 Progrès'),
      desc:  _t(
        'رحلتك كاملة — السعرات، الأيام، الشارات، مخططات الوزن، إحصاء ذكي، وأرقام قياسية.',
        'Your full journey — calories, days, badges, weight charts, smart stats, and personal records.',
        'Ton parcours complet — calories, jours, badges, courbe de poids et records personnels.'
      )
    },
    {
      targetId: 'tab-btn-coach', pos: 'bottom',
      title: _t('🤖 المدرب الذكي','🤖 AI Coach','🤖 Coach IA'),
      desc:  _t(
        'مدربك الشخصي بالذكاء الاصطناعي. يعرف وزنك وهدفك وسجلك. يتذكرك بين الجلسات.',
        'Your personal AI coach. Knows your weight, goal, and history. Remembers you between sessions.',
        'Ton coach IA personnel. Connaît ton poids, objectif et historique. Se souvient de toi.'
      )
    },
    {
      targetId: 'fab-theme', pos: 'left',
      title: _t('🎨 الثيم','🎨 Theme','🎨 Thème'),
      desc:  _t(
        '7 ثيمات مختلفة. أو قل للمدرب "غير الثيم للمحيط"!',
        '7 different themes. Or tell the coach "change theme to ocean"!',
        '7 thèmes différents. Ou dis au coach "change le thème en océan"!'
      )
    },
    {
      targetId: 'mode-hdr-btn', pos: 'bottom',
      title: _t('🖥️ وضع العرض','🖥️ Display Mode','🖥️ Mode d\'affichage'),
      desc:  _t(
        '📱 جوال — واجهة مدمجة\n🖥️ كمبيوتر — لوحة جانبية واسعة',
        '📱 Mobile — compact interface\n🖥️ Desktop — wide side panel',
        '📱 Mobile — interface compacte\n🖥️ Bureau — panneau latéral large'
      )
    },
    {
      targetId: 'settings-fab', fallbackCenter: true, pos: 'center',
      title: _t('⚙️ يمكنك العودة لهذه التعليمات!','⚙️ Return to this tutorial!','⚙️ Revoir ce tutoriel!'),
      desc:  _t(
        'إعدادات ← ❓ إعادة التعليمات\nأو من زر ❓ في تبويب المدرب.',
        'Settings ← ❓ Restart tutorial\nOr from the ❓ button in the Coach tab.',
        'Paramètres ← ❓ Relancer le tutoriel\nOu depuis le bouton ❓ dans l\'onglet Coach.'
      )
    }
  ];
}
const TUTORIAL_STEPS = getTutorialSteps(); // backward compat

let tutStep = 0;
let tutActive = false;

function startTutorial() {
  if (tutActive) return;
  tutActive = true;
  tutStep = 0;
  // إعادة توليد الخطوات بلغة التطبيق الحالية
  window.TUTORIAL_STEPS_CURRENT = getTutorialSteps();
  renderTutStep();
}

function tutNext() {
  tutStep++;
  if (tutStep >= (window.TUTORIAL_STEPS_CURRENT || getTutorialSteps()).length) {
    endTutorial();
  } else {
    renderTutStep();
  }
}

function endTutorial() {
  tutActive = false;
  S.tutorialDone = true;
  saveState();
  const overlay = document.getElementById('tut-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s';
    setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = '1'; }, 400);
  }
}

function renderTutStep() {
  let overlay = document.getElementById('tut-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tut-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';

  const steps = window.TUTORIAL_STEPS_CURRENT || getTutorialSteps();
  const step = steps[tutStep];
  const target = step.targetId ? document.getElementById(step.targetId) : null;
  if (!target && !step.fallbackCenter) { tutNext(); return; }

  // Center position for steps without a target
  let cx, cy, r;
  if (!target || step.pos === 'center') {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
    r = 0;
  } else {
    const rect2 = target.getBoundingClientRect();
    cx = rect2.left + rect2.width / 2;
    cy = rect2.top + rect2.height / 2;
    r = Math.max(rect2.width, rect2.height) / 2 + 14;
  }

  // Box positioning
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let boxLeft = 16, boxTop = 0, arrowClass = '';

  if (step.pos === 'center' || !target) {
    boxLeft = Math.max(16, (vw - 310) / 2);
    boxTop  = Math.max(80, (vh - 220) / 2);
    arrowClass = '';
  } else if (step.pos === 'bottom') {
    boxTop = cy + r + 18;
    boxLeft = Math.max(12, Math.min(cx - 160, vw - 332));
    arrowClass = 'tut-arrow-top';
    if (boxTop + 200 > vh) { boxTop = cy - r - 200; arrowClass = 'tut-arrow-bottom'; }
  } else if (step.pos === 'left') {
    boxTop = Math.max(12, Math.min(cy - 90, vh - 220));
    boxLeft = cx + r + 14;
    if (boxLeft + 310 > vw) { boxLeft = cx - r - 320; }
    arrowClass = '';
  }

  const arrowOffset = Math.round(cx - boxLeft - 16);

  overlay.innerHTML = `
    <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:all;" onclick="endTutorial()">
      <defs>
        <mask id="tut-mask">
          <rect width="100%" height="100%" fill="white"/>
          ${r > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="black"/>` : ''}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tut-mask)"/>
    </svg>
    ${r > 0 ? `<div style="position:absolute;left:${cx-r}px;top:${cy-r}px;width:${r*2}px;height:${r*2}px;border-radius:50%;
      box-shadow:0 0 0 3px #D4A843,0 0 0 7px rgba(212,168,67,0.3),0 0 30px rgba(212,168,67,0.6);
      animation:tutPulse 1.4s ease-in-out infinite;pointer-events:none;"></div>` : ''}
    <div style="position:absolute;left:${boxLeft}px;top:${boxTop}px;width:310px;
      background:#13131f;border:1.5px solid #D4A843;border-radius:18px;padding:18px 20px;
      box-shadow:0 8px 40px rgba(0,0,0,0.7);pointer-events:all;z-index:2;">
      ${arrowClass === 'tut-arrow-top' ? `<div style="position:absolute;top:-10px;left:${arrowOffset}px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:10px solid #D4A843;"></div>` : ''}
      ${arrowClass === 'tut-arrow-bottom' ? `<div style="position:absolute;bottom:-10px;left:${arrowOffset}px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid #D4A843;"></div>` : ''}
      <div style="font-size:15px;font-weight:900;color:#D4A843;margin-bottom:7px;">${step.title}</div>
      <div style="font-size:13px;color:#aaa;line-height:1.75;white-space:pre-line;">${step.desc}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:16px;">
        <button onclick="tutNext()" style="flex:1;padding:10px;border-radius:12px;background:linear-gradient(135deg,#D4A843,#F59E0B);border:none;color:#080810;font-family:'Cairo',sans-serif;font-size:13px;font-weight:900;cursor:pointer;">
          ${tutStep < TUTORIAL_STEPS.length - 1 ? 'التالي ←' : '🚀 ابدأ!'}
        </button>
        <button onclick="endTutorial()" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:#666;font-family:'Cairo',sans-serif;font-size:12px;cursor:pointer;">تخطي</button>
      </div>
      <div style="display:flex;justify-content:center;gap:5px;margin-top:12px;">
        ${(window.TUTORIAL_STEPS_CURRENT||getTutorialSteps()).map((_,i)=>`<div style="height:5px;border-radius:3px;background:${i===tutStep?'#D4A843':'rgba(255,255,255,0.15)'};width:${i===tutStep?18:6}px;transition:all 0.3s;"></div>`).join('')}
      </div>
    </div>`;
}


/* ══════ INIT ══════ */
document.addEventListener('DOMContentLoaded', () => {
  // ── تهيئة نظام المستويات والتحديات ──
  setTimeout(() => {
    try {
      if (typeof _updateLevelUI === 'function') _updateLevelUI();
      if (typeof initOrRefreshChallenge === 'function') initOrRefreshChallenge();
    } catch(e) {}
  }, 800);

  // ── First Open Ritual — طقس الفتح اليومي ──
  setTimeout(() => {
    try { if (typeof checkFirstOpenToday === 'function') checkFirstOpenToday(); } catch(e) {}
  }, 1200);

  // ── تحديث ذاكرة المدرب عند كل تحميل ──
  setTimeout(() => {
    try {
      updateCoachMemory();
      // ── رسالة استباقية إذا وجدت ──
      const proactive = getProactiveMessage();
      if (proactive && S.onboardingDone) {
        if (!S.coachHistory) S.coachHistory = [];
        // أضف الرسالة الاستباقية كرسالة من المدرب
        S.coachHistory.push({ role: 'assistant', content: proactive.msg });
        if (proactive.suggestions) window._lastCoachSuggestions = proactive.suggestions;
        saveState();
        // إذا كان تبويب المدرب مفتوحاً — حدّثه
        const coachTab = document.getElementById('tab-coach');
        if (coachTab && coachTab.classList.contains('active')) renderCoach();
        else {
          // أظهر toast + إشعار push إذا كان مسموحاً
          showMiniToast('🤖 ' + proactive.msg.split('\n')[0].slice(0, 40) + '...');
          try {
            if (typeof sendCoachNotification === 'function' &&
                typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              const firstLine = proactive.msg.split('\n')[0];
              setTimeout(() => sendCoachNotification(firstLine), 2000);
            }
          } catch(e) {}
        }
      }
    } catch(e) {}
  }, 2000);

  // Init all FABs
  const fabThemeEl = document.getElementById('fab-theme');
  if (fabThemeEl) initFab(fabThemeEl, 'fabThemePos', () => openThemeModal());

  // Init tabata values
  if (S.tabata) {
    document.getElementById('tab-work').textContent = S.tabata.work || 20;
    document.getElementById('tab-rest').textContent = S.tabata.rest || 10;
    document.getElementById('tab-rounds').textContent = S.tabata.rounds || 8;
  }

  // Sound UI
  document.getElementById('snd-toggle').classList.toggle('on', S.soundOn !== false);
  document.getElementById('tick-toggle').classList.toggle('on', S.tickOn !== false);
  document.getElementById('tts-toggle')?.classList.toggle('on', S.ttsOn !== false);
  document.getElementById('vol-range').value = S.volume || 80;

  // Timer default display
  updateTimerUI();

  // ── Onboarding check ──
  // نفس منطق النسخة العاملة: استدعاء مباشر بدون انتظار الإنترو
  // الـ onboarding z-index:10000 يظهر فوق الإنترو عند انتهائه
  const _anyRedirect = localStorage.getItem('azem_ob_redirect') || localStorage.getItem('azem_settings_redirect');
  if (!S.onboardingDone && !_anyRedirect) {
    setTimeout(showOnboarding, 300);
  }

  // Animated background + theme icons (single canonical init)
  const initTheme = S.theme || 'default';
  document.documentElement.setAttribute('data-theme', initTheme);
  initBG();
  setBG(initTheme);
  const thBtn = document.getElementById('theme-hdr-btn');
  if (thBtn) thBtn.textContent = THEME_ICONS[initTheme] || '☀️';
  const fabThemeIconEl = document.getElementById('fab-theme');
  if (fabThemeIconEl) fabThemeIconEl.textContent = THEME_ICONS[initTheme] || '☀️';

  // Render main
  loadCustomSchedule();
  render();
  // Auto-start tutorial on first launch (not right after onboarding - obFinish handles that)
  if (!S.tutorialDone && S.onboardingDone && !window._justFinishedOnboarding) {
    setTimeout(startTutorial, 600);
  }
  renderTips();

  // Apply mode
  if (!S.mode || S.mode === 'dark' || S.mode === 'light') S.mode = 'mobile';
  applyMode();

  // Apply lang
  applyLang(S.lang || 'ar');

  // Network
  setTimeout(updateNetworkStatus, 1500);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Auto-advance day based on start date
  const start = new Date(S.user?.startDate || S.startDate); // FIX-F: check user.startDate first
  const now = new Date();
  const maxDay = S.user?.programDays || 30;
  const elapsed = Math.floor((now - start) / 86400000) + 1;
  if (elapsed >= 1 && elapsed <= maxDay && elapsed > S.currentDay) {
    S.currentDay = Math.min(elapsed, maxDay);
    saveState();
    render();
  }

  // Poll for GIFs loading (gifs.js may take time to parse)
  let _gifPollCount = 0;
  const _gifPoll = setInterval(() => {
    _gifPollCount++;
    if (window.EXERCISE_GIFS && Object.keys(window.EXERCISE_GIFS).length > 0) {
      clearInterval(_gifPoll);
      renderWorkoutTab();
    }
    if (_gifPollCount > 100) clearInterval(_gifPoll);
  }, 100);
});

