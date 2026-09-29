import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { Mascot, MascotSays } from '@/components/Mascot';
import { ExtractError, extractKoseki, isDemoMode, type PageImage } from '@/lib/extract';
import { applyMerge, propagate, suggestAssignment, type Assignment } from '@/lib/merge';
import { awardProgress } from '@/lib/progress';
import { FREE_SCAN_LIMIT } from '@/lib/purchases';
import {
  FREE_MAX_GENERATION,
  PREMIUM_MAX_GENERATION,
  generationOf,
  relationLabel,
  slotsUpTo,
} from '@/lib/slots';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';
import type { ExtractionResult } from '@/types/extraction';

const MAX_PAGES = 6;

const DOC_TYPE_LABEL: Record<ExtractionResult['documentType'], string> = {
  koseki_zenbu: '戸籍謄本（全部事項証明書）',
  koseki_kojin: '戸籍抄本（個人事項証明書）',
  joseki: '除籍謄本',
  kaisei_genkoseki: '改製原戸籍謄本',
  other: 'その他の書類',
};

type Phase = 'pick' | 'reading' | 'review';

export default function ScanScreen() {
  const router = useRouter();
  const isPremium = usePremium((s) => s.isPremium);
  const scansUsed = useGame((s) => s.scansUsed);
  const remaining = Math.max(0, FREE_SCAN_LIMIT - scansUsed);
  const [phase, setPhase] = useState<Phase>('pick');
  const [pages, setPages] = useState<PageImage[]>([]);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [assignment, setAssignment] = useState<Assignment>({});

  const addPages = async (source: 'camera' | 'library') => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: source === 'library',
      selectionLimit: MAX_PAGES - pages.length,
    };
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('カメラへのアクセスが必要です', '設定アプリから許可してください。');
    }
    const res =
      source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const added = res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
    setPages((p) => [...p, ...added].slice(0, MAX_PAGES));
  };

  const read = async () => {
    if (!isPremium && remaining <= 0) return router.push('/paywall');
    setPhase('reading');
    try {
      const r = await extractKoseki(pages);
      if (!isDemoMode()) useGame.getState().consumeScan();
      setResult(r);
      setAssignment(suggestAssignment(r));
      setPhase('review');
    } catch (e) {
      setPhase('pick');
      Alert.alert('読み取れませんでした', e instanceof ExtractError ? e.message : '通信状況を確認して、もう一度お試しください。');
    }
  };

  if (phase === 'reading') return <Reading />;
  if (phase === 'review' && result) {
    return (
      <Review
        result={result}
        assignment={assignment}
        setAssignment={setAssignment}
        maxGen={isPremium ? PREMIUM_MAX_GENERATION : FREE_MAX_GENERATION}
        onDone={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="書類をスキャン" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        <MascotSays text="役所で取った戸籍を撮影してね。AIが読み取って家系図の空欄を埋めるよ！" />

        <View style={styles.tips}>
          <Tip icon="sunny" text="明るい場所で、影が入らないように" />
          <Tip icon="document" text="1ページずつ、書類全体が写るように" />
          <Tip icon="albums" text={`複数ページは最大${MAX_PAGES}枚まで一度に読み取れます`} />
        </View>

        {pages.length > 0 && (
          <ScrollView horizontal contentContainerStyle={{ gap: 10 }} showsHorizontalScrollIndicator={false}>
            {pages.map((p, i) => (
              <View key={p.uri}>
                <Image source={{ uri: p.uri }} style={styles.thumb} />
                <Pressable
                  style={styles.remove}
                  onPress={() => setPages(pages.filter((_, j) => j !== i))}
                  accessibilityLabel={`${i + 1}ページ目を削除`}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
                <Text style={styles.pageNo}>{i + 1}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button3D
            title="撮影"
            variant="secondary"
            style={{ flex: 1 }}
            disabled={pages.length >= MAX_PAGES}
            icon={<Ionicons name="camera" size={20} color={colors.blue} />}
            onPress={() => addPages('camera')}
          />
          <Button3D
            title="写真から"
            variant="secondary"
            style={{ flex: 1 }}
            disabled={pages.length >= MAX_PAGES}
            icon={<Ionicons name="images" size={20} color={colors.blue} />}
            onPress={() => addPages('library')}
          />
        </View>

        <Button3D title={`AIで読み取る（${pages.length}枚）`} disabled={pages.length === 0} onPress={read} />

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {isPremium && <Icon name="crown" size={16} />}
          <Text style={[font.small, { flex: 1 }]}>
            {isPremium ? 'プレミアム：読み取り無制限' : `無料の読み取り 残り ${remaining} / ${FREE_SCAN_LIMIT} 回`}
            {isDemoMode() ? '\n※ デモモード：実際の画像は送信されず、サンプル結果が表示されます。' : ''}
          </Text>
        </View>
        <Text style={font.small}>
          画像は読み取りのためだけにサーバーへ送信され、保存されません。戸籍には家族の大切な個人情報が含まれます。取り扱いにご注意ください。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} hitSlop={12}>
        <Ionicons name="close" size={28} color={colors.locked} />
      </Pressable>
      <Text style={font.h3}>{title}</Text>
    </View>
  );
}

function Tip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Ionicons name={icon} size={20} color={colors.blue} />
      <Text style={[font.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const READING_LINES = ['文字を読み取っています…', '和暦を西暦に変換しています…', '家族のつながりを整理しています…', 'もうすぐです…'];

function Reading() {
  const [bob] = useState(() => new Animated.Value(0));
  const [line, setLine] = useState(0);
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -14, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    const t = setInterval(() => setLine((l) => Math.min(l + 1, READING_LINES.length - 1)), 2500);
    return () => {
      anim.stop();
      clearInterval(t);
    };
  }, [bob]);
  return (
    <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: 20 }]}>
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Mascot size={160} mood="think" />
      </Animated.View>
      <Text style={font.h2}>AIが読み取り中</Text>
      <Text style={[font.body, { color: colors.textMuted }]}>{READING_LINES[line]}</Text>
    </SafeAreaView>
  );
}

function Review({
  result,
  assignment,
  setAssignment,
  maxGen,
  onDone,
}: {
  result: ExtractionResult;
  assignment: Assignment;
  setAssignment: (a: Assignment) => void;
  maxGen: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const hasAnchor = Object.values(assignment).some((v) => v != null);
  const usedSlots = new Set(Object.values(assignment).filter((v): v is number => v != null));

  const pickSlot = (tempId: string, slot: number | null) => {
    const next: Assignment = { ...assignment, [tempId]: slot };
    setAssignment(slot == null ? next : propagate(result.persons, next));
    setEditing(null);
  };

  const commit = () => {
    const family = useFamily.getState();
    const docId = family.addDocument({
      type: result.documentType,
      title: result.documentTitle,
      honseki: result.honseki,
      hittousha: result.hittousha,
      personCount: result.persons.length,
    });
    const leads = family.addLeads(result.previousRegisters, docId);
    const summary = applyMerge(result, assignment, docId, maxGen);
    const filled = summary.created.length;
    onDone();
    awardProgress(
      50 + summary.xp,
      filled > 0 ? `${filled}人の空欄が埋まった！` : '書類を読み取った！',
      'scans',
    );
    // Count each newly filled slot toward the daily quest.
    for (let i = 0; i < filled; i++) useGame.getState().bump('personsFilled');
    if (leads > 0) {
      setTimeout(
        () => Alert.alert('次に請求する戸籍が見つかりました', `${leads}件を「役所ナビ」に追加しました。`, [
          { text: 'あとで' },
          { text: '見る', onPress: () => router.push('/guide') },
        ]),
        600,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="読み取り結果の確認" onClose={onDone} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        <View style={styles.docCard}>
          <Icon name="scroll" size={36} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={font.h3}>{DOC_TYPE_LABEL[result.documentType]}</Text>
            {result.honseki && <Text style={font.small}>本籍：{result.honseki}</Text>}
            {result.hittousha && <Text style={font.small}>筆頭者：{result.hittousha}</Text>}
          </View>
        </View>

        {result.warnings.map((w) => (
          <View key={w} style={styles.warning}>
            <Ionicons name="alert-circle" size={18} color={colors.orangeDark} />
            <Text style={[font.small, { flex: 1, color: colors.orangeDark }]}>{w}</Text>
          </View>
        ))}

        <MascotSays
          size={64}
          mood={hasAnchor ? 'happy' : 'think'}
          text={
            hasAnchor
              ? '家系図のどこに入るか予想したよ。ちがっていたらタップして直してね。'
              : 'この書類の中で、家系図に登録済みの人（あなた・両親など）はいる？ 1人選ぶと残りを自動で配置するよ。'
          }
        />

        {result.persons.map((p) => {
          const slot = assignment[p.tempId];
          const tooDeep = slot != null && generationOf(slot) > maxGen;
          return (
            <View key={p.tempId} style={[styles.personCard, slot != null && !tooDeep && { borderColor: colors.green }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={font.h3}>
                      {p.familyName} {p.givenName}
                    </Text>
                    {p.isRemoved && (
                      <View style={styles.removedTag}>
                        <Icon name="cross" size={10} color={colors.redDark} />
                        <Text style={styles.removedTagText}>除籍</Text>
                      </View>
                    )}
                  </View>
                  <Text style={font.small}>
                    {[p.relationInRegister, p.birthDateText && `${p.birthDateText}生`, p.deathDateText && `${p.deathDateText}没`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {(p.fatherName || p.motherName) && (
                    <Text style={font.small}>
                      父：{p.fatherName ?? '—'}　母：{p.motherName ?? '—'}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[styles.slotPill, slot != null && { backgroundColor: tooDeep ? colors.purple : colors.green }]}
                  onPress={() => setEditing(editing === p.tempId ? null : p.tempId)}
                >
                  {tooDeep && <Icon name="crown" size={14} />}
                  <Text style={[styles.slotPillText, slot != null && { color: '#fff' }]}>
                    {slot == null ? '配置しない' : relationLabel(slot)}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={slot != null ? '#fff' : colors.textMuted} />
                </Pressable>
              </View>

              {editing === p.tempId && (
                <View style={styles.slotGrid}>
                  <SlotChip label="配置しない" active={slot == null} onPress={() => pickSlot(p.tempId, null)} />
                  {slotsUpTo(PREMIUM_MAX_GENERATION)
                    .filter((s) => s === slot || !usedSlots.has(s))
                    .filter((s) => generationOf(s) <= Math.max(maxGen, 3))
                    .map((s) => (
                      <SlotChip key={s} label={relationLabel(s)} sub={s > 7 ? `#${s}` : undefined} active={slot === s} onPress={() => pickSlot(p.tempId, s)} />
                    ))}
                </View>
              )}
            </View>
          );
        })}

        {result.previousRegisters.length > 0 && (
          <View style={styles.leadBox}>
            <View style={styles.iconTitle}>
              <Icon name="compass" size={22} />
              <Text style={font.h3}>次に請求できる戸籍</Text>
            </View>
            {result.previousRegisters.map((r) => (
              <Text key={r.honseki + r.hittousha} style={font.body}>
                ・{r.honseki}
                {r.hittousha ? `（筆頭者 ${r.hittousha}）` : ''}
              </Text>
            ))}
            <Text style={font.small}>保存すると「役所ナビ」のリストに追加されます。</Text>
          </View>
        )}

        <Button3D title="家系図に追加する" onPress={commit} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SlotChip({ label, sub, active, onPress }: { label: string; sub?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.slotChip, active && { borderColor: colors.blue, backgroundColor: colors.blueLight }]}>
      <Text style={styles.slotChipText}>{label}</Text>
      {sub && <Text style={{ fontSize: 10, color: colors.textMuted }}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 2, borderBottomColor: colors.border },
  tips: { gap: 10, backgroundColor: colors.blueLight, padding: 16, borderRadius: radius.md },
  thumb: { width: 96, height: 128, borderRadius: radius.sm, backgroundColor: colors.surface },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNo: { position: 'absolute', bottom: 4, left: 6, color: '#fff', fontWeight: '800', textShadowColor: '#000', textShadowRadius: 3 },
  docCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.surface },
  warning: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF1DE', padding: 10, borderRadius: radius.sm },
  personCard: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.border, borderRadius: radius.md, padding: 14, gap: 10 },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotPillText: { fontWeight: '800', fontSize: 13, color: colors.textMuted },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotChip: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  slotChipText: { fontWeight: '700', fontSize: 12, color: colors.text },
  removedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.redLight,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  removedTagText: { fontSize: 11, fontWeight: '800', color: colors.redDark },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadBox: { gap: 6, padding: 16, borderRadius: radius.md, borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.blueLight },
});
