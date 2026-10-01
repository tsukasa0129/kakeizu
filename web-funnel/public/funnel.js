// web2app funnel: landing → short quiz → insight → plan → paywall → RevenueCat checkout (Stripe).
// Mirrors the in-app onboarding (src/app/onboarding.tsx) so ad traffic gets the same pitch, but pays on
// the web. After checkout, RevenueCat redirects to /success, which hands the purchase to the app.

const PRICES = {
  // Keep in sync with the RevenueCat Web Billing products (premium_annual_web / premium_monthly_web).
  annual: { label: '年額プラン', price: '¥4,800', per: '年', monthly: '¥400' },
  monthly: { label: '月額プラン', price: '¥800', per: '月', monthly: null },
};
const SAVINGS = 50; // 1 - 4800 / (800 * 12)

const MOTIVES = ['ルーツを知りたい', '子どもに残したい', '相続の準備', 'お墓・法事のため', 'なんとなく興味'];
const TARGETS = [
  { gen: 2, label: '祖父母まで', sub: '2代前' },
  { gen: 3, label: '曾祖父母まで', sub: '3代前・明治〜大正ごろ' },
  { gen: 4, label: '高祖父母まで', sub: '4代前・江戸末期〜明治ごろ' },
  { gen: 5, label: 'たどれるところまで', sub: '5代前〜' },
];
const KNOWLEDGE = [
  { id: 'all', label: '4人とも言える' },
  { id: 'some', label: '1〜3人なら言える' },
  { id: 'none', label: 'ほとんど知らない' },
];
const EXPERIENCE = [
  { id: 'have', label: '取ったことがある' },
  { id: 'never', label: '取ったことはない' },
  { id: 'unknown', label: '取り方がわからない' },
];
const FIRST_STEP = {
  have: '手元の戸籍をスキャンして家系図に',
  never: 'コンビニ・役所で自分の戸籍を取る',
  unknown: 'レッスンで戸籍の取り方を知る',
};
const GEN_NAMES = ['あなた', '父母', '祖父母', '曾祖父母', '高祖父母', '5代前'];
const CALC_ITEMS = ['さかのぼる世代', '必要な戸籍の種類', '請求先の役所', '学習パス'];
const FEATURES = [
  ['scroll', 'AIで戸籍を読み取り', '撮るだけで人物・続柄・日付を読み取り、家系図に自動で配置（無制限）'],
  ['tree', '5代前まで広がる家系図', 'あなた → 父母 → 祖父母 → 曾祖父母 → 高祖父母 …'],
  ['office', '役所ナビ', '本籍地の調べ方から、次に請求する戸籍までチェックリストで案内'],
  ['spark', 'ゲーム感覚で続く', 'レッスン・連続記録・クエストで、少しずつ空欄が埋まる'],
];

const STEPS = ['landing', 'hook', 'motive', 'target', 'knowledge', 'experience', 'insight', 'compare', 'calc', 'plan', 'paywall'];
const QUIZ = ['motive', 'target', 'knowledge', 'experience'];

const root = document.getElementById('root');
const answers = store.get('answers', {});
let plan = store.get('plan', 'annual');

const ancestorsAt = (gen) => 2 ** gen;
const ancestorsUpTo = (gen) => 2 ** (gen + 1) - 2;
const targetGen = () => answers.target ?? 4;
const targetLabel = () => TARGETS.find((t) => t.gen === targetGen())?.label ?? '高祖父母まで';

// Attribution: remember the ad's UTM params so they reach checkout even after navigating the quiz.
const params = new URLSearchParams(location.search);
const utm = store.get('utm', {});
for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
  if (params.get(key)) utm[key] = params.get(key);
}
store.set('utm', utm);

function says(text) {
  return `<div class="says"><img src="/mascot.svg" alt=""><h1>${text}</h1></div>`;
}

function progress(step) {
  const i = STEPS.indexOf(step);
  const pct = Math.round((i / (STEPS.length - 2)) * 100);
  return `<div class="topbar"><button class="back" data-back aria-label="戻る">${icon('back')}</button><div class="progress"><i style="width:${pct}%"></i></div></div>`;
}

function options(key, items) {
  return `<div class="options">${items
    .map(
      (item, i) => `<button class="option${answers[key] === item.value ? ' selected' : ''}" style="animation-delay:${i * 40}ms" data-answer="${key}" data-value="${item.value}">
        <span>${item.label}${item.sub ? `<small>${item.sub}</small>` : ''}</span><span class="tick">${icon('check', 14)}</span>
      </button>`,
    )
    .join('')}</div>`;
}

