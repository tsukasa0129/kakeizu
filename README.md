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
- マスコット（苗木の「ネッコ」）が吹き出しで案内

## 本番前に対応が必要なこと

- **無料回数の制限はアプリ側のみ**です。本番では Edge Function 側でも、RevenueCat の REST API / Webhook で
  ユーザーの entitlement を確認するか、Supabase Auth と利用回数テーブルで制限してください。
- ペイウォールの利用規約・プライバシーポリシーの URL（`src/app/paywall.tsx`）を差し替えてください。
- 戸籍制度の説明（手数料・広域交付の範囲など）は一般的な内容です。自治体により異なる場合があるため、アプリ内でも確認を促しています。
- 戸籍は機微な個人情報です。ストア審査用のプライバシー表記（データの送信先・非保存）を用意してください。
