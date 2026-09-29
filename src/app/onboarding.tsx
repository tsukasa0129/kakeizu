import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon, type IconName } from '@/components/Icon';
import { Mascot, MascotSays } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { notify } from '@/lib/notify';
import { awardProgress } from '@/lib/progress';
import { purchasesAvailable, restore } from '@/lib/purchases';
import { generationName, xpForSlot } from '@/lib/slots';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { colors, font, radius } from '@/theme';

// Flow modelled on the top-grossing hard-paywall apps studied in Appllama (Cal AI et al.):
// short personal questions → insight → "with us vs. on your own" → plan calculation →
// "your plan is ready" → paywall. Each answer is reused on the plan and paywall screens.

const MOTIVES = ['ルーツを知りたい', '子どもに残したい', '相続の準備', 'お墓・法事のため', 'なんとなく興味'];

const TARGETS = [
  { gen: 2, label: '祖父母まで', sub: '2代前' },
  { gen: 3, label: '曾祖父母まで', sub: '3代前・明治〜大正ごろ' },
  { gen: 4, label: '高祖父母まで', sub: '4代前・江戸末期〜明治ごろ' },
  { gen: 5, label: 'たどれるところまで', sub: '5代前〜' },
];

const KNOWLEDGE = [
  { id: 'all', label: '4人とも言える' },
  { id: 'some', label: '1〜3人なら言える' },
  { id: 'none', label: 'ほとんど知らない' },
] as const;

