import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { PathNodeButton } from '@/components/PathNodeButton';
import { ProgressBar } from '@/components/ProgressBar';
import { TopStatsBar } from '@/components/TopStatsBar';
import { UnitHeader } from '@/components/UnitHeader';
import { guideById } from '@/data/guides';
import { lessonById } from '@/data/lessons';
import type { Unit } from '@/data/path';
import { type NodeState, usePathState } from '@/lib/progress';
import { relationLabel } from '@/lib/slots';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { colors, font, radius, unitPalette } from '@/theme';

// Winding trail offsets, repeating.
const OFFSETS = [0, 44, 70, 44, 0, -44, -70, -44];

export default function LearnScreen() {
  const router = useRouter();
  const path = usePathState();
  const todayXp = useGame((s) => s.todayXp);
  const dailyGoal = useGame((s) => s.dailyGoal);
  const [selected, setSelected] = useState<{ state: NodeState; unit: Unit } | null>(null);

  const open = (state: NodeState) => {
    const { node, status } = state;
    setSelected(null);
    if (status === 'premium') return router.push('/paywall');
    switch (node.kind) {
      case 'slot': {
        const persons = useFamily.getState();
        const empty = node.slots.find((s) => !persons.personAt(s)) ?? node.slots[0];
        return router.push({ pathname: '/person/[slot]', params: { slot: String(empty) } });
      }
      case 'lesson':
        return router.push({ pathname: '/lesson/[id]', params: { id: node.lessonId } });
      case 'guide':
        return router.push({ pathname: '/guide/[id]', params: { id: node.guideId } });
      case 'scan':
        return router.push('/scan');
      case 'chest':
        return useGame.getState().openChest(node.id, node.xp);
    }
  };

  let idx = 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopStatsBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.goalCard}>
          <Mascot size={56} mood={todayXp >= dailyGoal ? 'wow' : 'happy'} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={font.h3}>
              {todayXp >= dailyGoal ? '今日の目標クリア！' : `今日の目標まで あと ${dailyGoal - todayXp} XP`}
            </Text>
            <ProgressBar value={todayXp / dailyGoal} color={colors.orange} height={12} />
          </View>
        </View>

        {path.map(({ unit, nodes }) => {
          const palette = unitPalette[unit.color];
          return (
            <View key={unit.id}>
              <UnitHeader title={unit.title} subtitle={unit.subtitle} color={palette} premium={unit.premium} />
              {nodes.map((state) => {
                const offset = OFFSETS[idx++ % OFFSETS.length];
                return (
                  <PathNodeButton
                    key={state.node.id}
                    node={state.node}
                    status={state.status}
                    progress={state.progress}
                    color={palette}
                    offset={offset}
                    onPress={() => setSelected({ state, unit })}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <NodeSheet selected={selected} onClose={() => setSelected(null)} onStart={open} />
    </SafeAreaView>
  );
}

function describe(state: NodeState): string {
  const { node } = state;
  switch (node.kind) {
    case 'slot':
      return node.slots.length === 1
        ? `家系図の「${relationLabel(node.slots[0])}」の空欄を埋めよう。わかる範囲でOK！`
        : `${node.slots.length}人の空欄があります（${Math.round(state.progress * node.slots.length)}人 入力済み）。戸籍をスキャンすると一気に埋まります。`;
    case 'lesson':
      return `レッスン「${lessonById(node.lessonId)?.title}」 カードを読んでクイズに答えよう。`;
    case 'guide':
      return `役所ナビ「${guideById(node.guideId)?.title}」のステップを進めよう。`;
    case 'scan':
      return `役所で取った書類を撮影してAIで読み取ろう（目標 ${node.count}枚）。`;
    case 'chest':
      return `ユニットをクリアしたごほうび！ ${node.xp} XP`;
  }
}

function NodeSheet({
  selected,
  onClose,
  onStart,
}: {
  selected: { state: NodeState; unit: Unit } | null;
  onClose: () => void;
  onStart: (s: NodeState) => void;
}) {
  if (!selected) return null;
  const { state, unit } = selected;
  const palette = unitPalette[unit.color];
  const locked = state.status === 'locked';
  const premium = state.status === 'premium';
  const done = state.status === 'done';
  const chestLocked = state.node.kind === 'chest' && locked;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: locked ? colors.surface : palette.main }]}>
          <Text style={[styles.sheetTitle, locked && { color: colors.text }]}>{state.node.label}</Text>
          <Text style={[styles.sheetBody, locked && { color: colors.textMuted }]}>
            {premium ? 'このユニットはプレミアムで解放されます。' : describe(state)}
          </Text>
          {chestLocked ? (
            <Text style={[styles.sheetBody, { color: colors.textMuted }]}>ユニットのほかのステップを終えるとあけられます。</Text>
          ) : (
            <Button3D
              title={premium ? 'プレミアムを見る' : done ? 'もう一度ひらく' : locked ? '先に進めてみる' : 'はじめる'}
              variant={premium ? 'premium' : 'secondary'}
              onPress={() => onStart(state)}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  goalCard: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { margin: 16, marginBottom: 40, padding: 20, borderRadius: radius.lg, gap: 12 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sheetBody: { color: '#fff', fontSize: 15, lineHeight: 22, fontWeight: '600' },
});
