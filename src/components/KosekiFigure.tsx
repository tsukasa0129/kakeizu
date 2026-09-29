import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors, radius } from '@/theme';

// 戸籍・住民票の「見本」図。人物・住所はすべて架空。
// 実物の書き方に近いレイアウトで描き、注目してほしい所に番号付きのマーカーを付ける。

export type FigureId =
  | 'juminhyo'
  | 'koseki-header'
  | 'koseki-full'
  | 'koseki-person'
  | 'juzen'
  | 'tohon-shohon'
  | 'wareki'
  | 'old-koseki';

const MARK = colors.orange;
const MARK_BG = '#FFF1DB';
const PAPER = '#FFFDF7';
const INK = '#2B2B2B';

// ---------- 共通パーツ ----------

function Badge({ n }: { n: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{n}</Text>
    </View>
  );
}

function Legend({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((t, i) => (
        <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Badge n={i + 1} />
          <Text style={styles.legendText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------- 横書き（パソコン化された今の戸籍・住民票） ----------

interface DocRow {
  key?: string;
  text: string;
}
interface DocSection {
  label: string;
  rows: DocRow[];
}

const KOSEKI: DocSection[] = [
  { label: '本籍', rows: [{ key: 'honseki', text: '〇〇県△△市さくら町一丁目2番地' }] },
  { label: '氏名', rows: [{ key: 'hittousha', text: '山田　太郎' }] },
  { label: '戸籍事項', rows: [{ text: '戸籍編製　【編製日】平成10年4月1日' }] },
  {
    label: '戸籍に記録されている者',
    rows: [
      { text: '【名】太郎' },
      { text: '【生年月日】昭和45年5月10日' },
      { key: 'parents', text: '【父】山田一郎　【母】山田花子' },
      { key: 'zokugara', text: '【続柄】長男' },
    ],
  },
  {
    label: '身分事項',
    rows: [
      { text: '出生　【出生日】昭和45年5月10日' },
      { text: '婚姻　【婚姻日】平成10年4月1日\n　　　【配偶者氏名】佐藤桜子' },
      { key: 'juzen', text: '　　　【従前戸籍】□□県××町1番地　山田一郎' },
    ],
  },
];

const JUMINHYO: DocSection[] = [
  { label: '氏名', rows: [{ text: '山田　太郎' }] },
  { label: '生年月日', rows: [{ text: '昭和45年5月10日' }] },
  { label: '住所', rows: [{ key: 'address', text: '◇◇県◇◇市みどり町3番4号' }] },
  { label: '本籍', rows: [{ key: 'honseki', text: '〇〇県△△市さくら町一丁目2番地' }] },
  { label: '筆頭者', rows: [{ key: 'hittousha', text: '山田　太郎' }] },
];

function Doc({
  title,
  sections,
  marks,
  more,
}: {
  title: string;
  sections: DocSection[];
  marks: Record<string, number>;
  more?: boolean;
}) {
  return (
    <View style={styles.paper}>
      <Text style={styles.docTitle}>{title}</Text>
      {sections.map((sec) => (
        <View key={sec.label} style={styles.section}>
          <Text style={styles.sectionLabel}>{sec.label}</Text>
          {sec.rows.map((r) => {
            const n = r.key ? marks[r.key] : undefined;
            return (
              <View key={r.text} style={[styles.row, n !== undefined && styles.rowMarked]}>
                <Text style={[styles.docText, { flex: 1 }]}>{r.text}</Text>
                {n !== undefined && <Badge n={n} />}
              </View>
            );
          })}
        </View>
      ))}
      {more && <Text style={styles.more}>…（以下つづく）</Text>}
    </View>
  );
}

// ---------- 謄本と抄本 ----------

function MiniDoc({ title, people }: { title: string; people: string[] }) {
  return (
    <View style={[styles.paper, { flex: 1, gap: 6 }]}>
      <Text style={[styles.docTitle, { fontSize: 12 }]}>{title}</Text>
      {people.map((p) => (
        <View key={p} style={styles.miniPerson}>
          <Text style={styles.docText}>{p}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------- 和暦 ----------

const ERAS = [
  { name: '明治', start: 1868, color: '#B58B5A' },
  { name: '大正', start: 1912, color: colors.purple },
  { name: '昭和', start: 1926, color: colors.blue },
  { name: '平成', start: 1989, color: colors.green },
  { name: '令和', start: 2019, color: colors.orange },
];
const DAIJI = [
  ['壱', '1'],
  ['弐', '2'],
  ['参', '3'],
  ['拾', '10'],
];

function Wareki() {
  const end = 2030;
  const span = end - ERAS[0].start;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.timeline}>
        {ERAS.map((e, i) => {
          const next = ERAS[i + 1]?.start ?? end;
          return <View key={e.name} style={{ flex: (next - e.start) / span, backgroundColor: e.color }} />;
        })}
      </View>
      <View style={{ gap: 4 }}>
        {ERAS.map((e) => (
          <View key={e.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: e.color }]} />
            <Text style={[styles.docText, { width: 40, fontWeight: '800' }]}>{e.name}</Text>
            <Text style={styles.docText}>
              {e.start}年〜　（{e.name}◯年 ＋ {e.start - 1}＝西暦）
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.daijiBox}>
        <Text style={[styles.docText, { fontWeight: '800' }]}>むかしの数字の書き方</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {DAIJI.map(([k, n]) => (
            <View key={k} style={styles.daiji}>
              <Text style={styles.daijiKanji}>{k}</Text>
              <Text style={styles.docText}>＝{n}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.docText}>
          例：「昭和<Text style={styles.hl}>参拾弐</Text>年」→ 昭和32年 → 32＋1925＝<Text style={styles.hl}>1957年</Text>
        </Text>
      </View>
    </View>
  );
}

// ---------- 縦書き（手書きの古い戸籍） ----------

const COL_W = 15;
const CHAR_H = 15;

/** 縦書きの1行（長いときは左へ折り返す）。 */
function VCol({ text, max = 16, size = 12, mark }: { text: string; max?: number; size?: number; mark?: number }) {
  const chunks: string[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += max) chunks.push(chars.slice(i, i + max).join(''));
  return (
    <View style={[styles.vGroup, mark !== undefined && styles.rowMarked]}>
      {chunks.map((c) => (
        <View key={c} style={{ width: size > 12 ? COL_W + 6 : COL_W, alignItems: 'center' }}>
          {Array.from(c).map((ch, i) => (
            <Text key={i} style={[styles.vChar, { fontSize: size, height: size > 12 ? CHAR_H + 5 : CHAR_H }]}>
              {ch}
            </Text>
          ))}
        </View>
      ))}
      {mark !== undefined && (
        <View style={styles.vBadge}>
          <Badge n={mark} />
        </View>
      )}
    </View>
  );
}

function CrossOut() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Line x1={4} y1={4} x2={size.w - 4} y2={size.h - 4} stroke={colors.red} strokeWidth={2} />
          <Line x1={size.w - 4} y1={4} x2={4} y2={size.h - 4} stroke={colors.red} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}

function OldKoseki() {
  // 縦書きは右から左へ読む。flexDirection: 'row-reverse' で右端から並べる。
  return (
    <View style={[styles.paper, { flexDirection: 'row-reverse', justifyContent: 'center', gap: 4, paddingTop: 26, paddingBottom: 12 }]}>
      <VCol text="本籍　〇〇県〇〇村百弐拾参番地" />
      <View style={styles.vDivider} />
      {/* 1人目：筆頭者（今もこの戸籍にいる） */}
      <View style={styles.vPerson}>
        <VCol text="昭和弐拾年山本花子と婚姻届出" />
        <VCol text="父　山田作造" max={8} />
        <VCol text="母　トメ" max={8} />
        <VCol text="長男" mark={3} />
        <VCol text="一郎" size={15} />
        <VCol text="大正拾年参月五日生" mark={1} />
      </View>
      <View style={styles.vDivider} />
      {/* 2人目：結婚して出ていった長女（×印） */}
      <View style={styles.vPerson}>
        <VCol text="昭和四拾五年鈴木次郎と婚姻除籍" />
        <VCol text="父　一郎" max={8} />
        <VCol text="母　花子" max={8} />
        <VCol text="長女" />
        <VCol text="ゆき" size={15} />
        <VCol text="昭和弐拾弐年八月九日生" />
        <CrossOut />
        <View style={[styles.vBadge, { top: -16, left: 0 }]}>
          <Badge n={2} />
        </View>
      </View>
    </View>
  );
}

// ---------- 図ごとの設定 ----------

function Body({ id }: { id: FigureId }) {
  switch (id) {
    case 'juminhyo':
      return (
        <>
          <Doc title="住民票の写し" sections={JUMINHYO} marks={{ address: 1, honseki: 2, hittousha: 3 }} />
          <Legend
            items={[
              '住所：今住んでいる場所',
              '本籍：戸籍が置いてある場所。住所とちがうことが多い！',
              '筆頭者：その戸籍の代表の人。本籍とセットでメモしよう',
            ]}
          />
        </>
      );
    case 'koseki-header':
      return (
        <>
          <Doc title="全部事項証明" sections={KOSEKI.slice(0, 3)} marks={{ honseki: 1, hittousha: 2 }} more />
          <Legend
            items={['本籍：この戸籍が置いてある場所', '氏名：ここに書かれている人が「筆頭者」（戸籍の代表の人）']}
          />
        </>
      );
    case 'koseki-full':
      return (
        <>
          <Doc
            title="全部事項証明"
            sections={KOSEKI}
            marks={{ honseki: 1, hittousha: 2, parents: 3, juzen: 4 }}
          />
          <Legend
            items={[
              '本籍：この戸籍の置き場所',
              '氏名：この戸籍の代表の人（筆頭者）',
              '父・母：親の名前がわかる',
              '従前戸籍：この人が前にいた戸籍。次にさかのぼる手がかり',
            ]}
          />
        </>
      );
    case 'koseki-person':
      return (
        <>
          <Doc title="全部事項証明" sections={[KOSEKI[3]]} marks={{ parents: 1, zokugara: 2 }} more />
          <Legend items={['父・母の名前', '続柄：家族の中での立場（この人は「長男」）']} />
        </>
      );
    case 'juzen':
      return (
        <>
          <Doc title="全部事項証明" sections={[KOSEKI[1], KOSEKI[4]]} marks={{ juzen: 1 }} more />
          <Legend
            items={[
              '従前戸籍：太郎さんが結婚する前にいた戸籍（お父さん・一郎さんの戸籍）。次は「□□県××町1番地・筆頭者 山田一郎」の戸籍を頼めばOK',
            ]}
          />
        </>
      );
    case 'tohon-shohon':
      return (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MiniDoc title="謄本（全部事項）" people={['夫　太郎', '妻　桜子', '長女　ゆい']} />
          <MiniDoc title="抄本（個人事項）" people={['長女　ゆい']} />
        </View>
      );
    case 'wareki':
      return <Wareki />;
    case 'old-koseki':
      return (
        <>
          <OldKoseki />
          <Text style={styles.note}>※ 縦書きで、右の行から左へ読みます</Text>
          <Legend
            items={[
              '日付はむかしの数字（大正拾年参月五日＝大正10年3月5日）',
              '×印：結婚などでこの戸籍から抜けた人。情報はそのまま読める',
              '続柄：家族の中での立場',
            ]}
          />
        </>
      );
  }
}

/** 戸籍などの見本図。 */
export function KosekiFigure({ id }: { id?: FigureId }) {
  if (!id) return null;
  return (
    <View style={styles.frame}>
      <View style={styles.frameHead}>
        <Text style={styles.frameTitle}>実物のイメージ</Text>
        <Text style={styles.sample}>見本（架空の例）</Text>
      </View>
      <Body id={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 12 },
  frameHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  frameTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  sample: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.red,
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  paper: {
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: '#D9D2C0',
    borderRadius: 4,
    padding: 10,
  },
  docTitle: { textAlign: 'center', fontSize: 14, fontWeight: '800', color: INK, letterSpacing: 4, marginBottom: 6 },
  section: { borderTopWidth: 1, borderTopColor: '#D9D2C0', paddingVertical: 4, gap: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  rowMarked: { backgroundColor: MARK_BG, borderWidth: 1.5, borderColor: MARK },
  docText: { fontSize: 12, lineHeight: 18, color: INK },
  more: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  legendText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
  miniPerson: { borderWidth: 1, borderColor: '#D9D2C0', borderRadius: 4, padding: 6, backgroundColor: '#fff' },
  timeline: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  daijiBox: { backgroundColor: PAPER, borderRadius: radius.sm, padding: 10, gap: 8 },
  daiji: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  daijiKanji: { fontSize: 18, fontWeight: '800', color: INK },
  hl: { fontWeight: '800', color: colors.orangeDark },
  vGroup: { flexDirection: 'row-reverse', borderRadius: 4, paddingVertical: 2 },
  vChar: { color: INK, textAlign: 'center' },
  vBadge: { position: 'absolute', top: -20, left: -3 },
  vPerson: { flexDirection: 'row-reverse', gap: 1, padding: 4 },
  vDivider: { width: 1, backgroundColor: '#D9D2C0' },
  note: { fontSize: 12, color: colors.textMuted },
});
