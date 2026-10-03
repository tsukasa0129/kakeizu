// 家系図クエストの API（https://api.kakeizu-quest.app）。README の「アカウントと同期」を参照。
//   POST   /auth/code    { email }         → ログイン用の6桁コードをメールで送る
//   POST   /auth/verify  { email, code }   → { token, user }（新しいメールアドレスならアカウントを作る）
//   POST   /auth/logout                    → この端末のトークンを無効にする
//   GET    /me                             → { user }
//   DELETE /me                             → アカウントと保存データをすべて削除
//   GET    /me/data                        → { data, version, updatedAt }（未保存なら data: null, version: 0）
//   PUT    /me/data  { data, baseVersion } → { version, updatedAt }。baseVersion が古ければ 409 と最新の内容
//   POST   /extract  { images }           → { result } | { error }（戸籍画像の AI 読み取り。Workers AI。ログイン不要。src/extract.ts）
//                                            時間がかかるので空白を送りながら待ち、読み取り中のエラーも 200 の { error } で返す
// 認証は Authorization: Bearer <token>（Cookie は使わないので CORS は * で問題ない）。

import { extractKoseki, ExtractError, validateImages } from './extract';

const CODE_TTL_MS = 10 * 60_000;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_INTERVAL_MS = 60_000;
const MAX_SENDS_PER_EMAIL_PER_HOUR = 5;
const MAX_SENDS_PER_IP_PER_HOUR = 20;
const MAX_DATA_BYTES = 1_000_000;
const MAX_EXTRACTS_PER_IP_PER_HOUR = 30;
const HOUR_MS = 3_600_000;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-max-age': '86400',
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { ...CORS, 'cache-control': 'no-store' } });

async function readJson<T>(request: Request): Promise<Partial<T>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') throw new HttpError(400, 'リクエストの形式が正しくありません');
  return body as Partial<T>;
}

const encoder = new TextEncoder();

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomCode() {
  // Rejection sampling keeps all 1,000,000 codes equally likely.
  const buf = new Uint32Array(1);
  let n: number;
  do n = crypto.getRandomValues(buf)[0];
  while (n >= 4_294_000_000);
  return String(n % 1_000_000).padStart(6, '0');
}

/** Constant-time comparison for equal-length hex strings. */
function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normalizeEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'メールアドレスを正しく入力してください');
  }
  return email;
}

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

async function sendCode(request: Request, env: Env) {
  const { email: raw } = await readJson<{ email: string }>(request);
  const email = normalizeEmail(raw);
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const now = Date.now();

  const last = await env.DB.prepare('SELECT sent_at FROM login_codes WHERE email = ?').bind(email).first<{ sent_at: number }>();
  if (last && now - last.sent_at < RESEND_INTERVAL_MS) {
    throw new HttpError(429, 'コードを送ったばかりです。1分ほど待ってからお試しください');
  }
  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM code_sends WHERE email = ?1 AND sent_at > ?3) AS by_email,
       (SELECT COUNT(*) FROM code_sends WHERE ip = ?2 AND sent_at > ?3) AS by_ip`,
  )
    .bind(email, ip, now - HOUR_MS)
    .first<{ by_email: number; by_ip: number }>();
  if ((counts?.by_email ?? 0) >= MAX_SENDS_PER_EMAIL_PER_HOUR || (counts?.by_ip ?? 0) >= MAX_SENDS_PER_IP_PER_HOUR) {
    throw new HttpError(429, 'コードの送信回数が多すぎます。しばらく待ってからお試しください');
  }

  const code = randomCode();
  await env.EMAIL.send({
    from: { email: env.MAIL_FROM, name: '家系図クエスト' },
    to: email,
    subject: `ログインコード: ${code}`,
    text: [
      '家系図クエストのログインコードです。',
      '',
      `　${code}`,
      '',
      'アプリの画面にこの6桁のコードを入力してください（10分間有効）。',
      'お心当たりがない場合は、このメールを破棄してください。',
      '',
      '家系図クエスト https://kakeizu-quest.app',
    ].join('\n'),
  });

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO login_codes (email, code_hash, expires_at, attempts, sent_at) VALUES (?1, ?2, ?3, 0, ?4)
       ON CONFLICT (email) DO UPDATE SET code_hash = ?2, expires_at = ?3, attempts = 0, sent_at = ?4`,
    ).bind(email, await codeHash(email, code), now + CODE_TTL_MS, now),
    env.DB.prepare('INSERT INTO code_sends (email, ip, sent_at) VALUES (?, ?, ?)').bind(email, ip, now),
    env.DB.prepare('DELETE FROM code_sends WHERE sent_at < ?').bind(now - 24 * HOUR_MS),
  ]);
  return json({ ok: true });
}

