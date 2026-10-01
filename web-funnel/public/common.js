// Shared by the funnel (index.html) and the post-purchase page (success.html).

// Replace with your own pages before running ads. 特定商取引法に基づく表記 is required for web sales in Japan.
window.LEGAL = {
  terms: 'https://example.com/terms',
  privacy: 'https://example.com/privacy',
  tokushoho: 'https://example.com/tokushoho',
};

/** Ad / analytics hook: works with GTM (dataLayer), GA4 (gtag) and Meta Pixel (fbq) when their tags are added. */
window.track = function track(event, params = {}) {
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (typeof window.fbq === 'function') {
      const standard = { checkout_start: 'InitiateCheckout', purchase_complete: 'Purchase', lead: 'Lead' }[event];
      if (standard) window.fbq('track', standard, params);
      else window.fbq('trackCustom', event, params);
    }
  } catch {
    // Tracking must never break the funnel.
  }
};

window.store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`kakeizu-funnel:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`kakeizu-funnel:${key}`, JSON.stringify(value));
    } catch {
      // Private mode: the funnel still works, it just forgets answers on reload.
    }
  },
};

/** Store buttons and checkout availability come from the Worker's env (wrangler.jsonc `vars`). */
window.loadConfig = () =>
  fetch('/config.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((c) => c ?? { ios: false, android: false, checkout: false });

window.platform = /android/i.test(navigator.userAgent)
  ? 'android'
  : /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ? 'ios'
    : 'desktop';

// One stroke icon family for the whole funnel (24px grid, 2px stroke, round caps).
const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  tree: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M12 7.5v4M6 16.5V14h12v2.5"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1H9"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/><path d="M9 11h6M9 15h4"/>',
  office: '<path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  dash: '<path d="M7 12h10"/>',
};
window.icon = (name, size = 20) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

window.legalFooter = () => `
  <nav class="footer">
    <a href="${LEGAL.terms}" target="_blank" rel="noopener">利用規約</a>
    <a href="${LEGAL.privacy}" target="_blank" rel="noopener">プライバシー</a>
    <a href="${LEGAL.tokushoho}" target="_blank" rel="noopener">特定商取引法に基づく表記</a>
  </nav>`;
