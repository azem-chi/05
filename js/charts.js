
/* ══════════════════════════════════════════
   CHART.JS OFFLINE FALLBACK
   عند فشل CDN — رسوم بديلة بـ Canvas مباشرة
══════════════════════════════════════════ */
function _isChartAvailable() {
  return typeof Chart !== 'undefined' && !window._chartJsFailed;
}

// رسم خط بسيط بدون Chart.js
function _drawSimpleLine(canvasId, labels, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 40;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  ctx.fillRect(0, 0, W, H);

  if (!data || data.length < 2) {
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '13px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد بيانات كافية', W/2, H/2);
    return;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(p => {
    const y = pad + (1-p) * (H - pad*2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W-pad, y); ctx.stroke();
  });

  // Line
  const stepX = (W - pad*2) / (data.length - 1);
  ctx.strokeStyle = color || '#D4A843';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (H - pad*2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  data.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (H - pad*2);
    ctx.fillStyle = color || '#D4A843';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });

  // Labels
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.font = '10px Cairo, sans-serif';
  ctx.textAlign = 'center';
  const step = Math.ceil(labels.length / 5);
  labels.forEach((l, i) => {
    if (i % step !== 0) return;
    const x = pad + i * stepX;
    ctx.fillText(l, x, H - 8);
  });
}

/* ══════════════════════════════════════════
   AZEM — CHARTS MODULE (v7)
   رسوم بيانية تفاعلية بـ Chart.js 4
   يعمل مع render.js الموجود — لا يكسر أي شيء
══════════════════════════════════════════ */

let _trendChart = null;
let _donutChart = null;

