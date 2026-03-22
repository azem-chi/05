/* ══════ STATE ══════ */
/* ══════ SHARED API KEY — ضع مفتاح Groq المشترك هنا ══════ */
/* ضع مفتاح Groq المشترك هنا — سيُستخدم لجميع المستخدمين */
/* مثال: const SHARED_GROQ_KEY = ''; */
const SHARED_GROQ_KEY = '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';

/* ══════════════════════════════════════════
   XSS PROTECTION — دالة موحدة لجميع الملفات
   data.js يُحمَّل أولاً → متاحة في كل مكان
══════════════════════════════════════════ */
function _escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let S = {
  currentDay:1, completedDays:[], calories:0, streak:0, lang:'',
  theme:'default', mode:'mobile',
  startDate: new Date().toISOString().split('T')[0],
  customImages:{}, fabThemePos:{top:100,right:16},
  bodyMeasurements:{}, ropeJumps:0, ropeMeters:0, ropeMins:0, ropeSessions:0,
  weeklyData:{}, completedExercises:{}, unlockedBadges:[],
  soundOn:true, tickOn:true, volume:80, ttsOn:true,
  tabata:{work:20,rest:10,rounds:8},
  customSchedule:{},
  nutritionLog:{}, // يوميات التغذية: { 'YYYY-MM-DD': { entries:[...] } }
  onboardingDone: false,
  user: { name:'', weight:0, height:0, age:0, gender:'', goal:'burn', trainTime:'18:00', programDays:30, program:'standard', startDate: new Date().toISOString().split('T')[0] },
  trainingLog: {},
  coachHistory: [],
  _manualExCal: {},
  weeklyCalGoal: 0,
  xp: 0,             // نقاط XP الكلية
  superSetPairs: [], // أزواج Super Set [[ex1, ex2], ...]
  xpLevel: 1,        // مستوى XP (مستقل عن مستوى الأيام)      // هدف السعرات الأسبوعي (0 = تلقائي)
  streakFreezes: 1,      // عدد تجميدات السلسلة المتبقية
  identityTitle: '',     // لقب المستخدم المكتسب 'رياضي'/'بطل'/'أسطورة'
  commitmentDays: [],    // أيام وعد المستخدم بالتمرين فيها
  variableRewardNext: 0, // اليوم التالي الذي ستظهر فيه مكافأة مفاجئة
  coachMemory: {
    // ذاكرة طويلة المدى للمدرب
    weakDays: [],          // أيام يتخطاها المستخدم باستمرار
    skippedExercises: {},  // تمارين يتخطاها كثيراً {id: count}
    personality: '',       // 'needs_push' | 'self_motivated' | 'detail_oriented'
    lastAdvice: '',        // آخر نصيحة قدّمها المدرب
    promises: [],          // ما وعد به المستخدم [{text, day, done}]
    patterns: {},          // أنماط مكتشفة {bestDay, avgSession, trend}
    proactiveShown: 0,     // آخر يوم أظهر فيه المدرب رسالة استباقية
    achievements: []       // لحظات مميزة تستحق التذكر
  }  // FIX: تتبع السعرات المضافة يدوياً لمنع التكرار
};
function loadState(){try{
  // Migrate from old fitpulse_S key if exists
  const old=localStorage.getItem('fitpulse_S');
  if(old){localStorage.setItem('azem_S',old);localStorage.removeItem('fitpulse_S');}
  const r=localStorage.getItem('azem_S');
  if(r){const p=JSON.parse(r);S={...S,...p};
    if(S.mode==='tv') S.mode='mobile'; // migrate: tv mode removed
    // FIX: مزامنة startDate بين S.startDate وS.user.startDate
    if(S.user?.startDate && !S.startDate) S.startDate = S.user.startDate;
    if(S.startDate && S.user && !S.user.startDate) S.user.startDate = S.startDate;
    // FIX: تهيئة _manualExCal إذا لم يكن موجوداً
    if(!S._manualExCal) S._manualExCal = {};
    if(!S.userLevel) S.userLevel = 1;
    // تنظيف apiKey خاطئ — يجب أن يبدأ بـ gsk_ أو يكون فارغاً
    if (S.apiKey && !S.apiKey.startsWith('gsk_')) {
      console.warn('[AZEM] Invalid apiKey cleared:', S.apiKey.slice(0,8));
      S.apiKey = '';
      saveState();
    }
    if(S.streakFreezes === undefined) S.streakFreezes = 1;
    // مزامنة programDays مع fitnessLevel
    if (S.user?.fitnessLevel === 'beginner'  && (!S.user.programDays || S.user.programDays === 30)) S.user.programDays = 21;
    if (S.user?.fitnessLevel === 'advanced'  && (!S.user.programDays || S.user.programDays === 30)) S.user.programDays = 45;
    if(S.xp === undefined) S.xp = 0;
    if(S.xpLevel === undefined) S.xpLevel = 1;
    if(!S.identityTitle) S.identityTitle = '';
    if(!S.commitmentDays) S.commitmentDays = [];
    if(!S.variableRewardNext) S.variableRewardNext = 0;
    if(S.weeklyChallenge === undefined) S.weeklyChallenge = null;
    if(!S.coachMemory) S.coachMemory = {
      weakDays:[], skippedExercises:{}, personality:'',
      lastAdvice:'', promises:[], patterns:{},
      proactiveShown:0, achievements:[]
    };
  }
}catch(e){}}
// Debounced saveState — يمنع الكتابة المتكررة في أقل من 300ms
let _saveDebounceTimer = null;
function saveState(immediate = false) {
  if (immediate) {
    _doSaveState();
    return;
  }
  clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(_doSaveState, 300);
}
function _doSaveState() {
  try {
    localStorage.setItem('azem_S', JSON.stringify(S));
  } catch(e) {
    // FIX: QuotaExceededError — تخفيف تدريجي بدون تلويث S في الذاكرة
    try {
      const slim = JSON.parse(JSON.stringify(S));
      const deletedImages = [];

      // 1. إزالة صور base64 من محادثات المدرب
      if (slim.coachHistory) {
        slim.coachHistory = slim.coachHistory.map(m => {
          if (Array.isArray(m.content)) {
            return { ...m, content: m.content
              .filter(p => p.type !== 'image_url')
              .concat([{type:'text', text:'[صورة محذوفة لتوفير مساحة]'}])
            };
          }
          return m;
        });
      }
      // 2. الاحتفاظ بآخر 20 رسالة فقط من المدرب
      if (slim.coachHistory && slim.coachHistory.length > 20) {
        slim.coachHistory = slim.coachHistory.slice(-20);
      }
      // 3. حذف الصور المخصصة الكبيرة (>300KB) مع تتبع ما حُذف
      if (slim.customImages) {
        Object.keys(slim.customImages).forEach(k => {
          if (slim.customImages[k]?.length > 300000) {
            deletedImages.push(k);
            delete slim.customImages[k];
          }
        });
      }

      localStorage.setItem('azem_S', JSON.stringify(slim));
      // FIX: نُحدّث S فقط للحقول التي تغيرت — لا نلوّث customImages في الذاكرة
      S.coachHistory = slim.coachHistory;
      // نُبقي S.customImages كما هو في الذاكرة — فقط localStorage يفقدها

      const msg = deletedImages.length > 0
        ? `⚠️ مساحة ممتلئة — حُذفت صور: ${deletedImages.join(', ')} من التخزين المحلي`
        : '⚠️ مساحة ممتلئة — حُذفت محادثات قديمة';
      showMiniToast(msg);
    } catch(e2) {
      // آخر محاولة: احتفظ فقط بالبيانات الأساسية
      try {
        const minimal = {
          currentDay: S.currentDay, completedDays: S.completedDays,
          calories: S.calories, streak: S.streak, theme: S.theme,
          mode: S.mode, lang: S.lang, user: S.user,
          onboardingDone: S.onboardingDone
        };
        localStorage.setItem('azem_S', JSON.stringify(minimal));
        showMiniToast('❌ التخزين ممتلئ — تم حفظ البيانات الأساسية فقط');
      } catch(e3) {
        showMiniToast('❌ التخزين ممتلئ تماماً — يرجى مسح بيانات المتصفح');
      }
    }
  }
}
loadState();

/* ══════ EXERCISES ══════ */
// GIF helper - inline data
// جدول ترجمة من IDs التمارين إلى مفاتيح gifs.js
const GIF_KEY_MAP = {
  rope:     'jumprope',
  burpee:   'burpee',
  highknee: 'highknees',
  sqjump:   'squat',
  starjump: 'jumpingjack',
  climber:  'mountainclimber',
  boxing:   'shadowbox',
  plank:    'plank',
  crunch:   'crunch',
  legrise:  'crunch',
  bicycle:  'oblique',
  russian:  'russian',
  hollow:   'plank',
  pushup:   'pushup',
  squat:    'squat',
  chair:    'dip',
  neck:     'rest',
  shoulder: 'rest',
  chest:    'pushup',
  hamstring:'lunge',
  quad:     'squat',
  hip:      'glute',
  spine:    'superman',
  calf:         'wallsit',
  pike_push:    'pushup',
  side_plank:   'plank',
  jump_lunge:   'lunge',
  diamond:      'pushup',
  bottle_curl:  'curl',
  bottle_press: 'pushup',
  bottle_row:   'row',
  lateral_raise:'rest',
};
function getExGif(exId) {
  let src = window.EXERCISE_GIFS;
  if (!src || !Object.keys(src).length) {
    src = (typeof GIFS!=='undefined'&&Object.keys(GIFS||{}).length) ? GIFS
        : (typeof EXERCISE_GIFS!=='undefined'&&Object.keys(EXERCISE_GIFS||{}).length) ? EXERCISE_GIFS
        : (typeof GIF_DATA!=='undefined') ? GIF_DATA : null;
    if (src) window.EXERCISE_GIFS = src;
  }
  if (!src || !Object.keys(src).length) return null;
  const key = GIF_KEY_MAP[exId] || exId;
  return src[key] || src[exId] || null;
}
function gifsLoaded() {
  return window.EXERCISE_GIFS && Object.keys(window.EXERCISE_GIFS).length > 0;
}

