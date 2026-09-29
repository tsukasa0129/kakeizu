import type { IconName } from '@/components/Icon';

export interface GuideStep {
  id: string;
  title: string;
  body: string;
  checklist?: string[];
}

export interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: 'green' | 'blue' | 'purple' | 'orange';
  /** Rough time/cost hints shown as chips. */
  chips: string[];
  steps: GuideStep[];
  tips?: string[];
}

export const GUIDES: Guide[] = [
  {
    id: 'find-honseki',
    title: '本籍地を調べる',
    subtitle: 'すべての出発点。住民票でわかります',
    icon: 'pin',
    color: 'green',
    chips: ['所要10分', '300円前後'],
    steps: [
      {
        id: 'juminhyo',
        title: '住民票を「本籍・筆頭者あり」で取る',
        body: '住んでいる市区町村の窓口、またはマイナンバーカードがあればコンビニで取得できます。申請時に「本籍・筆頭者を記載する」を選びます。',
        checklist: ['本人確認書類（マイナンバーカード・運転免許証など）', '手数料（自治体により200〜300円程度）'],
      },
      {
        id: 'note',
        title: '本籍地と筆頭者をメモする',
        body: '住民票に書かれた「本籍」の住所と「筆頭者」の氏名を控えます。家族に聞いてもわかることがあります。',
      },
      {
        id: 'choose',
        title: '取得方法を選ぶ',
        body: '本籍地が近ければ窓口、遠ければ「広域交付」や「郵送」、マイナンバーカードがあれば「コンビニ交付」が便利です。「おすすめルート診断」も試してみましょう。',
      },
    ],
  },
  {
    id: 'koiki',
    title: '広域交付でまとめて取る',
    subtitle: '最寄りの役所で、親・祖父母の戸籍まで一括',
    icon: 'rocket',
    color: 'blue',
    chips: ['いちばん効率的', '本人が窓口へ'],
    steps: [
      {
        id: 'call',
        title: '窓口に事前に電話する',
        body: '最寄りの市区町村の戸籍窓口に「広域交付で、親と祖父母の除籍・改製原戸籍まで取りたい」と伝え、受付時間や当日交付の可否を確認します。',
      },
      {
        id: 'prepare',
        title: '持ち物をそろえる',
        body: '請求する本人が行く必要があります（郵送・代理人は不可）。',
        checklist: [
          '顔写真付きの本人確認書類（マイナンバーカード・運転免許証・パスポートなど）',
          'わかっている範囲の本籍地・筆頭者のメモ',
          '手数料（戸籍450円、除籍・改製原戸籍750円が目安）',
        ],
      },
      {
        id: 'request',
        title: '窓口で請求する',
        body: '「家系図を作りたいので、自分から直系でさかのぼれる戸籍をすべて」と伝えるとスムーズです。兄弟姉妹・おじおばの戸籍は対象外です。',
      },
      {
        id: 'receive',
        title: '受け取る',
        body: '照会に時間がかかり、後日受け取りになる場合があります。コンピュータ化されていない一部の戸籍は、本籍地に別途請求が必要です。',
      },
      {
        id: 'scan',
        title: 'アプリでスキャン',
        body: '受け取った書類を1ページずつ撮影して読み取りましょう。家系図の空欄が一気に埋まります！',
      },
    ],
    tips: ['混雑する月曜・月末を避けると待ち時間が短くなりがちです。', '枚数が多いと手数料が数千円になることもあります。'],
  },
  {
    id: 'convenience',
    title: 'コンビニで取る',
    subtitle: 'マイナンバーカードで、自分の現在の戸籍を',
    icon: 'shop',
    color: 'purple',
    chips: ['早朝・夜も可', '現在の戸籍のみ'],
    steps: [
      {
        id: 'check',
        title: '本籍地の自治体が対応しているか確認',
        body: '本籍地の市区町村がコンビニ交付に対応している必要があります。住所地と本籍地が違う場合は、事前に「利用登録申請」が必要なことがあります。',
      },
      {
        id: 'prepare',
        title: '持ち物',
        body: 'マルチコピー機のある店舗へ。',
        checklist: ['マイナンバーカード', '利用者証明用電子証明書の暗証番号（数字4桁）', '手数料'],
      },
      {
        id: 'print',
        title: 'マルチコピー機で「戸籍証明書」を選ぶ',
        body: '「全部事項証明書（謄本）」を選択します。除籍謄本・改製原戸籍はコンビニでは取れないので、窓口か郵送で請求します。',
      },
    ],
  },
  {
    id: 'mail',
    title: '郵送で請求する',
    subtitle: '遠方の本籍地や、代理で集めたいときに',
    icon: 'envelope',
    color: 'orange',
    chips: ['1〜2週間', '定額小為替'],
    steps: [
      {
        id: 'form',
        title: '請求書をダウンロード',
        body: '本籍地の市区町村のWebサイトから「戸籍証明書等郵送請求書」を印刷して記入します。使い道は「家系図作成のため」と書けばOKです。',
      },
      {
        id: 'kogawase',
        title: '郵便局で定額小為替を買う',
        body: '手数料分の定額小為替を購入します（1枚ごとに発行手数料がかかります）。何通になるかわからない場合は、多めに入れておくと差額を返してもらえることがあります。',
      },
      {
        id: 'pack',
        title: '封筒に入れるもの',
        body: '以下をまとめて本籍地の戸籍担当宛てに送ります。',
        checklist: [
          '記入した請求書',
          '本人確認書類のコピー',
          '定額小為替',
          '切手を貼り、住所を書いた返信用封筒',
          '（親・祖父母の戸籍なら）つながりのわかる戸籍の写し',
        ],
      },
      {
        id: 'wait',
        title: '届くのを待つ',
        body: '到着まで1〜2週間が目安。届いたらアプリでスキャンして、次に請求する戸籍をチェックしましょう。',
      },
    ],
  },
  {
    id: 'trace',
    title: 'さかのぼって古い戸籍を集める',
    subtitle: '明治までたどる、家系図づくりの本番',
    icon: 'search',
    color: 'blue',
    chips: ['上級', '数週間〜'],
    steps: [
      {
        id: 'read',
        title: '「従前戸籍」を読む',
        body: '取った戸籍の身分事項欄から、ひとつ前の本籍地と筆頭者を探します。アプリでスキャンすると自動で「次に請求する戸籍」に追加されます。',
      },
      {
        id: 'request',
        title: '次の戸籍を請求',
        body: '直系なら広域交付でまとめて、本籍地が対応外なら郵送で請求します。',
      },
      {
        id: 'repeat',
        title: 'くり返す',
        body: '一番古い戸籍（明治19年式・明治31年式など）にたどり着くまでくり返します。',
      },
      {
        id: 'relatives',
        title: '傍系（おじ・おば・兄弟）の戸籍について',
        body: '直系でない親族の戸籍は、原則として本人の委任状や正当な理由が必要です。親族に協力してもらいましょう。',
      },
    ],
  },
];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
export const guideCheckKey = (guideId: string, stepId: string) => `${guideId}:${stepId}`;
export const isGuideComplete = (guide: Guide, checks: Record<string, boolean>) =>
  guide.steps.every((s) => checks[guideCheckKey(guide.id, s.id)]);

