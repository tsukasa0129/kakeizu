# 家系図クエスト（kakeizu）

Duolingo のようなゲーミフィケーションで、家系図の空欄を埋めていくアプリです。
役所で取った戸籍を撮影すると AI（Claude）が JSON に変換し、家系図 UI に自動で配置します。
戸籍の取り方（本籍地の調べ方・広域交付・コンビニ交付・郵送請求・さかのぼり方）もアプリ内でナビゲーションします。

- **React Native + Expo SDK 57**（Expo Router / TypeScript）
- **RevenueCat**（`react-native-purchases`）でプレミアム課金
- **Supabase Edge Function + Claude API** で戸籍画像 → JSON

## 画面と機能

| タブ | 内容 |
| --- | --- |
| まなぶ | ユニットごとの学習パス（Duolingo 風のくねくね道）。ノード＝人物入力・レッスン・役所ガイド・スキャン・宝箱 |
| 家系図 | 横向きの家系図（あなた → 親 → 祖父母 → 曾祖父母 …）。空欄をタップで入力、右下からスキャン |
| 役所ナビ | おすすめルート診断、取得ガイド（チェックリスト付き）、スキャンで見つかった「次に請求する戸籍」リスト |
| クエスト | 連続記録🔥・週カレンダー・デイリークエスト・バッジ |
| プロフィール | レベル/XP、読み取った書類、購入の復元、データ削除 |

### 課金モデル（ハードペイウォール）

アプリの利用にはサブスクリプションが必須です。起動後の流れは **オンボーディング → ペイウォール → アプリ本体** で、
`src/app/_layout.tsx` の `Stack.Protected` で制御しています（`onboarded && isPremium` のときだけタブに入れる）。
サブスクリプションが切れると、データはそのままでペイウォールに戻ります。

Appllama で売上上位のハードペイウォール型アプリ（Cal AI など）のオンボーディングを調査し、次の流れにしています。

0. **興味喚起**（`src/components/OnboardingHooks.tsx`）: ようこそ画面のあとに5ページ。10代さかのぼると1,024人 → 戸籍で江戸時代生まれのご先祖さまに出会えることも → ご先祖さまに会うメリット（こころ：ルーツ・家族の会話・命のバトン／くらし：相続の準備・ルーツの土地・親戚関係） → 撮るだけでAIが家系図に → 完成した家系図は本にできる（製本は別料金と明記）
1. **質問**（`src/app/onboarding.tsx`）: きっかけ → 何代前まで知りたいか → 祖父母の名前をいくつ言えるか → 戸籍を取ったことがあるか
2. **気づき**: 選んだ世代までのご先祖さまの人数（例：高祖父母まで30人）を世代別バーで表示
3. **比較**: 「ひとりで」vs「家系図クエスト」（統計の数字は使わず、機能の違いだけで比較）
4. 1日の目標 → お名前
5. **プラン作成中**（0→100%のアニメーションとチェックリスト）→ **あなた専用プラン完成**（ゴール・人数・最初の一歩・1日の目標、完成したら本にして残せることも案内）
6. **ペイウォール**（`src/app/paywall.tsx`）
   - 無料トライアルがある場合: 「無料で体験しよう」→「終了前にお知らせします」（通知の許可）→ タイムライン（今日 / 前日にお知らせ / 課金開始日）＋プラン選択
   - 無料トライアルがない場合: 機能一覧 ＋ プラン選択のみ
   - 閉じるボタンなし。購入の復元・利用規約・プライバシーは常に表示。ようこそ画面にも「すでに購入済みの方」

オンボーディングはどの画面もアニメーションします（`src/components/Motion.tsx`：画面の切り替え・選択肢の時間差表示・選んだときのバウンド・人数のカウントアップ・棒グラフの伸び・プラン完成の紙吹雪など）。
追加のネイティブモジュールは使わず React Native の `Animated` だけで作っていて、端末の「視差効果を減らす」がオンのときは動きを止めます。