const EXERCISES = [
  {id:'rope',    nameAr:'نط الحبل',      nameEn:'Jump Rope',        icon:'🪢',color:'#f5c518',muscles:'الساقان، القلب',            type:'timer',sets:3,reps:60, repsLabel:'ثانية',rest:30,steps:['أمسك طرفي الحبل بكلتا يديك','دوّر الحبل من المعصمين','اقفز بكلتا القدمين معاً','حافظ على الظهر مستقيماً','ابدأ ببطء ثم زِد السرعة']},
  {id:'burpee',  nameAr:'بيربيز',        nameEn:'Burpees',          icon:'🔥',color:'#ff4500',muscles:'الجسم كاملاً',             type:'reps',sets:3,reps:10, rest:45,steps:['قف منتصباً','انحنِ وضع يديك على الأرض','اقفز للوضع الانبطاحي','نفّذ ضغطة واحدة','اقفز للأعلى مع رفع الذراعين']},
  {id:'highknee',nameAr:'رفع الركبة',    nameEn:'High Knees',       icon:'🦵',color:'#ff8c00',muscles:'الفخذ، القلب',             type:'timer',sets:3,reps:40, repsLabel:'ثانية',rest:30,steps:['قف منتصباً','ارفع ركبتك اليسرى لمستوى الخصر','بدّل بسرعة مع اليمنى','حرك ذراعيك بشكل معاكس','إيقاع سريع ومنتظم']},
  {id:'sqjump',  nameAr:'قرفصاء قفز',   nameEn:'Jump Squat',       icon:'⬆️',color:'#ffd700',muscles:'الفخذ، الأرداف',           type:'reps',sets:3,reps:15, rest:45,steps:['قف بعرض الكتفين','انزل في القرفصاء','اندفع للأعلى بقوة','هبوط ناعم على مشط القدم','انزل مباشرة للتالية']},
  {id:'starjump',nameAr:'قفز النجمة',    nameEn:'Star Jump',        icon:'⭐',color:'#00b4d8',muscles:'الجسم كاملاً',             type:'reps',sets:3,reps:20, rest:30,steps:['قف بأقدام متلاصقة','اقفز وافرد ساقيك ويديك','عُد للوضع الأول','ركبتان مرنتان عند الهبوط','إيقاع منتظم']},
  {id:'climber', nameAr:'متسلق الجبل',  nameEn:'Mountain Climbers',icon:'⛰️',color:'#4ade80',muscles:'القلب، البطن، الكتفان',     type:'timer',sets:3,reps:40, repsLabel:'ثانية',rest:30,steps:['وضع الضغط','جسمك خط مستقيم','اشحن ركبتك اليسرى للصدر','بدّل بسرعة','إيقاع سريع']},
  {id:'boxing',  nameAr:'ملاكمة هوائية',nameEn:'Shadow Boxing',    icon:'🥊',color:'#a855f7',muscles:'الذراعان، القلب، الكتفان', type:'timer',sets:3,reps:60, repsLabel:'ثانية',rest:45,steps:['وضع الحارس','لكمات مستقيمة سريعة','تنوع بين العلوية والسفلية','تحرك للأمام والخلف','أخرج كل طاقتك']},
  {id:'plank',   nameAr:'البلانك',       nameEn:'Plank Hold',       icon:'🧘',color:'#06b6d4',muscles:'البطن، الظهر، الكتفان',    type:'timer',sets:3,reps:45, repsLabel:'ثانية',rest:30,steps:['ارتفع على الساعدين','ساعدان موازيان تحت الكتفين','جسمك خط مستقيم','اضغط البطن للداخل','تنفس بانتظام']},
  {id:'crunch',  nameAr:'الكرنش',        nameEn:'Crunches',         icon:'💪',color:'#f59e0b',muscles:'عضلة البطن الأمامية',      type:'reps',sets:3,reps:20, rest:30,steps:['استلقِ واثنِ ركبتيك','يداك خلف رأسك بخفة','ارفع كتفيك بعضلات البطن','توقف لحظة عند القمة','الزفير عند الرفع']},
  {id:'legrise', nameAr:'رفع الساقين',  nameEn:'Leg Raises',       icon:'🦿',color:'#e11d48',muscles:'البطن السفلي، الحوض',      type:'reps',sets:3,reps:15, rest:30,steps:['استلقِ على الظهر','يداك تحت الأرداف','ارفع ساقيك حتى 90 درجة','انزلهما ببطء','الظهر يلاصق الأرض']},
  {id:'bicycle', nameAr:'كرنش الدراجة', nameEn:'Bicycle Crunch',   icon:'🚲',color:'#0ea5e9',muscles:'البطن الجانبي، الريكتوس',  type:'reps',sets:3,reps:20, rest:30,steps:['استلقِ ويداك خلف الرأس','ارفع ركبتيك 90 درجة','لمس كوع اليسار بركبة اليمين','تناوب مستمر','لا تشد الرقبة']},
  {id:'russian', nameAr:'اللف الروسي',  nameEn:'Russian Twist',    icon:'🌀',color:'#8b5cf6',muscles:'البطن الجانبي، الخصر',     type:'reps',sets:3,reps:20, rest:30,steps:['اجلس بزاوية 45 درجة','ارفع قدميك قليلاً','دوّر الجذع يساراً ثم يميناً','الحركة من الخصر','ضم يديك أمامك']},
  {id:'hollow',  nameAr:'هولو هولد',    nameEn:'Hollow Hold',      icon:'🎯',color:'#ec4899',muscles:'البطن الكامل، الكور',      type:'timer',sets:3,reps:30, repsLabel:'ثانية',rest:30,steps:['استلقِ ويداك فوق رأسك','ارفع كتفيك وساقيك معاً','شكل قارب مقعّر','اضغط البطن','تنفس بانتظام']},
  {id:'pushup',  nameAr:'الضغط',         nameEn:'Push-Ups',         icon:'💥',color:'#f97316',muscles:'الصدر، الكتفان، الترايسيبس',type:'reps',sets:3,reps:15, rest:45,steps:['كفاك بعرض الكتفين','جسمك خط مستقيم','انزل حتى يقارب الصدر الأرض','ادفع للأعلى','لا تنزل البطن']},
  {id:'squat',   nameAr:'القرفصاء',      nameEn:'Squats',           icon:'🏋️',color:'#84cc16',muscles:'الفخذ الأمامي والخلفي، الأرداف',type:'reps',sets:3,reps:20,rest:45,steps:['قف بعرض الكتفين','ظهرك مستقيم وصدرك للأعلى','انزل حتى الفخذ موازٍ للأرض','ركبتاك باتجاه الأصابع','ارتفع بدفع من الكعبين']},
  {id:'chair',   nameAr:'تدفيع الكرسي', nameEn:'Chair Dips',       icon:'🪑',color:'#14b8a6',muscles:'الترايسيبس، الصدر الأسفل',  type:'reps',sets:3,reps:12, rest:45,steps:['يداك على حافة كرسي ثابت','مدّ ساقيك للأمام','انزل بثني الكوعين 90 درجة','ادفع للأعلى','ظهرك قريب من الكرسي']},

  /* ══ تمارين مقاومة الجسم المتقدمة ══ */
  {id:'pike_push', nameAr:'ضغط البايك',    nameEn:'Pike Push-Up',     icon:'🔺',color:'#a78bfa',muscles:'الكتفان، الترايسيبس، الصدر العلوي',type:'reps',sets:3,reps:10,rest:45,steps:['ابدأ بوضع الضغط العادي','ارفع وركيك للأعلى حتى يصبح جسمك بشكل مثلث','انثنِ بمرفقيك ونزّل رأسك نحو الأرض','ادفع للأعلى بقوة الكتفين','حافظ على أوتار الركبة مشدودة']},
  // ── تمارين قوة إضافية ──
  {id:'lunge',    nameAr:'الخطوة الأمامية',     nameEn:'Lunges',            icon:'🦵',color:'#f59e0b',muscles:'الفخذ، الأرداف',      type:'reps', sets:3,reps:12, rest:45, steps:['قف منتصباً','خطوة كبيرة للأمام','انزل حتى تلامس الركبة الأرض','عد للخلف','بدّل الساقين']},
  {id:'glute',    nameAr:'رفع الورك',            nameEn:'Glute Bridge',      icon:'🍑',color:'#ec4899',muscles:'الأرداف، الظهر السفلي', type:'reps', sets:3,reps:15, rest:40, steps:['استلقِ على ظهرك','اثنِ ركبتيك','ارفع الورك للأعلى حتى يستقيم الجسم','اثبت ثانية','انزل ببطء']},
  {id:'superman', nameAr:'سوبرمان',              nameEn:'Superman Hold',     icon:'🦸',color:'#3b82f6',muscles:'الظهر، الأرداف',        type:'reps', sets:3,reps:12, rest:40, steps:['استلقِ على البطن','مد يديك أمامك','ارفع الذراعين والرجلين معاً','اثبت ثانيتين','انزل ببطء']},
  {id:'sideplank',nameAr:'البلانك الجانبي',      nameEn:'Side Plank',        icon:'📐',color:'#8b5cf6',muscles:'الكور الجانبي، الورك',   type:'timer',sets:2,reps:30, rest:40, steps:['استلقِ على الجانب','ارفع جسمك على ساعدك وقدمك الجانبية','جسمك خط مستقيم','اثبت المدة المطلوبة','كرر للجانب الآخر']},
  {id:'jackjump', nameAr:'القفز المتقاطع',       nameEn:'Jumping Jacks',     icon:'⭐',color:'#f97316',muscles:'الجسم كامل، القلب',      type:'reps', sets:3,reps:30, rest:40, steps:['قف منتصباً','اقفز وافتح ذراعيك وساقيك','اقفز مجدداً وأعدهما','استمر بإيقاع منتظم']},
  {id:'tricpush', nameAr:'ضغط ضيق الماسة',       nameEn:'Diamond Push-Up',   icon:'💎',color:'#14b8a6',muscles:'الترايسيبس، الصدر',     type:'reps', sets:3,reps:10, rest:50, steps:['يداك في شكل ماسة تحت الصدر','انزل ببطء','المرفقان قريبان من الجسم','ارفع للأعلى','حافظ على استقامة الظهر']},
  {id:'calfraise',nameAr:'رفع أصابع القدم',      nameEn:'Calf Raises',       icon:'🦶',color:'#06b6d4',muscles:'عضلة الربلة',            type:'reps', sets:3,reps:20, rest:30, steps:['قف منتصباً','ارفع كعبيك ببطء','اثبت في الأعلى ثانية','انزل ببطء','يمكن استخدام خطوة للتمدد أكثر']},
  {id:'side_plank',nameAr:'بلانك جانبي',   nameEn:'Side Plank',       icon:'↔️',color:'#0ea5e9',muscles:'البطن الجانبي، الخاصرة، الكتف',type:'timer',sets:3,reps:30,repsLabel:'ثانية',rest:30,steps:['استلقِ على الجنب','ارفع جسمك على ساعدك الواحد','جسمك خط مستقيم من الرأس للقدم','اضغط عضلات البطن الجانبية','اثبت ثم بدّل الجانب']},
  {id:'jump_lunge',nameAr:'لنج قفز',        nameEn:'Jump Lunge',       icon:'⚡',color:'#f59e0b',muscles:'الفخذ الأمامي، الأرداف، السمانة',type:'reps',sets:3,reps:12,rest:45,steps:['قف في وضع اللنج','انزل حتى تقترب الركبة الخلفية من الأرض','اندفع للأعلى بقوة','بدّل وضع ساقيك في الهواء','هبوط ناعم بالوضع المعاكس']},
  {id:'diamond',   nameAr:'ضغط الماسة',    nameEn:'Diamond Push-Up',  icon:'💎',color:'#ec4899',muscles:'الترايسيبس، الصدر الداخلي',type:'reps',sets:3,reps:10,rest:45,steps:['يداك بشكل مثلث تحت الصدر','أصابعك تلمس مشكّلةً ماسة','انزل بضغط الترايسيبس','ادفع للأعلى ببطء','المرفقان قريبان من الجسم']},

  /* ══ أثقال منزلية خفيفة (قارورة ماء / دمبل) ══ */
  {id:'bottle_curl',nameAr:'كيرل بالقارورة',nameEn:'Bottle Curl',     icon:'💧',color:'#22c55e',muscles:'البايسيبس، الساعد',type:'reps',sets:3,reps:15,rest:30,steps:['أمسك قارورتي ماء أو دمبل خفيف','ذراعاك على الجانبين','اثنِ المرفق ببطء ورفع القارورة','اضغط البايسيبس في الأعلى','انزل ببطء ولا تخطف']},
  {id:'bottle_press',nameAr:'ضغط كتف قارورة',nameEn:'Shoulder Press', icon:'🏺',color:'#f97316',muscles:'الكتفان، الترايسيبس، الصدر العلوي',type:'reps',sets:3,reps:12,rest:30,steps:['أمسك القاروتين عند مستوى الكتفين','ظهرك مستقيم جالساً أو واقفاً','ادفع للأعلى حتى تمتد الذراعان','انزل ببطء إلى مستوى الأذنين','لا تقوّس ظهرك']},
  {id:'bottle_row', nameAr:'رو بالقارورة', nameEn:'Bent-Over Row',     icon:'🏋️',color:'#8b5cf6',muscles:'الظهر العريض، البايسيبس، الكتف الخلفي',type:'reps',sets:3,reps:12,rest:30,steps:['انحنِ للأمام 45 درجة مع ظهر مستقيم','قارورتان معلقتان للأسفل','اسحب للأعلى نحو الخصر بضغط الظهر','اثبت لحظة عند القمة','انزل ببطء']},
  {id:'lateral_raise',nameAr:'رفع جانبي',  nameEn:'Lateral Raise',    icon:'↕️',color:'#06b6d4',muscles:'الكتف الجانبي، الدلتا',type:'reps',sets:3,reps:12,rest:30,steps:['ذراعاك على الجانبين مع القاروتين','ارفع الذراعين جانبياً حتى مستوى الكتف','مرفقاك خفيف الانثناء (لا مستقيمان تماماً)','توقف لحظة عند الأعلى','انزل ببطء']},
];


