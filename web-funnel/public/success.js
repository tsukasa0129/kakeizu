// After Stripe checkout, RevenueCat redirects here with ?redeem_url=rc-xxxx://redeem_web_purchase?redemption_token=…
// (Web Purchase Link → success behavior: custom redirect URL). Tapping that link with the app installed
// opens the app, which redeems the purchase for its user (src/app/redeem_web_purchase.tsx).
// The link is single-use and expires after 60 minutes; the app handles expiry by having RevenueCat email a new one.

const root = document.getElementById('root');
const REDEEM = /^rc-[0-9a-z]+:\/\/redeem_web_purchase\?redemption_token=[\w.-]+$/i;
const HOUR = 60 * 60 * 1000;

const query = new URLSearchParams(location.search);
const fromQuery = query.get('redeem_url');
if (fromQuery && REDEEM.test(fromQuery)) {
  // Keep it so the page still works when the user comes back after installing the app.
  store.set('redeem', { url: fromQuery, at: Date.now() });
  if (!store.get(`tracked:${fromQuery}`)) {
    store.set(`tracked:${fromQuery}`, true);
    const plan = store.get('plan', 'annual');
    track('purchase_complete', { plan, value: plan === 'annual' ? 4800 : 800, currency: 'JPY' });
  }
  history.replaceState(null, '', location.pathname);
}
const saved = store.get('redeem');
const redeemUrl = saved && REDEEM.test(saved.url) ? saved.url : null;
const stale = saved ? Date.now() - saved.at > HOUR : false;

function storeButtons(config) {
  const ios = config.ios
    ? '<a class="btn black" href="/app?store=ios" data-store="ios">App Store からダウンロード</a>'
    : '';
  const android = config.android
    ? '<a class="btn black" href="/app?store=android" data-store="android">Google Play からダウンロード</a>'
    : '';
  if (platform === 'ios') return ios || '<p class="notice">iPhone 版はまもなく公開します。公開まで少しお待ちください。</p>';
  if (platform === 'android') return android || '<p class="notice">Android 版はまもなく公開します。公開まで少しお待ちください。</p>';
  return ios + android;
}

function render(config) {
  const mobile = platform !== 'desktop';
  const redeemStep = redeemUrl
    ? `<a class="btn blue" href="${redeemUrl}" data-redeem>アプリで有効にする</a>
       <p class="small" style="margin:8px 0 0">アプリを入れてから押してください。${
         stale ? 'このリンクの有効期限（1時間）が過ぎている場合は、アプリで有効にするときに新しいリンクをメールでお送りします。' : 'リンクの有効期限は1時間です。'
       }</p>`
    : '<p class="small" style="margin:0">お申し込み時のメールにある「アプリで有効にする」のリンクを、アプリを入れたスマートフォンで開いてください。</p>';

  root.innerHTML = `
    <section class="screen">
      <div class="hero"><img class="mascot" src="/mascot.svg" alt="" style="width:130px;height:130px"></div>
      <h1 style="text-align:center">お申し込み<br>ありがとうございます！</h1>
      <p class="muted" style="text-align:center">あと2ステップで、家系図づくりをはじめられます。</p>
      ${
        mobile
          ? `<ol class="steps">
              <li><div style="flex:1"><h3>アプリをダウンロード</h3><div style="margin-top:10px;display:grid;gap:12px">${storeButtons(config)}</div></div></li>
              <li><div style="flex:1"><h3>このページに戻って、プランを有効にする</h3><div style="margin-top:10px">${redeemStep}</div></div></li>
            </ol>`
          : `<div class="card">
              <h3>スマートフォンで続けてください</h3>
              <p class="small" style="margin:8px 0 0">家系図クエストはスマートフォンのアプリです。</p>
              <ol class="steps">
                <li><span>スマートフォンに「家系図クエスト」をダウンロード</span></li>
                <li><span>お申し込み時のメールをスマートフォンで開き、「アプリで有効にする」をタップ</span></li>
              </ol>
              <div style="display:grid;gap:12px">${storeButtons(config)}</div>
            </div>`
      }
      <div class="card" style="margin-top:16px">
        <h3>うまくいかないときは</h3>
        <p class="small" style="margin:8px 0 0">・「アプリで有効にする」はアプリを入れたあとに押してください<br>
        ・有効期限が切れたリンクを押すと、アプリから新しいリンクがメールで届きます<br>
        ・領収書と、解約・支払い方法の変更ページはメールでお送りしています</p>
      </div>
      ${legalFooter()}
    </section>`;
}

root.addEventListener('click', (e) => {
  const el = e.target.closest('a');
  if (!el) return;
  if (el.dataset.store) track('app_store_click', { store: el.dataset.store });
  if (el.hasAttribute('data-redeem')) track('redeem_click', {});
});

loadConfig().then(render);
