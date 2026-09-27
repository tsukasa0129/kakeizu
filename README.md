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

`.env.example` に公開 SDK キーが入っているので `cp .env.example .env` だけで動きます。
開発ビルド（`__DEV__`）では `EXPO_PUBLIC_REVENUECAT_TEST_KEY` の **Test Store** が使われ、ストアのアカウントなしで購入フローを試せます。
リリースビルドでは iOS / Android のキーが使われます。

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