/* ══════════════════════════════════════════
   CALORIE ENGINE — MET-based calculation
   Formula: cal = MET × weight(kg) × duration(h)
══════════════════════════════════════════ */
const MET_BY_ID = {
  rope:     10.0,   // jump rope — vigorous
  burpee:    8.5,   // full body explosive
  highknee:  7.5,   // high knees cardio
  sqjump:    6.5,   // jump squats
  starjump:  7.0,   // star jumps / jumping jacks
  climber:   8.0,   // mountain climbers
  boxing:    6.0,   // shadow boxing
  plank:     3.5,   // isometric hold
  crunch:    3.8,   // abs crunch
  legrise:   3.5,   // leg raises
  bicycle:   4.0,   // bicycle crunch
  russian:   4.0,   // russian twist
  hollow:    3.5,   // hollow hold
  pushup:    5.0,   // push-ups
  squat:     5.0,   // bodyweight squat
  chair:     4.5,   // chair dips
  // Advanced bodyweight
  pike_push:    5.5,
  side_plank:   3.8,
  jump_lunge:   7.0,
  diamond:      5.2,
  // Home weights
  bottle_curl:  3.5,
  bottle_press: 4.0,
  bottle_row:   4.0,
  lateral_raise:3.5,
};
const MET_BY_TYPE = { timer: 4.0, reps: 5.0, cardio: 7.5, distance: 7.0 };

// FIX: تقدير MET للتمارين المخصصة بناءً على اسمها أو نوعها
function _estimateMETForCustom(ex) {
  if (!ex) return 5.0;
  // إذا كان timer → عادةً cardio/core → MET أعلى
  if (ex.type === 'timer') return 5.5;
  // نبحث في اسم التمرين عن كلمات دالة
  const nameLower = ((ex.nameEn || '') + ' ' + (ex.nameAr || '')).toLowerCase();
  if (/jump|burpee|hiit|rope|sprint|cardio|run/.test(nameLower)) return 8.0;
  if (/push|pull|squat|lunge|press|row|curl/.test(nameLower)) return 5.0;
  if (/plank|hold|static|balance/.test(nameLower)) return 3.5;
  if (/stretch|flex|yoga/.test(nameLower)) return 2.5;
  return MET_BY_TYPE[ex.type] ?? 5.0;
}

function calcExCal(ex, kgParam) {
  if (!ex) return 10;
  const kg = parseFloat(kgParam ?? S?.user?.weight) || 70;
  // FIX: للتمارين المخصصة التي ليس لها MET محدد نستخدم التقدير الذكي
  let met = MET_BY_ID[ex.id];
  if (met === undefined || met === null) {
    met = _estimateMETForCustom(ex);
  }
  // Duration in minutes:
  // timer-type: reps = seconds  → sets × reps / 60
  // reps-type:  ~3 s per rep    → sets × reps × 3 / 60
  const durationMins = ex.type === 'timer'
    ? (ex.sets * ex.reps) / 60
    : (ex.sets * ex.reps * 3) / 60;
  const mins = Math.max(0.5, durationMins);
  return Math.max(5, Math.round(met * kg * mins / 60));
}

function calcScheduleCal(sched, kg) {
  if (!sched || !sched.exercises || !sched.exercises.length) return 0;
  const total = sched.exercises.reduce((s, ex) => s + calcExCal(ex, kg), 0);
  // Add ~15% for warm-up/cool-down activity and between-set movement
  return Math.round(total * 1.15);
}

const STRETCH_EXERCISES = [
  {id:'neck',    nameAr:'تمدد الرقبة',      icon:'🧘', dur:30, steps:['أمل رأسك ببطء للجانب الأيمن','اثبت 15 ثانية','كرر للجانب الأيسر']},
  {id:'shoulder',nameAr:'تمدد الكتف',       icon:'💪', dur:30, steps:['مد ذراعك للأمام عبر الصدر','اضغط بذراعك الأخرى','اثبت 15 ثانية لكل جانب']},
  {id:'chest',   nameAr:'فتح الصدر',        icon:'🫁', dur:40, steps:['شبّك يديك خلف ظهرك','ارفع صدرك للأعلى','تنفس بعمق واثبت']},
  {id:'hamstring',nameAr:'تمدد الهامسترينج',icon:'🦵', dur:45, steps:['اجلس على الأرض','مد ساقيك أمامك','ابسط إلى الأمام وامسك قدميك']},
  {id:'quad',    nameAr:'تمدد الفخذ الأمامي',icon:'🏃', dur:30, steps:['قف على قدم واحدة','اسحب قدمك الأخرى للخلف','اثبت 15 ثانية لكل ساق']},
  {id:'hip',     nameAr:'فتح الوركين',      icon:'🧘', dur:45, steps:['استلقِ على ظهرك','اثنِ ركبة واحدة على الأخرى','اسحب برفق نحو صدرك']},
  {id:'spine',   nameAr:'لف العمود الفقري', icon:'🌀', dur:40, steps:['اجلس باستقامة','الف جذعك ببطء يميناً','اثبت ثم كرر لليسار']},
  {id:'calf',    nameAr:'تمدد الساق السفلية',icon:'👟', dur:30, steps:['قف أمام الجدار','خطوة للخلف مع قدم مستقيمة','اضغط الكعب للأرض']},
];

const WEEK_SCHEDULE = [
  {day:'الاثنين', type:'rope_hiit', labelKey:'typeRopeHiit',   label:'حبل+HIIT',  exercises:['rope','burpee','highknee','sqjump','starjump','climber']},
  {day:'الثلاثاء',type:'circuit',   labelKey:'typeCircuit',     label:'سيركيت',   exercises:['burpee','sqjump','climber','boxing','pushup','squat']},
  {day:'الأربعاء',type:'rope_core', labelKey:'typeRopeCore',    label:'حبل+كور',   exercises:['rope','plank','crunch','legrise','bicycle','russian']},
  {day:'الخميس', type:'rest',      labelKey:'typeActiveRest',  label:'راحة نشطة', exercises:[]},
  {day:'الجمعة', type:'hiit_core', labelKey:'typeHiitCore',    label:'HIIT+كور',  exercises:['burpee','highknee','climber','boxing','crunch','hollow']},
  {day:'السبت',  type:'strength',  labelKey:'typeStrength',    label:'قوة',       exercises:['pushup','squat','chair','plank','legrise','russian']},
  {day:'الأحد',  type:'rest',      labelKey:'typeRest',        label:'راحة',      exercises:[]},
];

// ── برنامج المبتدئين 21 يوم ──
// أخف، أبطأ، راحة أكثر، تمارين أسهل
const BEGINNER_SCHEDULE = [
  {day:1,  type:'intro',    label:'تعارف',     exercises:['pushup','squat','plank']},
  {day:2,  type:'rest',     label:'راحة',      exercises:[]},
  {day:3,  type:'cardio1',  label:'كارديو خفيف',exercises:['highknee','starjump','climber']},
  {day:4,  type:'rest',     label:'راحة',      exercises:[]},
  {day:5,  type:'core1',    label:'كور',       exercises:['crunch','legrise','plank']},
  {day:6,  type:'rest',     label:'راحة',      exercises:[]},
  {day:7,  type:'rest',     label:'راحة كاملة',exercises:[]},
  {day:8,  type:'strength1',label:'قوة',       exercises:['pushup','squat','chair']},
  {day:9,  type:'rest',     label:'راحة',      exercises:[]},
  {day:10, type:'cardio2',  label:'كارديو',    exercises:['highknee','starjump','sqjump','climber']},  // FIX-E: boxjump→sqjump (boxjump undefined)
  {day:11, type:'rest',     label:'راحة',      exercises:[]},
  {day:12, type:'core2',    label:'كور+',      exercises:['crunch','bicycle','legrise','plank']},
  {day:13, type:'rest',     label:'راحة',      exercises:[]},
  {day:14, type:'rest',     label:'استراحة أسبوعية',exercises:[]},
  {day:15, type:'hiit1',    label:'HIIT',      exercises:['burpee','highknee','climber','sqjump']},
  {day:16, type:'rest',     label:'راحة',      exercises:[]},
  {day:17, type:'strength2',label:'قوة+',      exercises:['pushup','squat','chair','plank']},
  {day:18, type:'rest',     label:'راحة',      exercises:[]},
  {day:19, type:'fullbody', label:'جسم كامل',  exercises:['burpee','pushup','squat','crunch','climber']},
  {day:20, type:'rest',     label:'راحة',      exercises:[]},
  {day:21, type:'finale',   label:'🎉 الختام', exercises:['pushup','squat','plank','crunch','highknee','burpee']},
];


