import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import {
  FREE_MAX_GENERATION,
  PREMIUM_MAX_GENERATION,
  generationName,
  generationOf,
  relationLabel,
  slotsInGeneration,
  slotsUpTo,
} from '@/lib/slots';
import { displayName, useFamily } from '@/store/family';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';
import type { Person } from '@/types/family';

const BOX_W = 150;
const BOX_H = 64;
const COL_GAP = 36;
const ROW_H = 76;

/** Horizontal pedigree: you on the left, each generation one column to the right. */
export default function TreeScreen() {
  const router = useRouter();
  const persons = useFamily((s) => s.persons);
  const isPremium = usePremium((s) => s.isPremium);
  const maxGen = isPremium ? PREMIUM_MAX_GENERATION : FREE_MAX_GENERATION;

  const bySlot = useMemo(() => {
    const m = new Map<number, Person>();
    Object.values(persons).forEach((p) => m.set(p.slot, p));
    return m;
  }, [persons]);

  const deepest = Math.max(0, ...[...bySlot.keys()].map(generationOf));
  // Show one empty generation beyond the deepest filled one, so there is always a next blank to fill.
  const shownGen = Math.min(maxGen, Math.max(2, deepest + 1));
  const leafRows = 2 ** shownGen;
  const height = leafRows * ROW_H;
  const width = (shownGen + 1) * (BOX_W + COL_GAP);

  const pos = (slot: number) => {
    const g = generationOf(slot);
    const i = slot - 2 ** g;
    const span = 2 ** (shownGen - g);
    return { x: g * (BOX_W + COL_GAP), y: (i * span + span / 2) * ROW_H - BOX_H / 2 };
  };

  const allSlots = slotsUpTo(shownGen);
  const totalSlots = slotsUpTo(maxGen).length;
  const filled = [...bySlot.keys()].filter((s) => generationOf(s) <= maxGen).length;

  const connectors = allSlots
    .filter((s) => generationOf(s) < shownGen)
    .map((s) => {
      const a = pos(s);
      const f = pos(s * 2);
      const m = pos(s * 2 + 1);
      const x0 = a.x + BOX_W;
      const y0 = a.y + BOX_H / 2;
      const xm = x0 + COL_GAP / 2;
      return `M${x0} ${y0} H${xm} M${xm} ${f.y + BOX_H / 2} V${m.y + BOX_H / 2} M${xm} ${f.y + BOX_H / 2} H${f.x} M${xm} ${m.y + BOX_H / 2} H${m.x}`;
    })
    .join(' ');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={font.h2}>家系図</Text>
          <Pressable style={styles.bookButton} onPress={() => router.push('/book')} accessibilityRole="button">
            <Icon name="books" size={18} />
            <Text style={styles.bookButtonText}>本にする</Text>
          </Pressable>
        </View>
        <Text style={font.small}>
          完成度 {filled} / {totalSlots} 人（{generationName(maxGen)}まで）
        </Text>
        <ProgressBar value={filled / totalSlots} />
        <View style={styles.genRow}>
          {Array.from({ length: shownGen + 1 }, (_, g) => {
            const slots = slotsInGeneration(g);
            const n = slots.filter((s) => bySlot.has(s)).length;
            return (
              <View key={g} style={[styles.genChip, n === slots.length && styles.genChipDone]}>
                <Text style={[styles.genChipText, n === slots.length && { color: colors.greenDark }]}>
                  {generationName(g)} {n}/{slots.length}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView horizontal contentContainerStyle={{ padding: 16 }} showsHorizontalScrollIndicator={false}>
          <View style={{ width, height }}>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <Path d={connectors} stroke={colors.border} strokeWidth={3} fill="none" />
            </Svg>
            {allSlots.map((slot) => {
              const p = pos(slot);
              const person = bySlot.get(slot);
              return (
                <PersonBox
                  key={slot}
                  slot={slot}
                  person={person}
                  style={{ left: p.x, top: p.y }}
                  onPress={() => router.push({ pathname: '/person/[slot]', params: { slot: String(slot) } })}
                />
              );
            })}
          </View>
        </ScrollView>

        {!isPremium && deepest >= FREE_MAX_GENERATION - 1 && (
          <View style={styles.upsell}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="crown" size={22} />
              <Text style={font.h3}>もっと上の世代へ</Text>
            </View>
            <Text style={[font.body, { color: colors.textMuted }]}>
              プレミアムなら高祖父母・5代前まで家系図を広げられます。AI読み取りも無制限に。
            </Text>
            <Button3D title="プレミアムを見る" variant="premium" onPress={() => router.push('/paywall')} />
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/scan')} accessibilityLabel="書類をスキャン">
        <Ionicons name="scan" size={26} color="#fff" />
        <Text style={styles.fabText}>戸籍をスキャン</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function PersonBox({
  slot,
  person,
  style,
  onPress,
}: {
  slot: number;
  person?: Person;
  style: { left: number; top: number };
  onPress: () => void;
}) {
  const accent = slot === 1 ? colors.green : slot % 2 === 0 ? colors.male : colors.female;
  if (!person) {
    return (
      <Pressable onPress={onPress} style={[styles.box, styles.emptyBox, style]}>
        <Ionicons name="add-circle" size={20} color={colors.locked} />
        <View style={{ flex: 1 }}>
          <Text style={styles.emptyLabel}>{relationLabel(slot)}</Text>
          <Text style={styles.emptyHint}>タップして入力</Text>
        </View>
      </Pressable>
    );
  }
  const years = [person.birthDateIso?.slice(0, 4), person.deathDateIso?.slice(0, 4)].filter(Boolean).join('–');
  return (
    <Pressable onPress={onPress} style={[styles.box, { borderColor: accent }, style]}>
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.relation}>{relationLabel(slot)}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {displayName(person)}
        </Text>
        {!!years && <Text style={styles.years}>{years}</Text>}
      </View>
      {person.sourceDocIds.length > 0 && <Icon name="scroll" size={14} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, gap: 8, borderBottomWidth: 2, borderBottomColor: colors.border },
  genRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genChip: { borderRadius: radius.pill, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4 },
  genChipDone: { backgroundColor: colors.greenLight },
  genChipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  box: {
    position: 'absolute',
    width: BOX_W,
    height: BOX_H,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderBottomWidth: 4,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
    overflow: 'hidden',
  },
  emptyBox: { borderStyle: 'dashed', borderColor: colors.locked, borderBottomWidth: 2, paddingLeft: 8, backgroundColor: colors.surface },
  stripe: { width: 6, alignSelf: 'stretch' },
  relation: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  years: { fontSize: 11, color: colors.textMuted },
  emptyLabel: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  emptyHint: { fontSize: 11, color: colors.locked },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: colors.orange,
    backgroundColor: '#FFF6E5',
  },
  bookButtonText: { fontSize: 13, fontWeight: '800', color: colors.orangeDark },
  upsell: { margin: 16, padding: 16, gap: 10, borderRadius: radius.md, borderWidth: 2, borderColor: colors.purple },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: colors.green,
    borderBottomWidth: 4,
    borderBottomColor: colors.greenDark,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
