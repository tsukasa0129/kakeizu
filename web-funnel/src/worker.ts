// web2app funnel. The pages in ./public are bundled into src/site.gen.ts (npm run embed) and served here,
// plus a few dynamic paths:
//   /checkout?plan=annual|monthly → RevenueCat Web Purchase Link (Stripe checkout), package preselected
//   /app                           → App Store / Google Play, picked from the user agent

import { SITE } from './site.gen';

/** Pretty URLs: / → index.html, /success → success.html. Unknown paths get 404.html. */
function serveSite(pathname: string): Response {
  const path = pathname === '/' ? '/index.html' : SITE[pathname] ? pathname : `${pathname.replace(/\/$/, '')}.html`;
  const file = SITE[path];
  const found = file ?? SITE['/404.html'];
  const body = found.base64 ? Uint8Array.from(atob(found.base64), (c) => c.charCodeAt(0)) : found.text;
  return new Response(body, {
    status: file ? 200 : 404,
    headers: {
      'content-type': found.type,
      // Pages revalidate so copy changes show up at once; scripts, styles and images can be cached briefly.
      'cache-control': found.type.startsWith('text/html') ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600',
    },
  });
}

const PACKAGES: Record<string, string> = {
  annual: '$rc_annual',
  monthly: '$rc_monthly',
};

// Web Purchase Links record these UTM params on the purchase automatically; others are ignored there.
const FORWARDED = /^utm_(source|medium|campaign|term|content)$/;

function checkout(url: URL, env: Env): Response {
  if (!env.WEB_PURCHASE_LINK) return Response.redirect(new URL('/?checkout=unavailable#paywall', url).toString(), 302);
  const target = new URL(env.WEB_PURCHASE_LINK);
  target.searchParams.set('package_id', PACKAGES[url.searchParams.get('plan') ?? ''] ?? PACKAGES.annual);
  for (const [key, value] of url.searchParams) {
    if (FORWARDED.test(key)) target.searchParams.set(key, value.slice(0, 200));
  }
  return Response.redirect(target.toString(), 302);
}

function storeFor(request: Request, url: URL, env: Env): string | null {
  const wanted = url.searchParams.get('store');
  const ua = request.headers.get('user-agent') ?? '';
  const android = wanted ? wanted === 'android' : /android/i.test(ua);
  return (android ? env.PLAY_STORE_URL : env.APP_STORE_URL) || env.APP_STORE_URL || env.PLAY_STORE_URL || null;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/checkout':
        return checkout(url, env);
      case '/app': {
        const store = storeFor(request, url, env);
        return store ? Response.redirect(store, 302) : Response.redirect(new URL('/success', url).toString(), 302);
      }
      case '/config.json':
        // Lets the static pages know which store buttons to show without hard-coding URLs.
        return Response.json(
          { ios: Boolean(env.APP_STORE_URL), android: Boolean(env.PLAY_STORE_URL), checkout: Boolean(env.WEB_PURCHASE_LINK) },
          { headers: { 'cache-control': 'public, max-age=300' } },
        );
      default:
        return serveSite(url.pathname);
    }
  },
} satisfies ExportedHandler<Env>;
