export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const BADGES: Badge[] = [
  { id: 'first-step', emoji: '🌱', title: 'はじめの一歩', description: 'あなた自身を登録した' },
  { id: 'parents', emoji: '👪', title: '両親そろった', description: '父と母を登録した' },
  { id: 'grandparents', emoji: '🌳', title: '祖父母コンプリート', description: '祖父母4人をすべて登録した' },
  { id: 'great-grandparents', emoji: '🏯', title: '曾祖父母コンプリート', description: '曾祖父母8人をすべて登録した' },
  { id: 'deep-roots', emoji: '⛩️', title: '深い根っこ', description: '高祖父母（4代前）を1人登録した' },
  { id: 'first-scan', emoji: '📜', title: '初めての戸籍', description: '書類を初めてAIで読み取った' },
  { id: 'archivist', emoji: '🗄️', title: '書類マスター', description: '書類を5枚読み取った' },
  { id: 'scholar', emoji: '🎓', title: '戸籍博士', description: 'レッスンをすべて修了した' },
  { id: 'navigator', emoji: '🧭', title: '役所ナビゲーター', description: '取得ガイドを1つ最後まで進めた' },
  { id: 'streak-3', emoji: '🔥', title: '3日連続', description: '3日連続で学習した' },
  { id: 'streak-7', emoji: '💎', title: '7日連続', description: '7日連続で学習した' },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);