// ── برنامج المتوسطين 30 يوم ──
const INTERMEDIATE_SCHEDULE = [
  // الأسبوع 1: بناء الأساس
  {day:1,  type:'strength',   label:'قوة علوية',    exercises:['pushup','widepush','chair','plank']},
  {day:2,  type:'cardio',     label:'كارديو',        exercises:['highknee','sqjump','climber','jackjump']},
  {day:3,  type:'core',       label:'كور',           exercises:['crunch','legrise','bicycle','russian','plank']},
  {day:4,  type:'rest',       label:'راحة نشطة',     exercises:[]},
  {day:5,  type:'strength',   label:'قوة سفلية',    exercises:['squat','lunge','glute','calfraise']},
  {day:6,  type:'hiit',       label:'HIIT',          exercises:['burpee','highknee','climber','sqjump','starjump']},
  {day:7,  type:'rest',       label:'راحة',          exercises:[]},
  // الأسبوع 2: تصعيد
  {day:8,  type:'strength',   label:'قوة+',          exercises:['pushup','tricpush','chair','superman','plank']},
  {day:9,  type:'cardio',     label:'كارديو+',       exercises:['rope','highknee','climber','jackjump']},
  {day:10, type:'core',       label:'كور+',          exercises:['crunch','legrise','bicycle','hollow','russian']},
  {day:11, type:'rest',       label:'راحة نشطة',     exercises:[]},
  {day:12, type:'strength',   label:'قوة سفلية+',   exercises:['squat','lunge','glute','sideplank','calfraise']},
  {day:13, type:'hiit',       label:'HIIT+',         exercises:['burpee','highknee','climber','boxing','sqjump']},
  {day:14, type:'rest',       label:'راحة أسبوعية',  exercises:[]},
  // الأسبوع 3: تكثيف
  {day:15, type:'circuit',    label:'سيركيت',        exercises:['pushup','squat','crunch','climber','plank','lunge']},
  {day:16, type:'cardio',     label:'كارديو مكثف',   exercises:['rope','burpee','highknee','sqjump','starjump']},
  {day:17, type:'strength',   label:'قوة شاملة',    exercises:['pushup','chair','squat','glute','superman']},
  {day:18, type:'rest',       label:'راحة',          exercises:[]},
  {day:19, type:'hiit_core',  label:'HIIT+كور',      exercises:['burpee','climber','boxing','crunch','hollow','legrise']},
  {day:20, type:'strength',   label:'قوة+تمدد',     exercises:['pushup','lunge','sideplank','bicycle','russian']},
  {day:21, type:'rest',       label:'راحة',          exercises:[]},
  // الأسبوع 4: ذروة
  {day:22, type:'fullbody',   label:'جسم كامل',     exercises:['burpee','pushup','squat','crunch','climber','plank']},
  {day:23, type:'cardio',     label:'كارديو ذروة',  exercises:['rope','highknee','sqjump','climber','jackjump']},
  {day:24, type:'strength',   label:'قوة ذروة',     exercises:['pushup','tricpush','squat','lunge','glute','superman']},
  {day:25, type:'rest',       label:'راحة',          exercises:[]},
  {day:26, type:'hiit',       label:'HIIT ذروة',     exercises:['burpee','highknee','climber','boxing','sqjump','starjump']},
  {day:27, type:'core',       label:'كور ذروة',     exercises:['crunch','legrise','hollow','bicycle','russian','sideplank']},
  {day:28, type:'rest',       label:'راحة',          exercises:[]},
  // نهاية البرنامج
  {day:29, type:'fullbody',   label:'جسم كامل نهائي',exercises:['burpee','pushup','squat','climber','crunch','plank','lunge']},
  {day:30, type:'finale',     label:'🎉 الختام',     exercises:['pushup','squat','burpee','plank','crunch','highknee','climber']},
];

// ── برنامج المتقدمين 45 يوم ──
const ADVANCED_SCHEDULE = [
  // المرحلة 1: أسابيع 1-2 (قوة + حجم)
  {day:1,  type:'strength_upper', label:'قوة علوية',   exercises:['pushup','widepush','tricpush','chair','plank','superman']},
  {day:2,  type:'cardio_hiit',    label:'كارديو HIIT',  exercises:['rope','burpee','highknee','sqjump','climber','jackjump']},
  {day:3,  type:'strength_lower', label:'قوة سفلية',   exercises:['squat','lunge','glute','calfraise','sideplank']},
  {day:4,  type:'core_advanced',  label:'كور متقدم',    exercises:['hollow','legrise','bicycle','russian','crunch','plank']},
  {day:5,  type:'rest',           label:'راحة نشطة',    exercises:[]},
  {day:6,  type:'fullbody',       label:'جسم كامل',    exercises:['burpee','pushup','squat','climber','boxing','crunch','plank']},
  {day:7,  type:'rest',           label:'راحة',         exercises:[]},
  {day:8,  type:'strength_upper', label:'قوة علوية+',  exercises:['pushup','widepush','tricpush','chair','dips','superman','plank']},
  {day:9,  type:'cardio_hiit',    label:'HIIT مكثف',    exercises:['rope','burpee','sqjump','highknee','climber','starjump','jackjump']},
  {day:10, type:'strength_lower', label:'قوة سفلية+',  exercises:['squat','lunge','glute','calfraise','sideplank','glute']},
  {day:11, type:'core_advanced',  label:'كور+',         exercises:['hollow','legrise','bicycle','russian','plank','sideplank']},
  {day:12, type:'rest',           label:'راحة',         exercises:[]},
  {day:13, type:'fullbody',       label:'جسم كامل+',   exercises:['burpee','pushup','squat','climber','boxing','crunch','lunge','plank']},
  {day:14, type:'rest',           label:'راحة أسبوعية', exercises:[]},
  // المرحلة 2: أسابيع 3-4 (تحمل + قوة)
  {day:15, type:'circuit',        label:'سيركيت 1',     exercises:['pushup','squat','climber','lunge','crunch','burpee']},
  {day:16, type:'hiit_advanced',  label:'HIIT ذروة',    exercises:['rope','burpee','sqjump','highknee','climber','boxing','jackjump']},
  {day:17, type:'strength_upper', label:'قوة علوية',   exercises:['pushup','widepush','tricpush','superman','chair','plank']},
  {day:18, type:'core_advanced',  label:'كور متقدم',   exercises:['hollow','legrise','bicycle','russian','sideplank','crunch']},
  {day:19, type:'rest',           label:'راحة',         exercises:[]},
  {day:20, type:'strength_lower', label:'قوة سفلية',   exercises:['squat','lunge','glute','calfraise','sideplank']},
  {day:21, type:'rest',           label:'راحة',         exercises:[]},
  {day:22, type:'circuit',        label:'سيركيت 2',     exercises:['pushup','squat','burpee','lunge','crunch','climber','boxing']},
  {day:23, type:'hiit_advanced',  label:'HIIT+',        exercises:['rope','burpee','highknee','sqjump','climbing','jackjump','starjump']},
  {day:24, type:'fullbody',       label:'جسم كامل',    exercises:['pushup','squat','crunch','lunge','climber','plank','superman']},
  {day:25, type:'core_advanced',  label:'كور+',         exercises:['hollow','legrise','bicycle','russian','sideplank','plank']},
  {day:26, type:'rest',           label:'راحة',         exercises:[]},
  {day:27, type:'strength',       label:'قوة شاملة',   exercises:['pushup','tricpush','widepush','squat','lunge','glute','chair']},
  {day:28, type:'rest',           label:'راحة أسبوعية', exercises:[]},
  // المرحلة 3: أسابيع 5-6 (ذروة + اختبار)
  {day:29, type:'circuit',        label:'سيركيت ذروة',  exercises:['burpee','pushup','squat','climber','lunge','crunch','boxing','plank']},
  {day:30, type:'hiit_advanced',  label:'HIIT نهائي',   exercises:['rope','burpee','highknee','sqjump','climber','jackjump','starjump','boxing']},
  {day:31, type:'strength_upper', label:'قوة علوية ذروة',exercises:['pushup','widepush','tricpush','chair','superman','plank','dips']},
  {day:32, type:'strength_lower', label:'قوة سفلية ذروة',exercises:['squat','lunge','glute','calfraise','sideplank']},
  {day:33, type:'rest',           label:'راحة',          exercises:[]},
  {day:34, type:'fullbody',       label:'جسم كامل ذروة',exercises:['burpee','pushup','squat','climber','boxing','crunch','lunge','hollow','plank']},
  {day:35, type:'rest',           label:'راحة',          exercises:[]},
  {day:36, type:'circuit',        label:'سيركيت نهائي',  exercises:['pushup','squat','burpee','climber','boxing','lunge','crunch','plank']},
  {day:37, type:'hiit_advanced',  label:'HIIT اختبار',   exercises:['rope','burpee','highknee','sqjump','climber','jackjump','boxing','starjump']},
  {day:38, type:'strength',       label:'قوة اختبار',   exercises:['pushup','widepush','tricpush','squat','lunge','glute','superman']},
  {day:39, type:'core_advanced',  label:'كور اختبار',   exercises:['hollow','legrise','bicycle','russian','sideplank','plank','crunch']},
  {day:40, type:'rest',           label:'راحة',          exercises:[]},
  {day:41, type:'fullbody',       label:'جسم كامل نهائي',exercises:['burpee','pushup','squat','climber','boxing','crunch','lunge','hollow','plank','superman']},
  {day:42, type:'rest',           label:'راحة أسبوعية',  exercises:[]},
  {day:43, type:'circuit',        label:'الجولة الأخيرة',exercises:['burpee','pushup','squat','lunge','climber','boxing','crunch','sideplank']},
  {day:44, type:'hiit_advanced',  label:'HIIT الأخير',   exercises:['rope','burpee','highknee','sqjump','climber','jackjump','starjump']},
  {day:45, type:'finale',         label:'🏆 الختام الأسطوري',exercises:['pushup','squat','burpee','plank','crunch','highknee','climber','lunge','hollow','superman']},
];

// ── دالة تحديد البرنامج حسب المستوى ──
function getProgramSchedule() {
  const prog = S.user?.program || 'standard';
  const level = S.user?.fitnessLevel || 'intermediate';
  if (prog === 'beginner'     || level === 'beginner')     return { schedule: BEGINNER_SCHEDULE,     days: 21 };
  if (prog === 'advanced'     || level === 'advanced')     return { schedule: ADVANCED_SCHEDULE,     days: 45 };
  return { schedule: INTERMEDIATE_SCHEDULE, days: 30 };
}

function getRepsLabel(ex) {
  if (!ex) return '';
  if (ex.type === 'timer')    return window.T ? window.T('lblSecs','ثانية') : (ex.repsLabel||'ثانية');
  if (ex.type === 'distance') return window.T ? window.T('lblMeters','م')   : (ex.repsLabel||'م');
  return window.T ? window.T('lblReps','تكرار') : (ex.repsLabel||'تكرار');
}