/* ── إدخال قسم الرسوم في DOM ── */
function injectChartsSection() {
  if (document.getElementById('charts-section')) return; // لا تُكرر
  const weeklyBarsEl = document.getElementById('weekly-bars');
  const anchor = weeklyBarsEl ? weeklyBarsEl.closest('.sec-card') : null;
  if (!anchor) return;

  const section = document.createElement('div');
  section.id = 'charts-section';
  section.className = 'sec-card';
  section.innerHTML = `
    <div class="sec-card-title" style="display:flex;align-items:center;justify-content:space-between;">
      <span>📈 اتجاه السعرات — 14 يوم</span>
      <div style="display:flex;gap:6px;" id="chart-range-btns">
        <button class="chart-range-btn active" data-range="14" onclick="switchChartRange(14,this)">14 يوم</button>
        <button class="chart-range-btn" data-range="30" onclick="switchChartRange(30,this)">30 يوم</button>
      </div>
    </div>
    <div style="position:relative;height:180px;margin:12px 0 6px;">
      <canvas id="chart-trend" style="display:block;"></canvas>
      <div id="chart-trend-empty" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--dim);font-size:13px;">
        <span style="font-size:32px;">📊</span>
        أكمل أول جلسة لترى الرسم البياني
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap;">
      <div class="chart-legend-dot" style="background:#D4A843;"></div>
      <span style="font-size:11px;color:var(--dim);">تمرين</span>
      <div class="chart-legend-dot" style="background:#3FD970;margin-right:6px;"></div>
      <span style="font-size:11px;color:var(--dim);">طعام مُسجَّل</span>
    </div>

    <div style="border-top:1px solid var(--border);margin:16px 0;"></div>

    <div class="sec-card-title">🎯 نسبة الإنجاز</div>
    <div style="display:flex;align-items:center;gap:20px;margin-top:8px;flex-wrap:wrap;">
      <div style="position:relative;width:110px;height:110px;flex-shrink:0;">
        <canvas id="chart-donut" style="display:block;"></canvas>
        <div id="chart-donut-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
          <span id="donut-pct" style="font-size:26px;font-weight:900;color:var(--gold);line-height:1;">0%</span>
          <span style="font-size:10px;color:var(--dim);">مكتمل</span>
        </div>
      </div>
      <div id="chart-donut-stats" style="flex:1;min-width:140px;display:flex;flex-direction:column;gap:8px;"></div>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', section);
}

/* ── رسم مخطط الاتجاه ── */
function renderTrendChart(days = 14) {
  const canvas = document.getElementById('chart-trend');
  const emptyEl = document.getElementById('chart-trend-empty');
  if (!canvas) return;
  if (!_isChartAvailable()) {
    // Offline fallback — رسم بسيط بدون Chart.js
    const log = Object.values(S.trainingLog||{}).sort((a,b)=>(a.day||0)-(b.day||0)).slice(-days);
    canvas.style.display='block';
    if(emptyEl) emptyEl.style.display='none';
    _drawSimpleLine(canvas.id, log.map(e=>e.date||('Y'+e.day)), log.map(e=>e.calories||0), 'var(--gold)');
    return;
  }

  const today = new Date();
  const labels = [], trainData = [], nutData = [];
  let hasAnyData = false;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    // بيانات التدريب: نجمع كل السجلات بنفس التاريخ (FIX: كان find يأخذ أول سجل فقط)
    const dayLogs = Object.values(S.trainingLog || {}).filter(e => {
      if (e.ts) { const k = new Date(e.ts).toISOString().split('T')[0]; return k === dateKey; }
      return false;
    });
    const trainCal = dayLogs.reduce((sum, e) => sum + (e.calories || 0), 0);
    // بيانات التغذية
    const nutEntries = (S.nutritionLog || {})[dateKey]?.entries || [];
    const nutCal = nutEntries.reduce((s, e) => s + (e.totalCal || 0), 0);

    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    labels.push(`${dd}/${mm}`);
    trainData.push(trainCal);
    nutData.push(nutCal);
    if (trainCal > 0 || nutCal > 0) hasAnyData = true;
  }

  if (!hasAnyData) {
    canvas.style.display = 'none';
    if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.style.flexDirection = 'column'; }
    return;
  }
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (_trendChart) { _trendChart.destroy(); _trendChart = null; }

  const ctx = canvas.getContext('2d');

  // Gradient fill for workout
  const gTrain = ctx.createLinearGradient(0, 0, 0, 160);
  gTrain.addColorStop(0, 'rgba(212,168,67,0.25)');
  gTrain.addColorStop(1, 'rgba(212,168,67,0.02)');

  const gNut = ctx.createLinearGradient(0, 0, 0, 160);
  gNut.addColorStop(0, 'rgba(63,217,112,0.18)');
  gNut.addColorStop(1, 'rgba(63,217,112,0.02)');

  _trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'تمرين',
          data: trainData,
          borderColor: '#D4A843',
          backgroundColor: gTrain,
          borderWidth: 2.5,
          fill: true,
          tension: 0.42,
          pointRadius: trainData.map(v => v > 0 ? 4 : 0),
          pointBackgroundColor: '#D4A843',
          pointBorderColor: 'rgba(212,168,67,0.3)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'طعام',
          data: nutData,
          borderColor: '#3FD970',
          backgroundColor: gNut,
          borderWidth: 2,
          fill: false,
          tension: 0.42,
          pointRadius: nutData.map(v => v > 0 ? 3 : 0),
          pointBackgroundColor: '#3FD970',
          pointHoverRadius: 5,
          spanGaps: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          backgroundColor: 'rgba(15,15,25,0.92)',
          borderColor: 'rgba(212,168,67,0.4)',
          borderWidth: 1,
          padding: 10,
          titleColor: '#D4A843',
          bodyColor: 'rgba(255,255,255,0.75)',
          titleFont: { family: 'Cairo', size: 12, weight: '700' },
          bodyFont:  { family: 'Cairo', size: 11 },
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (ctx) => {
              const v = ctx.parsed.y;
              if (v === 0) return null;
              return `${ctx.dataset.label}: ${v} سعرة`;
            }
          },
          filter: (item) => item.parsed.y > 0
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: {
            color: 'rgba(255,255,255,0.35)',
            font: { family: 'Cairo', size: 10 },
            maxRotation: 0,
            maxTicksLimit: days <= 14 ? 7 : 10
          },
          border: { display: false }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: {
            color: 'rgba(255,255,255,0.35)',
            font: { family: 'Cairo', size: 10 },
            callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v
          },
          border: { display: false },
          beginAtZero: true
        }
      }
    }
  });
}

/* ── رسم الدونت ── */
function renderDonutChart() {
  const canvas = document.getElementById('chart-donut');
  if (!canvas || !_isChartAvailable()) return;

  const done = (S.completedDays || []).length;
  const total = S.user?.programDays || 30;
  const pct = Math.round((done / total) * 100);
  const remaining = Math.max(0, total - done);

  document.getElementById('donut-pct').textContent = pct + '%';

  // Streak + calories from log
  const totalCal = Object.values(S.trainingLog || {}).reduce((s, e) => s + (e.calories || 0), 0);
  const statsEl = document.getElementById('chart-donut-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="donut-stat-row"><span class="donut-stat-icon">✅</span><span class="donut-stat-lbl">مكتمل:</span><span class="donut-stat-val" style="color:var(--gold);">${done} / ${total} يوم</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">🔥</span><span class="donut-stat-lbl">سلسلة:</span><span class="donut-stat-val" style="color:#f97316;">${S.streak || 0} أيام</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">⚡</span><span class="donut-stat-lbl">إجمالي الحرق:</span><span class="donut-stat-val" style="color:#38bdf8;">${totalCal >= 1000 ? (totalCal/1000).toFixed(1)+'k' : totalCal} كال</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">📅</span><span class="donut-stat-lbl">متبقي:</span><span class="donut-stat-val" style="color:var(--dim);">${remaining} يوم</span></div>
    `;
  }

  if (_donutChart) { _donutChart.destroy(); _donutChart = null; }
  const ctx = canvas.getContext('2d');

  const color = pct >= 80 ? '#3FD970' : pct >= 50 ? '#D4A843' : '#7C5CEF';

  _donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [done, remaining],
        backgroundColor: [color, 'rgba(255,255,255,0.06)'],
        borderColor: [color, 'transparent'],
        borderWidth: [2, 0],
        hoverOffset: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { duration: 800, easing: 'easeOutBack' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

/* ── تبديل النطاق الزمني ── */
function switchChartRange(days, btn) {
  document.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTrendChart(days);
}


/* ── مخطط وزن الجسم عبر الزمن ── */
let _weightChart = null;

function renderWeightChart() {
  // حقن قسم الوزن إذا لم يكن موجوداً
  if (!document.getElementById('weight-chart-section')) {
    const chartsSection = document.getElementById('charts-section');
    if (!chartsSection) return;
    const section = document.createElement('div');
    section.id = 'weight-chart-section';
    section.className = 'sec-card';
    section.style.marginTop = '12px';
    section.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div class="sec-card-title" style="margin-bottom:0;">⚖️ منحنى الوزن</div>
        <button onclick="openWeightLog()" style="padding:5px 12px;border-radius:8px;background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.3);color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif;">+ تسجيل</button>
      </div>
      <div id="weight-chart-wrap" style="position:relative;height:160px;">
        <canvas id="chart-weight"></canvas>
        <div id="weight-chart-empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--dim);font-size:13px;">
          <span style="font-size:28px;">⚖️</span>
          سجّل وزنك أسبوعياً لرؤية منحنى التغيير
        </div>
      </div>
      <div id="weight-chart-stats" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"></div>
    `;
    chartsSection.insertAdjacentElement('afterend', section);
  }

  const canvas  = document.getElementById('chart-weight');
  const emptyEl = document.getElementById('weight-chart-empty');
  const statsEl = document.getElementById('weight-chart-stats');
  if (!canvas) return;

  // جمع بيانات القياسات بالترتيب
  const measurements = Object.entries(S.bodyMeasurements || {})
    .filter(([,v]) => v.weight && parseFloat(v.weight) > 0)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-20); // آخر 20 قياس

  if (measurements.length < 2) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (statsEl) statsEl.innerHTML = '';
    return;
  }

  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  const labels = measurements.map(([date]) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth()+1}`;
  });
  const weights = measurements.map(([,v]) => parseFloat(v.weight));
  const firstW = weights[0], lastW = weights[weights.length-1];
  const diff = lastW - firstW;
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  if (!_isChartAvailable()) {
    const meas = S.bodyMeasurements||{};
    const entries = Object.entries(meas).sort((a,b)=>a[0].localeCompare(b[0])).slice(-20);
    if(entries.length >= 2) _drawSimpleLine(canvas.id, entries.map(([d])=>d.slice(5)), entries.map(([,v])=>v.weight||0), '#38bdf8');
    return;
  }
  if (_weightChart) { _weightChart.destroy(); _weightChart = null; }

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, 'rgba(99,102,241,0.25)');
  grad.addColorStop(1, 'rgba(99,102,241,0.02)');

  _weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'الوزن',
        data: weights,
        borderColor: '#6366f1',
        backgroundColor: grad,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          backgroundColor: 'rgba(15,15,25,0.92)',
          borderColor: 'rgba(99,102,241,0.4)', borderWidth: 1,
          padding: 10, titleColor: '#6366f1',
          bodyColor: 'rgba(255,255,255,0.75)',
          titleFont: { family: 'Cairo', size: 12, weight: '700' },
          bodyFont:  { family: 'Cairo', size: 11 },
          callbacks: { label: ctx => `${ctx.parsed.y} كغ` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Cairo', size: 10 } }, border: { display: false } },
        y: {
          min: Math.floor(minW), max: Math.ceil(maxW),
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Cairo', size: 10 }, callback: v => v + 'kg' },
          border: { display: false }
        }
      }
    }
  });

  // إحصاء الوزن
  if (statsEl) {
    const diffColor = diff < 0 ? '#22c55e' : diff > 0 ? '#ef4444' : '#D4A843';
    const diffIcon  = diff < 0 ? '📉' : diff > 0 ? '📈' : '➡️';
    const idealW = Math.round(22.5 * Math.pow((parseFloat(S.user?.height)||170)/100, 2));
    statsEl.innerHTML = `
      <div style="flex:1;min-width:80px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:var(--dim);">الوزن الأول</div>
        <div style="font-size:15px;font-weight:900;color:var(--dim);">${firstW}<span style="font-size:9px;"> كغ</span></div>
      </div>
      <div style="flex:1;min-width:80px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:var(--dim);">الوزن الحالي</div>
        <div style="font-size:15px;font-weight:900;color:#6366f1;">${lastW}<span style="font-size:9px;"> كغ</span></div>
      </div>
      <div style="flex:1;min-width:80px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:var(--dim);">التغيير ${diffIcon}</div>
        <div style="font-size:15px;font-weight:900;color:${diffColor};">${diff>0?'+':''}${diff.toFixed(1)}<span style="font-size:9px;"> كغ</span></div>
      </div>
      <div style="flex:1;min-width:80px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:var(--dim);">المثالي</div>
        <div style="font-size:15px;font-weight:900;color:#a78bfa;">${idealW}<span style="font-size:9px;"> كغ</span></div>
      </div>
    `;
  }
}