async function verifyCode(request: Request, env: Env) {
  const body = await readJson<{ email: string; code: string }>(request);
  const email = normalizeEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  const now = Date.now();

  const row = await env.DB.prepare('SELECT code_hash, expires_at, attempts FROM login_codes WHERE email = ?')
    .bind(email)
    .first<{ code_hash: string; expires_at: number; attempts: number }>();
  if (!row || row.expires_at < now || row.attempts >= MAX_CODE_ATTEMPTS) {
    throw new HttpError(400, 'コードの有効期限が切れました。もう一度コードを送ってください');
  }
  if (code.length !== 6 || !sameHash(await codeHash(email, code), row.code_hash)) {
    await env.DB.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').bind(email).run();
    const left = MAX_CODE_ATTEMPTS - row.attempts - 1;
    throw new HttpError(400, left > 0 ? `コードが違います（あと${left}回）` : 'コードの有効期限が切れました。もう一度コードを送ってください');
  }

  await env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING')
    .bind(crypto.randomUUID(), email, now)
    .run();
  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first<{ id: string; email: string }>();
  if (!user) throw new HttpError(500, 'アカウントを作成できませんでした');

  const token = randomToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_codes WHERE email = ?').bind(email),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)').bind(
      await sha256(token),
      user.id,
      now,
      now,
    ),
  ]);
  return json({ token, user });
}

async function authenticate(request: Request, env: Env) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, 'ログインしてください');
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(
    'SELECT users.id, users.email, sessions.last_used_at FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?',
  )
    .bind(tokenHash)
    .first<{ id: string; email: string; last_used_at: number }>();
  if (!user) throw new HttpError(401, 'ログインの有効期限が切れました。もう一度ログインしてください');
  // Touch at most hourly so reads stay reads.
  if (Date.now() - user.last_used_at > HOUR_MS) {
    await env.DB.prepare('UPDATE sessions SET last_used_at = ? WHERE token_hash = ?').bind(Date.now(), tokenHash).run();
  }
  return { id: user.id, email: user.email, tokenHash };
}

async function getData(user: { id: string }, env: Env) {
  const row = await env.DB.prepare('SELECT data, version, updated_at FROM user_data WHERE user_id = ?')
    .bind(user.id)
    .first<{ data: string; version: number; updated_at: number }>();
  if (!row) return json({ data: null, version: 0, updatedAt: null });
  return json({ data: JSON.parse(row.data), version: row.version, updatedAt: row.updated_at });
}

async function putData(request: Request, user: { id: string }, env: Env) {
  const body = await readJson<{ data: unknown; baseVersion: number }>(request);
  if (!body.data || typeof body.data !== 'object' || !Number.isInteger(body.baseVersion)) {
    throw new HttpError(400, 'リクエストの形式が正しくありません');
  }
  const text = JSON.stringify(body.data);
  if (encoder.encode(text).length > MAX_DATA_BYTES) throw new HttpError(413, 'データが大きすぎます');
  const baseVersion = body.baseVersion as number;
  const now = Date.now();

  // Compare-and-swap on version: only the device that saw the latest version may write.
  const result =
    baseVersion === 0
      ? await env.DB.prepare(
          'INSERT INTO user_data (user_id, data, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT (user_id) DO NOTHING',
        )
          .bind(user.id, text, now)
          .run()
      : await env.DB.prepare('UPDATE user_data SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?')
          .bind(text, now, user.id, baseVersion)
          .run();

  if (result.meta.changes === 0) {
    const current = await env.DB.prepare('SELECT data, version, updated_at FROM user_data WHERE user_id = ?')
      .bind(user.id)
      .first<{ data: string; version: number; updated_at: number }>();
    return json(
      {
        error: 'ほかの端末で更新されています',
        data: current ? JSON.parse(current.data) : null,
        version: current?.version ?? 0,
        updatedAt: current?.updated_at ?? null,
      },
      409,
    );
  }
  return json({ version: baseVersion + 1, updatedAt: now });
}