function getExName(ex) {
  if (!ex) return '';
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
  if (lang !== 'ar' && ex.nameEn) return ex.nameEn;
  return ex.nameAr || ex.nameEn || '';
}

function getExercisesLabel(count) {
  return count + ' ' + (window.T ? window.T('lblExercises','تمارين') : 'تمارين');
}

function getScheduleLabel(ws) {
  if (!ws) return '';
  if (ws.labelKey && window.T) return window.T(ws.labelKey, ws.label);
  return ws.label || '';
}

const PHASES = [
  {nameKey:'phaseFound', name:'التأسيس', icon:'🌱', days:'1-7',   start:1, end:7},
  {nameKey:'phaseBuilt', name:'البناء',   icon:'⚡', days:'8-14',  start:8, end:14},
  {nameKey:'phasePeak',  name:'الذروة',   icon:'🔥', days:'15-21', start:15,end:21},
  {nameKey:'phaseFinal', name:'الحسم',    icon:'🏆', days:'22-30', start:22,end:30},
];

function getPhaseName(phase) {
  if (!phase) return '';
  if (phase.nameKey && window.T) return window.T(phase.nameKey, phase.name);
  return phase.name || '';
}

// FIX#7: Extended week templates for programs > 30 days
// Weeks 1-4: foundation → Weeks 5-8: intensity → Weeks 9+: peak
const EXTENDED_WEEK_SCHEDULES = [
  // Weeks 1-2: Foundation (same as WEEK_SCHEDULE)
  null,
  // Weeks 3-4: Build — add advanced exercises
  [
    {day:'الاثنين', type:'rope_hiit',  label:'حبل+HIIT+', exercises:['rope','burpee','highknee','sqjump','jump_lunge','climber']},
    {day:'الثلاثاء',type:'circuit',    label:'سيركيت+',   exercises:['burpee','sqjump','climber','boxing','pushup','diamond','squat']},
    {day:'الأربعاء',type:'rope_core',  label:'حبل+كور+',  exercises:['rope','plank','side_plank','crunch','legrise','bicycle','russian']},
    {day:'الخميس', type:'rest',        label:'راحة نشطة', exercises:[]},
    {day:'الجمعة', type:'hiit_core',   label:'HIIT+كور+', exercises:['burpee','jump_lunge','climber','boxing','hollow','crunch']},
    {day:'السبت',  type:'strength',    label:'قوة+',      exercises:['pike_push','diamond','squat','chair','plank','side_plank']},
    {day:'الأحد',  type:'rest',        label:'راحة',      exercises:[]},
  ],
  // Weeks 5-6: Intensity — full advanced
  [
    {day:'الاثنين', type:'rope_hiit',  label:'حبل+HIIT متقدم', exercises:['rope','burpee','highknee','sqjump','jump_lunge','climber','boxing']},
    {day:'الثلاثاء',type:'circuit',    label:'سيركيت متقدم',   exercises:['pike_push','diamond','sqjump','climber','boxing','pushup','squat']},
    {day:'الأربعاء',type:'rope_core',  label:'حبل+كور متقدم',  exercises:['rope','hollow','side_plank','crunch','legrise','bicycle','russian']},
    {day:'الخميس', type:'rest',        label:'راحة نشطة',      exercises:[]},
    {day:'الجمعة', type:'hiit_core',   label:'HIIT قصوى',      exercises:['burpee','jump_lunge','climber','boxing','sqjump','starjump','highknee']},
    {day:'السبت',  type:'strength',    label:'قوة كاملة',      exercises:['pike_push','diamond','squat','chair','side_plank','hollow','legrise']},
    {day:'الأحد',  type:'rest',        label:'راحة',           exercises:[]},
  ],
];

function getWeekTemplate(weekNumber) {
  if (weekNumber <= 2) return WEEK_SCHEDULE;
  if (weekNumber <= 4) return EXTENDED_WEEK_SCHEDULES[1];
  return EXTENDED_WEEK_SCHEDULES[2];
}

/* ══════════════════════════════════════════
   SMART PROGRESSIVE OVERLOAD
   يُحلّل الأداء الفعلي ويُعدّل الشدة بذكاء
   بدلاً من الرفع الميكانيكي الثابت كل أسبوع
══════════════════════════════════════════ */
function calcSmartOverload(ex, week, day) {
  if (!ex) return { sets: ex?.sets || 3, reps: ex?.reps || 10 };

  const log = Object.values(S.trainingLog || {});
  const completedDays = S.completedDays || [];

  // ── تحليل الأداء الفعلي من آخر 3 أسابيع ──
  const recentWeeks = log
    .filter(e => e.exerciseIds?.includes(ex.id) && e.day < day)
    .sort((a,b) => b.day - a.day)
    .slice(0, 6);

  // كم مرة أُكمل هذا التمرين مقارنة بعدد مرات برمجته
  const scheduledCount = Math.max(1, Math.ceil((day-1) / 7) * 2);
  const completedCount = recentWeeks.length;
  const completionRate = completedCount / scheduledCount;

  // ── قرار الشدة ──
  let repsBonus = 0, setsBonus = 0;

  if (completionRate >= 0.85 && week >= 2) {
    // أداء ممتاز → زد التكرارات
    repsBonus = ex.type === 'timer'
      ? Math.min(week * 5, 30)   // +5 ثانية/أسبوع حتى 30 ثانية إضافية
      : Math.min(week * 2, 12);  // +2 تكرار/أسبوع حتى 12 إضافية
    // بعد الأسبوع 4: زد مجموعة
    if (week >= 4 && completionRate >= 0.9) setsBonus = 1;
  } else if (completionRate >= 0.6 && week >= 2) {
    // أداء متوسط → زد أقل
    repsBonus = ex.type === 'timer'
      ? Math.min(week * 3, 15)
      : Math.min(week * 1, 6);
  } else if (completionRate < 0.4 && week >= 3) {
    // أداء ضعيف → ثبّت أو خفّف
    repsBonus = ex.type === 'timer' ? -5 : -2;
    repsBonus = Math.max(repsBonus, -(ex.reps * 0.2)); // حد أقصى للتخفيف 20%
  }
  // Deload كل 4 أسابيع (أسبوع 4، 8، 12...)
  if (week % 4 === 0 && week > 0) {
    repsBonus = Math.round(repsBonus * 0.7); // تخفيف 30% كـ deload
  }

  return {
    sets: Math.max(2, (ex.sets || 3) + setsBonus),
    reps: Math.max(ex.type === 'timer' ? 20 : 5,
                   Math.round((ex.reps || 10) + repsBonus))
  };
}

function getDaySchedule(day) {
  const allEx = [...(S.customExercises||[]), ...EXERCISES];
  const customIds = S.customSchedule && S.customSchedule[day];
  const week = Math.ceil(day / 7);
  const level = S.user?.fitnessLevel || 'intermediate';

  // ── اختيار الجدول حسب المستوى ──
  let schedule;
  if (level === 'beginner')  schedule = BEGINNER_SCHEDULE;
  else if (level === 'advanced') schedule = ADVANCED_SCHEDULE;
  else schedule = null; // استخدام WEEK_SCHEDULE الديناميكي

  if (schedule) {
    const dayEntry = schedule.find(d => d.day === day);
    const ws = dayEntry || { day, type: 'rest', label: 'راحة', exercises: [] };
    if (customIds === 'rest') return { ...ws, type: 'rest', exercises: [] };
    const exIds = customIds || ws.exercises;
    const exercises = exIds.map(id => {
      const ex = allEx.find(e => e.id === id);
      if (!ex) return null;
      const load = calcSmartOverload(ex, week, day);
      if (level === 'beginner')
        return { ...ex, sets: Math.max(2, load.sets-1), reps: Math.max(5, Math.round(load.reps*0.75)) };
      if (level === 'advanced')
        return { ...ex, sets: Math.min(5, load.sets+1), reps: Math.round(load.reps*1.15) };
      return { ...ex, sets: load.sets, reps: load.reps };
    }).filter(Boolean);
    return { ...ws, exercises };
  }

  // ── الجدول الديناميكي (intermediate/standard) ──
  const weekTemplate = getWeekTemplate(week);
  const weekIdx = (day - 1) % 7;
  const ws = weekTemplate[weekIdx];
  if (customIds === 'rest') return { ...ws, type: 'rest', exercises: [] };
  const exIds = customIds || ws.exercises;
  const exercises = exIds.map(id => {
    const ex = allEx.find(e => e.id === id);
    if (!ex) return null;
    const smartLoad = calcSmartOverload(ex, week, day);
    return { ...ex, sets: smartLoad.sets, reps: smartLoad.reps };
  }).filter(Boolean);
  return { ...ws, exercises };
}

function getPhase(day) {
  // Beginner program phases
  if (S.user?.program === 'beginner') {
    if (day <= 7)  return { nameKey:'phaseDiscovery', name:'الاكتشاف', icon:'🌱', days:'1-7',  start:1,  end:7  };
    if (day <= 14) return { nameKey:'phaseBuilt',     name:'البناء',    icon:'⚡', days:'8-14', start:8,  end:14 };
    return           { nameKey:'phaseMastery',    name:'الإتقان',   icon:'🏆', days:'15-21',start:15, end:21 };
  }
  // Scale phases proportionally to programDays
  const prog = S.user?.programDays || 30;
  if (prog === 30) return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[3];
  // Dynamic: divide program into 4 equal quarters
  const q = Math.max(1, prog / 4); // FIX: منع q = 0 إذا كان programDays صغيراً
  const phases = [
    {...PHASES[0], start:1,              end:Math.floor(q)},
    {...PHASES[1], start:Math.floor(q)+1, end:Math.floor(q*2)},
    {...PHASES[2], start:Math.floor(q*2)+1, end:Math.floor(q*3)},
    {...PHASES[3], start:Math.floor(q*3)+1, end:prog},
  ];
  return phases.find(p => day >= p.start && day <= p.end) || phases[3];
}

/* ══════════════════════════════════════════
   LEVEL SYSTEM — نظام المستويات 1-10
   كل 3 أيام مكتملة = ترقية
   كل مستوى يغير شكل التطبيق
══════════════════════════════════════════ */


/* ══════════════════════════════════════════
   PSYCHOLOGY ENGINE
══════════════════════════════════════════ */

function checkVariableReward(dayCompleted) {
  const seed = (dayCompleted * 7 + (S.streak||0) * 3) % 10;
  if (seed < 3 || S.variableRewardNext === dayCompleted) {
    S.variableRewardNext = 0;
    const rewards = [
      '🎲 مفاجأة! يوم مميز — أداؤك يُحسب ضعفاً!',
      '⚡ مكافأة مفاجئة! شارة سرية فُتحت لك!',
      '🌟 رائع! اليوم يُحتسب مزدوجاً في التحدي!',
      '🎯 استثنائي! حرقت سعرات إضافية وهمية!',
    ];
    const msg = rewards[seed % rewards.length];
    setTimeout(() => {
      showMiniToast(msg);
      if (typeof launchConfetti === 'function') launchConfetti();
    }, 2000);
    if (!S.unlockedBadges.includes('surprise_star')) {
      S.unlockedBadges.push('surprise_star');
    }
    saveState();
    return true;
  }
  return false;
}