// نافذة تسجيل الوزن السريع
function openWeightLog() {
  const today = new Date().toISOString().split('T')[0];
  const existing = (S.bodyMeasurements || {})[today]?.weight || '';
  const w = prompt('أدخل وزنك اليوم (كغ):', existing);
  if (!w || isNaN(parseFloat(w))) return;
  if (!S.bodyMeasurements) S.bodyMeasurements = {};
  if (!S.bodyMeasurements[today]) S.bodyMeasurements[today] = {};
  S.bodyMeasurements[today].weight = parseFloat(w);
  S.bodyMeasurements[today].date   = today;
  // حفّظ أيضاً في S.user.weight كآخر وزن مُسجَّل
  S.user.weight = parseFloat(w);
  saveState();
  renderWeightChart();
  showMiniToast(`✅ وزنك اليوم: ${w} كغ — محفوظ!`);
}

/* ── الدالة الرئيسية ── */
function renderAllCharts() {
  injectChartsSection();
  requestAnimationFrame(() => {
    renderTrendChart(14);
    renderDonutChart();
    renderWeightChart();
  });
}

/* ══════════════════════════════════════════
   renderProgress تستدعي renderAllCharts مباشرة في render.js
   لا حاجة لـ patch هنا
══════════════════════════════════════════ */