トライアルの有無と日数はストアの商品（`introPrice`）から自動判定します。**成約率を上げるには、App Store Connect / Google Play で
年額プランに3日間などの無料トライアル（導入オファー）を設定するのがおすすめ**です。設定するとペイウォールが自動で3ステップ版に切り替わります。
トライアル付きで購入されると、終了前日に `expo-notifications` のローカル通知でお知らせします（`src/lib/trialReminder.ts`、Web は対象外）。
`expo-notifications` はネイティブモジュールなので、反映には開発ビルド / ストアビルドの作り直しが必要です。

開発ビルドで RevenueCat のキーが未設定のときだけ、ペイウォールに「開発用：課金をスキップ」ボタンが出ます。

「家系図を本にする」LP（`src/app/book.tsx`）: 家系図タブ右上の「本にする」とプロフィールから開くモーダル。いまの家系図で作った表紙のプレビュー・掲載人数・特徴・注文の流れ・仕様と価格・FAQ を表示し、注文ボタンで製本サービスの注文ページ（`EXPO_PUBLIC_BOOK_ORDER_URL`）をアプリ内ブラウザで開きます（未設定なら「準備中」を案内）。価格や仕様などの文言は `src/data/book.ts` で差し替えられます。
**完成特典（製本割引）**: 曾祖父母（3代前）までの15人をすべて埋めた人は、製本が割引になります（割引率は `src/data/book.ts` の `BOOK_COMPLETE_DISCOUNT_PERCENT`）。
割引は製本サービス側で発行したクーポンコード（`EXPO_PUBLIC_BOOK_COMPLETE_COUPON`）で適用します。条件を満たすと LP にコードを表示し、注文ページの URL にも `?coupon=コード` を付けて開きます。
**コードが未設定のあいだは、オンボーディングにも LP にも割引の案内を出しません**（実際に適用できない特典を表示しないため）。キャンペーンを始めるときは、製本サービスでクーポンを作ってからコードを設定してください。

ゲーミフィケーション: XP・レベル・連続記録・デイリー目標・デイリークエスト・宝箱・バッジ・達成演出。
空欄は「アーネンタフェル番号」（1=あなた, 2n=父, 2n+1=母）で管理しているので、世代が上がるほど獲得 XP が増えます。

### スキャン → JSON → 家系図 の流れ

1. `src/app/scan.tsx` で撮影/選択（最大6ページ）。長辺2000pxの JPEG に縮小して送信
2. `supabase/functions/extract-koseki` が Claude（`claude-opus-5`、構造化出力）で読み取り
   - 人物・続柄・和暦/西暦の日付・父母欄・配偶者リンク・除籍（×印）
   - **従前戸籍**（次に請求すべき戸籍）も抽出 → 役所ナビに自動追加
3. `src/lib/merge.ts` が登録済みの人物と名前で照合し、父母/配偶者リンクをたどって家系図の位置を自動推定
   （書類にいない親も「父母欄」の名前から1世代上に追加）
4. 確認画面で位置を修正して「家系図に追加」→ XP・バッジ

JSON の形は `src/types/extraction.ts`（アプリ側）と `supabase/functions/extract-koseki/schema.ts`（サーバー側 Zod）で定義しています。

## セットアップ

```bash
npm install
cp .env.example .env   # 値を設定
npx expo start
```

`.env` を設定しない場合は **デモモード** で動きます（スキャンするとサンプルの戸籍結果が返り、課金画面はキー未設定の案内を表示）。
RevenueCat はネイティブモジュールを含むため、課金を試すには開発ビルドが必要です：

```bash
npx expo run:ios      # または eas build --profile development
```

### RevenueCat

