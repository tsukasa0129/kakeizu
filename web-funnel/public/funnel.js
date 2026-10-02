// web2app funnel: the in-app onboarding (src/app/onboarding.tsx + src/components/OnboardingHooks.tsx), screen for
// screen, then a web paywall → RevenueCat checkout (Stripe). Ad traffic gets exactly the app's pitch but pays on the
// web; after checkout, RevenueCat redirects to /success, which hands the purchase to the app.
// Keep the copy and the step order in sync with the app. The drawings come from art.js.

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
  { id: 'have', label: '取ったことがある', icon: 'scroll' },
  { id: 'never', label: '取ったことはない', icon: 'office' },
  { id: 'unknown', label: '取り方がわからない', icon: 'search' },
];
const GOALS = [
  { xp: 10, label: '気軽に', sub: '1日5分' },
  { xp: 30, label: 'ふつう', sub: '1日10分' },
  { xp: 50, label: 'しっかり', sub: '1日15分' },
  { xp: 80, label: '本気', sub: '1日20分' },
];
const FIRST_STEP = {
  have: '手元の戸籍をスキャンして家系図に',
  never: 'コンビニ・役所で自分の戸籍を取る',
  unknown: 'レッスンで戸籍の取り方を知る',
};
const GEN_NAMES = ['あなた', '親', '祖父母', '曾祖父母', '高祖父母', '5代前'];
const CALC_ITEMS = ['さかのぼる世代', '必要な戸籍の種類', '請求先の役所', '学習パス', '1日の目標'];
const COMPARE_ROWS = [
  { label: '戸籍を読む', alone: '旧字・手書きで挫折しがち', app: 'AIが読み取って自動で家系図に' },
  { label: '次に取る戸籍', alone: '自分で探して推理', app: '読み取り結果から自動でリスト化' },
  { label: '役所への請求', alone: '調べながら手探り', app: 'ルート診断とチェックリスト' },
  { label: 'つづける', alone: '途中で止まりがち', app: '連続記録とXPで毎日すこしずつ' },
];
const FEATURES = [
  ['scroll', 'AIで戸籍を読み取り', '撮るだけで人物・続柄・日付を読み取り、家系図に自動で配置（無制限）'],
  ['office', '家系図の取り方はアプリが案内', '本籍地の調べ方から、役所・コンビニ・郵送での戸籍の取り方まで、チェックリストで案内'],
  ['book', '家系図が完成したら実際の本にしてお届け', 'ハードカバーの本にして、ご自宅にお届けします（製本は別料金）'],
  ['spark', 'ゲーム感覚で続く', 'レッスン・連続記録・クエストで、少しずつ空欄が埋まる'],
];
const BOOK_PRICE_FROM = '¥3,980〜'; // src/data/book.ts BOOK_PLANS[0].price

const HOOKS = ['hook1', 'hook2', 'hook3', 'hook4', 'hook5', 'hook6'];
/** The app's 8 question steps; the progress bar shows how far through them you are. */
const QUESTIONS = ['motive', 'target', 'knowledge', 'experience', 'insight', 'compare', 'goal', 'name'];
const STEPS = ['welcome', ...HOOKS, ...QUESTIONS, 'calc', 'plan', 'paywall'];

const root = document.getElementById('root');
const answers = { goal: 30, ...store.get('answers', {}) };
let plan = store.get('plan', 'annual');

const ancestorsUpTo = (gen) => 2 ** (gen + 1) - 2;
const generationName = (gen) => GEN_NAMES[gen] ?? `${gen}代前`;
const targetGen = () => answers.target ?? 4;
const targetLabel = () => TARGETS.find((t) => t.gen === targetGen())?.label ?? '高祖父母まで';
const displayName = () => (answers.givenName ?? '').trim() || (answers.familyName ?? '').trim();
const hasName = () => !!displayName();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Whether the step's answer is in, i.e. whether "つづける" is enabled. */
const ANSWERED = {
  motive: () => !!answers.motive,
  target: () => answers.target !== undefined,
  knowledge: () => !!answers.knowledge,
  experience: () => !!answers.experience,
  name: hasName,
};
const answered = (step) => ANSWERED[step]?.() ?? true;