/** おすすめルート診断 */
export interface RouteQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

export const ROUTE_QUESTIONS: RouteQuestion[] = [
  {
    id: 'myna',
    question: 'マイナンバーカードを持っていますか？',
    options: [
      { label: '持っている', value: 'yes' },
      { label: '持っていない', value: 'no' },
    ],
  },
  {
    id: 'goal',
    question: 'どこまでさかのぼりたい？',
    options: [
      { label: 'まずは自分の戸籍だけ', value: 'self' },
      { label: '祖父母・曾祖父母まで', value: 'deep' },
    ],
  },
  {
    id: 'visit',
    question: '平日に役所の窓口へ行けますか？',
    options: [
      { label: '行ける', value: 'yes' },
      { label: '難しい', value: 'no' },
    ],
  },
];

export function recommendRoute(answers: Record<string, string>): { guideId: string; reason: string } {
  if (answers.goal === 'self' && answers.myna === 'yes') {
    return { guideId: 'convenience', reason: 'マイナンバーカードがあれば、自分の戸籍はコンビニですぐ取れます。' };
  }
  if (answers.visit === 'yes') {
    return {
      guideId: 'koiki',
      reason: '窓口に行けるなら「広域交付」で、親・祖父母の戸籍まで最寄りの役所でまとめて請求できます。',
    };
  }
  return { guideId: 'mail', reason: '窓口に行くのが難しい場合は、本籍地への郵送請求が確実です。' };
}