const screens = {
  landing: () => `
    <section class="screen hero">
      <img class="mascot" src="/mascot.svg" alt="まめだぬきのまめた">
      <span class="badge">1分でわかる 無料診断</span>
      <h1>戸籍を撮るだけで、<br><span class="accent">ご先祖さまの家系図</span>に。</h1>
      <p class="muted">あなたが会えるご先祖さまの人数と、<br>戸籍をさかのぼるプランを診断します。</p>
      <div class="features" style="text-align:left">
        ${FEATURES.slice(0, 3).map(([ic, t, d]) => `<div class="feature"><span class="ic">${icon(ic)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}
      </div>
      <div class="grow"></div>
      <div class="bottom">
        <button class="btn" data-next>無料で診断をはじめる</button>
        <p class="small" style="margin:0">すでにアプリをお持ちの方は、アプリからご利用ください</p>
      </div>
      ${legalFooter()}
    </section>`,

  hook: () => `
    ${progress('hook')}
    <section class="screen center">
      <div class="grow"></div>
      <div class="stat-card">
        <p class="muted" style="font-weight:700;margin:0">10代さかのぼると、ご先祖さまは</p>
        <div><span class="big-number" data-count="1024">0</span> <b>人</b></div>
        <p class="small" style="margin:8px 0 0">戸籍をたどれば、江戸時代生まれのご先祖さまに<br>出会えることもあります。</p>
      </div>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>つぎへ</button></div>
    </section>`,

  motive: () => `
    ${progress('motive')}
    <section class="screen">
      ${says('家系図をつくろうと思ったきっかけは？')}
      ${options('motive', MOTIVES.map((m) => ({ value: m, label: m })))}
    </section>`,

  target: () => `
    ${progress('target')}
    <section class="screen">
      ${says('何代前まで知りたい？')}
      ${options('target', TARGETS.map((t) => ({ value: t.gen, label: t.label, sub: t.sub })))}
    </section>`,

  knowledge: () => `
    ${progress('knowledge')}
    <section class="screen">
      ${says('祖父母4人のお名前、いくつ言える？')}
      ${options('knowledge', KNOWLEDGE.map((k) => ({ value: k.id, label: k.label })))}
    </section>`,

  experience: () => `
    ${progress('experience')}
    <section class="screen">
      ${says('戸籍を取ったことはある？')}
      ${options('experience', EXPERIENCE.map((e) => ({ value: e.id, label: e.label })))}
    </section>`,

  insight: () => {
    const gen = targetGen();
    const rows = Array.from({ length: gen }, (_, i) => i + 1);
    return `
    ${progress('insight')}
    <section class="screen">
      ${says(`${targetLabel()}だと、会えるご先祖さまは…`)}
      <div class="stat-card">
      <div><span class="big-number" data-count="${ancestorsUpTo(gen)}">0</span> <b>人</b></div>
      <div class="bars">
        ${rows
          .map(
            (g) => `<div class="bar-row"><span>${GEN_NAMES[g]}</span><div class="bar"><i data-width="${(ancestorsAt(g) / ancestorsAt(gen)) * 100}"></i></div><span>${ancestorsAt(g)}人</span></div>`,
          )
          .join('')}
      </div>
      </div>
      <p class="muted" style="margin-top:16px">${answers.knowledge === 'all' ? '祖父母のお名前を言えるのは、すばらしいことです。' : 'お名前がわからなくても大丈夫。'}${
        gen >= 3 ? '曾祖父母より前の方々は、戸籍を取るとお名前がわかります。' : '戸籍を取ると、生年月日や出身地までわかります。'
      }</p>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>つぎへ</button></div>
    </section>`;
  },

  compare: () => `
    ${progress('compare')}
    <section class="screen">
      ${says('ひとりでやるのと、なにがちがうの？')}
      <div class="compare">
        <div class="row head"><div>ひとりで</div><div>家系図クエスト</div></div>
        ${[
          ['どの役所に請求するか調べる', '役所ナビが次の請求先を案内'],
          ['古い手書きの戸籍を読み解く', '撮るだけでAIが読み取り'],
          ['図を手で書き起こす', '家系図に自動で配置'],
          ['途中で止まりがち', 'ゲーム感覚で続く'],
        ]
          .map(([alone, us]) => `<div class="row"><div><span class="no">${icon('dash', 16)}</span>${alone}</div><div><span class="yes">${icon('check', 16)}</span>${us}</div></div>`)
          .join('')}
      </div>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>わたしのプランをつくる</button></div>
    </section>`,

  calc: () => `
    <div class="topbar"></div>
    <section class="screen center">
      <div class="calc-pct" id="pct">0%</div>
      <h2>あなた専用のプランを<br>作成しています</h2>
      <div class="calc-bar"><i id="calcbar"></i></div>
      <ul class="checklist">${CALC_ITEMS.map((c) => `<li><span class="tick">${icon('check', 14)}</span>${c}</li>`).join('')}</ul>
    </section>`,

  plan: () => `
    <div class="topbar"></div>
    <section class="screen">
      <img class="pop" src="/mascot.svg" alt="" style="width:104px;height:104px;margin:0 auto">
      <h1 style="text-align:center">あなた専用プランが<br>できました！</h1>
      <div class="summary">
        <div class="cell"><div class="label">ゴール</div><div class="value">${targetLabel()}</div></div>
        <div class="cell"><div class="label">会えるご先祖さま</div><div class="value num">${ancestorsUpTo(targetGen())}人</div></div>
        <div class="cell wide"><span class="ic">${icon('scroll')}</span><div><div class="label">最初の一歩</div><div class="value">${FIRST_STEP[answers.experience] ?? FIRST_STEP.unknown}</div></div></div>
      </div>
      <p class="small" style="margin-top:12px">完成した家系図は、本にして残すこともできます（製本は別料金）。</p>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>プランをはじめる</button></div>
    </section>`,

  paywall: () => {
    const unavailable = params.get('checkout') === 'unavailable';
    return `
    <div class="topbar"><button class="back" data-back aria-label="戻る">${icon('back')}</button></div>
    <section class="screen paywall">
      <h1>${targetLabel()}の家系図を、<br>今日からはじめよう</h1>
      <div class="features">
        ${FEATURES.map(([ic, t, d]) => `<div class="feature"><span class="ic">${icon(ic)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}
      </div>
      <div class="plans" role="radiogroup" aria-label="プラン">
        ${planCard('annual', `<span class="plan-badge">${SAVINGS}%おトク</span>`)}
        ${planCard('monthly', '')}
      </div>
      ${unavailable ? '<div class="notice">ただいまお申し込みを受け付けていません。時間をおいてお試しください。</div>' : ''}
      <div class="section-title">お申し込みのあと</div>
      <ol class="timeline">
        <li><span class="dot num">1</span><div><p>クレジットカードでお支払い（Stripe の安全な決済ページ）</p></div></li>
        <li><span class="dot num">2</span><div><p>アプリ「家系図クエスト」をダウンロード</p></div></li>
        <li><span class="dot num">3</span><div><p>完了ページの「アプリで有効にする」をタップ。そのまま使いはじめられます</p></div></li>
      </ol>
      <div>
        <details><summary>iPhone と Android のどちらで使えますか？</summary><p>どちらでも使えます。Web でお申し込みいただいたプランを、アプリで有効にしてご利用ください。</p></details>
        <details><summary>解約はいつでもできますか？</summary><p>はい。お申し込み時のメールにある管理ページ、またはアプリの「プロフィール → サブスクリプションを管理」からいつでも解約できます。次回更新日までは引き続きご利用いただけます。</p></details>
        <details><summary>戸籍の画像は保存されますか？</summary><p>読み取りのためにメモリ上で処理するだけで、画像は保存しません。</p></details>
        <details><summary>製本の料金も含まれますか？</summary><p>含まれません。家系図を本にする場合は、アプリから別料金でご注文いただけます。</p></details>
      </div>
      <div class="bottom">
        <button class="btn" data-checkout>${PRICES[plan].label}ではじめる</button>
        <p class="small num" style="margin:0;text-align:center">${PRICES[plan].price}/${PRICES[plan].per}・自動更新。いつでも解約できます。</p>
      </div>
      ${legalFooter()}
    </section>`;
  },
};

function planCard(id, extra) {
  const p = PRICES[id];
  return `<button class="plan${plan === id ? ' selected' : ''}" role="radio" aria-checked="${plan === id}" data-plan="${id}">
    ${extra}<span class="tick">${icon('check', 12)}</span><span class="name">${p.label}</span>
    <span class="price">${p.price}<small>/${p.per}</small></span>
    <span class="sub">${p.monthly ? `月あたり${p.monthly}` : '&nbsp;'}</span>
  </button>`;
}

// ---- navigation (browser back works through history.state) ----

let current = 'landing';

/** history: 'push' adds an entry, 'replace' rewrites the current one, 'none' is for popstate. */
function show(step, { history: mode = 'push' } = {}) {
  current = step;
  root.innerHTML = screens[step]();
  const url = step === 'landing' ? location.pathname + location.search : `#${step}`;
  if (mode === 'push') history.pushState({ step }, '', url);
  else if (mode === 'replace') history.replaceState({ step }, '', url);
  window.scrollTo(0, 0);
  track('funnel_step', { step, index: STEPS.indexOf(step) });
  animate(step);
}

function next() {
  const i = STEPS.indexOf(current);
  if (i < STEPS.length - 1) show(STEPS[i + 1]);
}

window.addEventListener('popstate', (e) => {
  const step = e.state?.step ?? 'landing';
  // The calculation screen is a one-way transition; going back skips over it.
  show(step === 'calc' ? 'compare' : step, { history: step === 'calc' ? 'replace' : 'none' });
});

root.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;
  if (el.hasAttribute('data-next')) next();
  else if (el.hasAttribute('data-back')) history.back();
  else if (el.dataset.answer) {
    const key = el.dataset.answer;
    answers[key] = key === 'target' ? Number(el.dataset.value) : el.dataset.value;
    store.set('answers', answers);
    root.querySelectorAll(`[data-answer="${key}"]`).forEach((b) => b.classList.toggle('selected', b === el));
    track('quiz_answer', { question: key, answer: String(answers[key]) });
    setTimeout(next, 280);
  } else if (el.dataset.plan) {
    plan = el.dataset.plan;
    store.set('plan', plan);
    show('paywall', { history: 'none' });
  } else if (el.hasAttribute('data-checkout')) {
    startCheckout(el);
  }
});