// Attribution: remember the ad's UTM params so they reach checkout even after navigating the quiz.
const params = new URLSearchParams(location.search);
const utm = store.get('utm', {});
for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
  if (params.get(key)) utm[key] = params.get(key);
}
store.set('utm', utm);

// ---- building blocks (web versions of the app's components) ----

const fade = (html, delay = 0, from = 'bottom', cls = '', style = '') =>
  `<div class="fi from-${from} ${cls}" style="--d:${delay}ms;${style}">${html}</div>`;
const pop = (html, delay = 0, cls = '') => `<div class="pop-in ${cls}" style="--d:${delay}ms">${html}</div>`;
const button = (title, attrs = 'data-next') => `<button class="btn" ${attrs}>${title}</button>`;

function questionHeader(step) {
  const value = (QUESTIONS.indexOf(step) + 1) / QUESTIONS.length;
  return `<div class="ob-header"><button class="ob-back" data-back aria-label="戻る">‹</button>${progressBar(value)}</div>`;
}

function progressBar(value, id = '') {
  return `<div class="pbar"${id ? ` id="${id}"` : ''}><i style="width:${Math.round(value * 100)}%"><b></b></i></div>`;
}

function option(key, value, i, { label, sub, trailing, icon: ic }) {
  const selected = answers[key] === value;
  return fade(
    `<button class="ob-option${selected ? ' selected' : ''}" data-answer="${key}" data-value="${value}" aria-pressed="${selected}">
      ${ic ? appIcon(ic, 26) : ''}
      <span class="ob-option-label">${label}${sub ? `<small>${sub}</small>` : ''}</span>
      ${trailing ? `<span class="ob-option-trailing">${trailing}</span>` : ''}
    </button>`,
    150 + i * 70,
  );
}

/** One question screen: header, scrolling body, continue button pinned at the bottom. */
function question(step, body, { title = 'つづける' } = {}) {
  return `
    ${questionHeader(step)}
    <section class="screen ob-body"><div class="fi from-right ob-stack" style="--dist:48px">${body}</div></section>
    <div class="ob-bottom">${button(title, `data-next${answered(step) ? '' : ' disabled'}`)}</div>`;
}

// ---- intro pages (OnboardingHooks.tsx) ----

const hookTitle = (html) => fade(`<h1 class="hook-title">${html}</h1>`);

const ERAS = [
  { era: '令和・平成', who: 'あなた・親', color: C.green },
  { era: '昭和', who: '祖父母', color: C.blue },
  { era: '大正・明治', who: '曾祖父母', color: C.purple },
  { era: '江戸', who: '高祖父母', color: C.orange },
];
const HEART = [
  ['compass', '「自分はどこから来たのか」がわかる', '名字や生まれた土地に、ちゃんと物語があったと気づけます。'],
  ['chatbubbles', '家族の会話が増える', '「ひいおじいちゃんってどんな人？」が、祖父母と話すきっかけに。'],
  ['infinite', '命のバトンを実感できる', 'だれか1人でも欠けていたら、今のあなたはいません。'],
];
const PRACTICAL = [
  ['document-text', '相続の準備に役立つ', '相続では、亡くなった人の出生から死亡までの戸籍が必要。集めた戸籍がそのまま役立ちます。'],
  ['location', 'ルーツの土地がわかる', '本籍地から、ご先祖さまが暮らした町がわかります。旅行やお墓参りの行き先にも。'],
  ['people', '親戚関係がすっきり', '法事やお正月の「あの人はだれ？」が、家系図でひと目でわかります。'],
];

const benefitRow = ([ic, title, text], tint, color, delay) =>
  fade(
    `<span class="benefit-icon">${ion(ic, 18, color)}</span><div><div class="benefit-title">${title}</div><div class="benefit-text">${text}</div></div>`,
    delay,
    'right',
    'benefit',
    `background:${tint}`,
  );

const point = (ic, text, i, base) => fade(`${ic}<span>${text}</span>`, base + i * 150, 'left', 'point');

