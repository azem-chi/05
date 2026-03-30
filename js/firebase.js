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
        // حماية apiKey المحلي
        const _localKey  = S.apiKey || '';
        const _remoteKey = remote.apiKey || '';
        if (_localKey.startsWith('gsk_')) merged.apiKey = _localKey;
        else if (_remoteKey.startsWith('gsk_')) merged.apiKey = _remoteKey;
        else merged.apiKey = _localKey || _remoteKey;
        // حماية onboardingDone — لا نسمح للسحابة بتعيينها true إذا كانت محلياً false
        if (!S.onboardingDone) merged.onboardingDone = false;
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
    if (btn) { btn.textContent = '⏳ ...'; btn.disabled = true; }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

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
        // مستخدم موجود لديه بيانات → دخول مباشر
        obFinish();
      } else {
        // مستخدم جديد → أدخل المعلومات
        obGoToStep('goal');
      }
    } else {
      window._obGoogleJustSignedIn = false;
      if (btn) { btn.textContent = ''; btn.disabled = false; }
    }
  } catch(e) {
    window._obGoogleJustSignedIn = false;
    if (btn) { btn.textContent = ''; btn.disabled = false; }
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
  const pass2El = document.getElementById('ob-pass2-inp');
  const nameEl  = document.getElementById('ob-name-inp');
  const btn     = document.getElementById('ob-email-btn');
  const errEl   = document.getElementById('ob-auth-err');

  const email    = emailEl ? emailEl.value.trim()  : '';
  const password = passEl  ? passEl.value.trim()   : '';
  const pass2    = pass2El ? pass2El.value.trim()  : '';
  const name     = nameEl  ? nameEl.value.trim()   : '';

  const _lang = currentLang || S.lang || 'ar';
  const _t = (ar, en) => _lang === 'en' ? en : _lang === 'fr' ? en : ar;

  const showErr = (msg) => {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  };
  const hideErr = () => { if (errEl) errEl.style.display = 'none'; };

  hideErr();

  if (!email) { showErr(_t('أدخل البريد الإلكتروني', 'Enter your email')); return; }
  if (!password) { showErr(_t('أدخل كلمة المرور', 'Enter your password')); return; }
  if (password.length < 6) { showErr(_t('كلمة المرور 6 أحرف على الأقل', 'Password must be at least 6 characters')); return; }

  if (mode === 'signup') {
    if (!pass2) { showErr(_t('أكّد كلمة المرور', 'Confirm your password')); return; }
    if (password !== pass2) { showErr(_t('كلمتا المرور غير متطابقتين', 'Passwords do not match')); return; }
  }

  try {
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

    let user;
    if (mode === 'signup') {
      // تحقق أولاً إذا الإيميل مسجل مسبقاً
      const { fetchSignInMethodsForEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        showErr(_t(
          'هذا الإيميل مسجل مسبقاً — انتقل لـ "تسجيل الدخول"',
          'This email is already registered — switch to "Sign In"'
        ));
        if (btn) { btn.textContent = _t('إنشاء الحساب ←','Create Account →'); btn.disabled = false; }
        // بدّل تلقائياً للـ login tab
        setTimeout(() => {
          window._obAuthMode = 'login';
          if (typeof renderObStep === 'function') renderObStep();
          const emailInp = document.getElementById('ob-email-inp');
          if (emailInp) { emailInp.value = email; }
        }, 1200);
        return;
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      user = result.user;
      if (name) {
        await updateProfile(user, { displayName: name });
        S.user = S.user || {};
        S.user.name = name;
      }
    } else {
      // تسجيل دخول
      const result = await signInWithEmailAndPassword(auth, email, password);
      user = result.user;
    }

    await saveUserProfile(user, { authMethod: 'email' });

    if (mode === 'login') {
      const hasData = await pullFromCloud(user.uid);
      updateAuthUI(user);
      if (hasData) {
        obFinish();
      } else {
        // مستخدم موجود لكن بدون بيانات في السحابة → أدخل معلوماته
        obGoToStep('goal');
      }
    } else {
      // إنشاء حساب جديد → دائماً يملأ المعلومات
      updateAuthUI(user);
      obGoToStep('goal');
    }

  } catch(e) {
    if (btn) {
      const isSignup = mode === 'signup';
      btn.textContent = isSignup ? _t('إنشاء الحساب ←','Create Account →') : _t('دخول ←','Sign In →');
      btn.disabled = false;
    }
    const msgs = {
      'auth/email-already-in-use':    _t('هذا الإيميل مسجل — جرّب "تسجيل الدخول"','Email already in use — try "Sign In"'),
      'auth/user-not-found':          _t('الحساب غير موجود — جرّب "إنشاء حساب"','Account not found — try "Sign Up"'),
      'auth/wrong-password':          _t('كلمة المرور غير صحيحة','Wrong password'),
      'auth/invalid-email':           _t('صيغة الإيميل غير صحيحة','Invalid email format'),
      'auth/too-many-requests':       _t('محاولات كثيرة — انتظر قليلاً','Too many attempts — wait a moment'),
      'auth/invalid-credential':      _t('بيانات الدخول غير صحيحة','Invalid credentials'),
      'auth/network-request-failed':  _t('خطأ في الشبكة — تحقق من الاتصال','Network error — check connection'),
    };
    showErr(msgs[e.code] || e.message);
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
      await saveUserProfile(user, { authMethod: 'google+email' });
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
// FIX-SAVE-STATE: لا نُعيد تعريف saveState هنا
// data.js يستدعي window._firebaseSyncHook بعد كل حفظ
// ══════════════════════════════════════════
window._firebaseSyncHook = function() {
  if (_fbUid) {
    clearTimeout(_syncDebounce);
    _syncDebounce = setTimeout(pushToCloud, 2500);
  }
};

// ══════════════════════════════════════════
// حذف جميع بيانات المستخدم
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

  ['azem_S','fitpulse_S','azem_ob_redirect','azem_settings_redirect','azem_last_open'].forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();

  if (typeof showMiniToast === 'function') showMiniToast('✅ تم حذف جميع البيانات');
  setTimeout(() => {
    if (typeof closeSettingsSheet === 'function') closeSettingsSheet();
    location.reload();
  }, 1200);
};onAuthStateChanged(auth, async function(user) {
  if (user) {
    _fbUid = user.uid;
    window._fbUid = user.uid;
    window._fbUser = user;
    updateAuthUI(user);
    if (!window._obGoogleJustSignedIn) {
      await saveUserProfile(user);
      const hasData = await pullFromCloud(user.uid);
      if (!hasData && !S.onboardingDone) {
        const obEl = document.getElementById('onboarding');
        const obVisible = obEl && obEl.style.display !== 'none';
        if (!obVisible && typeof showOnboarding === 'function') setTimeout(showOnboarding, 500);
      } else if (hasData) {
        showMiniToast('☁️ مرحباً ' + (user.displayName || '').split(' ')[0] + '! بياناتك تُزامن تلقائياً');
      }
      const sheet = document.getElementById('settings-sheet');
      if (sheet && sheet.style.display !== 'none') updateAuthUI(user);
    }
  } else {
    _fbUid = null;
    window._fbUid = null;
    window._fbUser = null;
    updateAuthUI(null);
  }
});

