
/* ══════════════════════════════════════════
   حساب السعرات من صورة الطعام
   يستخدم المدرب الذكي (vision)
══════════════════════════════════════════ */
let _nutPhotoAnalyzing = false;

function openNutPhotoAnalyzer() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'camera';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (_nutPhotoAnalyzing) return;
    _nutPhotoAnalyzing = true;
    showMiniToast('📷 جارٍ تحليل الصورة...');
    try {
      await _analyzeNutPhoto(file);
    } catch(err) {
      showMiniToast('⚠️ فشل تحليل الصورة');
    }
    _nutPhotoAnalyzing = false;
  };
  input.click();
}

async function _analyzeNutPhoto(file) {
  // تحويل لـ base64
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const mediaType = file.type || 'image/jpeg';

  // API key
  const _userKey   = (S.apiKey || '').startsWith('gsk_') ? S.apiKey : '';
  const _sharedKey = (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? SHARED_GROQ_KEY : '';
  const apiKey = _userKey || _sharedKey;
  if (!apiKey) {
    showMiniToast('⚠️ يتطلب تسجيل الدخول');
    return;
  }

  const lang = currentLang || S.lang || 'ar';
  const prompt = lang === 'en'
    ? 'Analyze this food photo. List each food item with estimated calories, protein, carbs, fat per serving. Reply in JSON only: {"items":[{"name":"...","cal":0,"p":0,"c":0,"f":0,"qty":"..."}],"total_cal":0}'
    : 'حلّل صورة الطعام هذه. أعطني كل صنف مع السعرات والماكرو. أجب بـ JSON فقط: {"items":[{"name":"...","cal":0,"p":0,"c":0,"f":0,"qty":"..."}],"total_cal":0}';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
          { type: 'text', text: prompt }
        ]
      }]
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  // parse JSON
  let result;
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    result = JSON.parse(clean);
  } catch(e) {
    showMiniToast('⚠️ لم أتمكن من تحليل الصورة — جرب صورة أوضح');
    return;
  }

  // عرض النتيجة
  _showNutPhotoResult(result, base64, mediaType);
}

