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
const COMPARE = [
  ['請求先の役所を自分で調べる', '役所ナビが次の請求先を案内'],
  ['古い手書きの戸籍を読み解く', '撮るだけでAIが読み取り'],
  ['家系図を手で書き起こす', '家系図に自動で配置'],
  ['途中で止まりがち', 'レッスンと連続記録で続く'],
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

function header(step) {
  const i = STEPS.indexOf(step);
  const pct = Math.round((i / (STEPS.length - 2)) * 100);
  return `<div class="topbar"><button class="back" data-back aria-label="戻る">${icon('back')}</button><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>`;
}

/** A question screen: title, why we ask, filled option cards, and a Continue that waits for an answer. */
function question(key, title, why, items) {
  const chosen = answers[key] !== undefined;
  return `
    ${header(key)}
    <section class="screen">
      <h1>${title}</h1>
      <p class="lead">${why}</p>
      <div class="options" role="radiogroup">${items
        .map(
          (item, i) => `<button class="option${answers[key] === item.value ? ' selected' : ''}" role="radio" aria-checked="${answers[key] === item.value}" style="animation-delay:${i * 40}ms" data-answer="${key}" data-value="${item.value}">
            <span>${item.label}${item.sub ? `<small>${item.sub}</small>` : ''}</span><span class="tick">${icon('check', 14)}</span>
          </button>`,
        )
        .join('')}</div>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next ${chosen ? '' : 'disabled'}>続ける</button></div>
    </section>`;
}

/** The product in one picture: a family tree whose boxes fill in as koseki are scanned. */
function treeMock() {
  const box = (x, y, w, label, name) => {
    const filled = name !== '?';
    return `<g><rect x="${x}" y="${y}" width="${w}" height="38" rx="9" fill="${filled ? '#EFFBE5' : '#fff'}" stroke="${filled ? '#58CC02' : '#D4D4D4'}" stroke-width="2" ${filled ? '' : 'stroke-dasharray="4 3"'}/>
      <text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-size="9" font-weight="700" fill="#777">${label}</text>
      <text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" font-size="12" font-weight="800" fill="${filled ? '#3C3C3C' : '#AFAFAF'}">${name}</text></g>`;
  };
  const line = (d) => `<path d="${d}" stroke="#D4D4D4" stroke-width="2" fill="none"/>`;
  return `<svg class="tree" width="232" height="176" viewBox="0 0 232 176" aria-hidden="true">
    ${line('M27 40v12h56V40M57 52v18')}${line('M149 40v12h56V40M177 52v18')}${line('M57 108v12h120v-12M117 120v14')}
    ${box(2, 2, 50, '祖父', '健一')}${box(58, 2, 50, '祖母', 'ハル')}${box(124, 2, 50, '祖父', '?')}${box(180, 2, 50, '祖母', '?')}
    ${box(22, 70, 70, '父', '誠')}${box(142, 70, 70, '母', '?')}
    ${box(72, 134, 90, '本人', 'あなた')}
  </svg>`;
}

const screens = {
  landing: () => `
    <section class="screen hero">
      <div class="hero-wrap">
        <div class="device">
          <div class="notch"></div>
          <div class="bar">わたしの家系図<span class="num">3 / 7人</span></div>
          ${treeMock()}
          <div class="toast"><span class="dot">${icon('check', 14)}</span>戸籍から2人を追加しました</div>
        </div>
        <img class="peek" src="/mascot.svg" alt="">
      </div>
      <h1>戸籍を撮るだけで、<br><span class="accent">ご先祖さまの家系図</span>に。</h1>
      <p class="muted">1分の診断で、会えるご先祖さまの人数と<wbr>戸籍をさかのぼるプランがわかります。</p>
      <div class="grow"></div>
      <div class="bottom">
        <button class="btn" data-next>無料で診断する</button>
        <p class="small" style="margin:0">すでにアプリをお持ちの方は、アプリからご利用ください</p>
      </div>
      ${legalFooter()}
    </section>`,

  hook: () => `
    ${header('hook')}
    <section class="screen">
      <h1>10代さかのぼると、<br>ご先祖さまは何人？</h1>
      <p class="lead">父母が2人、祖父母が4人…と、1代ごとに倍になります。</p>
      <div class="stat-card" style="text-align:center">
        <div class="big-number" data-count="1024">0</div>
        <b>人</b>
        <p class="small" style="margin:8px 0 0">戸籍をたどれば、江戸時代生まれのご先祖さまに出会えることもあります。</p>
      </div>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>続ける</button></div>
    </section>`,

  motive: () =>
    question('motive', '家系図をつくろうと<br>思ったきっかけは？', 'あなたに合ったプランづくりに使います。', MOTIVES.map((m) => ({ value: m, label: m }))),

  target: () =>
    question('target', '何代前まで<br>知りたいですか？', 'ゴールに合わせて、必要な戸籍をご案内します。', TARGETS.map((t) => ({ value: t.gen, label: t.label, sub: t.sub }))),

  knowledge: () =>
    question('knowledge', '祖父母4人のお名前、<br>いくつ言えますか？', 'いまの家系図の出発点がわかります。', KNOWLEDGE.map((k) => ({ value: k.id, label: k.label }))),

  experience: () =>
    question('experience', '戸籍を取ったことは<br>ありますか？', '最初の一歩を決めるのに使います。', EXPERIENCE.map((e) => ({ value: e.id, label: e.label }))),

  insight: () => {
    const gen = targetGen();
    const rows = Array.from({ length: gen }, (_, i) => i + 1);
    return `
    ${header('insight')}
    <section class="screen">
      <h1>${targetLabel()}で、<br>会えるご先祖さまは</h1>
      <p class="lead">${answers.knowledge === 'all' ? '祖父母のお名前を言えるのは、すばらしいことです。' : 'お名前がわからなくても大丈夫。'}${
        gen >= 3 ? '曾祖父母より前の方々は、戸籍を取るとお名前がわかります。' : '戸籍を取ると、生年月日や出身地までわかります。'
      }</p>
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
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>続ける</button></div>
    </section>`;
  },

  compare: () => `
    ${header('compare')}
    <section class="screen">
      <h1>つまずきやすいところを、<br>アプリが手伝います</h1>
      <p class="lead">ひとりで戸籍をさかのぼるのは、大変な作業です。</p>
      <div class="compare">
        <div class="row head"><div>ひとりで</div><div>家系図クエスト</div></div>
        ${COMPARE.map(
          ([alone, us]) => `<div class="row"><div><span class="no">${icon('dash', 16)}</span>${alone}</div><div><span class="yes">${icon('check', 16)}</span>${us}</div></div>`,
        ).join('')}
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
      <div class="grow"></div>
    </section>`,

  plan: () => `
    <div class="topbar"></div>
    <section class="screen" style="text-align:center">
      <img class="pop" src="/mascot.svg" alt="" style="width:104px;height:104px;margin:0 auto">
      <h1>あなた専用プランが<br>できました</h1>
      <span class="result-pill num">${targetLabel()}・${ancestorsUpTo(targetGen())}人のご先祖さま</span>
      <div class="summary">
        <div class="cell"><div class="label">さかのぼる世代</div><div class="value num">${targetGen()}代前</div></div>
        <div class="cell"><div class="label">会えるご先祖さま</div><div class="value num">${ancestorsUpTo(targetGen())}人</div></div>
        <div class="cell wide"><span class="ic">${icon('scroll')}</span><div><div class="label">最初の一歩</div><div class="value">${FIRST_STEP[answers.experience] ?? FIRST_STEP.unknown}</div></div></div>
      </div>
      <p class="small" style="margin-top:14px">完成した家系図は、本にして残すこともできます（製本は別料金）。</p>
      <div class="grow"></div>
      <div class="bottom"><button class="btn" data-next>続ける</button></div>
    </section>`,

  paywall: () => {
    const unavailable = params.get('checkout') === 'unavailable';
    const p = PRICES[plan];
    return `
    <div class="topbar"><button class="back" data-back aria-label="戻る">${icon('back')}</button></div>
    <section class="screen">
      <h1>${targetLabel()}の家系図を、<br>今日からつくろう</h1>
      <ol class="timeline">
        <li><span class="dot">${icon('unlock')}</span><div><h3>今日</h3><p>すべての機能が使えるようになります</p></div></li>
        <li><span class="dot">${icon('phone')}</span><div><h3>お申し込みのあと</h3><p>アプリを入れて、プランを有効にします</p></div></li>
        <li><span class="dot">${icon('tree')}</span><div><h3>戸籍が届いたら</h3><p>撮るだけで、AIが家系図に配置します</p></div></li>
      </ol>
      <div class="plans" role="radiogroup" aria-label="プラン">
        ${planCard('monthly')}
        ${planCard('annual')}
      </div>
      ${unavailable ? '<div class="notice">ただいまお申し込みを受け付けていません。時間をおいてお試しください。</div>' : ''}
      <div class="reassure">${icon('check', 18)}いつでも解約できます</div>
      <button class="btn" data-checkout>${p.label}ではじめる</button>
      <p class="small fine num">${p.price}/${p.per}・自動更新<br>解約しても次の更新日まで使えます<br>お支払いは Stripe の安全な決済ページで行います</p>

      <div class="section-title">家系図クエストでできること</div>
      <div class="features">
        ${FEATURES.map(([ic, t, d]) => `<div class="feature"><span class="ic">${icon(ic)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}
      </div>
      <div class="section-title">よくある質問</div>
      <details><summary>iPhone と Android のどちらで使えますか？</summary><p>どちらでも使えます。Web でお申し込みいただいたプランを、アプリで有効にしてご利用ください。</p></details>
      <details><summary>解約はいつでもできますか？</summary><p>はい。お申し込み時のメールにある管理ページ、またはアプリの「プロフィール → サブスクリプションを管理」からいつでも解約できます。次回更新日までは引き続きご利用いただけます。</p></details>
      <details><summary>戸籍の画像は保存されますか？</summary><p>読み取りのためにメモリ上で処理するだけで、画像は保存しません。</p></details>
      <details><summary>製本の料金も含まれますか？</summary><p>含まれません。家系図を本にする場合は、アプリから別料金でご注文いただけます。</p></details>
      ${legalFooter()}
    </section>`;
  },
};

function planCard(id) {
  const p = PRICES[id];
  const selected = plan === id;
  return `<button class="plan${selected ? ' selected' : ''}" role="radio" aria-checked="${selected}" data-plan="${id}">
    ${id === 'annual' ? `<span class="badge">${SAVINGS}%おトク</span>` : ''}
    <span class="tick">${icon('check', 12)}</span>
    <span class="name">${p.label}</span>
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
    root.querySelectorAll(`[data-answer="${key}"]`).forEach((b) => {
      b.classList.toggle('selected', b === el);
      b.setAttribute('aria-checked', String(b === el));
    });
    root.querySelector('[data-next]')?.removeAttribute('disabled');
    track('quiz_answer', { question: key, answer: String(answers[key]) });
  } else if (el.dataset.plan) {
    plan = el.dataset.plan;
    store.set('plan', plan);
    // Update in place so the page doesn't jump back to the top.
    root.querySelectorAll('[data-plan]').forEach((b) => {
      b.classList.toggle('selected', b === el);
      b.setAttribute('aria-checked', String(b === el));
    });
    const p = PRICES[plan];
    root.querySelector('[data-checkout]').textContent = `${p.label}ではじめる`;
    root.querySelector('.fine').innerHTML = root.querySelector('.fine').innerHTML.replace(/^[^・]+/, `${p.price}/${p.per}`);
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

// ---- start ----

const initial = location.hash.slice(1);
// Deep links into the middle of the quiz only make sense once it was answered (e.g. back from checkout).
const resumable = STEPS.includes(initial) && initial !== 'calc' && QUIZ.every((k) => answers[k] !== undefined || STEPS.indexOf(initial) <= STEPS.indexOf(k));
show(resumable ? initial : 'landing', { history: 'replace' });
if (!resumable || initial === 'landing') track('funnel_view', { ...utm });