function startCheckout(button) {
  button.disabled = true;
  button.textContent = '決済ページを開いています…';
  track('checkout_start', { plan, value: plan === 'annual' ? 4800 : 800, currency: 'JPY' });
  const query = new URLSearchParams({ plan, ...utm });
  location.href = `/checkout?${query}`;
}

// Returning from a cancelled checkout (bfcache) must not leave the button stuck.
window.addEventListener('pageshow', (e) => {
  if (e.persisted && current === 'paywall') show('paywall', { history: 'none' });
});

// ---- per-screen motion ----

function animate(step) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll('[data-count]').forEach((el) => countUp(el, Number(el.dataset.count), reduced ? 0 : 1100));
  requestAnimationFrame(() =>
    root.querySelectorAll('[data-width]').forEach((el, i) => {
      el.style.transitionDelay = `${i * 120}ms`;
      el.style.width = `${el.dataset.width}%`;
    }),
  );
  if (step === 'calc') runCalc(reduced);
  if (step === 'plan' && !reduced) confetti();
}

function countUp(el, to, ms) {
  const start = performance.now();
  const tick = (now) => {
    const t = ms ? Math.min(1, (now - start) / ms) : 1;
    el.textContent = Math.round(to * (1 - (1 - t) ** 3)).toLocaleString('ja-JP');
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function runCalc(reduced) {
  const bar = document.getElementById('calcbar');
  const pct = document.getElementById('pct');
  const items = root.querySelectorAll('.checklist li');
  const total = reduced ? 600 : 3200;
  const start = performance.now();
  const tick = (now) => {
    if (current !== 'calc') return;
    const t = Math.min(1, (now - start) / total);
    const p = Math.round(t * 100);
    bar.style.width = `${p}%`;
    pct.textContent = `${p}%`;
    items.forEach((li, i) => li.classList.toggle('done', p >= ((i + 1) / items.length) * 100 - 5));
    if (t < 1) requestAnimationFrame(tick);
    else setTimeout(() => current === 'calc' && show('plan', { history: 'replace' }), 400);
  };
  requestAnimationFrame(tick);
}

function confetti() {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#FFC800', '#CE82FF', '#FF4B4B'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3200);
}

// ---- start ----

const initial = location.hash.slice(1);
// Deep links into the middle of the quiz only make sense once it was answered (e.g. back from checkout).
const resumable = STEPS.includes(initial) && initial !== 'calc' && QUIZ.every((k) => answers[k] !== undefined || STEPS.indexOf(initial) <= STEPS.indexOf(k));
show(resumable ? initial : 'landing', { history: 'replace' });
if (!resumable || initial === 'landing') track('funnel_view', { ...utm });