function _showNutPhotoResult(result, base64, mediaType) {
  const items = result.items || [];
  const totalCal = result.total_cal || items.reduce((s,i)=>s+i.cal,0);

  let modal = document.getElementById('nut-photo-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nut-photo-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center;';
    modal.onclick = e => { if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  const lang = currentLang || S.lang || 'ar';
  const _t = (ar,en) => lang==='en'?en:ar;

  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:24px 24px 0 0;width:100%;max-width:520px;
      padding:20px 20px 36px;max-height:85vh;overflow-y:auto;
      border-top:2px solid rgba(212,168,67,.2);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <img src="data:${mediaType};base64,${base64}"
          style="width:64px;height:64px;border-radius:12px;object-fit:cover;">
        <div>
          <div style="font-size:16px;font-weight:900;color:var(--txt);">
            📷 ${_t('تحليل الصورة','Photo Analysis')}
          </div>
          <div style="font-size:13px;color:var(--gold);font-weight:700;">
            ${_t('إجمالي','Total')}: ${totalCal} ${_t('كال','cal')}
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        ${items.map((item,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
            background:var(--card);border-radius:12px;border:1px solid var(--border);">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:var(--txt);">${_escHtml(item.name)}</div>
              <div style="font-size:11px;color:var(--dim);">
                ${item.qty||''} · 💪${item.p||0}غ · 🍞${item.c||0}غ · 🧈${item.f||0}غ
              </div>
            </div>
            <div style="font-size:15px;font-weight:900;color:var(--gold);">${item.cal}</div>
            <button onclick="_addPhotoItem(${i})"
              style="padding:6px 10px;border-radius:8px;background:rgba(212,168,67,.15);
              border:1px solid rgba(212,168,67,.3);color:var(--gold);
              font-family:'Cairo',sans-serif;font-size:11px;cursor:pointer;">+</button>
          </div>`).join('')}
      </div>
      <button onclick="_addAllPhotoItems()"
        style="width:100%;padding:14px;border-radius:14px;
        background:linear-gradient(135deg,var(--gl),var(--gd));
        border:none;color:var(--night);font-family:'Cairo',sans-serif;
        font-size:14px;font-weight:900;cursor:pointer;margin-bottom:8px;">
        ✅ ${_t('إضافة الكل','Add All')} (${totalCal} ${_t('كال','cal')})
      </button>
      <button onclick="document.getElementById('nut-photo-modal').remove()"
        style="width:100%;padding:12px;border-radius:14px;background:transparent;
        border:1px solid var(--border);color:var(--dim);
        font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;">
        ${_t('إغلاق','Close')}
      </button>
    </div>`;

  // حفظ النتائج للإضافة
  window._nutPhotoItems = items;
}

function _addPhotoItem(idx) {
  const item = (window._nutPhotoItems||[])[idx];
  if (!item) return;
  const food = {
    id: 'photo_' + Date.now(),
    name: item.name, icon: '📷',
    cal: item.cal, unit: item.qty || '1 حصة',
    p: item.p||0, c: item.c||0, f: item.f||0,
  };
  _pendingFood = food; _pendingQty = 1;
  document.getElementById('nut-photo-modal')?.remove();
  openNutritionModal();
  setTimeout(() => { _pendingFood = food; showNutQtyPanel(); }, 300);
}

function _addAllPhotoItems() {
  const items = window._nutPhotoItems || [];
  if (!items.length) return;
  const dateKey = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'});
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries:[], waterCups:0 };
  items.forEach(item => {
    S.nutritionLog[dateKey].entries.push({
      id: 'photo_' + Date.now() + Math.random(),
      name: item.name, icon: '📷',
      cal: item.cal, unit: item.qty||'حصة', qty: 1,
      totalCal: item.cal, totalP: item.p||0,
      totalC: item.c||0, totalF: item.f||0,
      time: timeStr, ts: Date.now(), fromPhoto: true,
    });
  });
  saveState();
  document.getElementById('nut-photo-modal')?.remove();
  showMiniToast('✅ تمت إضافة كل الأصناف!');
  if (typeof renderNutritionDiary === 'function') renderNutritionDiary();
}

/* ══════════════════════════════════════════
   AZEM — NUTRITION DIARY MODULE (v7)
   يوميات التغذية بقاعدة بيانات أطعمة عربية/جزائرية
══════════════════════════════════════════ */

/* ─── قاعدة بيانات الأطعمة ─── */
const FOODS_DB = [
  // p=protein(g), c=carbs(g), f=fat(g) per unit
  // ── بروتين ──
  { id:'egg',       name:'بيضة مسلوقة',         icon:'🥚', cal:78,  unit:'حبة',          cat:'بروتين', p:6,  c:0.6, f:5   },
  { id:'egg_fr',    name:'بيضة مقلية',           icon:'🍳', cal:90,  unit:'حبة',          cat:'بروتين', p:6,  c:0.4, f:7   },
  { id:'chicken',   name:'دجاج مشوي',            icon:'🍗', cal:165, unit:'100 غ',        cat:'بروتين', p:31, c:0,   f:3.6 },
  { id:'tuna',      name:'تونة (علبة)',           icon:'🐟', cal:130, unit:'علبة',         cat:'بروتين', p:28, c:0,   f:1   },
  { id:'beef',      name:'لحم بقري مشوي',        icon:'🥩', cal:250, unit:'100 غ',        cat:'بروتين', p:26, c:0,   f:15  },
  { id:'fish',      name:'سمك مشوي',             icon:'🐠', cal:200, unit:'100 غ',        cat:'بروتين', p:24, c:0,   f:8   },
  { id:'kafta',     name:'كفتة مشوية',            icon:'🥙', cal:240, unit:'2 قطعة',      cat:'بروتين', p:20, c:2,   f:16  },
  { id:'lentils',   name:'عدس مطبوخ',            icon:'🫘', cal:140, unit:'كوب',          cat:'بروتين', p:9,  c:24,  f:0.4 },
  { id:'chickpea',  name:'حمص مطبوخ',            icon:'🫘', cal:160, unit:'كوب',          cat:'بروتين', p:8,  c:28,  f:2   },
  // ── نشويات ──
  { id:'rice',      name:'أرز مطبوخ',            icon:'🍚', cal:200, unit:'كوب',          cat:'نشويات', p:4,  c:44,  f:0.4 },
  { id:'bread_ar',  name:'خبز عربي',             icon:'🫓', cal:170, unit:'رغيف',         cat:'نشويات', p:6,  c:33,  f:1.5 },
  { id:'bread_br',  name:'خبز أسمر (شريحة)',     icon:'🍞', cal:70,  unit:'شريحة',        cat:'نشويات', p:3,  c:12,  f:1   },
  { id:'pasta',     name:'مكرونة مطبوخة',        icon:'🍝', cal:220, unit:'كوب',          cat:'نشويات', p:8,  c:43,  f:1.3 },
  { id:'couscous',  name:'كسكوس مطبوخ',          icon:'🥣', cal:180, unit:'كوب',          cat:'نشويات', p:6,  c:36,  f:0.3 },
  { id:'potato',    name:'بطاطا مسلوقة',         icon:'🥔', cal:150, unit:'حبة متوسطة',  cat:'نشويات', p:3,  c:34,  f:0.2 },
  { id:'oats',      name:'شوفان بالحليب',        icon:'🥣', cal:300, unit:'كوب',          cat:'نشويات', p:10, c:50,  f:6   },
  { id:'corn',      name:'ذرة مسلوقة',           icon:'🌽', cal:130, unit:'كوز',          cat:'نشويات', p:4,  c:28,  f:1.5 },
  // ── فاكهة ──
  { id:'banana',    name:'موزة',                 icon:'🍌', cal:105, unit:'حبة',          cat:'فاكهة',  p:1.3,c:27,  f:0.4 },
  { id:'apple',     name:'تفاحة',                icon:'🍎', cal:80,  unit:'حبة',          cat:'فاكهة',  p:0.4,c:21,  f:0.3 },
  { id:'orange',    name:'برتقالة',              icon:'🍊', cal:60,  unit:'حبة',          cat:'فاكهة',  p:1.2,c:15,  f:0.2 },
  { id:'dates',     name:'تمر',                  icon:'🫘', cal:60,  unit:'3 حبات',       cat:'فاكهة',  p:0.4,c:16,  f:0.1 },
  { id:'grape',     name:'عنب',                  icon:'🍇', cal:90,  unit:'عنقود صغير',  cat:'فاكهة',  p:0.9,c:23,  f:0.2 },
  { id:'water_m',   name:'بطيخ',                 icon:'🍉', cal:85,  unit:'شريحة',        cat:'فاكهة',  p:1.7,c:21,  f:0.4 },
  // ── ألبان ──
  { id:'milk',      name:'حليب',                 icon:'🥛', cal:150, unit:'كوب',          cat:'ألبان',  p:8,  c:12,  f:8   },
  { id:'yogurt',    name:'لبن زبادي',            icon:'🍶', cal:100, unit:'كوب',          cat:'ألبان',  p:10, c:7,   f:2   },
  { id:'cheese',    name:'جبنة (شريحة)',          icon:'🧀', cal:80,  unit:'شريحة',        cat:'ألبان',  p:5,  c:0.4, f:6   },
  { id:'labneh',    name:'لبنة',                 icon:'🥄', cal:150, unit:'2 ملعقة',      cat:'ألبان',  p:6,  c:4,   f:10  },
  // ── دهون ──
  { id:'olive_oil', name:'زيت زيتون',            icon:'🫙', cal:120, unit:'ملعقة كبيرة', cat:'دهون',   p:0,  c:0,   f:14  },
  { id:'nuts',      name:'مكسرات مشكلة',         icon:'🥜', cal:170, unit:'حفنة',         cat:'دهون',   p:5,  c:7,   f:15  },
  { id:'almond',    name:'لوز',                  icon:'🌰', cal:160, unit:'حفنة',         cat:'دهون',   p:6,  c:6,   f:14  },
  { id:'avocado',   name:'أفوكادو',              icon:'🥑', cal:240, unit:'حبة متوسطة',  cat:'دهون',   p:3,  c:13,  f:22  },
  // ── خضروات ──
  { id:'salad',     name:'سلطة خضراء',           icon:'🥗', cal:30,  unit:'طبق',          cat:'خضروات', p:2,  c:5,   f:0.5 },
  { id:'tomato',    name:'طماطم',                icon:'🍅', cal:35,  unit:'2 حبات',       cat:'خضروات', p:1.6,c:7,   f:0.4 },
  { id:'cucumber',  name:'خيار',                 icon:'🥒', cal:25,  unit:'حبة',          cat:'خضروات', p:1,  c:5,   f:0.2 },
  { id:'soup',      name:'شوربة خضار',           icon:'🍲', cal:80,  unit:'طبق',          cat:'خضروات', p:3,  c:14,  f:1   },
  { id:'chorba',    name:'شوربة / حريرة',        icon:'🍵', cal:120, unit:'طبق',          cat:'خضروات', p:7,  c:18,  f:2   },
  // ── مشروبات ──
  { id:'water',     name:'ماء',                  icon:'💧', cal:0,   unit:'كوب',          cat:'مشروبات',p:0,  c:0,   f:0   },
  { id:'coffee',    name:'قهوة (بدون سكر)',      icon:'☕', cal:5,   unit:'كوب',          cat:'مشروبات',p:0.3,c:0,   f:0   },
  { id:'tea',       name:'شاي (بدون سكر)',       icon:'🍵', cal:2,   unit:'كوب',          cat:'مشروبات',p:0,  c:0.5, f:0   },
  { id:'juice',     name:'عصير برتقال طبيعي',   icon:'🧃', cal:120, unit:'كوب',          cat:'مشروبات',p:2,  c:26,  f:0.5 },
  { id:'soda',      name:'مشروب غازي',           icon:'🥤', cal:140, unit:'علبة',         cat:'مشروبات',p:0,  c:39,  f:0   },
  // ── وجبات جاهزة ──
  { id:'ch_plate',  name:'وجبة دجاج (أرز+دجاج)',icon:'🍽️', cal:500, unit:'طبق',          cat:'وجبات',  p:35, c:55,  f:10  },
  { id:'cous_plt',  name:'كسكسي بالدجاج',        icon:'🍽️', cal:450, unit:'طبق',          cat:'وجبات',  p:30, c:50,  f:8   },
  { id:'shawarma',  name:'شاورما دجاج',           icon:'🌯', cal:400, unit:'حبة',          cat:'وجبات',  p:25, c:40,  f:14  },
  { id:'burger',    name:'برغر',                 icon:'🍔', cal:500, unit:'حبة',          cat:'وجبات',  p:25, c:40,  f:25  },
  { id:'pizza',     name:'بيتزا (شريحة)',         icon:'🍕', cal:300, unit:'شريحة',        cat:'وجبات',  p:12, c:35,  f:12  },
  { id:'sandwich',  name:'ساندويتش دجاج',        icon:'🥪', cal:350, unit:'حبة',          cat:'وجبات',  p:22, c:38,  f:10  },
  { id:'tagine',    name:'طاجين لحم',            icon:'🍲', cal:380, unit:'طبق',          cat:'وجبات',  p:28, c:30,  f:15  },
  // ── حلويات ──
  { id:'choco',     name:'شوكولاتة',             icon:'🍫', cal:150, unit:'30 غ',         cat:'حلويات', p:2,  c:18,  f:9   },
  { id:'cake',      name:'كيك (شريحة)',           icon:'🎂', cal:350, unit:'شريحة',        cat:'حلويات', p:4,  c:55,  f:14  },
  { id:'icecream',  name:'آيس كريم',             icon:'🍦', cal:200, unit:'كوب',          cat:'حلويات', p:3,  c:32,  f:8   },
  { id:'baklava',   name:'بقلاوة',               icon:'🍯', cal:150, unit:'قطعة',         cat:'حلويات', p:2,  c:20,  f:8   },
  { id:'makroud',   name:'مقروض',                icon:'🧆', cal:130, unit:'حبة',          cat:'حلويات', p:2,  c:22,  f:5   },
  { id:'honey_sp',  name:'عسل',                 icon:'🍯', cal:60,  unit:'ملعقة',        cat:'حلويات', p:0,  c:17,  f:0   },
  // ── مكملات ──
  { id:'protein_s', name:'شيك بروتين',           icon:'💪', cal:150, unit:'كوب',          cat:'مكملات', p:25, c:8,   f:2   },
  { id:'protbar',   name:'قضيب بروتين',          icon:'🍫', cal:220, unit:'قضيب',         cat:'مكملات', p:20, c:24,  f:7   },
];

const NUT_CATS = ['الكل','بروتين','نشويات','فاكهة','ألبان','دهون','خضروات','مشروبات','وجبات','حلويات','مكملات','🌍 عالمي'];
let _nutActiveCat = 'الكل';
let _nutSearch = '';
let _pendingFood = null; // الطعام المحدد قيد الإضافة
let _pendingQty = 1;

/* ─── حساب الهدف اليومي + الماكرو ─── */

// حساب الماكرو الفعلي من قائمة الوجبات
function calcMacroFromEntries(entries) {
  return entries.reduce((acc, e) => {
    const food = FOODS_DB.find(f => f.id === e.id);
    const qty = e.qty || 1;
    if (food) {
      acc.p += (food.p || 0) * qty;
      acc.c += (food.c || 0) * qty;
      acc.f += (food.f || 0) * qty;
    }
    return acc;
  }, { p: 0, c: 0, f: 0 });
}

// هدف الماكرو اليومي
function calcMacroTargets() {
  const kg   = parseFloat(S.user?.weight) || 70;
  const goal = S.user?.goal || 'burn';
  const target = calcDailyCalTarget();
  const p = Math.round(kg * (goal === 'muscle' ? 2.0 : 1.6));
  const f = Math.round(kg * 0.8);
  const c = Math.max(50, Math.round((target - p * 4 - f * 9) / 4));
  return { p, c, f, cal: target };
}

function calcDailyCalTarget() {
  const kg     = parseFloat(S.user?.weight) || 70;
  const cm     = parseFloat(S.user?.height) || 170;
  const age    = parseFloat(S.user?.age)    || 25;
  const gender = S.user?.gender || 'male';
  const goal   = S.user?.goal   || 'burn';
  const bmr = gender === 'female'
    ? Math.round(10*kg + 6.25*cm - 5*age - 161)
    : Math.round(10*kg + 6.25*cm - 5*age + 5);
  const tdee = Math.round(bmr * 1.375);
  if (goal === 'burn')   return Math.round(tdee - 300);
  if (goal === 'muscle') return Math.round(tdee + 300);
  return tdee;
}

/* ─── مفتاح اليوم ─── */
function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/* ─── الإجمالي اليومي ─── */
function todayNutTotal() {
  const entries = (S.nutritionLog || {})[todayKey()]?.entries || [];
  return entries.reduce((s, e) => s + (e.totalCal || 0), 0);
}

/* ═══════════════════════════════════════
   RENDER DIARY — يُعيد رسم قسم التغذية
═══════════════════════════════════════ */
function renderNutritionDiary() {
  const el = document.getElementById('nutrition-plan');
  if (!el) return;

  const targets  = calcMacroTargets();
  const total    = todayNutTotal();
  const pct      = Math.min(100, Math.round((total / targets.cal) * 100));
  const entries  = (S.nutritionLog || {})[todayKey()]?.entries || [];
  const macro    = calcMacroFromEntries(entries);

  // ── تتبع الماء ──
  const waterToday = (S.nutritionLog || {})[todayKey()]?.water || 0;
  const waterTarget = Math.round((parseFloat(S.user?.weight)||70) * 0.035 * 33.8 / 8); // أكواب
  const waterPct = Math.min(100, Math.round((waterToday / waterTarget) * 100));

  const barColor = pct > 110 ? '#ef4444' : pct >= 80 ? '#D4A843' : '#22c55e';

  el.innerHTML = `
    <!-- ── تبويبات السعرات / الماكرو / الماء ── -->
    <div style="display:flex;gap:6px;margin-bottom:14px;" id="nut-tab-bar">
      <button onclick="nutSwitchView('cal')" id="nut-tab-cal"
        style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid var(--gold);background:rgba(212,168,67,.15);color:var(--gold);font-family:'Cairo',sans-serif;font-size:12px;font-weight:800;cursor:pointer;">
        🔥 السعرات</button>
      <button onclick="nutSwitchView('macro')" id="nut-tab-macro"
        style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--dim);font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">
        💪 الماكرو</button>
      <button onclick="nutSwitchView('water')" id="nut-tab-water"
        style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--dim);font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">
        💧 الماء</button>
    </div>

    <!-- ── لوحة السعرات ── -->
    <div id="nut-view-cal">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
        <div style="font-size:12px;color:var(--dim);">
          الهدف: <strong style="color:var(--gold);">${targets.cal.toLocaleString('ar')} كال</strong> ·
          مُسجَّل: <strong style="color:${barColor};">${total.toLocaleString('ar')} كال</strong>
        </div>
        <button onclick="openNutritionModal()" style="padding:6px 12px;border-radius:10px;background:linear-gradient(135deg,var(--gl),var(--gd));border:none;color:var(--night);font-family:'Cairo',sans-serif;font-size:12px;font-weight:900;cursor:pointer;">+ إضافة</button>
        <button onclick="openNutPhotoAnalyzer()" title="حساب سعرات من صورة" style="padding:6px 10px;border-radius:10px;background:rgba(212,168,67,.1);border:1px solid rgba(212,168,67,.25);color:var(--gold);font-size:14px;cursor:pointer;">📷</button>
        <button onclick="openCustomMealForm()" title="وجبة مخصصة" style="padding:6px 10px;border-radius:10px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);color:#818cf8;font-size:14px;cursor:pointer;">✏️</button>
        <button onclick="generateWeeklyMealPlan()" title="خطة أسبوعية" style="padding:6px 10px;border-radius:10px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ade80;font-size:14px;cursor:pointer;">📅</button>
      </div>
      <div style="background:rgba(255,255,255,0.07);border-radius:8px;height:10px;overflow:hidden;margin-bottom:6px;">
        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:8px;transition:width .6s ease;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-bottom:14px;">
        <span>${pct}% من هدفك</span>
        <span>${Math.max(0,targets.cal-total).toLocaleString('ar')} كال متبقية</span>
      </div>
      ${entries.length === 0 ? `
        <div style="text-align:center;padding:20px 0;color:var(--dim);">
          <div style="font-size:28px;margin-bottom:8px;">🍽️</div>
          <div style="font-size:13px;">لا توجد وجبات مُسجَّلة اليوم</div>
        </div>` : `
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          ${entries.map((e,idx) => `
            <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px 10px;">
              <span style="font-size:22px;flex-shrink:0;">${_escHtml(e.icon)||'🍽️'}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escHtml(e.name)}</div>
                <div style="font-size:10px;color:var(--dim);">${e.qty} ${_escHtml(e.unit)||''}
                  ${e.totalP ? `· 💪${Math.round(e.totalP)}غ` : ''}
                  ${e.totalC ? `· 🍚${Math.round(e.totalC)}غ` : ''}
                  ${e.totalF ? `· 🫙${Math.round(e.totalF)}غ` : ''}
                </div>
              </div>
              <div style="font-size:13px;font-weight:800;color:var(--gold);flex-shrink:0;">${e.totalCal}<span style="font-size:9px;color:var(--dim);"> كال</span></div>
              <button onclick="removeNutEntry(${idx})" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#ef4444;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;">×</button>
            </div>`).join('')}
        </div>`}
      <button onclick="openNutritionModal()" style="width:100%;padding:11px;border-radius:12px;background:rgba(212,168,67,.08);border:1.5px dashed rgba(212,168,67,.3);color:var(--gold);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
        ＋ إضافة طعام أو وجبة
      </button>
    </div>

    <!-- ── لوحة الماكرو ── -->
    <div id="nut-view-macro" style="display:none;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        ${[
          {lbl:'🥩 بروتين', got:Math.round(macro.p), target:targets.p, color:'#f97316', unit:'غ'},
          {lbl:'🍚 كارب',   got:Math.round(macro.c), target:targets.c, color:'#38bdf8', unit:'غ'},
          {lbl:'🫙 دهون',   got:Math.round(macro.f), target:targets.f, color:'#a78bfa', unit:'غ'},
        ].map(m => {
          const mpct = Math.min(100, Math.round((m.got/m.target)*100));
          const mcolor = mpct>=90?'#22c55e':mpct>=60?m.color:'#ef4444';
          return `<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 8px;text-align:center;">
            <div style="font-size:11px;color:var(--dim);margin-bottom:6px;">${m.lbl}</div>
            <div style="font-size:18px;font-weight:900;color:${mcolor};">${m.got}<span style="font-size:10px;color:var(--dim);font-weight:400;"> ${m.unit}</span></div>
            <div style="font-size:10px;color:var(--dim);margin-top:2px;">/ ${m.target}${m.unit}</div>
            <div style="height:4px;background:rgba(255,255,255,.07);border-radius:2px;margin-top:6px;overflow:hidden;">
              <div style="height:100%;width:${mpct}%;background:${mcolor};border-radius:2px;transition:width .5s;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${macro.p > 0 || macro.c > 0 || macro.f > 0 ? `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;">
          <div style="font-size:11px;color:var(--dim);margin-bottom:8px;">توزيع الطاقة</div>
          <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px;">
            ${(()=>{
              const total3 = macro.p*4 + macro.c*4 + macro.f*9 || 1;
              const pp = Math.round(macro.p*4/total3*100);
              const cp = Math.round(macro.c*4/total3*100);
              const fp = 100-pp-cp;
              return `<div style="flex:${pp};background:#f97316;border-radius:4px;" title="بروتين ${pp}%"></div>
                      <div style="flex:${cp};background:#38bdf8;border-radius:4px;" title="كارب ${cp}%"></div>
                      <div style="flex:${fp};background:#a78bfa;border-radius:4px;" title="دهون ${fp}%"></div>`;
            })()}
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--dim);">
            <span><span style="color:#f97316;">●</span> بروتين</span>
            <span><span style="color:#38bdf8;">●</span> كارب</span>
            <span><span style="color:#a78bfa;">●</span> دهون</span>
          </div>
        </div>` : `
        <div style="text-align:center;padding:20px;color:var(--dim);font-size:13px;">سجّل وجباتك لرؤية توزيع الماكرو</div>`}
    </div>

    <!-- ── لوحة الماء ── -->
    <div id="nut-view-water" style="display:none;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:48px;margin-bottom:8px;">💧</div>
        <div style="font-size:28px;font-weight:900;color:#38bdf8;">${waterToday} <span style="font-size:14px;font-weight:400;color:var(--dim);">/ ${waterTarget} كوب</span></div>
        <div style="font-size:12px;color:var(--dim);margin-top:4px;">${waterPct}% من هدفك اليومي</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:16px;">
        ${Array.from({length: waterTarget}, (_, i) => `
          <div style="width:28px;height:28px;border-radius:50%;background:${i < waterToday ? '#38bdf8' : 'rgba(56,189,248,.12)'};border:1.5px solid ${i < waterToday ? '#38bdf8' : 'rgba(56,189,248,.2)'};display:flex;align-items:center;justify-content:center;font-size:12px;transition:all .3s;">
            ${i < waterToday ? '💧' : ''}</div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button onclick="addWater(1)" style="flex:1;padding:12px;border-radius:14px;background:rgba(56,189,248,.15);border:1.5px solid rgba(56,189,248,.3);color:#38bdf8;font-family:'Cairo',sans-serif;font-size:14px;font-weight:800;cursor:pointer;">
          + كوب 💧</button>
        <button onclick="addWater(-1)" style="padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--dim);font-family:'Cairo',sans-serif;font-size:14px;cursor:pointer;">−</button>
      </div>
      <div style="text-align:center;font-size:11px;color:var(--dim);margin-top:10px;">
        هدفك: ${((parseFloat(S.user?.weight)||70) * 0.035).toFixed(1)} لتر يومياً
        ${(S.completedDays||[]).includes(S.currentDay) ? '(+ 0.5 لتر يوم تمرين 🔥)' : ''}
      </div>
    </div>
  `;
}

// تبديل لوحات التغذية
function nutSwitchView(view) {
  ['cal','macro','water'].forEach(v => {
    const panel = document.getElementById('nut-view-' + v);
    const tab   = document.getElementById('nut-tab-' + v);
    if (!panel || !tab) return;
    const active = v === view;
    panel.style.display = active ? 'block' : 'none';
    tab.style.borderColor    = active ? 'var(--gold)' : 'var(--border)';
    tab.style.background     = active ? 'rgba(212,168,67,.15)' : 'transparent';
    tab.style.color          = active ? 'var(--gold)' : 'var(--dim)';
  });
}

// إضافة / حذف كوب ماء
function addWater(delta) {
  const dateKey = todayKey();
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries: [] };
  const current = S.nutritionLog[dateKey].water || 0;
  S.nutritionLog[dateKey].water = Math.max(0, current + delta);
  saveState();
  renderNutritionDiary();
  // انتقل لتبويب الماء بعد الإضافة
  setTimeout(() => nutSwitchView('water'), 50);
  if (delta > 0) {
    try { microCelebrate('water_cup'); } catch(e) { showMiniToast('💧 +كوب ماء!'); }
  }
}

/* ═══════════════════════════════════════
   MODAL — فاتح منتقي الطعام
═══════════════════════════════════════ */

/* ══════════════════════════════════════════
   وجبة مخصصة — المستخدم يضيف ما يريد
══════════════════════════════════════════ */
function openCustomMealForm() {
  let modal = document.getElementById('custom-meal-modal');
  if (modal) { modal.remove(); return; }

  const lang = currentLang || S.lang || 'ar';
  const _t = (ar,en) => lang==='en'?en:ar;

  modal = document.createElement('div');
  modal.id = 'custom-meal-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };

  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:24px 24px 0 0;width:100%;max-width:520px;
      padding:20px 20px 40px;border-top:2px solid rgba(212,168,67,.2);">
      <div style="font-size:16px;font-weight:900;color:var(--txt);margin-bottom:16px;">
        ✏️ ${_t('وجبة مخصصة','Custom Meal')}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <input id="cm-name" type="text" placeholder="${_t('اسم الوجبة...','Meal name...')}"
          style="padding:12px 14px;border-radius:12px;background:var(--card);
          border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;
          -webkit-appearance:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <div style="font-size:11px;color:var(--dim);margin-bottom:4px;">${_t('سعرات','Calories')}</div>
            <input id="cm-cal" type="number" placeholder="0" min="0" max="5000"
              style="width:100%;padding:12px;border-radius:12px;background:var(--card);
              border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;
              font-size:14px;text-align:center;-webkit-appearance:none;">
          </div>
          <div>
            <div style="font-size:11px;color:var(--dim);margin-bottom:4px;">${_t('كمية','Quantity')}</div>
            <input id="cm-unit" type="text" placeholder="${_t('حصة','serving')}"
              style="width:100%;padding:12px;border-radius:12px;background:var(--card);
              border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;
              font-size:14px;-webkit-appearance:none;">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          ${[['cm-p','💪','بروتين','Protein'],['cm-c','🍞','كربوهيدرات','Carbs'],['cm-f','🧈','دهون','Fat']].map(([id,ic,ar,en])=>`
            <div>
              <div style="font-size:10px;color:var(--dim);margin-bottom:4px;">${ic} ${_t(ar,en)} (غ)</div>
              <input id="${id}" type="number" placeholder="0" min="0"
                style="width:100%;padding:10px;border-radius:10px;background:var(--card);
                border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;
                font-size:13px;text-align:center;-webkit-appearance:none;">
            </div>`).join('')}
        </div>
        <button onclick="_confirmCustomMeal()"
          style="padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));
          border:none;color:var(--night);font-family:'Cairo',sans-serif;font-size:14px;font-weight:900;cursor:pointer;">
          ✅ ${_t('إضافة الوجبة','Add Meal')}
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('cm-name')?.focus(), 200);
}

function _confirmCustomMeal() {
  const name = document.getElementById('cm-name')?.value.trim();
  const cal  = parseInt(document.getElementById('cm-cal')?.value)  || 0;
  const unit = document.getElementById('cm-unit')?.value.trim()    || '1 حصة';
  const p    = parseFloat(document.getElementById('cm-p')?.value)  || 0;
  const c    = parseFloat(document.getElementById('cm-c')?.value)  || 0;
  const f    = parseFloat(document.getElementById('cm-f')?.value)  || 0;

  if (!name) { showMiniToast('⚠️ أدخل اسم الوجبة'); return; }
  if (!cal)  { showMiniToast('⚠️ أدخل السعرات'); return; }

  const food = { id:'custom_'+Date.now(), name, icon:'🍽️', cal, unit, p, c, f };
  _pendingFood = food;
  _pendingQty  = 1;
  document.getElementById('custom-meal-modal')?.remove();
  showNutQtyPanel();
}

function openNutritionModal() {
  _nutActiveCat = 'الكل';
  _nutSearch    = '';
  _offResults   = [];
  _offLoading   = false;
  clearTimeout(_offSearchTimer);
  document.getElementById('nut-modal').style.display = 'flex';
  document.getElementById('nut-search-inp').value = '';
  renderNutCategoryTabs();
  renderNutFoodList();
  setTimeout(() => document.getElementById('nut-search-inp').focus(), 300);
}

function closeNutritionModal() {
  document.getElementById('nut-modal').style.display = 'none';
  _pendingFood = null;
  document.getElementById('nut-qty-panel').style.display = 'none';
}

function renderNutCategoryTabs() {
  const el = document.getElementById('nut-cat-tabs');
  if (!el) return;
  el.innerHTML = NUT_CATS.map(cat => `
    <button class="nut-cat-tab ${_nutActiveCat === cat ? 'active' : ''}"
      onclick="nutSetCat('${cat}')">${cat}</button>
  `).join('');
}

function nutSetCat(cat) {
  _nutActiveCat = cat;
  renderNutCategoryTabs();
  if (cat === '🌍 عالمي') {
    // اعرض مجال البحث فارغاً مع رسالة ترحيبية
    renderNutFoodList();
    setTimeout(() => document.getElementById('nut-search-inp')?.focus(), 200);
  } else {
    _offResults = [];
    renderNutFoodList();
  }
}


/* ══════════════════════════════════════════
   OPEN FOOD FACTS INTEGRATION
   بحث في 3+ مليون منتج عالمي مجاناً
   API: world.openfoodfacts.org
══════════════════════════════════════════ */

let _offSearchTimer = null;   // debounce timer
let _offResults     = [];     // نتائج OFF الحالية
let _offLoading     = false;  // حالة التحميل
let _offSearchQuery = '';     // آخر بحث

// ── تحويل نتيجة OFF إلى صيغة FOODS_DB ──
function _offProductToFood(p) {
  const n = p.nutriments || {};
  const cal  = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] || 0) / 4.184 || 0);
  const prot = Math.round((n['proteins_100g']       || 0) * 10) / 10;
  const carb = Math.round((n['carbohydrates_100g']  || 0) * 10) / 10;
  const fat  = Math.round((n['fat_100g']            || 0) * 10) / 10;

  // اسم المنتج — نفضّل العربي ثم الإنجليزي
  const name = p.product_name_ar
    || p.product_name_fr
    || p.product_name_en
    || p.product_name
    || p.abbreviated_product_name
    || '—';

  if (!name || name === '—' || cal === 0) return null;

  // أيقونة بسيطة حسب الفئة
  const catIcon = {
    'en:beverages':'🧃', 'en:dairy':'🥛', 'en:meats':'🥩',
    'en:fruits':'🍎', 'en:vegetables':'🥦', 'en:cereals':'🌾',
    'en:snacks':'🍿', 'en:sweets':'🍬', 'en:sauces':'🫙',
  };
  const cats = p.categories_tags || [];
  const icon = cats.reduce((ic, c) => catIcon[c] || ic, '📦');

  return {
    id:   'off_' + (p.code || p._id || Date.now()),
    name: name.slice(0, 60),
    icon,
    cal,
    unit: '100 غ',
    cat:  '🌍 عالمي',
    p: prot, c: carb, f: fat,
    brand:   p.brands   || '',
    barcode: p.code     || '',
    imgThumb: p.image_thumb_url || '',
    fromOFF: true,
  };
}

// ── البحث في Open Food Facts ──
async function searchOpenFoodFacts(query) {
  if (!query || query.length < 2) return [];
  _offLoading = true;
  _offResults = [];

  try {
    // نبحث بعربي + إنجليزي معاً
    const url = `https://world.openfoodfacts.org/cgi/search.pl?` + new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 12,
      fields: 'code,product_name,product_name_ar,product_name_en,product_name_fr,brands,nutriments,categories_tags,image_thumb_url',
    });

    const res = await fetch(url, {
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    _offResults = (data.products || [])
      .map(_offProductToFood)
      .filter(Boolean)
      .slice(0, 10);

  } catch(e) {
    console.warn('[OFF] Search error:', e.message);
    _offResults = [];
  }

  _offLoading = false;
  return _offResults;
}

// ── بحث مع debounce 600ms ──
function nutSearchWithOFF(val) {
  _nutSearch = val.trim();
  _offSearchQuery = _nutSearch;

  // بحث محلي فوري
  renderNutFoodList();

  // بحث OFF بعد 600ms من توقف الكتابة
  clearTimeout(_offSearchTimer);
  if (_nutSearch.length >= 2) {
    _offSearchTimer = setTimeout(async () => {
      if (_offSearchQuery !== _nutSearch) return; // بحث أحدث جاء
      // عرض loading
      _offLoading = true;
      renderNutFoodList();
      await searchOpenFoodFacts(_nutSearch);
      if (_offSearchQuery === _nutSearch) renderNutFoodList();
    }, 600);
  } else {
    _offResults = [];
    _offLoading = false;
  }
}

// ── اختيار منتج OFF ──
function nutSelectOffProduct(idx) {
  const food = _offResults[idx];
  if (!food) return;
  _pendingFood = food;
  _pendingQty = 1;
  showNutQtyPanel();
}

function renderNutFoodList() {
  const el = document.getElementById('nut-food-list');
  if (!el) return;

  // ── نتائج محلية ──
  let filtered = FOODS_DB;
  if (_nutActiveCat !== 'الكل' && _nutActiveCat !== '🌍 عالمي')
    filtered = filtered.filter(f => f.cat === _nutActiveCat);
  if (_nutSearch) {
    const q = _nutSearch.toLowerCase();
    filtered = filtered.filter(f => f.name.includes(q) || f.cat.includes(q));
  }

  // ── بناء HTML ──
  let html = '';

  // نتائج محلية
  if (filtered.length > 0 && _nutActiveCat !== '🌍 عالمي') {
    if (_nutSearch && _offResults.length === 0 && !_offLoading) {
      html += `<div style="font-size:10px;color:var(--dim);padding:4px 0 8px;text-align:center;">📚 من قاعدة البيانات المحلية</div>`;
    }
    html += filtered.map(f => `
      <button class="nut-food-item" onclick="nutSelectFood('${f.id}')">
        <span class="nut-food-icon">${f.icon}</span>
        <div class="nut-food-info">
          <div class="nut-food-name">${_escHtml(f.name)}</div>
          <div class="nut-food-unit">لكل ${f.unit}</div>
        </div>
        <div class="nut-food-cal">${f.cal} <span style="font-size:10px;">كال</span></div>
      </button>`).join('');
  }

  // ── نتائج Open Food Facts ──
  if (_nutSearch && _nutSearch.length >= 2) {
    if (_offLoading) {
      html += `
        <div style="text-align:center;padding:20px;color:var(--dim);">
          <div style="font-size:22px;margin-bottom:6px;">🌍</div>
          <div style="font-size:12px;">جارٍ البحث في 3 مليون منتج...</div>
          <div style="margin-top:8px;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:60%;background:var(--gold);border-radius:2px;animation:shimmer 1s ease-in-out infinite;"></div>
          </div>
        </div>`;
    } else if (_offResults.length > 0) {
      html += `
        <div style="font-size:10px;color:var(--dim);padding:12px 0 6px;text-align:center;display:flex;align-items:center;gap:6px;justify-content:center;">
          <span>🌍</span> نتائج Open Food Facts (${_offResults.length})
        </div>`;
      html += _offResults.map((f, idx) => `
        <button class="nut-food-item" onclick="nutSelectOffProduct(${idx})"
          style="border-color:rgba(56,189,248,.15);">
          <span class="nut-food-icon" style="font-size:18px;">${f.imgThumb
            ? `<img src="${f.imgThumb}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" onerror="this.textContent='📦';this.style.display='none';this.parentNode.textContent='📦';">`
            : f.icon}</span>
          <div class="nut-food-info" style="flex:1;min-width:0;">
            <div class="nut-food-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escHtml(f.name)}</div>
            <div class="nut-food-unit" style="color:rgba(56,189,248,.7);">
              ${f.brand ? _escHtml(f.brand.slice(0,20)) + ' · ' : ''}لكل 100غ
            </div>
          </div>
          <div style="text-align:left;flex-shrink:0;">
            <div class="nut-food-cal">${f.cal} <span style="font-size:10px;">كال</span></div>
            ${f.p ? `<div style="font-size:9px;color:var(--dim);">💪${f.p}غ</div>` : ''}
          </div>
        </button>`).join('');
    } else if (!_offLoading && filtered.length === 0) {
      html = `
        <div style="text-align:center;padding:32px;color:var(--dim);font-size:13px;">
          <div style="font-size:28px;margin-bottom:8px;">🔍</div>
          لا توجد نتائج — جرّب كلمة أخرى أو أضف وجبة مخصصة
        </div>`;
    }
  } else if (filtered.length === 0) {
    html = `
      <div style="text-align:center;padding:32px;color:var(--dim);font-size:13px;">
        <div style="font-size:28px;margin-bottom:8px;">🍽️</div>
        اختر فئة أو ابحث عن طعام
      </div>`;
  }

  el.innerHTML = html;
}

function nutSelectFood(id) {
  const food = FOODS_DB.find(f => f.id === id);
  if (!food) return;
  _pendingFood = food;
  _pendingQty = 1;
  showNutQtyPanel();
}

function showNutQtyPanel() {
  if (!_pendingFood) return;
  const panel = document.getElementById('nut-qty-panel');
  panel.style.display = 'flex';
  updateQtyPanel();
}

function updateQtyPanel() {
  if (!_pendingFood) return;
  document.getElementById('qty-food-icon').textContent = _pendingFood.icon;
  document.getElementById('qty-food-name').textContent = _pendingFood.name;
  document.getElementById('qty-food-unit').textContent = `لكل ${_pendingFood.unit}`;
  document.getElementById('qty-num').textContent = _pendingQty;
  document.getElementById('qty-total-cal').textContent = Math.round(_pendingFood.cal * _pendingQty);
}

function nutAdjQty(delta) {
  _pendingQty = Math.max(0.5, _pendingQty + delta);
  // Round to 0.5 steps
  _pendingQty = Math.round(_pendingQty * 2) / 2;
  updateQtyPanel();
}

function confirmNutAdd() {
  if (!_pendingFood) return;
  const dateKey = todayKey();
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries: [] };

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  S.nutritionLog[dateKey].entries.push({
    id:       _pendingFood.id,
    name:     _pendingFood.name,
    icon:     _pendingFood.icon,
    cal:      _pendingFood.cal,
    unit:     _pendingFood.unit,
    qty:      _pendingQty,
    totalCal: Math.round(_pendingFood.cal * _pendingQty),
    totalP:   Math.round((_pendingFood.p || 0) * _pendingQty * 10) / 10,
    totalC:   Math.round((_pendingFood.c || 0) * _pendingQty * 10) / 10,
    totalF:   Math.round((_pendingFood.f || 0) * _pendingQty * 10) / 10,
    time:     timeStr,
    ts:       Date.now(),
    // OFF metadata
    brand:    _pendingFood.brand   || '',
    barcode:  _pendingFood.barcode || '',
    fromOFF:  _pendingFood.fromOFF || false,
  });

  saveState();
  renderNutritionDiary();
  closeNutritionModal();
  // تحديث الرسم البياني إذا كان مفتوحاً
  if (typeof renderTrendChart === 'function') {
    try { renderTrendChart(14); } catch(e) {}
  }
  showMiniToast(`✅ ${_pendingFood.icon} ${_pendingFood.name} — ${Math.round(_pendingFood.cal * _pendingQty)} كال`);
  _pendingFood = null;
  _pendingQty = 1;
}

/* ─── إضافة وجبة مخصصة ─── */
function nutAddCustom() {
  const name = document.getElementById('nut-custom-name').value.trim();
  const cal  = parseInt(document.getElementById('nut-custom-cal').value) || 0;
  if (!name || cal <= 0) {
    showMiniToast('⚠️ أدخل اسم الوجبة والسعرات');
    return;
  }
  // FIX: حد أقصى معقول للسعرات (5000 كحد يومي تقريبي لأي وجبة)
  if (cal > 9999) {
    showMiniToast('⚠️ السعرات تبدو كثيرة جداً — تحقق من الرقم');
    return;
  }
  const dateKey = todayKey();
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries: [] };

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  S.nutritionLog[dateKey].entries.push({
    id: 'custom_' + Date.now(),
    name, icon:'🍽️', cal, unit:'وجبة', qty:1, totalCal:cal,
    time: timeStr, ts: Date.now()
  });

  saveState();
  renderNutritionDiary();
  closeNutritionModal();
  showMiniToast(`✅ ${name} — ${cal} كال`);
  document.getElementById('nut-custom-name').value = '';
  document.getElementById('nut-custom-cal').value = '';
}

/* ─── حذف إدخال ─── */
function removeNutEntry(idx) {
  const dateKey = todayKey();
  const entries = (S.nutritionLog || {})[dateKey]?.entries;
  if (!entries) return;
  entries.splice(idx, 1);
  saveState();
  renderNutritionDiary();
}

/* ─── البحث ─── */
function nutSearch(val) {
  nutSearchWithOFF(val);
}

/* ══════════════════════════════════════════
   Patch renderNutrition in render.js (override)
══════════════════════════════════════════ */
window.renderNutrition = renderNutritionDiary;
