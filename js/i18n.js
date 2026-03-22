/* ══════ LANGUAGE ══════ */
const LANGS = {
  ar: {
    home:'الرئيسية',
    workout:'تدريب', timer:'مؤقت', progress:'تقدم', coach:'مدرب',
    day:'اليوم', streak:'🔥 سلسلة', calories:'⚡ كالوري',
    start:'جلسة', done:'إكمال التمرين', rest:'يوم راحة',
    theme:'الثيم', mode:'الوضع', sound:'الصوت',
    startSession:'▶ ابدأ الجلسة الموجهة', markDone:'✓ إنهاء اليوم', restDay:'يوم راحة',
    exercises:'التمارين', sets:'مجموعات', reps:'تكرار', seconds:'ث',
    completed:'مكتمل', remaining:'متبقي', phase:'المرحلة',
    stats:'الإحصاء', badges:'الشارات', measurements:'القياسات',
    weight:'الوزن (كغ)', waist:'الخصر (سم)', chest:'الصدر (سم)',
    save:'💾 حفظ',
    noEx:'لا توجد تمارين اليوم',
    timerReady:'جاهز', timerRunning:'يعمل', timerPaused:'موقف مؤقتاً', timerDone:'انتهى ✅',
    tabataTitle:'⚡ تاباتا', ropeTitle:'🪢 متتبع الحبل',
    workTime:'وقت العمل (ث)', restTime:'وقت الراحة (ث)', roundsLabel:'عدد الجولات',
    startTabata:'🔥 ابدأ تاباتا', startRope:'▶ ابدأ', resetRope:'↺ تصفير',
    jumpsLabel:'قفزة', metersLabel:'متر', minsLabel:'دقيقة', sessLabel:'جلسة',
    daysLeft:'يوم متبقي', daysCompleted:'مكتمل', days2:'الأيام',
    dayDone:'اليوم مكتمل',
    exercisesToday:'تمارين اليوم', restSub:'الجسم يبني ويتعافى أثناء الراحة. استمتع بيومك!',
    phasesTitle:'المراحل', weeklyTitle:'📊 مقارنة أسبوعية', calTitle:'🗓️ تقويم',  // ديناميكي — يُحدَّث في applyLang
    measureTitle:'📏 قياسات الجسم', badgesTitle:'🏅 الشارات',
    weightLabel:'الوزن (كغ)', waistLabel:'الخصر (سم)', chestLabel:'الصدر (سم)',
    saveBtn:'💾 حفظ القياسات',
    doneStat:'يوم مكتمل', streakStat:'سلسلة 🔥', calStat:'سعرة ⚡', remainStat:'يوم متبقي',
    exercisesTodayLbl:'تمارين اليوم', editExercises:'✏️ تعديل التمارين',
    lblReps:'تكرار', lblSecs:'ثانية', lblMeters:'م', lblSets:'مجموعات', lblExercises:'تمارين',
    phaseFound:'التأسيس', phaseBuilt:'البناء', phasePeak:'الذروة', phaseFinal:'الحسم',
    typeRopeHiit:'حبل+HIIT', typeCircuit:'سيركيت', typeRopeCore:'حبل+كور',
    typeActiveRest:'راحة نشطة', typeHiitCore:'HIIT+كور', typeStrength:'قوة', typeRest:'راحة',
    obName:'ما اسمك؟', obWeight:'وزنك الحالي (كغ)', obHeight:'طولك (سم)',
    obGoal:'ما هدفك الأساسي؟', obDays:'كم يوماً برنامجك؟', obTime:'وقت تدريبك المفضل', obStart:'متى تبدأ برنامجك؟',
    obGoalBurn:'حرق الدهون', obGoalMuscle:'بناء العضلات', obGoalFitness:'تحسين اللياقة', obGoalHealth:'الصحة العامة',
    obDays15:'15 يوم', obDays30:'30 يوم', obDays60:'60 يوم', obDaysCustom:'تخصيص',
    restDayTitle:'يوم راحة', restDaySub:'الراحة جزء أساسي من التدريب.\nعضلاتك تنمو أثناء الاستشفاء.',
    activeRest:'🧘 راحة نشطة (تمدد)', recordRest:'☑️ تسجيل يوم الراحة', recordedRest:'✅ تم تسجيل يوم الراحة',
    startGuided:'▶ ابدأ الجلسة الموجهة', startToday:'▶ ابدأ تدريب اليوم', completeDay:'✓ إنهاء اليوم', dayComplete:'✅ اليوم مكتمل',
    getReady:'استعد 🌙', skipRest:'تخطي الراحة ▶',
    pauseBtn:'⏸ إيقاف', resumeBtn:'▶ استئناف', skipBtn:'تخطي ⏭', backBtn:'↩ العودة',
    closeSession:'✕ إغلاق', setOf:'مجموعة', of2:'من', exerciseLbl:'تمرين',
    restBetween:'استراحة', nextExercise:'التالي:',
    coachOnline:'● متصل', coachPlaceholder:'اسألني أي شيء...', clearHistory:'مسح',
    shareProgress:'📤 مشاركة تقدمي', enableNotif:'🔔 تفعيل تذكير التدريب اليومي',
    sessComplete:'أحسنت! جلسة رائعة!', wellDone:'رائع', dayCompleted:'اليوم مكتمل',
    sessExercises:'تمارين الجلسة', restScreen:'استراح! 😤',
    steps:'الخطوات', smartStats:'🧠 إحصاء ذكي', trainingHistory:'📅 سجل التدريبات',
    soundSettings:'🔊 إعدادات الصوت', soundToggle:'الصوت', tickToggle:'نقرات المؤقت', ttsToggle:'🎙️ صوت تحفيزي عربي', volumeLabel:'مستوى الصوت',
    settingsTitle:'⚙️ الإعدادات', apiKeyTitle:'🤖 مفتاح Groq API الشخصي (اختياري)', apiKeySave:'💾 حفظ المفتاح',
    profileTitle:'👤 الملف الشخصي', profileName:'الاسم', profileWeight:'الوزن (كغ)', profileHeight:'الطول (سم)',
    profileTrainTime:'وقت التدريب', profileStartDate:'تاريخ بدء البرنامج', profileSave:'💾 حفظ الملف',
    tutorialTitle:'التعليمات', resetOnboarding:'إعادة شاشة الإعداد', helpTitle:'❓ التعليمات',
    closeBtn:'إغلاق', cancelBtn:'إلغاء', saveClose:'✅ حفظ وإغلاق',
    addExercise:'إضافة تمرين', exerciseLibrary:'مكتبة التمارين', newExercise:'+ تمرين جديد',
    smartStatsCompletion:'معدل الإتمام', smartStatsAvgCal:'متوسط سعرة/جلسة',
    smartStatsFav:'تمرينك المفضل', smartStatsBestDay:'أفضل يوم في الأسبوع',
    smartStatsWeekTrend:'مقارنة بالأسبوع الماضي', smartStatsThisWeek:'هذا الأسبوع', smartStatsLastWeek:'الأسبوع الماضي',
    // Network & PWA
    noInternet:'⚠️ لا يوجد اتصال بالإنترنت',
    installApp:'📲 تثبيت التطبيق',
    installTitle:'📲 تثبيت التطبيق', installAppTitle:'ثبّت التطبيق على جهازك', installAppSub:'وصول فوري — يعمل بدون نت — تذكيرات', installNowBtn:'تثبيت الآن',
    installDesc:'احفظ التطبيق على شاشتك الرئيسية للوصول السريع دون إنترنت',
    installBtnAndroid:'📲 تثبيت الآن',
    installAlready:'✅ التطبيق مثبت',
    installIosHint:'لتثبيت التطبيق على iOS: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"',
    // Settings sheet
    cloudSyncTitle:'☁️ المزامنة السحابية',
    cloudSyncDesc:'سجّل دخول بـ Google لحفظ بياناتك على السحاب ومزامنتها بين أجهزتك.',
    googleSignIn:'تسجيل الدخول بـ Google',
    syncedStatus:'✅ متصل — بياناتك محفوظة',
    signOut:'خروج',
    syncNow:'🔄 مزامنة الآن',
    programTitle:'📅 اختيار البرنامج',
    programAdvanced:'🔥 المتقدم',
    programAdvancedDays:'30+ يوم',
    programBeginner:'🌱 المبتدئين',
    programBeginnerDays:'21 يوم',
    helpQuestion:'هل تريد مراجعة شرح التطبيق مرة أخرى؟',
    restartTutorial:'🎯 إعادة التعليمات',
    resetSetupTitle:'🔄 إعادة التهيئة',
    resetSetupBtn:'إعادة شاشة الإعداد الأولى',
    resetSetupConfirm:'إعادة شاشة الإعداد الأولى؟',
    // Workout inline
    calLabel:'كالوري', dayLabel:'يوم', estimatedCalToday:'🔥 السعرات المقدرة لليوم:',
    weightLbl:'وزن', kgLbl:'كغ', exCalChip:'كالوري',
    stretchExLabel:'تمارين تمدد',
    // Beginner phases
    phaseDiscovery:'الاكتشاف', phaseMastery:'الإتقان',
  },
  en: {
    home:'Home',
    workout:'Workout', timer:'Timer', progress:'Progress', coach:'Coach',
    day:'Day', streak:'🔥 Streak', calories:'⚡ Calories',
    start:'Session', done:'Complete Exercise', rest:'Rest Day',
    theme:'Theme', mode:'Mode', sound:'Sound',
    startSession:'▶ Start Guided Session', markDone:'✓ Complete Day', restDay:'Rest Day',
    exercises:'Exercises', sets:'Sets', reps:'Reps', seconds:'s',
    completed:'Completed', remaining:'Remaining', phase:'Phase',
    stats:'Stats', badges:'Badges', measurements:'Measurements',
    weight:'Weight (kg)', waist:'Waist (cm)', chest:'Chest (cm)',
    save:'💾 Save',
    noEx:'No exercises today',
    timerReady:'Ready', timerRunning:'Running', timerPaused:'Paused', timerDone:'Done ✅',
    tabataTitle:'⚡ Tabata', ropeTitle:'🪢 Rope Tracker',
    workTime:'Work Time (s)', restTime:'Rest Time (s)', roundsLabel:'Rounds',
    startTabata:'🔥 Start Tabata', startRope:'▶ Start', resetRope:'↺ Reset',
    jumpsLabel:'Jumps', metersLabel:'Meters', minsLabel:'Minutes', sessLabel:'Sessions',
    daysLeft:'Days Left', daysCompleted:'Completed', days2:'Days',
    dayDone:'Day Complete',
    exercisesToday:"Today's Exercises", restSub:'Your body builds and recovers during rest. Enjoy your day!',
    phasesTitle:'Phases', weeklyTitle:'📊 Weekly Comparison', calTitle:'🗓️ Calendar',  // dynamic — updated in applyLang
    measureTitle:'📏 Body Measurements', badgesTitle:'🏅 Badges',
    weightLabel:'Weight (kg)', waistLabel:'Waist (cm)', chestLabel:'Chest (cm)',
    saveBtn:'💾 Save Measurements',
    doneStat:'Days Done', streakStat:'Streak 🔥', calStat:'Calories ⚡', remainStat:'Days Left',
    exercisesTodayLbl:"Today's Exercises", editExercises:'✏️ Edit Exercises',
    lblReps:'Reps', lblSecs:'Sec', lblMeters:'m', lblSets:'Sets', lblExercises:'Exercises',
    phaseFound:'Foundation', phaseBuilt:'Building', phasePeak:'Peak', phaseFinal:'Final Push',
    typeRopeHiit:'Rope+HIIT', typeCircuit:'Circuit', typeRopeCore:'Rope+Core',
    typeActiveRest:'Active Rest', typeHiitCore:'HIIT+Core', typeStrength:'Strength', typeRest:'Rest',
    obName:"What's your name?", obWeight:'Your weight (kg)', obHeight:'Your height (cm)',
    obGoal:'What is your main goal?', obDays:'How many days is your program?', obTime:'Preferred workout time', obStart:'When do you start?',
    obGoalBurn:'Burn Fat', obGoalMuscle:'Build Muscle', obGoalFitness:'Improve Fitness', obGoalHealth:'General Health',
    obDays15:'15 Days', obDays30:'30 Days', obDays60:'60 Days', obDaysCustom:'Custom',
    restDayTitle:'Rest Day', restDaySub:'Rest is part of training.\nYour muscles grow during recovery.',
    activeRest:'🧘 Active Rest (Stretch)', recordRest:'☑️ Record Rest Day', recordedRest:'✅ Rest Day Recorded',
    startGuided:'▶ Start Guided Session', startToday:'▶ Start Today\'s Workout', completeDay:'✓ Complete Day', dayComplete:'✅ Day Complete',
    getReady:'Get Ready 🌙', skipRest:'Skip Rest ▶',
    pauseBtn:'⏸ Pause', resumeBtn:'▶ Resume', skipBtn:'Skip ⏭', backBtn:'↩ Back',
    closeSession:'✕ Close', setOf:'Set', of2:'of', exerciseLbl:'Exercise',
    restBetween:'Rest between sets', nextExercise:'Next:',
    coachOnline:'● Online', coachPlaceholder:'Ask me anything...', clearHistory:'Clear',
    shareProgress:'📤 Share Progress', enableNotif:'🔔 Enable Daily Training Reminder',
    sessComplete:'Well done! Great session!', wellDone:'Well done', dayCompleted:'Day completed',
    sessExercises:'Session Exercises', restScreen:'Rest! 😤',
    steps:'Steps', smartStats:'🧠 Smart Stats', trainingHistory:'📅 Training Log',
    soundSettings:'🔊 Sound Settings', soundToggle:'Sound', tickToggle:'Timer Clicks', ttsToggle:'🎙️ Arabic Motivation Voice', volumeLabel:'Volume',
    settingsTitle:'⚙️ Settings', apiKeyTitle:'🤖 Groq API Key (optional)', apiKeySave:'💾 Save Key',
    profileTitle:'👤 Profile', profileName:'Name', profileWeight:'Weight (kg)', profileHeight:'Height (cm)',
    profileTrainTime:'Workout Time', profileStartDate:'Program Start Date', profileSave:'💾 Save Profile',
    tutorialTitle:'Tutorial', resetOnboarding:'Restart Setup', helpTitle:'❓ Help',
    closeBtn:'Close', cancelBtn:'Cancel', saveClose:'✅ Save & Close',
    addExercise:'Add Exercise', exerciseLibrary:'Exercise Library', newExercise:'+ New Exercise',
    smartStatsCompletion:'Completion Rate', smartStatsAvgCal:'Avg Cal/Session',
    smartStatsFav:'Favorite Exercise', smartStatsBestDay:'Best Day',
    smartStatsWeekTrend:'vs Last Week', smartStatsThisWeek:'This week', smartStatsLastWeek:'Last week',
    // Network & PWA
    noInternet:'⚠️ No internet connection',
    installApp:'📲 Install App',
    installAppTitle:'Install the App on your device',
    installAppSub:'Instant access — works offline — reminders',
    installNowBtn:'Install Now',
    installTitle:'📲 Install AZEM App',
    installDesc:'Save the app to your home screen for quick offline access',
    installBtnAndroid:'📲 Install Now',
    installAlready:'✅ App already installed',
    installIosHint:'To install on iOS: tap the Share button, then "Add to Home Screen"',
    // Settings sheet
    cloudSyncTitle:'☁️ Cloud Sync',
    cloudSyncDesc:'Sign in with Google to save your data to the cloud and sync across devices.',
    googleSignIn:'Sign in with Google',
    syncedStatus:'✅ Connected — your data is saved',
    signOut:'Sign out',
    syncNow:'🔄 Sync Now',
    programTitle:'📅 Choose Program',
    programAdvanced:'🔥 Advanced',
    programAdvancedDays:'30+ days',
    programBeginner:'🌱 Beginner',
    programBeginnerDays:'21 days',
    helpQuestion:'Would you like to review the app tutorial again?',
    restartTutorial:'🎯 Restart Tutorial',
    resetSetupTitle:'🔄 Reset Setup',
    resetSetupBtn:'Restart Setup Screen',
    resetSetupConfirm:'Restart the initial setup screen?',
    // Workout inline
    calLabel:'Cal', dayLabel:'Day', estimatedCalToday:'🔥 Estimated calories today:',
    weightLbl:'Weight', kgLbl:'kg', exCalChip:'Cal',
    stretchExLabel:'stretch exercises',
    // Beginner phases
    phaseDiscovery:'Discovery', phaseMastery:'Mastery',
  },
  fr: {
    home:'Accueil',
    workout:'Entraîn.', timer:'Minuteur', progress:'Progrès', coach:'Coach',
    day:'Jour', streak:'🔥 Série', calories:'⚡ Calories',
    start:'Séance', done:'Terminer exercice', rest:'Repos',
    theme:'Thème', mode:'Mode', sound:'Son',
    startSession:'▶ Démarrer la séance', markDone:'✓ Terminer', restDay:'Jour de repos',
    exercises:'Exercices', sets:'Séries', reps:'Rép.', seconds:'s',
    completed:'Complété', remaining:'Restant', phase:'Phase',
    stats:'Stats', badges:'Badges', measurements:'Mesures',
    weight:'Poids (kg)', waist:'Taille (cm)', chest:'Poitrine (cm)',
    save:'💾 Sauver',
    noEx:"Pas d'exercices aujourd'hui",
    timerReady:'Prêt', timerRunning:'En cours', timerPaused:'Pausé', timerDone:'Terminé ✅',
    tabataTitle:'⚡ Tabata', ropeTitle:'🪢 Suivi corde',
    workTime:'Temps travail (s)', restTime:'Temps repos (s)', roundsLabel:'Tours',
    startTabata:'🔥 Démarrer Tabata', startRope:'▶ Démarrer', resetRope:'↺ Réinitialiser',
    jumpsLabel:'Sauts', metersLabel:'Mètres', minsLabel:'Minutes', sessLabel:'Sessions',
    daysLeft:'Jours restants', daysCompleted:'Complété', days2:'Jours',
    dayDone:'Jour complété',
    exercisesToday:"Exercices du jour", restSub:'Le corps se construit pendant le repos. Profitez de votre journée!',
    phasesTitle:'Phases', weeklyTitle:'📊 Comparaison hebdo', calTitle:'🗓️ Calendrier',  // dynamique — mis à jour dans applyLang
    measureTitle:'📏 Mesures corporelles', badgesTitle:'🏅 Badges',
    weightLabel:'Poids (kg)', waistLabel:'Tour de taille (cm)', chestLabel:'Poitrine (cm)',
    saveBtn:'💾 Sauvegarder',
    doneStat:'Jours faits', streakStat:'Série 🔥', calStat:'Calories ⚡', remainStat:'Jours restants',
    exercisesTodayLbl:"Exercices du jour", editExercises:'✏️ Modifier',
    lblReps:'Rép.', lblSecs:'Sec', lblMeters:'m', lblSets:'Séries', lblExercises:'Exercices',
    phaseFound:'Fondation', phaseBuilt:'Construction', phasePeak:'Pic', phaseFinal:'Final',
    typeRopeHiit:'Corde+HIIT', typeCircuit:'Circuit', typeRopeCore:'Corde+Core',
    typeActiveRest:'Repos actif', typeHiitCore:'HIIT+Core', typeStrength:'Force', typeRest:'Repos',
    obName:'Votre prénom ?', obWeight:'Votre poids (kg)', obHeight:'Votre taille (cm)',
    obGoal:'Quel est votre objectif ?', obDays:'Durée du programme ?', obTime:'Heure préférée', obStart:'Date de début ?',
    obGoalBurn:'Brûler les graisses', obGoalMuscle:'Musculation', obGoalFitness:'Améliorer la forme', obGoalHealth:'Santé générale',
    obDays15:'15 jours', obDays30:'30 jours', obDays60:'60 jours', obDaysCustom:'Personnalisé',
    restDayTitle:'Jour de repos', restDaySub:'Le repos fait partie de l\'entraînement.\nVos muscles grandissent pendant la récupération.',
    activeRest:'🧘 Repos actif (étirements)', recordRest:'☑️ Enregistrer repos', recordedRest:'✅ Repos enregistré',
    startGuided:'▶ Démarrer la séance', startToday:'▶ Commencer l\'entraînement', completeDay:'✓ Terminer', dayComplete:'✅ Jour complété',
    pauseBtn:'⏸ Pause', resumeBtn:'▶ Reprendre', skipBtn:'Passer ⏭', backBtn:'↩ Retour',
    getReady:'Préparez-vous 🌙', skipRest:'Passer le repos ▶',
    closeSession:'✕ Fermer', setOf:'Série', of2:'de', exerciseLbl:'Exercice',
    restBetween:'Repos entre séries', nextExercise:'Suivant:',
    coachOnline:'● En ligne', coachPlaceholder:'Posez-moi une question...', clearHistory:'Effacer',
    shareProgress:'📤 Partager mes progrès', enableNotif:'🔔 Activer le rappel quotidien',
    sessComplete:'Bravo! Excellente séance!', wellDone:'Bravo', dayCompleted:'Jour complété',
    sessExercises:"Exercices de la séance", restScreen:'Repos! 😤',
    steps:'Étapes', smartStats:'🧠 Stats intelligentes', trainingHistory:'📅 Journal',
    soundSettings:'🔊 Paramètres sonores', soundToggle:'Son', tickToggle:'Clics minuteur', ttsToggle:'🎙️ Voix motivante arabe', volumeLabel:'Volume',
    settingsTitle:'⚙️ Paramètres', apiKeyTitle:'🤖 Clé Groq API (optionnel)', apiKeySave:'💾 Sauvegarder',
    profileTitle:'👤 Profil', profileName:'Prénom', profileWeight:'Poids (kg)', profileHeight:'Taille (cm)',
    profileTrainTime:'Heure d\'entraînement', profileStartDate:'Date de début', profileSave:'💾 Sauvegarder',
    tutorialTitle:'Tutoriel', resetOnboarding:'Recommencer config.', helpTitle:'❓ Aide',
    closeBtn:'Fermer', cancelBtn:'Annuler', saveClose:'✅ Sauver et fermer',
    addExercise:'Ajouter exercice', exerciseLibrary:'Bibliothèque', newExercise:'+ Nouvel exercice',
    smartStatsCompletion:'Taux de complétion', smartStatsAvgCal:'Cal moy/séance',
    smartStatsFav:'Exercice favori', smartStatsBestDay:'Meilleur jour',
    smartStatsWeekTrend:'vs Semaine passée', smartStatsThisWeek:'Cette semaine', smartStatsLastWeek:'Semaine passée',
    // Network & PWA
    noInternet:'⚠️ Pas de connexion internet',
    installApp:'📲 Installer l\'app',
    installAppTitle:'Installer l\'appli sur votre appareil',
    installAppSub:'Accès rapide — fonctionne hors ligne — rappels',
    installNowBtn:'Installer',
    installTitle:'📲 Installer AZEM',
    installDesc:'Enregistrez l\'app sur votre écran d\'accueil pour un accès rapide hors ligne',
    installBtnAndroid:'📲 Installer maintenant',
    installAlready:'✅ Application déjà installée',
    installIosHint:'Pour installer sur iOS: appuyez sur Partager puis "Sur l’écran d’accueil"',
    // Settings sheet
    cloudSyncTitle:'☁️ Synchronisation cloud',
    cloudSyncDesc:'Connectez-vous avec Google pour sauvegarder vos données dans le cloud.',
    googleSignIn:'Se connecter avec Google',
    syncedStatus:'✅ Connecté — données sauvegardées',
    signOut:'Déconnexion',
    syncNow:'🔄 Synchroniser',
    programTitle:'📅 Choisir le programme',
    programAdvanced:'🔥 Avancé',
    programAdvancedDays:'30+ jours',
    programBeginner:'🌱 Débutant',
    programBeginnerDays:'21 jours',
    helpQuestion:'Voulez-vous revoir le tutoriel de l\'application?',
    restartTutorial:'🎯 Recommencer le tutoriel',
    resetSetupTitle:'🔄 Réinitialiser',
    resetSetupBtn:'Recommencer la configuration',
    resetSetupConfirm:'Recommencer la configuration initiale?',
    // Workout inline
    calLabel:'Cal', dayLabel:'Jour', estimatedCalToday:'🔥 Calories estimées aujourd\'hui:',
    weightLbl:'Poids', kgLbl:'kg', exCalChip:'Cal',
    stretchExLabel:'exercices d\'étirement',
    // Beginner phases
    phaseDiscovery:'Découverte', phaseMastery:'Maîtrise',
  }
};
let currentLang = (() => { try { const s = JSON.parse(localStorage.getItem('azem_S')); return s?.lang || 'ar'; } catch(e) { return 'ar'; } })();
// Quick translation helper
window.T = function(key, fallback) {
  const L = LANGS[currentLang] || LANGS.ar;
  return L[key] || fallback || key;
};
function cycleLang() {
  const arr=['ar','en','fr'];
  currentLang = arr[(arr.indexOf(currentLang)+1)%3];
  S.lang=currentLang; saveState();
  applyLang(currentLang);
}
function applyLang(lang) {
  currentLang = lang || 'ar';
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang==='ar'?'rtl':'ltr';
  document.body.style.fontFamily = currentLang==='ar' ? "'Cairo','Tajawal',sans-serif" : "'Inter',sans-serif";

  // Update all lang buttons
  ['lang-btn','dt-lang-btn'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent=currentLang.toUpperCase();
  });

  const L = LANGS[currentLang] || LANGS.ar;

  // ── Tab labels ──
  const tabs = document.querySelectorAll('.tab-btn');
  const tabKeys = ['home','workout','timer','progress','coach'];
  const tabIcons = ['🏠','🏋️','⏱️','📊','🤖'];
  tabs.forEach((t,i)=>{ t.innerHTML=`<span class="t-icon">${tabIcons[i]}</span>${L[tabKeys[i]]||tabKeys[i]}`; });

  // ── Static labels map (id → lang key) ──
  const staticLabels = {
    // Progress stats
    'lbl-done-stat':'doneStat','lbl-streak-stat':'streakStat',
    'lbl-cal-stat':'calStat','lbl-remain-stat':'remainStat',
    // Timer tab labels
    'lbl-worktime':'workTime','lbl-resttime':'restTime','lbl-rounds':'roundsLabel',
    // Rope labels
    'lbl-jumps':'jumpsLabel','lbl-meters':'metersLabel','lbl-mins':'minsLabel','lbl-sess':'sessLabel',
    // Desktop stats
    'dt-lbl-day':'day','dt-lbl-done':'daysCompleted','dt-lbl-str':'streak','dt-lbl-cal':'calories',
    // Section titles
    'lbl-phases':'phasesTitle',
  };
  Object.entries(staticLabels).forEach(([id,key])=>{
    const el=document.getElementById(id);
    if(el && L[key]) el.textContent=L[key];
  });

  // ── Timer tab buttons ──
  const tPlayBtn = document.getElementById('t-play-btn');
  if(tPlayBtn && !tPlayBtn._running) tPlayBtn.textContent = (currentLang==='ar'?'▶ تشغيل':currentLang==='fr'?'▶ Démarrer':'▶ Start');
  const tLbl = document.getElementById('t-lbl');
  if(tLbl) tLbl.textContent = L.timerReady||'جاهز';
  const tResetBtn = document.querySelector('[onclick="timerReset()"]');
  if(tResetBtn) tResetBtn.textContent = currentLang==='ar'?'↺ إعادة':currentLang==='fr'?'↺ Réinitialiser':'↺ Reset';

  // ── Timer presets (minute labels) ──
  const presetMap = {ar:['1د','2د','3د','5د','10د','20د'], en:['1m','2m','3m','5m','10m','20m'], fr:['1m','2m','3m','5m','10m','20m']};
  document.querySelectorAll('.preset').forEach((btn,i)=>{ if(presetMap[currentLang]?.[i]) btn.textContent=presetMap[currentLang][i]; });

  // ── Tabata section ──
  const tabTitleEl = document.querySelector('#tab-timer .sec-card:first-of-type .sec-card-title');
  if(tabTitleEl) tabTitleEl.textContent = L.tabataTitle||'⚡ تاباتا';
  const startTabataBtn = document.querySelector('[onclick="startTabata()"]');
  if(startTabataBtn) startTabataBtn.textContent = L.startTabata||'🔥 ابدأ تاباتا';

  // ── Rope tracker ──
  const ropeTitleEl = document.querySelectorAll('#tab-timer .sec-card-title')[1];
  if(ropeTitleEl) ropeTitleEl.textContent = L.ropeTitle||'🪢 متتبع الحبل';
  const ropeBtn = document.getElementById('rope-btn');
  if(ropeBtn && !ropeBtn._running) ropeBtn.textContent = L.startRope||'▶ ابدأ';
  const ropeResetBtn = document.querySelector('[onclick="ropeReset()"]');
  if(ropeResetBtn) ropeResetBtn.textContent = L.resetRope||'↺ تصفير';

  // ── Progress tab section titles ──
  const progressTitles = [
    {sel:'[onclick="shareProgress()"]', key:'shareProgress'},
  ];
  const weeklyTitleEl = document.querySelector('#tab-progress .sec-card:nth-of-type(2) .sec-card-title');
  if(weeklyTitleEl) weeklyTitleEl.textContent = L.weeklyTitle||'📊 مقارنة أسبوعية';
  const calTitleEl = document.querySelector('#tab-progress .sec-card:nth-of-type(3) .sec-card-title');
  if(calTitleEl) {
    // FIX: عنوان التقويم ديناميكي بناءً على عدد أيام البرنامج الفعلي
    const progDays = S.user?.programDays || 30;
    const calBase = currentLang==='en' ? `🗓️ ${progDays}-Day Calendar` : currentLang==='fr' ? `🗓️ Calendrier ${progDays}j` : `🗓️ تقويم ${progDays} يوم`;
    calTitleEl.textContent = calBase;
  }
  const measTitleEl = document.querySelector('#tab-progress .sec-card:nth-of-type(4) .sec-card-title');
  if(measTitleEl) measTitleEl.textContent = L.measureTitle||'📏 قياسات الجسم';
  const badgesTitleEl = document.querySelector('#tab-progress .sec-card:nth-of-type(5) .sec-card-title');
  if(badgesTitleEl) badgesTitleEl.textContent = L.badgesTitle||'🏅 الشارات';

  // ── Measurements labels ──
  const mLabels = document.querySelectorAll('.m-lbl');
  const mKeys = ['weightLabel','waistLabel','chestLabel'];
  mLabels.forEach((el,i)=>{ if(L[mKeys[i]]) el.textContent=L[mKeys[i]]; });
  const saveMeasBtn = document.querySelector('[onclick="saveMeasurements()"]');
  if(saveMeasBtn) saveMeasBtn.textContent = L.saveBtn||'💾 حفظ القياسات';

  // ── Share + Notif buttons ──
  const shareBtn = document.querySelector('[onclick="shareProgress()"]');
  if(shareBtn) shareBtn.textContent = currentLang==='ar'?'📤 مشاركة تقدمي':currentLang==='fr'?'📤 Partager':'📤 Share Progress';
  const notifBtn = document.getElementById('notif-btn');
  if(notifBtn && !notifBtn._activated) notifBtn.textContent = currentLang==='ar'?'🔔 تفعيل تذكير التدريب اليومي':currentLang==='fr'?'🔔 Activer le rappel':'🔔 Enable Daily Training Reminder';

  // ── Session overlay ──
  const sessPauseBtn = document.getElementById('sess-pause-btn');
  if(sessPauseBtn) sessPauseBtn.textContent = L.pauseBtn||'⏸ إيقاف';
  const sessBackBtn = document.getElementById('sess-back-btn');
  if(sessBackBtn) sessBackBtn.textContent = L.backBtn||'↩ العودة';

  // ── Session celebration ──
  const celTitle = document.querySelector('.cel-title');
  if(celTitle) celTitle.textContent = currentLang==='ar'?'أحسنت! جلسة رائعة!':currentLang==='fr'?'Bravo! Excellente séance!':'Well done! Great session!';
  const celSubDefault = document.getElementById('cel-sub');
  if(celSubDefault) celSubDefault.textContent = currentLang==='ar'?'لقد أنجزت جلستك اليومية':currentLang==='fr'?'Vous avez complété votre séance':'You completed your daily session';
  const celBtn = document.querySelector('.cel-btn');
  if(celBtn) celBtn.textContent = currentLang==='ar'?'💪 رائع! إغلاق':currentLang==='fr'?'💪 Super! Fermer':'💪 Awesome! Close';

  // ── Session list ──
  const slTitle = document.querySelector('.sl-title');
  if(slTitle) slTitle.textContent = currentLang==='ar'?'تمارين الجلسة':currentLang==='fr'?"Exercices de la séance":'Session Exercises';

  // ── Session seconds label ──
  const sTLbl = document.querySelector('.s-t-lbl');
  if(sTLbl) sTLbl.textContent = L.lblSecs||'ثانية';

  // ── Rest screen ──
  const restLbl = document.querySelector('.rest-lbl');
  if(restLbl) restLbl.textContent = currentLang==='ar'?'استراح! 😤':currentLang==='fr'?'Repos! 😤':'Rest! 😤';

  // ── Theme modal title ──
  const themeMTitle = document.querySelector('#theme-modal .sheet-title');
  if(themeMTitle) themeMTitle.textContent = currentLang==='ar'?'🎨 اختر الثيم':currentLang==='fr'?'🎨 Choisir le thème':'🎨 Choose Theme';

  // ── Desktop shell ──
  const dtStartBtn = document.querySelector('.dt-topbar-btn[onclick="startGuidedSession()"]');
  if(dtStartBtn) dtStartBtn.textContent = (currentLang==='ar'?'▶ جلسة موجهة':currentLang==='fr'?'▶ Séance guidée':'▶ Guided Session');
  const dtModeBtn = document.querySelector('.dt-topbar-btn[onclick="cycleMode()"]');
  if(dtModeBtn) dtModeBtn.textContent = (currentLang==='ar'?'📱 جوال':currentLang==='fr'?'📱 Mobile':'📱 Mobile');
  const dtStatTitle = document.querySelector('.dt-panel-title');
  if(dtStatTitle) dtStatTitle.textContent = currentLang==='ar'?'📊 الإحصاء':currentLang==='fr'?'📊 Statistiques':'📊 Stats';
  const dtTimerTitle = document.querySelectorAll('.dt-panel-title')[1];
  if(dtTimerTitle) dtTimerTitle.textContent = currentLang==='ar'?'⏱️ المؤقت':currentLang==='fr'?'⏱️ Minuteur':'⏱️ Timer';
  const dtPhaseLbl = document.getElementById('dt-t-phase');
  if(dtPhaseLbl) dtPhaseLbl.textContent = L.timerReady||'جاهز';
  const dtPlanLbl = document.getElementById('dt-plan-label');
  if(dtPlanLbl) dtPlanLbl.textContent = L.exercisesTodayLbl||'تمارين اليوم';


  // ── Active rest overlay buttons ──
  const arBackBtn = document.getElementById('ar-back-btn');
  if(arBackBtn) arBackBtn.textContent = L.backBtn||'↩ العودة';
  const arMainBtn = document.getElementById('ar-main-btn');
  if(arMainBtn) arMainBtn.textContent = L.skipBtn||'تخطي ⏭';



  // ── Settings sheet ──
  const settingsTitleEl = document.querySelector('#settings-sheet [style*="font-size:16px"][style*="font-weight:900"]');
  if(settingsTitleEl) settingsTitleEl.textContent = L.settingsTitle||'⚙️ الإعدادات';
  const apiKeyTitleEl = document.querySelector('#settings-sheet [style*="مفتاح Groq"], #settings-sheet .sec-card > div:first-child');
  // API key description is inline - handled via static text
  const profileTitleEl = document.querySelector('#settings-sheet [style*="الملف الشخصي"]');
  const saveApiBtn = document.querySelector('[onclick="saveApiKey()"]');
  if(saveApiBtn) saveApiBtn.textContent = L.apiKeySave||'💾 حفظ المفتاح';
  const saveProfileBtn = document.querySelector('[onclick="saveProfile()"]');
  if(saveProfileBtn) saveProfileBtn.textContent = L.profileSave||'💾 حفظ الملف';

  // ── Sound sheet ── (FIX: استخدام IDs بدلاً من ترتيب querySelectorAll)
  const sndSound = document.getElementById('snd-lbl-sound');
  const sndTick  = document.getElementById('snd-lbl-tick');
  const sndTts   = document.getElementById('snd-lbl-tts');
  const sndVol   = document.getElementById('snd-lbl-vol');
  if(sndSound) sndSound.textContent = L.soundToggle  || 'الصوت';
  if(sndTick)  sndTick.textContent  = L.tickToggle   || 'نقرات المؤقت';
  if(sndTts)   sndTts.textContent   = L.ttsToggle    || '🎙️ صوت تحفيزي عربي';
  if(sndVol)   sndVol.textContent   = L.volumeLabel  || 'مستوى الصوت';

  // ── Smart stats + training history section titles ──
  const smartStatsTitleEl = document.querySelector('#smart-stats')?.previousElementSibling;
  if(smartStatsTitleEl?.classList?.contains('sec-card-title')) smartStatsTitleEl.textContent = L.smartStats||'🧠 إحصاء ذكي';
  const trainingHistTitleEl = document.querySelector('#training-history-list')?.previousElementSibling;
  if(trainingHistTitleEl?.classList?.contains('sec-card-title')) trainingHistTitleEl.textContent = L.trainingHistory||'📅 سجل التدريبات';

  // ── Active rest overlay title ──
  const arTitleEl = document.querySelector('#active-rest-overlay [style*="font-size:16px"][style*="font-weight:900"]');
  if(arTitleEl) arTitleEl.textContent = currentLang==='ar'?'🧘 راحة نشطة':currentLang==='fr'?'🧘 Repos actif':'🧘 Active Rest';

  // ── Day editor ──
  const deAddBtn = document.querySelector('[onclick="deShowLibrary()"] span:last-child');
  if(deAddBtn) deAddBtn.textContent = currentLang==='ar'?'إضافة تمرين':currentLang==='fr'?'Ajouter exercice':'Add Exercise';
  const deSaveBtn = document.querySelector('[onclick="closeDayEditor()"][style*="gradient"]');
  if(deSaveBtn) deSaveBtn.textContent = currentLang==='ar'?'✅ حفظ وإغلاق':currentLang==='fr'?'✅ Sauver':'✅ Save & Close';
  const deLibTitle = document.querySelector('#de-panel-library [style*="font-size:16px"]');
  if(deLibTitle) deLibTitle.textContent = currentLang==='ar'?'مكتبة التمارين':currentLang==='fr'?'Bibliothèque':'Exercise Library';

  // ── data-i18n attributes ──
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');
    if(L[key]) el.textContent=L[key];
  });

  // ── API Key section - handled by data-i18n

  // ── Settings sheet static labels ──
  const settingsSheet = document.getElementById('settings-sheet');
  if (settingsSheet) {
    // Profile labels
    const profileLabels = settingsSheet.querySelectorAll('.profile-lbl');
    const profileKeys = ['profileName','profileWeight','profileHeight','profileTrainTime','profileStartDate'];
    profileLabels.forEach((el,i) => { if(L[profileKeys[i]]) el.textContent = L[profileKeys[i]]; });
    // Program section
    const pgmTitle = settingsSheet.querySelector('[data-pgm-title]');
    if(pgmTitle) pgmTitle.textContent = L.programTitle||'📅 اختيار البرنامج';
    const pgmAdv = document.getElementById('pgm-btn-standard');
    if(pgmAdv) { const lbl = pgmAdv.querySelector('.pgm-lbl'); const sub = pgmAdv.querySelector('.pgm-sub'); if(lbl) lbl.textContent = L.programAdvanced||'🔥 المتقدم'; if(sub) sub.textContent = L.programAdvancedDays||'30+ يوم'; }
    const pgmBeg = document.getElementById('pgm-btn-beginner');
    if(pgmBeg) { const lbl = pgmBeg.querySelector('.pgm-lbl'); const sub = pgmBeg.querySelector('.pgm-sub'); if(lbl) lbl.textContent = L.programBeginner||'🌱 المبتدئين'; if(sub) sub.textContent = L.programBeginnerDays||'21 يوم'; }
    // Help section
    const helpQ = settingsSheet.querySelector('[data-help-q]');
    if(helpQ) helpQ.textContent = L.helpQuestion||'هل تريد مراجعة شرح التطبيق مرة أخرى؟';
    const restartBtn = settingsSheet.querySelector('[data-restart-tutorial]');
    if(restartBtn) restartBtn.textContent = L.restartTutorial||'🎯 إعادة التعليمات';
    const resetTitle = settingsSheet.querySelector('[data-reset-title]');
    if(resetTitle) resetTitle.textContent = L.resetSetupTitle||'🔄 إعادة التهيئة';
    const resetBtn = settingsSheet.querySelector('[data-reset-btn]');
    if(resetBtn) resetBtn.textContent = L.resetSetupBtn||'إعادة شاشة الإعداد الأولى';
  }

  // ── Install section ──
  updateInstallSection();

  // FIX: إعادة رسم المكونات الدائمة فقط + التبويب النشط حالياً
  // بدلاً من إعادة رسم كل شيء دفعة واحدة
  renderDayStrip();
  renderTips();

  // رسم التبويب النشط فقط
  const activeTab = document.querySelector('.tab-content.active');
  const activeId  = activeTab ? activeTab.id : '';
  if (activeId === 'tab-home')     { if (typeof renderHome === 'function') renderHome(); }
  else if (activeId === 'tab-workout')  renderWorkoutTab();
  else if (activeId === 'tab-progress') renderProgress();
  else if (activeId === 'tab-coach')    { try { renderCoach(); } catch(e) {} }
  else { renderWorkoutTab(); } // fallback

  if (document.body.classList.contains('desktop-mode')) dtRender();
}