const EXPERIENCE = [
  { id: 'have', label: '取ったことがある', icon: 'scroll' },
  { id: 'never', label: '取ったことはない', icon: 'office' },
  { id: 'unknown', label: '取り方がわからない', icon: 'search' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

const GOALS = [
  { xp: 10, label: '気軽に', sub: '1日5分' },
  { xp: 30, label: 'ふつう', sub: '1日10分' },
  { xp: 50, label: 'しっかり', sub: '1日15分' },
  { xp: 80, label: '本気', sub: '1日20分' },
];

const FIRST_STEP: Record<(typeof EXPERIENCE)[number]['id'], string> = {
  have: '手元の戸籍をスキャンして家系図に',
  never: 'コンビニ・役所で自分の戸籍を取る',
  unknown: 'レッスンで戸籍の取り方を知る',
};

const CALC_ITEMS = ['さかのぼる世代', '必要な戸籍の種類', '請求先の役所', '学習パス', '1日の目標'];

/** Question steps show the progress bar; the last two are the calculation and the plan. */
const QUESTION_STEPS = 8;
const CALC = 9;
const PLAN = 10;

const ancestorsUpTo = (gen: number) => 2 ** (gen + 1) - 2;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [motive, setMotive] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [knowledge, setKnowledge] = useState<(typeof KNOWLEDGE)[number]['id'] | null>(null);
  const [experience, setExperience] = useState<(typeof EXPERIENCE)[number]['id'] | null>(null);
  const [goal, setGoal] = useState(30);
  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [restoring, setRestoring] = useState(false);

  const targetGen = target ?? 4;
  const goalLabel = GOALS.find((g) => g.xp === goal)?.sub ?? '1日10分';
  const name = givenName.trim() || familyName.trim();

  const finish = () => {
    useFamily.getState().upsertAtSlot(1, {
      familyName: familyName.trim(),
      givenName: givenName.trim(),
      notes: motive ? `きっかけ: ${motive}` : undefined,
    });
    useGame.getState().finishOnboarding(goal, targetGen);
    awardProgress(xpForSlot(1), 'あなたが家系図の最初の1人に！', 'personsFilled');
  };

  // Reinstalls: an active subscription skips the questions entirely.
  const onRestore = async () => {
    if (!purchasesAvailable()) return notify('購入の復元', 'ストアに接続できませんでした。');
    setRestoring(true);
    const ok = await restore().catch(() => false);
    setRestoring(false);
    if (ok) useGame.getState().finishOnboarding(goal, targetGen);
    else notify('購入の復元', '復元できる購入が見つかりませんでした。');
  };

  if (step === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Mascot size={180} />
        <Text style={[font.h1, styles.centerText]}>家系図クエスト</Text>
        <Text style={[font.body, styles.centerText, { color: colors.textMuted }]}>
          役所の戸籍をAIで読み取って、{'\n'}ゲーム感覚で家系図を完成させよう。
        </Text>
        <View style={styles.bottom}>
          <Button3D title="はじめる" onPress={() => setStep(1)} />
          <Text style={styles.restore} onPress={restoring ? undefined : onRestore}>
            {restoring ? '確認中…' : 'すでに購入済みの方はこちら'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === CALC) return <PlanCalculation onDone={() => setStep(PLAN)} />;

  const canContinue =
    (step === 1 && !!motive) ||
    (step === 2 && target !== null) ||
    (step === 3 && !!knowledge) ||
    (step === 4 && !!experience) ||
    step === 5 ||
    step === 6 ||
    step === 7 ||
    (step === 8 && (!!familyName.trim() || !!givenName.trim())) ||
    step === PLAN;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step !== PLAN && (
          <View style={styles.header}>
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} accessibilityLabel="戻る">
              <Text style={styles.back}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <ProgressBar value={step / QUESTION_STEPS} />
            </View>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <>
              <MascotSays text="家系図をつくろうと思ったきっかけは？" />
              <View style={styles.options}>
                {MOTIVES.map((m) => (
                  <Option key={m} label={m} selected={motive === m} onPress={() => setMotive(m)} />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <MascotSays text="何代前のご先祖さままで知りたい？" />
              <View style={styles.options}>
                {TARGETS.map((t) => (
                  <Option
                    key={t.gen}
                    label={t.label}
                    sub={t.sub}
                    trailing={t.gen === 4 ? 'おすすめ' : undefined}
                    selected={target === t.gen}
                    onPress={() => setTarget(t.gen)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <MascotSays text="祖父母4人のフルネーム、いくつ言えるかな？" mood="think" />
              <View style={styles.options}>
                {KNOWLEDGE.map((k) => (
                  <Option key={k.id} label={k.label} selected={knowledge === k.id} onPress={() => setKnowledge(k.id)} />
                ))}
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <MascotSays text="戸籍謄本を取ったことはある？" />
              <View style={styles.options}>
                {EXPERIENCE.map((e) => (
                  <Option
                    key={e.id}
                    icon={e.icon}
                    label={e.label}
                    selected={experience === e.id}
                    onPress={() => setExperience(e.id)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 5 && <AncestorInsight gen={targetGen} knowledge={knowledge} />}

          {step === 6 && <Comparison experience={experience} />}

          {step === 7 && (
            <>
              <MascotSays text="1日の目標を決めよう！毎日つづけると連続記録がのびるよ。" />
              <View style={styles.options}>
                {GOALS.map((g) => (
                  <Option
                    key={g.xp}
                    label={`${g.label}  ${g.sub}`}
                    trailing={`${g.xp} XP`}
                    selected={goal === g.xp}
                    onPress={() => setGoal(g.xp)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 8 && (
            <>
              <MascotSays text="最後に、家系図の真ん中になるあなたのお名前を教えてね。" />
              <View style={styles.nameRow}>
                <TextInput
                  style={styles.input}
                  placeholder="姓"
                  value={familyName}
                  onChangeText={setFamilyName}
                  placeholderTextColor={colors.locked}
                />
                <TextInput
                  style={styles.input}
                  placeholder="名"
                  value={givenName}
                  onChangeText={setGivenName}
                  placeholderTextColor={colors.locked}
                />
              </View>
              <Text style={font.small}>入力した情報はこの端末の中だけに保存されます。</Text>
            </>
          )}

          {step === PLAN && (
            <View style={{ gap: 16 }}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={styles.doneMark}>
                  <Ionicons name="checkmark" size={26} color="#fff" />
                </View>
                <Text style={[font.h2, styles.centerText]}>
                  {name ? `${name}さん専用の` : 'あなた専用の'}
                  {'\n'}ルーツ探しプランができました！
                </Text>
              </View>
              <View style={styles.goalPill}>
                <Text style={styles.goalPillText}>
                  {generationName(targetGen)}まで ・ ご先祖さま最大{ancestorsUpTo(targetGen)}人
                </Text>
              </View>
              <View style={styles.planGrid}>
                <PlanCard icon="flag" title="ゴール" value={`${generationName(targetGen)}（${targetGen}代前）`} />
                <PlanCard icon="tree" title="見つけるご先祖さま" value={`最大 ${ancestorsUpTo(targetGen)}人`} />
                <PlanCard icon="rocket" title="最初の一歩" value={FIRST_STEP[experience ?? 'unknown']} />
                <PlanCard icon="flame" title="1日の目標" value={goalLabel} />
              </View>
              <Text style={[font.small, styles.centerText]}>目標はあとからいつでも変えられます。</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          {step === PLAN ? (
            <Button3D title="プランをはじめる" onPress={finish} />
          ) : (
            <Button3D
              title={step === QUESTION_STEPS ? 'プランを作成する' : 'つづける'}
              disabled={!canContinue}
              onPress={() => setStep(step + 1)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** How many ancestors the chosen target means, one bar per generation (Cal AI's "potential" screen). */
function AncestorInsight({ gen, knowledge }: { gen: number; knowledge: string | null }) {
  const gens = Array.from({ length: gen }, (_, i) => i + 1);
  const max = 2 ** gen;
  return (
    <View style={{ gap: 16 }}>
      <Text style={font.h2}>
        {generationName(gen)}までには、{'\n'}
        <Text style={{ color: colors.greenDark }}>{ancestorsUpTo(gen)}人</Text>のご先祖さまがいます
      </Text>
      <View style={styles.card}>
        {gens.map((g) => (
          <View key={g} style={styles.barRow}>
            <Text style={styles.barLabel}>{generationName(g)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(2 ** g / max) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{2 ** g}人</Text>
          </View>
        ))}
      </View>
      <Text style={font.body}>
        {knowledge === 'all'
          ? '祖父母のことをよく知っているなら、その先はすぐそこ。'
          : '名前を知らなくても大丈夫。'}
        戸籍をさかのぼれば、名前・生まれた年・出身地まで書いてあります。
      </Text>
      <View style={styles.note}>
        <Icon name="hourglass" size={22} />
        <Text style={[font.small, { flex: 1 }]}>
          古い戸籍の中には、保存期間を過ぎて廃棄されたものもあります。調べるなら早いほど安心です。
        </Text>
      </View>
    </View>
  );
}

const COMPARE_ROWS: { label: string; alone: string; app: string }[] = [
  { label: '戸籍を読む', alone: '旧字・手書きで挫折しがち', app: 'AIが読み取って自動で家系図に' },
  { label: '次に取る戸籍', alone: '自分で探して推理', app: '読み取り結果から自動でリスト化' },
  { label: '役所への請求', alone: '調べながら手探り', app: 'ルート診断とチェックリスト' },
  { label: 'つづける', alone: '途中で止まりがち', app: '連続記録とXPで毎日すこしずつ' },
];

/** "On your own vs. with the app" (Cal AI's comparison screen), without invented statistics. */
function Comparison({ experience }: { experience: string | null }) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={font.h2}>
        {experience === 'have' ? 'ひとりで進めるより、' : '取り方がわからなくても、'}
        {'\n'}家系図クエストならかんたん
      </Text>
      <View style={styles.compareHead}>
        <Text style={[styles.compareHeadText, { flex: 1 }]}>ひとりで</Text>
        <Text style={[styles.compareHeadText, { flex: 1.2, color: colors.greenDark }]}>家系図クエスト</Text>
      </View>
      {COMPARE_ROWS.map((r) => (
        <View key={r.label} style={{ gap: 6 }}>
          <Text style={styles.compareLabel}>{r.label}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.compareCell, { flex: 1 }]}>
              <Icon name="cross" size={16} />
              <Text style={[font.small, { flex: 1 }]}>{r.alone}</Text>
            </View>
            <View style={[styles.compareCell, styles.compareCellApp, { flex: 1.2 }]}>
              <Icon name="check" size={16} />
              <Text style={[font.small, { flex: 1, color: colors.text, fontWeight: '700' }]}>{r.app}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Animated "building your plan" step; the wait makes the result feel tailored. */
function PlanCalculation({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPct((p) => Math.min(100, p + 2)), 60);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (pct < 100) return;
    const id = setTimeout(onDone, 500);
    return () => clearTimeout(id);
  }, [pct, onDone]);

  const doneCount = Math.floor((pct / 100) * CALC_ITEMS.length);
  return (
    <SafeAreaView style={[styles.center, { justifyContent: 'center' }]}>
      <Text style={styles.pct}>{pct}%</Text>
      <Text style={[font.h2, styles.centerText]}>あなた専用のプランを{'\n'}作成しています</Text>
      <View style={{ width: '100%', paddingHorizontal: 12 }}>
        <ProgressBar value={pct / 100} />
      </View>
      <View style={styles.calcList}>
        {CALC_ITEMS.map((item, i) => (
          <View key={item} style={styles.calcRow}>
            <Text style={[font.body, { flex: 1, color: i < doneCount ? colors.text : colors.locked }]}>・{item}</Text>
            {i < doneCount && <Ionicons name="checkmark-circle" size={22} color={colors.green} />}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

function PlanCard({ icon, title, value }: { icon: IconName; title: string; value: string }) {
  return (
    <View style={styles.planCard}>
      <Icon name={icon} size={26} />
      <Text style={font.small}>{title}</Text>
      <Text style={styles.planValue}>{value}</Text>
    </View>
  );
}

function Option({
  label,
  sub,
  trailing,
  icon,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  trailing?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && { borderColor: colors.blue, backgroundColor: colors.blueLight }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && <Icon name={icon} size={26} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionText, selected && { color: colors.blueDark }]}>{label}</Text>
        {sub && <Text style={font.small}>{sub}</Text>}
      </View>
      {trailing && <Text style={[styles.optionTrailing, selected && { color: colors.blueDark }]}>{trailing}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg },
  centerText: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  back: { fontSize: 34, color: colors.locked, fontWeight: '300' },
  body: { padding: 20, gap: 20 },
  options: { gap: 10 },
  option: {
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionTrailing: { fontSize: 13, fontWeight: '800', color: colors.greenDark },
  nameRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    fontSize: 18,
    color: colors.text,
  },
  bottom: { padding: 20, width: '100%', gap: 14 },
  restore: { textAlign: 'center', color: colors.blue, fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 64, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  barTrack: { flex: 1, height: 14, borderRadius: 7, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7, backgroundColor: colors.green, minWidth: 14 },
  barValue: { width: 40, textAlign: 'right', fontWeight: '800', color: colors.text },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
  },
  compareHead: { flexDirection: 'row', gap: 8 },
  compareHeadText: { textAlign: 'center', fontWeight: '800', color: colors.textMuted },
  compareLabel: { fontWeight: '800', color: colors.text },
  compareCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  compareCellApp: { backgroundColor: colors.greenLight },
  pct: { fontSize: 64, fontWeight: '900', color: colors.text },
  calcList: { width: '100%', paddingHorizontal: 12, gap: 6, marginTop: 12 },
  calcRow: { flexDirection: 'row', alignItems: 'center' },
  doneMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPill: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goalPillText: { fontWeight: '800', color: colors.text },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  planValue: { fontSize: 15, fontWeight: '800', color: colors.text },
});