// Only what the app really covers (src/components/OnboardingHooks.tsx GUIDE_STEPS).
const GUIDE_STEPS = [
  { icon: 'pin', title: '本籍地を調べる', text: '住民票の取り方から案内' },
  { icon: 'office', title: '戸籍を取る', text: '役所・コンビニ・郵送から、あなたに合う方法を診断' },
  { icon: 'search', title: '古い戸籍をさかのぼる', text: '次に請求する戸籍をリストでお知らせ' },
  { icon: 'tree', title: '家系図を完成させる', text: 'ご先祖さまが1人ずつ埋まっていく' },
];

const hookPages = {
  hook1: () => `
    ${hookTitle(`10代さかのぼると、<br>ご先祖さまは<span style="color:${C.greenDark}">1,024人</span>`)}
    <div class="visual">
      ${[1, 2, 4, 8, 16]
        .map(
          (n, row) =>
            `<div class="pyramid-row">${Array.from({ length: n }, (_, i) =>
              pop(`<span class="person" style="background:${n === 1 ? C.green : i % 2 ? C.female : C.male}"></span>`, 200 + row * 170 + i * 22),
            ).join('')}</div>`,
        )
        .join('')}
      <div class="ellipsis">⋮</div>
      <div class="big-count"><span class="big-count-label">10代前</span><span class="big-count-value"><span data-count="1024" data-dur="1400" data-delay="1100">0</span>人</span></div>
    </div>
    ${fade('<p class="hook-body">そのうち1人でも欠けていたら、<br>あなたはここにいません。</p>', 1600)}`,

  hook2: () => `
    ${hookTitle(`戸籍をたどると、<br><span style="color:${C.orangeDark}">江戸時代</span>生まれの<br>ご先祖さまに出会えることも`)}
    <div class="visual eras">
      ${ERAS.map((e, i) =>
        fade(
          `<div class="era-rail"><span class="era-dot" style="background:${e.color}"></span>${i < ERAS.length - 1 ? '<span class="era-line"></span>' : ''}</div>
           <div class="era-text${i < ERAS.length - 1 ? ' gap' : ''}"><div class="era-name" style="color:${e.color}">${e.era}</div><div class="small">${e.who}（目安）</div></div>
           ${i === ERAS.length - 1 ? `<span class="twinkle">${ion('sparkles', 24, C.orange)}</span>` : ''}`,
          250 + i * 260,
          'left',
          'era-row',
        ),
      ).join('')}
    </div>
    ${fade('<p class="hook-body">明治時代の古い戸籍には、江戸時代に生まれた人の名前や生年月日が書かれていることがあります。</p>', 1300)}`,

  hook3: () => `
    ${hookTitle(`ご先祖さまに会うと、<br><span style="color:${C.greenDark}">こんないいこと</span>があります`)}
    <div class="benefits">
      ${fade(`<span class="beat">${ion('heart', 20, C.female)}</span><span class="section-head-title" style="color:#E0569E">こころ</span>`, 200, 'bottom', 'section-head')}
      ${HEART.map((b, i) => benefitRow(b, '#FFEAF4', '#E0569E', 320 + i * 140)).join('')}
    </div>
    <div class="benefits">
      ${fade(`${ion('briefcase', 20, C.blue)}<span class="section-head-title" style="color:${C.blueDark}">くらし</span>`, 800, 'bottom', 'section-head')}
      ${PRACTICAL.map((b, i) => benefitRow(b, C.blueLight, C.blueDark, 920 + i * 140)).join('')}
    </div>`,

  hook4: () => `
    ${hookTitle(`家系図の作り方も、<br>戸籍の取り方も、<br><span style="color:${C.greenDark}">すべてアプリが案内</span>します`)}
    <div class="visual steps">
      ${GUIDE_STEPS.map((step, i) =>
        fade(
          `<div class="step-rail"><span class="step-icon">${appIcon(step.icon, 22)}</span>${i < GUIDE_STEPS.length - 1 ? '<span class="step-line"></span>' : ''}</div>
           <div class="step-text${i < GUIDE_STEPS.length - 1 ? ' gap' : ''}"><div class="step-title"><span style="color:${C.greenDark}">${i + 1}. </span>${step.title}</div><div class="small">${step.text}</div></div>`,
          250 + i * 220,
          'left',
          'step-row',
        ),
      ).join('')}
    </div>
    <div class="points">
      ${['持ち物も申請書の書き方も、チェックリストで', '役所への電話のしかたまで、ていねいに', '旧字や和暦の読み方は、レッスンでやさしく']
        .map((t, i) => point(ion('checkmark-circle', 20, C.blue), t, i, 1150))
        .join('')}
    </div>`,

  hook5: () => {
    const tree = [
      [C.male, C.female, C.male, C.female],
      [C.male, C.female],
      [C.green],
    ];
    return `
    ${hookTitle(`戸籍を撮るだけ。<br><span style="color:${C.blueDark}">AI</span>が家系図にします`)}
    <div class="visual scan-row">
      <div class="paper">
        ${[0, 1, 2, 3, 4, 5].map((i) => `<span class="paper-line" style="height:${40 + ((i * 17) % 30)}px"></span>`).join('')}
        <span class="scan-frame"></span><span class="scan-line"></span>
      </div>
      <div class="scan-mid">${mascot(56, 'wow', true)}${ion('arrow-forward', 26, C.blue)}</div>
      <div class="mini-tree">
        ${tree
          .map(
            (row, r) =>
              `<div class="mini-row">${row.map((c, i) => pop(`<span class="node${r > 0 ? ' wide' : ''}" style="background:${c}"></span>`, 1300 - r * 350 + i * 90)).join('')}</div>`,
          )
          .join('')}
      </div>
    </div>
    <div class="points">
      ${['戸籍の取り方はアプリがガイド', '読みにくい旧字・手書きもAIにおまかせ', '空欄が埋まるたびにXPがもらえる']
        .map((t, i) => point(ion('checkmark-circle', 20, C.green), t, i, 400))
        .join('')}
    </div>`;
  },

  hook6: () => `
    ${hookTitle(`完成した家系図は、<br><span style="color:${C.orangeDark}">世界に一冊の本</span>に`)}
    ${fade(bookOpening(), 150, 'bottom', '', '--dist:60px')}
    <div class="points">
      ${['見開きいっぱいの家系図', 'ひとりずつの人物ページと和暦つきの年表', '還暦・法事・お正月の贈りものにも']
        .map((t, i) => point(ion('book', 18, C.orange), t, i, 500))
        .join('')}
    </div>
    <p class="small" style="margin:0">製本は別途ご注文いただけます（${BOOK_PRICE_FROM}）</p>`,
};