function getLossAversionMessage() {
  const streak = S.streak || 0;
  if (streak < 2) return null;
  const now = new Date();
  const hour = now.getHours();
  const trainHour = parseInt((S.user?.trainTime || '18:00').split(':')[0]);
  const hoursLeft = trainHour > hour ? trainHour - hour : 24 - hour + trainHour;
  if (hoursLeft <= 3 && hoursLeft > 0) {
    return { title: `⚠️ سلسلتك ${streak} يوم في خطر!`, msg: `متبقي ${hoursLeft} ${hoursLeft===1?'ساعة':'ساعات'} فقط!`, urgency: 'high' };
  }
  if (hoursLeft <= 6) {
    return { title: `🔥 ${streak} يوم — حافظ عليها`, msg: `تمرين 15 دقيقة يكفي!`, urgency: 'medium' };
  }
  return null;
}

function getNearMissMessage() {
  const done = (S.completedDays||[]).length;
  if (done === 6)  return '🎯 يوم واحد فقط للشارة الأسبوعية! أكمله اليوم!';
  if (done === 13) return '🎯 يوم واحد للـ 14 يوم! كدت تصل!';
  if (done === 20) return '🎯 يوم واحد لشارة 21 يوم — العادة في متناول يدك!';
  if (done === 29) return '🎯 يوم واحد لإنهاء البرنامج! لا تتوقف الآن!';
  if (typeof getNextLevel === 'function') {
    const next = getNextLevel();
    if (next) {
      const remaining = next.minDays - done;
      if (remaining === 1) return `👑 يوم واحد للمستوى ${next.lvl}: ${next.name} ${next.icon}!`;
      if (remaining === 2) return `👑 يومان للمستوى ${next.lvl} ${next.icon} — استمر!`;
    }
  }
  return null;
}

function useStreakFreeze() {
  if ((S.streakFreezes||0) <= 0) { showMiniToast('⚠️ لا تملك تجميدات متبقية'); return false; }
  S.streakFreezes--;
  if (!S.completedDays.includes(S.currentDay)) {
    S.completedDays.push(S.currentDay);
    S.completedDays = [...new Set(S.completedDays)];
  }
  saveState();
  showMiniToast(`🧊 تم تجميد سلسلتك! متبقي: ${S.streakFreezes} تجميد`);
  if (typeof render === 'function') render();
  return true;
}

function checkStreakFreezeGrant() {
  const done = (S.completedDays||[]).length;
  if (done > 0 && done % 7 === 0) {
    if ((S.streakFreezes||0) < 3) {
      S.streakFreezes = Math.min(3, (S.streakFreezes||0) + 1);
      saveState();
      setTimeout(() => showMiniToast(`🧊 حصلت على تجميد جديد! لديك ${S.streakFreezes}`), 1500);
    }
  }
}

function updateIdentityTitle() {
  const done = (S.completedDays||[]).length;
  const streak = S.streak || 0;
  const lvl = S.userLevel || 1;
  let newTitle = '';
  if (done >= 30 || lvl >= 8)          newTitle = 'أسطورة اللياقة';
  else if (done >= 21 || streak >= 14) newTitle = 'البطل';
  else if (done >= 14 || streak >= 7)  newTitle = 'المتحدي';
  else if (done >= 7  || lvl >= 3)     newTitle = 'الرياضي';
  else if (done >= 3)                  newTitle = 'المتدرب';
  else if (done >= 1)                  newTitle = 'المبادر';
  if (newTitle && newTitle !== S.identityTitle) {
    const old = S.identityTitle;
    S.identityTitle = newTitle;
    saveState();
    if (old) {
      setTimeout(() => {
        showMiniToast(`✨ لقبك الجديد: "${newTitle}" 🎖️`);
        if (typeof launchConfetti === 'function') launchConfetti();
      }, 1000);
    }
  }
  return S.identityTitle;
}

function getSunkCostMessage() {
  const done = (S.completedDays||[]).length;
  const total = S.user?.programDays || 30;
  const pct = Math.round(done/total*100);
  const cal = S.calories || 0;
  const streak = S.streak || 0;
  if (pct >= 80)    return `🏁 أكملت ${pct}% — لا تدع هذا الجهد يضيع!`;
  if (pct >= 50)    return `💪 نصف البرنامج خلفك — لا تتوقف الآن!`;
  if (cal >= 2000)  return `🔥 ${cal} سعرة محترقة — جسمك يتغير بالفعل!`;
  if (streak >= 5)  return `⛓️ ${streak} أيام متتالية — هذا انضباط نادر!`;
  return null;
}

function microCelebrate(type) {
  const celebrations = {
    'exercise_done': { msg: '💥 تمرين منجز!',      confetti: false },
    'set_done':      { msg: '✅ مجموعة كاملة!',     confetti: false },
    'half_session':  { msg: '⚡ نصف الجلسة! استمر!', confetti: true  },
    'water_cup':     { msg: '💧 ماء! جسمك يشكرك!',  confetti: false },
    'meal_logged':   { msg: '📝 وجبة مُسجَّلة!',    confetti: false },
  };
  const cel = celebrations[type];
  if (!cel) return;
  showMiniToast(cel.msg);
  if (cel.confetti && typeof launchConfetti === 'function') launchConfetti();
}

function getEndowedProgress() {
  const done = (S.completedDays||[]).length;
  if (done === 0) return { display: 2, real: 0, endowed: true };
  return { display: done, real: done, endowed: false };
}

function runPsychologyHooks(dayCompleted) {
  checkVariableReward(dayCompleted);
  checkStreakFreezeGrant();
  updateIdentityTitle();
}


/* ══════════════════════════════════════════
   XP SYSTEM — نقاط الخبرة
   كل تمرين = نقاط → مستوى XP مستقل
══════════════════════════════════════════ */
const XP_PER_SESSION    = 100;
const XP_PER_STREAK_DAY = 25;
const XP_PER_BADGE      = 150;
const XP_LEVELS = [
  { lvl:1,  min:0,     name:'مبتدئ',      icon:'⚡' },
  { lvl:2,  min:300,   name:'متدرب',      icon:'💪' },
  { lvl:3,  min:800,   name:'نشيط',       icon:'🔥' },
  { lvl:4,  min:1500,  name:'متحمس',      icon:'⭐' },
  { lvl:5,  min:2500,  name:'رياضي',      icon:'🏋️' },
  { lvl:6,  min:4000,  name:'محترف',      icon:'🥇' },
  { lvl:7,  min:6000,  name:'بطل',        icon:'🏆' },
  { lvl:8,  min:9000,  name:'أسطورة',     icon:'👑' },
  { lvl:9,  min:13000, name:'خارق',       icon:'💎' },
  { lvl:10, min:18000, name:'AZEM Elite', icon:'🔮' },
];


/* ══ Super Set ══ */
function toggleSuperSet(exId1, exId2) {
  if (!S.superSetPairs) S.superSetPairs = [];
  // هل الزوج موجود؟
  const existing = S.superSetPairs.findIndex(p => p.includes(exId1) && p.includes(exId2));
  if (existing >= 0) {
    S.superSetPairs.splice(existing, 1);
    showMiniToast('❌ تم إلغاء Super Set');
  } else {
    S.superSetPairs.push([exId1, exId2]);
    showMiniToast('⚡ Super Set: تمرينان بدون راحة');
  }
  saveState();
}

function isSuperSetWith(exId) {
  if (!S.superSetPairs) return null;
  const pair = S.superSetPairs.find(p => p.includes(exId));
  return pair ? pair.find(id => id !== exId) : null;
}

function addXP(amount, reason) {
  S.xp = (S.xp || 0) + amount;
  // تحقق من ترقية XP
  const newLevel = XP_LEVELS.slice().reverse().find(l => S.xp >= l.min);
  if (newLevel && newLevel.lvl > (S.xpLevel || 1)) {
    S.xpLevel = newLevel.lvl;
    setTimeout(() => {
      showMiniToast(`${newLevel.icon} XP Level ${newLevel.lvl}: ${newLevel.name}!`);
      if (typeof launchConfetti === 'function') launchConfetti();
    }, 800);
  }
  saveState();
  _updateXPBar();
}

function _updateXPBar() {
  const bar  = document.getElementById('xp-bar-fill');
  const text = document.getElementById('xp-bar-text');
  if (!bar && !text) return;
  const xp    = S.xp || 0;
  const lvl   = XP_LEVELS.slice().reverse().find(l => xp >= l.min) || XP_LEVELS[0];
  const next  = XP_LEVELS.find(l => l.lvl === lvl.lvl + 1);
  const pct   = next ? Math.min(100, Math.round((xp - lvl.min) / (next.min - lvl.min) * 100)) : 100;
  if (bar)  bar.style.width  = pct + '%';
  if (text) text.textContent = `${lvl.icon} ${xp} XP`;
}

function getXPLevel() {
  const xp = S.xp || 0;
  return XP_LEVELS.slice().reverse().find(l => xp >= l.min) || XP_LEVELS[0];
}

const LEVELS = [
  { lvl:1,  name:'مبتدئ',      icon:'🌱', minDays:0,  theme:'default', color:'#6B7280' },
  { lvl:2,  name:'متدرب',      icon:'💪', minDays:3,  theme:'default', color:'#3B82F6' },
  { lvl:3,  name:'نشيط',       icon:'⚡', minDays:6,  theme:'ocean',   color:'#0EA5E9' },
  { lvl:4,  name:'مثابر',      icon:'🔥', minDays:10, theme:'fire',    color:'#F97316' },
  { lvl:5,  name:'محترف',      icon:'🏋️', minDays:15, theme:'fire',    color:'#EF4444' },
  { lvl:6,  name:'قوي',        icon:'💎', minDays:20, theme:'neon',    color:'#A855F7' },
  { lvl:7,  name:'أسطورة',     icon:'🌟', minDays:25, theme:'neon',    color:'#EC4899' },
  { lvl:8,  name:'بطل',        icon:'🏆', minDays:30, theme:'purple',  color:'#8B5CF6' },
  { lvl:9,  name:'أبطال أبطال',icon:'👑', minDays:40, theme:'purple',  color:'#D4A843' },
  { lvl:10, name:'أسطورة AZEM',icon:'🔮', minDays:50, theme:'default', color:'#D4A843' },
];

function getCurrentLevel() {
  const done = (S.completedDays || []).length;
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (done >= l.minDays) level = l;
    else break;
  }
  return level;
}

function getNextLevel() {
  const cur = getCurrentLevel();
  return LEVELS.find(l => l.lvl === cur.lvl + 1) || null;
}

