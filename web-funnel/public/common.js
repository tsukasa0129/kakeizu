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

window.legalFooter = () => `
  <nav class="footer">
    <a href="${LEGAL.terms}" target="_blank" rel="noopener">利用規約</a>
    <a href="${LEGAL.privacy}" target="_blank" rel="noopener">プライバシー</a>
    <a href="${LEGAL.tokushoho}" target="_blank" rel="noopener">特定商取引法に基づく表記</a>
  </nav>`;
