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
| iOS アプリ | `com.tsukasa0129.kakeizu` — 商品 `com.tsukasa0129.kakeizu.premium_annual` / `...premium_monthly` |
| Android アプリ | `com.tsukasa0129.kakeizu` — 商品 `premium:annual` / `premium:monthly`（サブスクID:基本プランID） |
| Test Store | `premium_annual`（¥4,800 / $29.99）/ `premium_monthly`（¥800 / $4.99） |
| Web Billing（Stripe） | `premium_annual_web`（¥4,800 / $29.99）/ `premium_monthly_web`（¥800 / $4.99）— Stripe アカウント `acct_1UKvYcAi6mygNgkU` に接続 |

`.env.example` に公開 SDK キーが入っているので `cp .env.example .env` だけで動きます。
開発ビルド（`__DEV__`）では `EXPO_PUBLIC_REVENUECAT_TEST_KEY` の **Test Store** が使われ、ストアのアカウントなしで購入フローを試せます。
リリースビルドでは iOS / Android のキーが使われます。

#### Web 課金（Stripe）

`npx expo start --web` で動かす Web 版は、RevenueCat **Web Billing** 経由で Stripe 決済します。
`react-native-purchases` が Web では自動で `purchases-js` に切り替わるため、アプリのコードは iOS / Android と共通です
（`src/lib/purchases.ts` が Web では `EXPO_PUBLIC_REVENUECAT_WEB_KEY` を使います）。

- 購入ボタンを押すと RevenueCat のチェックアウト（Stripe）が開き、完了すると entitlement `premium` が有効になります
- 現在のキー `rcb_sb_...` は **Stripe サンドボックス**です。テストカード `4242 4242 4242 4242`（有効期限は未来の日付、CVC は任意）で試せます
- 解約・支払い方法の変更は、プロフィールの「サブスクリプションを管理」（RevenueCat のカスタマーポータル）から行えます
- Web のユーザー ID はブラウザの localStorage に保存される匿名 ID です。別のブラウザ・端末で購入を引き継ぐには、ログイン機能を追加して `Purchases.logIn(userId)` を呼んでください

#### Web2App ファネル（`/start`）

広告・SNS から Web に来た人を、Web で Stripe 決済 → アプリで引き継ぎ、の流れでプレミアムにします（App Store / Google Play の手数料がかからない）。

1. `/start`（`src/app/start/index.tsx`）: 3問の診断クイズ → 「◯人のご先祖さま」の診断結果 → プラン選択 → Stripe チェックアウト
   - RevenueCat の Offering **`web_funnel`**（`$rc_annual` / `$rc_monthly` の Web 商品）を表示します。アプリ内の `default` とは別なので、ファネルだけ価格や A/B テストを変えられます
   - クイズの回答と `utm_source` などの UTM パラメータは RevenueCat の顧客属性（`funnel_*` / `utm_*`）に保存されます
2. `/start/success`: 購入後、RevenueCat の **Redemption Link** を表示。「アプリでひらく」を押すとアプリが起動します
3. アプリ側: `src/app/+native-intent.tsx` が `…://redeem_web_purchase?redemption_link=…` を受け取り、`src/app/redeem.tsx` で
   `Purchases.redeemWebPurchase` を実行 → entitlement `premium` がアプリのユーザーに付与されます（オンボーディング前でも可）

広告のリンク先は `https://<Web のホスト>/start?utm_source=instagram&utm_campaign=...` のようにします。
Web 版は `npx expo export --platform web` で `dist/` に書き出し、Vercel などの静的ホスティングに置けます。

**ダッシュボードでの設定が必要（API からは設定できません）:**

- RevenueCat → Web Billing アプリ（家系図クエスト (Web)）の設定で **Redemption Links を有効化**。無効のままだと購入後にリンクが発行されません
- Redemption Link が使う URL スキームが `app.json` の `scheme`（`kakeizu` / `rc-9ac62803d4` / `rc-31592afba5`）に含まれているか確認。違う場合は追加して、ネイティブを再ビルドします
- ストア公開後、`.env` に `EXPO_PUBLIC_APP_STORE_URL` / `EXPO_PUBLIC_PLAY_STORE_URL` を設定すると、購入完了ページにダウンロードボタンが出ます
- Redemption Link の受け取りはネイティブの変更（URL スキーム）を含むので、新しい開発ビルド / ストアビルドが必要です

本番公開前: RevenueCat の Web Billing アプリ設定で Stripe を本番モードに接続し、本番用の `rcb_` 公開キーに差し替えてください。
サポート用メールアドレス（領収書に記載）もアプリ設定で登録してください。

リリース前に残っている作業（ストア側）:

1. App Store Connect で上記の商品ID（自動更新サブスク、同じサブスクリプショングループ）を作成し、価格（月額¥800・年額¥4,800）を設定
2. Google Play Console でサブスク `premium` に基本プラン `monthly` / `annual` を作成
3. RevenueCat の各アプリ設定で、App Store Connect API キー / In-App Purchase キーと Google Play のサービスアカウント認証情報を登録
   （登録すると RevenueCat 側から価格や商品の作成もできるようになります）

無料プラン: AI 読み取り3回・曾祖父母（3代前）まで。プレミアム: 読み取り無制限・5代前まで・ユニット5。

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
| `preview` | 動作確認用（Android は .apk、iOS はアドホック配布） | Test Store |
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
- マスコット（苗木の「ネッコ」）が吹き出しで案内

## 本番前に対応が必要なこと

- **無料回数の制限はアプリ側のみ**です。本番では Edge Function 側でも、RevenueCat の REST API / Webhook で
  ユーザーの entitlement を確認するか、Supabase Auth と利用回数テーブルで制限してください。
- ペイウォールの利用規約・プライバシーポリシーの URL（`src/app/paywall.tsx`）を差し替えてください。
- 戸籍制度の説明（手数料・広域交付の範囲など）は一般的な内容です。自治体により異なる場合があるため、アプリ内でも確認を促しています。
- 戸籍は機微な個人情報です。ストア審査用のプライバシー表記（データの送信先・非保存）を用意してください。