RevenueCat プロジェクト「家系図クエスト」は設定済みです（[ダッシュボード](https://app.revenuecat.com/projects/78986d5d)）。

| 項目 | 設定 |
| --- | --- |
| Entitlement | `premium`（`src/lib/purchases.ts` の `ENTITLEMENT_ID`） |
| Offering | `default`（current）: `$rc_annual`（年額）/ `$rc_monthly`（月額） |
| iOS アプリ | `com.tsk.kakeizu` — 商品 `com.tsk.kakeizu.premium_annual`（¥4,800）/ `com.tsk.kakeizu.premium_monthly`（¥800）。App Store Connect 作成済み・日本のみで販売 |
| Android アプリ | `com.tsk.kakeizu` — 商品 `premium:annual` / `premium:monthly`（サブスクID:基本プランID） |
| Test Store | `premium_annual`（¥4,800 / $29.99）/ `premium_monthly`（¥800 / $4.99） |
| Web Billing（Stripe） | `premium_annual_web`（¥4,800 / $29.99）/ `premium_monthly_web`（¥800 / $4.99）— Stripe アカウント `acct_1UKvYcAi6mygNgkU` に接続 |

`.env.example` に公開 SDK キーが入っているので `cp .env.example .env` だけで動きます。
開発ビルド（`__DEV__`）では `EXPO_PUBLIC_REVENUECAT_TEST_KEY` の **Test Store** が使われ、ストアのアカウントなしで購入フローを試せます。
リリースビルド（`preview` / `production`）で Test Store のキーを使うと、SDK が「Wrong API Key」を表示してアプリを終了させるため、コード側で開発ビルドに限定しています。
リリースビルドでは iOS / Android のキーが使われます。

#### iOS で Stripe を並べて表示（日本のストアのみ）

スマホ新法（2025年12月施行）に基づき、日本の App Store ではアプリ内課金と並べて Stripe 決済を出せます。
条件がそろった端末でだけ、ペイウォールが次の表示に切り替わります（それ以外は従来どおりアプリ内課金のみ）。

- 「 App Store で購入」（黒・先頭）と「クレジットカードで購入（Stripe）」（白）を並べる。アプリ内課金を同等以上に目立たせるのが Apple の条件
- Stripe を押すと、Apple 指定の開示シート（`src/components/ExternalPurchaseNotice.tsx`、Apple 提供の日本語文言・アイコン）を表示
- 「続ける」で RevenueCat の Web Purchase Link（Stripe チェックアウト）をアプリ内ブラウザで開き、閉じたら購入状態を再取得
- iOS 26.4 以降は購入前に Apple の外部購入トークン（`IN_APP`）を取得し、RevenueCat の顧客属性 `apple_external_purchase_token` に保存
- 判定は `modules/external-purchase`（StoreKit `ExternalPurchaseCustomLink` を呼ぶローカル Expo モジュール）の `isEligible`

有効にする手順:

1. Apple Developer で **StoreKit External Purchases or Offers** エンタイトルメント（日本）を申請し、承認を待つ
2. RevenueCat ダッシュボード → Web → **Web Purchase Links** で `default` オファリングのリンクを作り、`EXPO_PUBLIC_REVENUECAT_WEB_PURCHASE_LINK` に設定（`eas.json` の `production` の `env` にも）
3. `eas.json` の `production` の `env` に `"IOS_EXTERNAL_PURCHASE": "1"` を追加（`app.config.ts` がエンタイトルメントを付けます。承認前に付けると署名で失敗します）
4. **Apple への月次報告の仕組みを用意する**（必須・未実装）: Stripe での購入・更新・返金・購入に至らなかったトークンを、External Purchase Server API で翌月15日までに報告。トークンは RevenueCat の顧客属性に入っています。手数料は Stripe 経由の売上の21%
5. 開示シートの「デベロッパ名」（`ExternalPurchaseNotice.tsx` の `DEVELOPER_NAME`）を App Store の販売者名に合わせる

注意:
- App Store の商品ページに Web 購入や Stripe の案内を書いてはいけません
- iOS 27.2 以降は Apple のシステム開示シート（`showNotice(for:)`）に切り替える必要があります
- Stripe で購入したユーザーは匿名 ID から `kakeizu_<ID>` に切り替わります。アプリを削除すると ID が失われるため、将来ログイン機能を追加するまでは再インストール後にプレミアムを引き継げません

#### Web 課金（Stripe）

`npx expo start --web` で動かす Web 版は、RevenueCat **Web Billing** 経由で Stripe 決済します。
`react-native-purchases` が Web では自動で `purchases-js` に切り替わるため、アプリのコードは iOS / Android と共通です
（`src/lib/purchases.ts` が Web では `EXPO_PUBLIC_REVENUECAT_WEB_KEY` を使います）。

- 購入ボタンを押すと RevenueCat のチェックアウト（Stripe）が開き、完了すると entitlement `premium` が有効になります
- 現在のキー `rcb_sb_...` は **Stripe サンドボックス**です。テストカード `4242 4242 4242 4242`（有効期限は未来の日付、CVC は任意）で試せます
- 解約・支払い方法の変更は、プロフィールの「サブスクリプションを管理」（RevenueCat のカスタマーポータル）から行えます
- Web のユーザー ID はブラウザの localStorage に保存される匿名 ID です。別のブラウザ・端末で購入を引き継ぐには、ログイン機能を追加して `Purchases.logIn(userId)` を呼んでください

本番公開前: RevenueCat の Web Billing アプリ設定で Stripe を本番モードに接続し、本番用の `rcb_` 公開キーに差し替えてください。
サポート用メールアドレス（領収書に記載）もアプリ設定で登録してください。

リリース前に残っている作業（ストア側）:

1. App Store の商品は作成済み（サブスクリプショングループ「家系図クエスト プレミアム」）。審査用スクリーンショットは仮の画像なので、ペイウォールのスクリーンショットに差し替えてから最初のアプリ審査と一緒に提出
2. Google Play Console でサブスク `premium` に基本プラン `monthly` / `annual` を作成
3. RevenueCat の各アプリ設定で、App Store Connect API キー / In-App Purchase キーと Google Play のサービスアカウント認証情報を登録
   （登録すると RevenueCat 側から価格や商品の作成もできるようになります）

無料プランはありません。プレミアム（サブスクリプション）で、AI 読み取り無制限・5代前までの家系図・全ユニットが使えます。

### web2app ファネル（`web-funnel/`・Cloudflare Workers・https://kakeizu-quest.app ）

広告から Web に来た人を **Web で診断 → Web で購入（Stripe）→ アプリをダウンロード → アプリで有効化** まで運ぶファネルです。
Web で決済するので App Store / Google Play の手数料がかからず、広告の計測もしやすくなります。

```
広告 ─▶ /（ようこそ）─▶ 紹介5ページ ─▶ 質問4問 ─▶ ご先祖さまの人数 ─▶ 比較 ─▶ 1日の目標 ─▶ お名前 ─▶ プラン作成 ─▶ ペイウォール
     ─▶ /checkout ─▶ RevenueCat Web Purchase Link（Stripe）─▶ /success?redeem_url=rc-xxxx://…
     ─▶ アプリをインストール ─▶「アプリで有効にする」─▶ アプリの /redeem_web_purchase で entitlement を付与
```

| ファイル | 内容 |
| --- | --- |
| `web-funnel/public/index.html` + `funnel.js` + `art.js` | オンボーディング・プラン・ペイウォール。オンボーディングはアプリ（`src/app/onboarding.tsx` / `src/components/OnboardingHooks.tsx`）と同じ画面・同じ文言・同じ見た目で、まめた・アイコン・本の絵は `art.js` にアプリから移植。アプリ側を変えたらこちらも合わせる。回答と UTM は localStorage に保存 |
| `web-funnel/public/success.html` + `success.js` | 購入後のページ。スマホならストアへのボタンと「アプリで有効にする」、PC なら「スマホでメールを開いて」と案内 |
| `web-funnel/src/worker.ts` | `public/` のページを配信（`scripts/embed.mjs` が deploy / dev の前に `src/site.gen.ts` へ取り込む）、`/checkout`（Web Purchase Link に `package_id` と UTM を付けてリダイレクト）、`/app`（端末に合わせて App Store / Google Play へ）、`/config.json` |
| `src/app/redeem_web_purchase.tsx` | アプリ側。Redemption Link（`rc-xxxx://redeem_web_purchase?redemption_token=…`）を受け取り `Purchases.redeemWebPurchase` で購入を引き継ぐ。オンボーディング前でも開けるよう `_layout.tsx` のガードの外に置いている。成功したら質問をスキップしてアプリへ（Web で回答済みのため）。期限切れのときは RevenueCat が新しいリンクをメールで送る |

計測: `funnel.js` / `success.js` は `funnel_view` / `funnel_step` / `quiz_answer` / `checkout_start` / `purchase_complete` / `app_store_click` / `redeem_click` を
`dataLayer`（GTM）・`gtag`（GA4）・`fbq`（Meta Pixel、`InitiateCheckout` / `Purchase` に対応）へ送ります。タグは `index.html` / `success.html` の `<head>` に追加してください。
UTM（`utm_source` など5つ）はチェックアウトまで引き継がれ、RevenueCat が購入に記録します。

#### 有効にする手順

1. **RevenueCat → Web → Redemption Links を有効化**（アプリのアイコン・名前・ストアのリンクの登録が必要）。
   Web Billing アプリ「家系図クエスト (Web)」のスキームは `rc-591233cc18` で、`eas.json` の `base.env.REVENUECAT_REDEMPTION_SCHEME` と `.env.example` に設定済みです。
   ダッシュボードに表示されるスキームがこれと違う場合は差し替えてください。反映には**アプリのビルドし直し**が必要です（ネイティブ設定なので OTA では反映されません）
2. **RevenueCat → Web → Web Purchase Links** でファネル用のリンクを **`web_funnel` オファリング**（Web 用商品 `premium_annual_web` ¥4,800 / `premium_monthly_web` ¥800 のみ）で作成
   （アプリ内 Stripe 用の `EXPO_PUBLIC_REVENUECAT_WEB_PURCHASE_LINK` は `default` オファリングのまま分けておくと、成功時の動作を分けられます）
   - 成功時の動作: **Custom redirect URL** に `https://<ファネルのドメイン>/success`（`redeem_url` が自動で付きます）
   - Web Billing の Stripe を本番モードに接続し、アプリ設定でサポート用メールアドレスを登録（基本通貨は JPY に設定済み）
3. `web-funnel/wrangler.jsonc` の `vars` に `WEB_PURCHASE_LINK`（手順2のリンク）と、公開後に `APP_STORE_URL` / `PLAY_STORE_URL` を設定
4. 利用規約（https://kakeizu-quest.app/terms ）とプライバシーポリシー（https://kakeizu-quest.app/privacy ）は `web-funnel/public/terms.html` / `privacy.html` で公開済み。アプリのペイウォールもこの URL を開く。**特定商取引法に基づく表記**は https://kakeizu-quest.app/tokushoho （`web-funnel/public/tokushoho.html`、販売事業者は株式会社Tsk）。運営責任者の氏名は「請求があった場合は遅滞なく開示」としているので、請求が来たら開示すること。HTML に `{{…}}` の未記入項目が残っていると `scripts/embed.mjs` がエラーで止めて公開できない
5. 価格表示は `funnel.js` の `PRICES` です。Web Billing の商品価格を変えたら合わせてください（Web 限定価格にする場合もここと RevenueCat の商品を変更）
6. デプロイ

```bash
cd web-funnel
npm install
npm run dev        # http://localhost:8787 （--var WEB_PURCHASE_LINK:https://pay.rev.cat/… で上書き可）
npm run typecheck
npx wrangler login # 初回のみ（CI では CLOUDFLARE_API_TOKEN を設定）
npm run deploy     # https://kakeizu-quest.app と https://kakeizu-funnel.tsukasa240129.workers.dev
```

ドメイン `kakeizu-quest.app` は Cloudflare Registrar で取得済み（2026-10-01）。自動更新はオンで、有効期限（2027-10-01）の前に $14.20/年 で自動更新されます（Cloudflare に登録した支払い方法に請求）。
`wrangler.jsonc` の `routes`（`custom_domain: true`）で Worker に紐付けており、DNS と証明書は Cloudflare が自動で設定します。

ページは Workers Static Assets ではなく Worker に同梱して配信しています（約70KB）。静的アセットのアップロードを通せない環境からでも `wrangler deploy` だけで公開できるようにするためです。

注意:
- `WEB_PURCHASE_LINK` が空のあいだは、購入ボタンを押すと「ただいまお申し込みを受け付けていません」と表示します
- App Store の商品ページやアプリ内に、このファネル（Web で安く買える等）への誘導を書いてはいけません（アプリ内の Stripe は上の「iOS で Stripe を並べて表示」の条件どおりに）
- Redemption Link はアプリをインストールしたスマホで開く必要があります。PC で購入した人は、購入完了メールのリンクをスマホで開いてもらいます

### Supabase Edge Function（AI 読み取り）

```bash
supabase functions deploy extract-koseki
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

`.env` に `EXPO_PUBLIC_EXTRACT_URL=https://<project-ref>.supabase.co/functions/v1/extract-koseki` と
`EXPO_PUBLIC_SUPABASE_ANON_KEY` を設定します。API キーはサーバー側だけに置き、アプリには入れません。
画像はメモリ上で処理するだけで保存しません。

## EAS Build

`eas.json` のプロファイル:

| プロファイル | 用途 | 課金 |
| --- | --- | --- |
| `development` | 開発ビルド（expo-dev-client、実機に直接インストール） | Test Store |
| `development-simulator` | iOS シミュレーター用の開発ビルド | Test Store |
| `preview` | 動作確認用（Android は .apk、iOS はアドホック配布） | App Store / Google Play のサンドボックス |
| `preview-simulator` | iOS シミュレーター用の動作確認ビルド | App Store のサンドボックス（シミュレーターで Apple ID のサンドボックスアカウントにサインイン） |
| `production` | ストア提出用（ビルド番号は自動採番） | App Store / Google Play |

初回だけ EAS プロジェクトを作ります（`app.json` に `extra.eas.projectId` が入ります）:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile preview --platform android
```

iOS の実機向けビルドには Apple Developer Program のアカウントが必要です（証明書は EAS が作成・管理します）。

## 開発コマンド

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

## UI デザインについて

Appllama（売上上位アプリの画面ライブラリ）で Duolingo の学習パス・ストリーク・クエスト・プロフィール・ペイウォール、
Photomyne のスキャン画面などを調査し、次のパターンを取り入れています。

- 白背景に明るいユニットカラー（緑 `#58CC02` / 青 `#1CB0F6` / オレンジ `#FF9600` / 紫）と、ロック状態のグレー
- 下に影がつく立体ボタン、中央寄せのジグザグ学習ノード、「はじめる」吹き出し、カラーのユニットヘッダー
- 大きなストリーク数字＋週カレンダー、進捗バー付きクエスト行、バッジグリッド
- グラデーションのヒーロー＋おすすめリボン付きプランカードのペイウォール
- マスコットはまめだぬきの「まめた」（頭に化けるための葉っぱ＝家系図の葉、目のまわりのたぬき模様、丸い耳、しましまのしっぽ）。Appllama で Duolingo の Duo などの人気マスコットを調べ、輪郭線なし・頭と体がひとつながりの丸いシルエット・低めの位置の大きなツヤ目・小さな口で描いている。表情は happy / wow（星の目）/ think（汗）。`animate` でふわふわ揺れてまばたきする

## 本番前に対応が必要なこと

- **課金チェックはアプリ側のみ**です。本番では Edge Function 側でも、RevenueCat の REST API / Webhook で
  ユーザーの entitlement を確認してから AI 読み取りを実行してください。
- 利用規約・プライバシーポリシーは https://kakeizu-quest.app/terms ・ /privacy に公開済みです（`web-funnel/public/`）。内容を変えたら `cd web-funnel && npm run deploy` で反映してください。問い合わせ先 support@kakeizu-quest.app は Cloudflare Email Routing で運営者の Gmail に転送しています。
- 戸籍制度の説明（手数料・広域交付の範囲など）は一般的な内容です。自治体により異なる場合があるため、アプリ内でも確認を促しています。
- 戸籍は機微な個人情報です。ストア審査用のプライバシー表記（データの送信先・非保存）を用意してください。