function checkLevelUp() {
  const newLevel = getCurrentLevel();
  const oldLevel = S.userLevel || 1;
  if (newLevel.lvl > oldLevel) {
    S.userLevel = newLevel.lvl;
    saveState();
    _triggerLevelUp(newLevel);
    return true;
  }
  return false;
}

function _triggerLevelUp(level) {
  // احتفاء بالمستوى الجديد
  if (typeof launchConfetti === 'function') launchConfetti();
  if (typeof playFanfare === 'function') playFanfare();
  // Toast بارز
  setTimeout(() => {
    showMiniToast(`${level.icon} ترقية! مستوى ${level.lvl} — ${level.name}`);
  }, 500);
  // تحديث الهيدر مع animation
  setTimeout(() => {
    _updateLevelUI();
    const badge = document.getElementById('hdr-level-badge');
    if (badge) {
      badge.classList.add('level-up-anim');
      setTimeout(() => badge.classList.remove('level-up-anim'), 700);
    }
  }, 600);
  // عرض زر مشاركة الترقية
  setTimeout(() => _shareLevelUpPrompt(level), 2500);
}

function _shareLevelUpPrompt(level) {
  const name  = S.user?.name || 'بطل';
  const done  = (S.completedDays||[]).length;
  const streak = S.streak || 0;
  const msg = `${level.icon} ${name} وصل للمستوى ${level.lvl}: "${level.name}" في AZEM!
✅ ${done} يوم مكتمل · 🔥 سلسلة ${streak} يوم
👆 chi-hani.github.io/AZEM`;

  // Toast مع زر مشاركة
  let lsToast = document.getElementById('level-share-toast');
  if (!lsToast) {
    lsToast = document.createElement('div');
    lsToast.id = 'level-share-toast';
    lsToast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:99996;background:var(--card);border:1.5px solid rgba(212,168,67,.4);border-radius:16px;padding:14px 18px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:300px;width:calc(100%-32px);animation:slideUp .4s ease;';
    document.body.appendChild(lsToast);
  }
  lsToast.innerHTML = `
    <div style="font-size:28px;">${level.icon}</div>
    <div style="font-size:14px;font-weight:900;color:var(--gold);">مستوى ${level.lvl}: ${level.name}!</div>
    <button onclick="_doShareLevel('${msg.replace(/'/g,"\'")}')"
      style="width:100%;padding:10px;border-radius:12px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;color:#fff;font-family:Cairo,sans-serif;font-size:13px;font-weight:800;cursor:pointer;">
      📤 شارك ترقيتك
    </button>
    <button onclick="document.getElementById('level-share-toast').remove()"
      style="font-size:11px;color:var(--dim);background:none;border:none;cursor:pointer;padding:2px;">تجاهل</button>`;
  setTimeout(() => { if(lsToast.parentNode) lsToast.remove(); }, 8000);
}

function _doShareLevel(msg) {
  document.getElementById('level-share-toast')?.remove();
  if (navigator.share) {
    navigator.share({ title: 'AZEM — ترقية! 🎮', text: msg }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(msg).then(() => showMiniToast('✅ تم النسخ!'));
  }
}

function _updateLevelUI() {
  const level = getCurrentLevel();
  const next  = getNextLevel();
  // شارة المستوى في الهيدر
  const lvlBadge = document.getElementById('hdr-level-badge');
  if (lvlBadge) {
    lvlBadge.textContent = level.icon;
    lvlBadge.title = `مستوى ${level.lvl}: ${level.name}`;
    lvlBadge.style.color = level.color;
  }
  // شريط تقدم المستوى
  const lvlBar = document.getElementById('level-progress-bar');
  const lvlText = document.getElementById('level-progress-text');
  if (lvlBar && next) {
    const done = (S.completedDays||[]).length;
    const pct = Math.min(100, Math.round(((done - level.minDays) / (next.minDays - level.minDays)) * 100));
    lvlBar.style.width = pct + '%';
    lvlBar.style.background = level.color;
    if (lvlText) lvlText.textContent = `${done - level.minDays}/${next.minDays - level.minDays} يوم للمستوى ${next.lvl}`;
  } else if (lvlBar) {
    lvlBar.style.width = '100%';
    if (lvlText) lvlText.textContent = `🏆 أعلى مستوى!`;
  }
}

/* ══════════════════════════════════════════
   WEEKLY CHALLENGES — تحديات أسبوعية
   تتجدد كل أحد بناءً على مستوى المستخدم
══════════════════════════════════════════ */

const CHALLENGE_TEMPLATES = [
  { id:'sessions4', desc:'أكمل 4 جلسات هذا الأسبوع',         type:'sessions', target:4  },
  { id:'sessions5', desc:'أكمل 5 جلسات هذا الأسبوع',         type:'sessions', target:5  },
  { id:'cal1500',   desc:'احرق 1500 سعرة هذا الأسبوع',       type:'calories', target:1500 },
  { id:'cal2000',   desc:'احرق 2000 سعرة هذا الأسبوع',       type:'calories', target:2000 },
  { id:'streak5',   desc:'سلسلة 5 أيام متواصلة',             type:'streak',   target:5  },
  { id:'streak7',   desc:'أسبوع كامل بدون انقطاع',           type:'streak',   target:7  },
  { id:'water35',   desc:'اشرب هدفك من الماء 3 أيام',        type:'water',    target:3  },
  { id:'burpee30',  desc:'أدِّ البيربيز في 3 جلسات',         type:'exercise', target:3, exId:'burpee' },
  { id:'plank3',    desc:'أدِّ البلانك في 3 جلسات',          type:'exercise', target:3, exId:'plank'  },
  { id:'rope3',     desc:'جلسات نط الحبل 3 مرات',            type:'exercise', target:3, exId:'rope'   },
];

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function initOrRefreshChallenge() {
  const weekStart = getWeekStart();
  const cur = S.weeklyChallenge;
  // لا تغيير إذا التحدي للأسبوع الحالي
  if (cur && cur.weekStart === weekStart) {
    _updateChallengeProgress();
    return cur;
  }
  // تحدٍ جديد — اختر بناءً على المستوى
  const lvl = S.userLevel || 1;
  const pool = CHALLENGE_TEMPLATES.filter(c => {
    if (lvl <= 2) return c.type === 'sessions' && c.target <= 4;
    if (lvl <= 4) return c.target <= 5 || c.type === 'calories' && c.target <= 1500;
    return true;
  });
  const idx = Math.floor(Date.now() / (7*86400000)) % pool.length;
  const tpl = pool[idx] || pool[0];
  S.weeklyChallenge = {
    ...tpl, weekStart, progress: 0, done: false,
    startCal: S.calories || 0,
    startSessions: Object.keys(S.trainingLog || {}).length
  };
  saveState();
  return S.weeklyChallenge;
}

function _updateChallengeProgress() {
  const ch = S.weeklyChallenge;
  if (!ch || ch.done) return;
  const weekStart = ch.weekStart;
  let progress = 0;
  if (ch.type === 'sessions') {
    progress = Object.values(S.trainingLog || {})
      .filter(e => e.date >= weekStart).length;
  } else if (ch.type === 'calories') {
    progress = (S.calories || 0) - (ch.startCal || 0);
  } else if (ch.type === 'streak') {
    progress = S.streak || 0;
  } else if (ch.type === 'water') {
    // أيام شرب الماء فيها
    progress = Object.entries(S.nutritionLog || {})
      .filter(([date, v]) => date >= weekStart && (v.water || 0) >= 6).length;
  } else if (ch.type === 'exercise') {
    progress = Object.values(S.trainingLog || {})
      .filter(e => e.date >= weekStart && e.exerciseIds?.includes(ch.exId)).length;
  }
  ch.progress = Math.min(ch.target, progress);
  if (ch.progress >= ch.target && !ch.done) {
    ch.done = true;
    saveState();
    _challengeComplete(ch);
  } else {
    saveState();
  }
}

function _challengeComplete(ch) {
  if (typeof launchConfetti === 'function') launchConfetti();
  if (typeof playFanfare === 'function') playFanfare();
  setTimeout(() => showMiniToast(`🎯 تهانينا! أكملت التحدي: "${ch.desc}" 🏆`), 400);
  // إضافة شارة خاصة
  if (!S.unlockedBadges.includes('challenge_' + ch.id)) {
    S.unlockedBadges.push('challenge_' + ch.id);
    saveState();
  }
}

/* ══════ THEMES ══════ */
const THEMES = [
  {id:'default', name:'🌑 داكن',    dot:'linear-gradient(135deg,#0284C7,#38BDF8)'},
  {id:'fire',    name:'🔥 ناري',    dot:'linear-gradient(135deg,#DC2F02,#F48C06)'},
  {id:'ocean',   name:'🌊 بحري',   dot:'linear-gradient(135deg,#023E8A,#00B4D8)'},
  {id:'nature',  name:'🌿 طبيعي',  dot:'linear-gradient(135deg,#1B4332,#52B788)'},
  {id:'neon',    name:'⚡ نيون',    dot:'linear-gradient(135deg,#C500A3,#FF6FD8)'},
  {id:'purple',  name:'🔮 بنفسجي', dot:'linear-gradient(135deg,#9C27B0,#FF80FF)'},
  {id:'light',   name:'☀️ فاتح',   dot:'linear-gradient(135deg,#1D4ED8,#93C5FD)'},
];
const THEME_ICONS = {default:'🌑',fire:'🔥',ocean:'🌊',nature:'🌿',neon:'⚡',purple:'🔮',light:'☀️'};

function setTheme(id) {
  const el = document.documentElement;
  if (id === 'default') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', id);
  S.theme = id;
  saveState();
  // FIX: تحديث meta theme-color ليتطابق مع الثيم المختار
  const themeColors = {
    default:'#07090F', fire:'#0D0500', ocean:'#00070F', nature:'#020A05',
    neon:'#050008', purple:'#060010', light:'#F8FAFC'
  };
  const metaTC = document.getElementById('meta-theme-color');
  if (metaTC) metaTC.setAttribute('content', themeColors[id] || '#07090F');
  // Change animated background
  setBG(id === 'default' ? 'default' : id);
  // Update header theme button icon
  const btn = document.getElementById('theme-hdr-btn');
  if (btn) btn.textContent = THEME_ICONS[id] || '🎨';
  const fab = document.getElementById('fab-theme');
  if (fab) fab.textContent = THEME_ICONS[id] || '🎨';
  // Update desktop/tv dots
  dtBuildThemeDots();
  buildThemeGrid();
  closeThemeModal();
}
function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  grid.innerHTML = THEMES.map(t => `
    <div class="theme-opt${S.theme===t.id?' active':''}" onclick="setTheme('${t.id}')">
      <div class="th-dot" style="background:${t.dot}"></div>
      <span class="th-name">${t.name}</span>
    </div>`).join('');
}
function openThemeModal() { buildThemeGrid(); document.getElementById('theme-modal').classList.add('open'); }
function closeThemeModal() { document.getElementById('theme-modal').classList.remove('open'); }
function setMode(m) {
  S.mode = m;
  saveState();
  const icons = {mobile:'📱',desktop:'🖥️'};
  const modeBtn = document.getElementById('mode-hdr-btn');
  if (modeBtn) modeBtn.textContent = icons[m]||'📱';
  showMiniToast('وضع ' + (m==='mobile'?'الجوال':'الكمبيوتر') + ' ✓');
}