/** Index of the intro page shown before this one, so the page dots can slide over from it. */
let lastHook = null;

function hookScreen(step) {
  const index = HOOKS.indexOf(step);
  const last = index === HOOKS.length - 1;
  const from = lastHook ?? index;
  return `
    <div class="ob-header"><button class="ob-back" data-back aria-label="戻る">‹</button></div>
    <section class="screen hook"><div class="fi from-right hook-page" style="--dist:48px">${hookPages[step]()}</div></section>
    <div class="ob-bottom">
      <div class="dots">${HOOKS.map((_, i) => `<span class="${i === from ? 'on' : ''}"></span>`).join('')}</div>
      ${button(last ? 'わたしの家系図をつくる' : 'つぎへ')}
    </div>`;
}

// ---- screens ----

const screens = {
  welcome: () => `
    <section class="screen welcome">
      <div class="grow"></div>
      ${pop('<div class="greeting">まめただよ！いっしょにご先祖さまを探そう</div>', 500)}
      ${pop(mascot(190, 'happy', true))}
      ${fade('<h1 class="center-text">家系図クエスト</h1>', 250)}
      ${fade('<p class="ob-text muted center-text">役所の戸籍をAIで読み取って、<br>ゲーム感覚で家系図を完成させよう。</p>', 400)}
      <div class="grow"></div>
      ${fade(
        `${button('はじめる')}<a class="restore" href="/success">すでに購入済みの方はこちら</a>`,
        650,
        'bottom',
        'ob-bottom flat',
      )}
      ${legalFooter()}
    </section>`,

  ...Object.fromEntries(HOOKS.map((h) => [h, () => hookScreen(h)])),

  motive: () =>
    question(
      'motive',
      `${mascotSays('家系図をつくろうと思ったきっかけは？')}
      <div class="ob-options">${MOTIVES.map((m, i) => option('motive', m, i, { label: m })).join('')}</div>`,
    ),

  target: () =>
    question(
      'target',
      `${mascotSays('何代前のご先祖さままで知りたい？')}
      <div class="ob-options">${TARGETS.map((t, i) =>
        option('target', t.gen, i, { label: t.label, sub: t.sub, trailing: t.gen === 4 ? 'おすすめ' : undefined }),
      ).join('')}</div>`,
    ),

  knowledge: () =>
    question(
      'knowledge',
      `${mascotSays('祖父母4人のフルネーム、いくつ言えるかな？', 'think')}
      <div class="ob-options">${KNOWLEDGE.map((k, i) => option('knowledge', k.id, i, { label: k.label })).join('')}</div>`,
    ),

  experience: () =>
    question(
      'experience',
      `${mascotSays('戸籍謄本を取ったことはある？')}
      <div class="ob-options">${EXPERIENCE.map((e, i) => option('experience', e.id, i, { label: e.label, icon: e.icon })).join('')}</div>`,
    ),

  insight: () => {
    const gen = targetGen();
    const max = 2 ** gen;
    return question(
      'insight',
      `<h2>${generationName(gen)}までには、<br><span style="color:${C.greenDark}"><span data-count="${ancestorsUpTo(gen)}" data-dur="1000" data-delay="300">0</span>人</span>のご先祖さまがいます</h2>
      <div class="card">
        ${Array.from({ length: gen }, (_, i) => i + 1)
          .map(
            (g, i) => `<div class="bar-row"><span class="bar-label">${generationName(g)}</span>
              <span class="bar-track"><i data-width="${((2 ** g) / max) * 100}" style="transition-delay:${300 + i * 180}ms"></i></span>
              <span class="bar-value">${2 ** g}人</span></div>`,
          )
          .join('')}
      </div>
      <p class="ob-text">${answers.knowledge === 'all' ? '祖父母のことをよく知っているなら、その先はすぐそこ。' : '名前を知らなくても大丈夫。'}戸籍をさかのぼれば、名前・生まれた年・出身地まで書いてあります。</p>
      ${fade(`${appIcon('hourglass', 22)}<span class="small">古い戸籍の中には、保存期間を過ぎて廃棄されたものもあります。調べるなら早いほど安心です。</span>`, 1200, 'bottom', 'note')}`,
    );
  },

  compare: () =>
    question(
      'compare',
      `<h2>${answers.experience === 'have' ? 'ひとりで進めるより、' : '取り方がわからなくても、'}<br>家系図クエストならかんたん</h2>
      <div class="compare-head"><span>ひとりで</span><span style="color:${C.greenDark}">家系図クエスト</span></div>
      ${COMPARE_ROWS.map((r, i) =>
        fade(
          `<div class="compare-label">${r.label}</div>
           <div class="compare-cells">
             <div class="compare-cell">${appIcon('cross', 16)}<span class="small">${r.alone}</span></div>
             <div class="compare-cell ours">${appIcon('check', 16)}<span class="small">${r.app}</span></div>
           </div>`,
          200 + i * 160,
          'bottom',
          'compare-row',
        ),
      ).join('')}`,
    ),

  goal: () =>
    question(
      'goal',
      `${mascotSays('1日の目標を決めよう！毎日つづけると連続記録がのびるよ。')}
      <div class="ob-options">${GOALS.map((g, i) =>
        option('goal', g.xp, i, { label: `${g.label}&ensp;${g.sub}`, trailing: `${g.xp} XP` }),
      ).join('')}</div>`,
    ),

  name: () =>
    question(
      'name',
      `${mascotSays('最後に、家系図の真ん中になるあなたのお名前を教えてね。')}
      <div class="name-row">
        <input class="ob-input" data-name="familyName" placeholder="姓" autocomplete="family-name" value="${esc(answers.familyName ?? '')}">
        <input class="ob-input" data-name="givenName" placeholder="名" autocomplete="given-name" value="${esc(answers.givenName ?? '')}">
      </div>
      <p class="small" style="margin:0">入力した情報はこの端末の中だけに保存されます。</p>`,
      { title: 'プランを作成する' },
    ),

  calc: () => `
    <section class="screen calc">
      ${mascot(110, 'think', true)}
      <div class="calc-pct num" id="pct">0%</div>
      <h2 class="center-text">あなた専用のプランを<br>作成しています</h2>
      <div class="calc-bar">${progressBar(0, 'calcbar')}</div>
      <ul class="calc-list">${CALC_ITEMS.map((c) => `<li><span>・${c}</span><span class="calc-check">${ion('checkmark-circle', 22, C.green)}</span></li>`).join('')}</ul>
    </section>`,

  plan: () => {
    const gen = targetGen();
    const name = displayName();
    const card = (ic, title, value, delay) =>
      pop(`${appIcon(ic, 26)}<span class="small">${title}</span><span class="plan-value">${value}</span>`, delay, 'plan-card');
    return `
    <section class="screen ob-body plan-ready">
      <div class="fi from-right ob-stack" style="--dist:48px">
        <div class="plan-head">
          ${pop(mascot(96, 'wow', true))}
          <h2 class="center-text">${name ? `${esc(name)}さん専用の` : 'あなた専用の'}<br>ルーツ探しプランができました！</h2>
        </div>
        ${pop(`${generationName(gen)}まで ・ ご先祖さま最大${ancestorsUpTo(gen)}人`, 250, 'goal-pill')}
        <div class="plan-grid">
          ${card('flag', 'ゴール', `${generationName(gen)}（${gen}代前）`, 400)}
          ${card('tree', '見つけるご先祖さま', `最大 ${ancestorsUpTo(gen)}人`, 500)}
          ${card('rocket', '最初の一歩', FIRST_STEP[answers.experience] ?? FIRST_STEP.unknown, 600)}
          ${card('flame', '1日の目標', GOALS.find((g) => g.xp === answers.goal)?.sub ?? '1日10分', 700)}
        </div>
        ${fade(
          `${appIcon('books', 28)}<span>埋まった家系図は、ハードカバーの本にして${answers.motive === '子どもに残したい' ? 'お子さんに' : '家族に'}残せます。</span>`,
          850,
          'bottom',
          'book-banner',
        )}
        <p class="small center-text" style="margin:0">目標はあとからいつでも変えられます。</p>
      </div>
    </section>
    <div class="ob-bottom">${button('プランをはじめる')}</div>`;
  },

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

let current = 'welcome';

/** history: 'push' adds an entry, 'replace' rewrites the current one, 'none' is for popstate. */
function show(step, { history: mode = 'push' } = {}) {
  current = step;
  root.className = `app step-${step}`;
  root.innerHTML = screens[step]();
  const url = step === 'welcome' ? location.pathname + location.search : `#${step}`;
  if (mode === 'push') history.pushState({ step }, '', url);
  else if (mode === 'replace') history.replaceState({ step }, '', url);
  window.scrollTo(0, 0);
  track('funnel_step', { step, index: STEPS.indexOf(step) });
  animate(step);
}

function next() {
  if (!answered(current)) return;
  const i = STEPS.indexOf(current);
  if (i < STEPS.length - 1) show(STEPS[i + 1]);
}

window.addEventListener('popstate', (e) => {
  const step = STEPS.includes(e.state?.step) ? e.state.step : 'welcome';
  // The calculation screen is a one-way transition; going back skips over it.
  show(step === 'calc' ? 'name' : step, { history: step === 'calc' ? 'replace' : 'none' });
});

root.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el || el.disabled) return;
  if (el.hasAttribute('data-next')) next();
  else if (el.hasAttribute('data-back')) history.back();
  else if (el.dataset.answer) select(el);
  else if (el.dataset.plan) {
    plan = el.dataset.plan;
    store.set('plan', plan);
    show('paywall', { history: 'none' });
  } else if (el.hasAttribute('data-checkout')) {
    startCheckout(el);
  }
});

