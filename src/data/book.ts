// 「家系図を本にする」LP（src/app/book.tsx）に表示する内容。
// 価格・仕様・納期は製本サービス側の実際の値に合わせて差し替えてください。

/** 注文ページ（製本サービス）。未設定のあいだは LP の注文ボタンが「準備中」の案内になります。 */
export const BOOK_ORDER_URL = process.env.EXPO_PUBLIC_BOOK_ORDER_URL ?? '';

/**
 * 完成特典: 曾祖父母（3代前）までの15人をすべて埋めた人は、製本が割引になる。
 * 割引は製本サービス側のクーポンコードで適用する。コード（EXPO_PUBLIC_BOOK_COMPLETE_COUPON）が
 * 未設定のあいだは、オンボーディングにも LP にも割引の案内を出さない（実際に適用できない特典は表示しない）。
 * 割引率は製本サービスで作ったクーポンの値に合わせてください。
 */
export const BOOK_COMPLETE_COUPON = process.env.EXPO_PUBLIC_BOOK_COMPLETE_COUPON ?? '';
export const BOOK_COMPLETE_DISCOUNT_PERCENT = 20;
export const BOOK_COMPLETE_GENERATION = 3;
export const bookDiscountActive = () => BOOK_COMPLETE_COUPON !== '';

/** 本にするのにおすすめの最低人数（あなた〜祖父母の7人）。 */
export const BOOK_RECOMMENDED_PERSONS = 7;

export const BOOK_POINTS = [
  {
    icon: 'tree',
    title: '見開きいっぱいの家系図',
    text: 'アプリで埋めた家系図を、そのまま大判の見開きページにレイアウト。5代前までのご先祖さまが一目でわかります。',
  },
  {
    icon: 'person',
    title: 'ひとりずつの人物ページ',
    text: '名前・よみがな・生没年・出生地・本籍。戸籍から読み取った情報を、ひとりに1ページずつまとめます。',
  },
  {
    icon: 'scroll',
    title: 'ご先祖さまの年表',
    text: '明治・大正・昭和…と和暦つきの年表に。「ひいおじいちゃんが生まれた年」が時代の中で見えてきます。',
  },
  {
    icon: 'gift',
    title: '贈りものにも',
    text: '還暦・米寿・法事・お正月の集まりに。親戚みんなで囲める、世界に一冊だけの本です。',
  },
] as const;

export const BOOK_STEPS = [
  { title: '家系図を埋める', text: 'アプリで空欄を埋めます。戸籍をスキャンすればAIが自動で配置。' },
  { title: '表紙とタイトルを選ぶ', text: '「〇〇家の家系図」など、表紙の文字とデザインを選びます。' },
  { title: '注文する', text: '注文ページでプレビューを確認して、お届け先を入力するだけ。' },
  { title: 'お届け', text: 'ていねいに製本して、ご自宅へお届けします。' },
] as const;

export const BOOK_PLANS = [
  {
    id: 'soft',
    name: 'ソフトカバー',
    price: '¥3,980〜',
    specs: ['A4横・フルカラー', '24ページ〜', '家系図の見開き＋人物ページ'],
    recommended: false,
  },
  {
    id: 'hard',
    name: 'ハードカバー',
    price: '¥6,980〜',
    specs: ['A4横・フルカラー', '24ページ〜', '布張り風の表紙・箔押しタイトル', '年表ページつき'],
    recommended: true,
  },
] as const;

export const BOOK_FAQ = [
  {
    q: '家系図が全部うまっていなくても作れますか？',
    a: 'はい。わかっている人だけで作れます。空欄は「不明」として、あとから書き込めるデザインになります。',
  },
  {
    q: '届くまでどれくらいかかりますか？',
    a: 'ご注文から10日〜2週間ほどでお届けします（繁忙期は前後します）。',
  },
  {
    q: '同じ本を何冊か注文できますか？',
    a: 'はい。兄弟やいとこの分もまとめてご注文いただけます。',
  },
  {
    q: '戸籍の画像も本に載りますか？',
    a: 'いいえ。載るのは家系図に登録した名前や日付などの情報だけです。書類の画像は含まれません。',
  },
] as const;