/* ══════ QUOTES & TIPS ══════ */
const QUOTES_BY_LANG = {
  ar:[
    {text:'كل رحلة ألف ميل تبدأ بخطوة واحدة.',attr:'لاوتزي'},
    {text:'الانضباط هو الجسر بين أهدافك وإنجازاتك.',attr:'جيم رون'},
    {text:'لا تتوقف عند الإرهاق، توقف عند الانتهاء.',attr:'—'},
    {text:'جسمك يسمع كل شيء يقوله عقلك.',attr:'—'},
    {text:'من جدّ وجد، ومن زرع حصد.',attr:'مثل عربي'},
    {text:'النية الصادقة تضاعف الأجر والنتيجة.',attr:'—'},
    {text:'اجعل صحتك عبادة وتمرينك قربة.',attr:'—'},
    {text:'القوة لا تأتي من القدرة الجسدية، بل من الإرادة الذهنية.',attr:'غاندي'},
    {text:'كل تعرق في التدريب يوفر دم في الميدان.',attr:'—'},
    {text:'رمضان فرصة لتجديد الروح والجسد معاً.',attr:'—'},
  ],
  en:[
    {text:'A journey of a thousand miles begins with a single step.',attr:'Lao Tzu'},
    {text:'Discipline is the bridge between goals and accomplishment.',attr:'Jim Rohn'},
    {text:'Don\'t stop when you\'re tired. Stop when you\'re done.',attr:'—'},
    {text:'Your body hears everything your mind says.',attr:'—'},
    {text:'The only bad workout is the one that didn\'t happen.',attr:'—'},
    {text:'Push yourself, because no one else is going to do it for you.',attr:'—'},
    {text:'Success is the sum of small efforts, repeated daily.',attr:'R. Collier'},
    {text:'Strength doesn\'t come from physical capacity. It comes from indomitable will.',attr:'Gandhi'},
    {text:'Sweat in training so you don\'t bleed in battle.',attr:'—'},
    {text:'Make your health a priority, not an afterthought.',attr:'—'},
  ],
  fr:[
    {text:'Un voyage de mille lieues commence par un seul pas.',attr:'Lao Tseu'},
    {text:'La discipline est le pont entre les objectifs et l\'accomplissement.',attr:'Jim Rohn'},
    {text:'Ne t\'arrête pas quand tu es fatigué. Arrête-toi quand tu as fini.',attr:'—'},
    {text:'Ton corps entend tout ce que dit ton esprit.',attr:'—'},
    {text:'La seule mauvaise séance est celle que tu n\'as pas faite.',attr:'—'},
    {text:'Pousse-toi, car personne d\'autre ne le fera pour toi.',attr:'—'},
    {text:'Le succès est la somme de petits efforts répétés chaque jour.',attr:'R. Collier'},
    {text:'La force ne vient pas de la capacité physique, mais de la volonté.',attr:'Gandhi'},
    {text:'Transpire à l\'entraînement pour ne pas saigner sur le terrain.',attr:'—'},
    {text:'Fais de ta santé une priorité, pas une réflexion après coup.',attr:'—'},
  ],
};
function getQuotes(){return QUOTES_BY_LANG[currentLang]||QUOTES_BY_LANG.ar;}
const QUOTES=QUOTES_BY_LANG.ar; // backward compat
const TIPS = [
  {cat:'💧 تغذية',  text:'اشرب 8 أكواب من الماء يومياً. الترطيب يزيد الأداء بنسبة 20%.'},
  {cat:'😴 نوم',    text:'7-8 ساعات نوم ضروري لبناء العضل وحرق الدهون بشكل طبيعي.'},
  {cat:'🥩 بروتين', text:'تناول بروتيناً بعد التمرين بساعة. 1.6 غرام لكل كيلو من وزنك يومياً.'},
  {cat:'🧘 تعافي',  text:'يوم الراحة بنفس أهمية يوم التمرين. العضل يبنى أثناء الراحة.'},
  {cat:'⏰ توقيت',  text:'أفضل وقت للتمرين هو الذي تستطيع الالتزام به. الانتظام أهم من الوقت.'},
  {cat:'🌙 رمضان',  text:'في رمضان، تمرن قبل الإفطار بـ30 دقيقة أو بعده بساعتين للحصول على أفضل نتائج.'},
  {cat:'🔥 دهون',   text:'التمارين الهوائية المتقطعة (HIIT) تحرق الدهون حتى 48 ساعة بعد التمرين.'},
  {cat:'💡 تركيز',  text:'ركّز على صحة الحركة قبل كمية الوزن. التقنية الصحيحة تمنع الإصابات.'},
  {cat:'📈 تقدم',   text:'زِد شدة التمرين بـ10% أسبوعياً فقط. التدرج يحمي من الإصابة ويضمن التقدم.'},
  {cat:'🤲 نية',    text:'ابدأ كل جلسة بنية خالصة. اجعل صحتك أمانة في عنقك لتؤدي واجباتك خيراً.'},
];


/* ══════ WEEKLY CALORIE GOAL ══════ */
function calcWeeklyCalGoal() {
  // إذا حدّده المستخدم يدوياً — استخدمه
  if (S.weeklyCalGoal && S.weeklyCalGoal > 0) return S.weeklyCalGoal;
  // وإلا: الهدف اليومي × 5 أيام تدريب
  const daily = typeof calcDailyCalTarget === 'function' ? calcDailyCalTarget() : 500;
  return daily * 5;
}

function calcWeeklyCalBurned() {
  const nowTs  = Date.now();
  const msWeek = 7 * 24 * 3600 * 1000;
  return Object.values(S.trainingLog || {})
    .filter(e => e.ts && (nowTs - e.ts) < msWeek)
    .reduce((s,e) => s + (e.calories||0), 0);
}

/* ══════ BADGES ══════ */
const BADGES = [
  {id:'first_day',  name:'الخطوة الأولى', icon:'👟', desc:'إكمال أول يوم',           check:()=>S.completedDays.length>=1},
  {id:'week1',      name:'أسبوع كامل',    icon:'📅', desc:'7 أيام مكتملة',           check:()=>S.completedDays.length>=7},
  {id:'week2',      name:'14 يوم',         icon:'⚡', desc:'نصف الطريق',              check:()=>S.completedDays.length>=14},
  {id:'week3',      name:'21 يوم',         icon:'🔥', desc:'عادة راسخة',              check:()=>S.completedDays.length>=21},
  {id:'champion',   name:'البطل',           icon:'🏆', desc:'30 يوم كاملة',            check:()=>S.completedDays.length>=30},
  {id:'streak5',    name:'سلسلة 5',        icon:'⛓️', desc:'5 أيام متواصلة',          check:()=>S.streak>=5},
  {id:'streak10',   name:'سلسلة 10',       icon:'💎', desc:'10 أيام متواصلة',         check:()=>S.streak>=10},
  {id:'cal1000',    name:'محرق السعرات',   icon:'🌋', desc:'1000 سعرة محروقة',        check:()=>S.calories>=1000},
  {id:'cal5000',    name:'آلة الحرق',      icon:'☀️', desc:'5000 سعرة محروقة',        check:()=>S.calories>=5000},
  {id:'rope_hero',  name:'بطل الحبل',      icon:'🪢', desc:'100 جلسة حبل',            check:()=>S.ropeSessions>=100},
  {id:'early_bird', name:'الطائر المبكر',  icon:'🐦', desc:'إكمال 3 تمارين صباحية',  check:()=>(S.morningWorkouts||0)>=3},
  {id:'perfect_wk', name:'أسبوع مثالي',   icon:'⭐', desc:'7 أيام متواصلة بدون انقطاع',check:()=>S.streak>=7},
];


// ── تشغيل Auto Milestone Card عند checkBadges ──
function _checkAutoMilestoneCard() {
  const done   = (S.completedDays||[]).length;
  const streak = S.streak || 0;
  const milestones = [7, 14, 21, 30, 50];
  if (milestones.includes(done) || milestones.includes(streak)) {
    // تأجير قليلاً للسماح للـ render بالاكتمال
    setTimeout(async () => {
      try {
        if (typeof generateAchievementCard !== 'function') return;
        const dataUrl = await generateAchievementCard();
        if (!dataUrl) return;
        // عرض auto modal
        if (typeof _showAchievementModal === 'function') {
          _showAchievementModal(dataUrl);
        }
      } catch(e) {}
    }, 1500);
  }
}

function checkBadges() {
  // تحقق من الترقية عند كل إنجاز
  try { if (typeof checkLevelUp === 'function') checkLevelUp(); } catch(e) {}
  // تحديث التحدي الأسبوعي
  try { if (typeof _updateChallengeProgress === 'function') _updateChallengeProgress(); } catch(e) {}
  // Auto Milestone Card
  try { _checkAutoMilestoneCard(); } catch(e) {}
  BADGES.forEach(b => {
    if (!S.unlockedBadges.includes(b.id) && b.check()) {
      S.unlockedBadges.push(b.id);
      saveState();
      showBadgeToast(b);
      playFanfare();
    }
  });
}
function showBadgeToast(b) {
  document.getElementById('bt-icon').textContent = b.icon;
  document.getElementById('bt-name').textContent = b.name;
  document.getElementById('bt-desc').textContent = b.desc;
  const t = document.getElementById('badge-toast');
  // زر مشاركة الشارة
  let shareBtn = document.getElementById('bt-share-btn');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.id = 'bt-share-btn';
    shareBtn.style.cssText = 'margin-top:8px;padding:6px 14px;border-radius:10px;background:rgba(212,168,67,.2);border:1px solid rgba(212,168,67,.3);color:var(--gold);font-family:Cairo,sans-serif;font-size:11px;font-weight:700;cursor:pointer;width:100%;';
    t.appendChild(shareBtn);
  }
  shareBtn.textContent = '📤 شارك هذه الشارة';
  shareBtn.onclick = () => _shareBadge(b);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 5000);
}

function _shareBadge(b) {
  const name   = S.user?.name || 'بطل';
  const streak = S.streak || 0;
  const done   = (S.completedDays||[]).length;
  const msg = `${b.icon} ${name} حصل على شارة "${b.name}" في AZEM (عزم)!
${b.desc}
🔥 سلسلة ${streak} يوم · ✅ ${done} يوم مكتمل
👆 chi-hani.github.io/AZEM`;
  if (navigator.share) {
    navigator.share({ title: 'شارة AZEM', text: msg }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(msg).then(() => showMiniToast('✅ نُسخت رسالة الشارة!'));
  }
}