/** Picks an option like the app does: highlight it with a little bounce, then wait for "つづける". */
function select(el) {
  const key = el.dataset.answer;
  answers[key] = key === 'target' || key === 'goal' ? Number(el.dataset.value) : el.dataset.value;
  store.set('answers', answers);
  root.querySelectorAll(`[data-answer="${key}"]`).forEach((b) => {
    b.classList.toggle('selected', b === el);
    b.setAttribute('aria-pressed', String(b === el));
  });
  el.classList.remove('bounce');
  void el.offsetWidth; // restart the animation on repeated taps
  el.classList.add('bounce');
  updateContinue();
  track('quiz_answer', { question: key, answer: String(answers[key]) });
}

// The name stays on this device (it is never sent to analytics).
root.addEventListener('input', (e) => {
  const key = e.target.dataset?.name;
  if (!key) return;
  answers[key] = e.target.value;
  store.set('answers', answers);
  updateContinue();
});

root.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset?.name && !e.isComposing) next();
});

function updateContinue() {
  const btn = root.querySelector('[data-next]');
  if (btn) btn.disabled = !answered(current);
}

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

// ---- per-screen motion (FadeSlideIn / PopIn are CSS; counters, bars and the calculation run here) ----

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate(step) {
  const reduced = reducedMotion();
  root.querySelectorAll('[data-count]').forEach((el) =>
    countUp(el, Number(el.dataset.count), reduced ? 0 : Number(el.dataset.dur), reduced ? 0 : Number(el.dataset.delay)),
  );
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.querySelectorAll('[data-width]').forEach((el) => (el.style.width = `${el.dataset.width}%`))),
  );
  const hook = HOOKS.indexOf(step);
  if (hook >= 0) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.querySelectorAll('.dots > span').forEach((d, i) => d.classList.toggle('on', i === hook))),
    );
  }
  lastHook = hook >= 0 ? hook : null;
  if (step === 'hook6') runBook(reduced);
  if (step === 'calc') runCalc(reduced);
  if (step === 'plan' && !reduced) confetti();
}