async function deleteAccount(user: { id: string }, env: Env) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM user_data WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);
  return json({ ok: true });
}

/**
 * Reading takes 30–90 seconds. Mobile network stacks give up when nothing arrives for about a minute, so the
 * response starts at once and a space is sent every 10 seconds until the JSON is ready (JSON.parse ignores
 * leading whitespace). Errors found after that point are sent as { error } with status 200.
 */
function keepAliveJson(ctx: ExecutionContext, task: () => Promise<unknown>) {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const timer = setInterval(() => writer.write(encoder.encode(' ')).catch(() => {}), 10_000);
  ctx.waitUntil(
    (async () => {
      let body: unknown;
      try {
        body = await task();
      } catch (e) {
        if (!(e instanceof HttpError || e instanceof ExtractError)) console.error(e);
        body = { error: e instanceof HttpError || e instanceof ExtractError ? e.message : 'サーバーでエラーが発生しました。しばらくしてからお試しください' };
      } finally {
        clearInterval(timer);
      }
      await writer.write(encoder.encode(JSON.stringify(body))).catch(() => {});
      await writer.close().catch(() => {});
    })(),
  );
  return new Response(readable, {
    headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function extract(request: Request, env: Env, ctx: ExecutionContext) {
  const images = validateImages(await request.json().catch(() => null));

  // Abuse guard: the endpoint is open (the paywall is enforced in the app), so cap requests per IP.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const now = Date.now();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM extract_requests WHERE ip = ? AND requested_at > ?')
    .bind(ip, now - HOUR_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= MAX_EXTRACTS_PER_IP_PER_HOUR) {
    throw new HttpError(429, '読み取りの回数が多すぎます。しばらくしてからお試しください');
  }
  await env.DB.batch([
    env.DB.prepare('INSERT INTO extract_requests (ip, requested_at) VALUES (?, ?)').bind(ip, now),
    env.DB.prepare('DELETE FROM extract_requests WHERE requested_at < ?').bind(now - 24 * HOUR_MS),
  ]);

  // For comparing models in production: a request carrying the debug key may pick the model (see README).
  const debugKey = request.headers.get('x-debug-key');
  const override = env.EXTRACT_DEBUG_KEY && debugKey === env.EXTRACT_DEBUG_KEY ? request.headers.get('x-extract-model') : null;
  const model = override || env.EXTRACT_MODEL;
  return keepAliveJson(ctx, async () => ({ result: await extractKoseki(images, env.AI, model) }));
}

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(request.url);
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  if (pathname === '/extract' && method === 'POST') return extract(request, env, ctx);
  if (pathname === '/auth/code' && method === 'POST') return sendCode(request, env);
  if (pathname === '/auth/verify' && method === 'POST') return verifyCode(request, env);

  if (pathname === '/auth/logout' && method === 'POST') {
    const user = await authenticate(request, env);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
    return json({ ok: true });
  }
  if (pathname === '/me' && method === 'GET') {
    const user = await authenticate(request, env);
    return json({ user: { id: user.id, email: user.email } });
  }
  if (pathname === '/me' && method === 'DELETE') return deleteAccount(await authenticate(request, env), env);
  if (pathname === '/me/data' && method === 'GET') return getData(await authenticate(request, env), env);
  if (pathname === '/me/data' && method === 'PUT') return putData(request, await authenticate(request, env), env);

  throw new HttpError(404, 'Not found');
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      return await route(request, env, ctx);
    } catch (e) {
      if (e instanceof HttpError || e instanceof ExtractError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'サーバーでエラーが発生しました。しばらくしてからお試しください' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