function countUp(el, to, ms, delay) {
  const screen = current;
  setTimeout(() => {
    const start = performance.now();
    const tick = (now) => {
      if (current !== screen) return;
      const t = ms ? Math.min(1, (now - start) / ms) : 1;
      el.textContent = Math.round(to * (1 - (1 - t) ** 3)).toLocaleString('ja-JP');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, delay);
}

/** The book (art.js bookOpening): the cover opens, then the page keeps turning between the two spreads. */
function runBook(reduced) {
  const book = root.querySelector('.ob-book');
  if (!book) return;
  if (reduced) return book.classList.add('open');
  // Same rhythm as the app: open after a moment, then a 0.6s turn after every 1s of reading time.
  const at = (ms, fn) => setTimeout(() => book.isConnected && fn(), ms);
  const turn = () => {
    book.classList.toggle('turned');
    at(1600, turn);
  };
  at(650, () => {
    book.classList.add('open');
    at(1600, turn);
  });
}

/** Same pace as the app: +2% every 60ms, items tick off as it goes, then the plan. */
function runCalc(reduced) {
  const bar = root.querySelector('#calcbar > i');
  const pctEl = document.getElementById('pct');
  const items = root.querySelectorAll('.calc-list li');
  let pct = 0;
  const id = setInterval(() => {
    if (current !== 'calc') return clearInterval(id);
    pct = Math.min(100, pct + (reduced ? 10 : 2));
    bar.style.width = `${pct}%`;
    pctEl.textContent = `${pct}%`;
    const done = Math.floor((pct / 100) * items.length);
    items.forEach((li, i) => li.classList.toggle('done', i < done));
    if (pct < 100) return;
    clearInterval(id);
    setTimeout(() => current === 'calc' && show('plan', { history: 'replace' }), 500);
  }, 60);
}

function confetti() {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const colors = [C.green, C.blue, C.yellow, C.orange, C.red, C.purple, C.female];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.width = `${7 + Math.random() * 5}px`;
    piece.style.height = `${10 + Math.random() * 6}px`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
    piece.style.setProperty('--spin', `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360)}deg`);
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3600);
}

// ---- start ----

const initial = location.hash.slice(1);
// Deep links into the middle of the flow only make sense once the earlier questions were answered
// (e.g. back from checkout).
const resumable =
  STEPS.includes(initial) && initial !== 'calc' && STEPS.slice(0, STEPS.indexOf(initial)).every((s) => answered(s));
show(resumable ? initial : 'welcome', { history: 'replace' });
if (!resumable || initial === 'welcome') track('funnel_view', { ...utm });
