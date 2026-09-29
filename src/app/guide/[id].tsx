import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { ExampleBox, TermList } from '@/components/Explainers';
import { Icon } from '@/components/Icon';
import { KosekiFigure } from '@/components/KosekiFigure';
import { ProgressBar } from '@/components/ProgressBar';
import { guideById, guideCheckKey, isGuideComplete } from '@/data/guides';
import { awardProgress } from '@/lib/progress';
import { useGame } from '@/store/game';
import { colors, font, radius, unitPalette } from '@/theme';

export default function GuideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const guide = guideById(id);
  const checks = useGame((s) => s.guideChecks);

  if (!guide) return null;
  const palette = unitPalette[guide.color];
  const done = guide.steps.filter((s) => checks[guideCheckKey(guide.id, s.id)]).length;

  const toggle = (stepId: string) => {
    const game = useGame.getState();
    const key = guideCheckKey(guide.id, stepId);
    const wasEverChecked = key in game.guideChecks;
    const nowChecked = game.toggleGuideCheck(key);
    if (!nowChecked || wasEverChecked) return;
    // First time a step is checked: small XP, and a celebration when the whole guide is done.
    const complete = isGuideComplete(guide, useGame.getState().guideChecks);
    awardProgress(complete ? 40 : 10, complete ? `「${guide.title}」をクリア！` : 'ステップ完了', 'guideSteps', complete);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.locked} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={done / guide.steps.length} color={palette.main} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}>
        <Icon name={guide.icon} size={52} />
        <Text style={font.h1}>{guide.title}</Text>
        <Text style={[font.body, { color: colors.textMuted }]}>{guide.subtitle}</Text>
        {guide.intro && <Text style={[font.body, { fontSize: 16, lineHeight: 25 }]}>{guide.intro}</Text>}

        {guide.steps.map((step, i) => {
          const checked = !!checks[guideCheckKey(guide.id, step.id)];
          return (
            <View key={step.id} style={[styles.step, checked && { borderColor: palette.main }]}>
              <Pressable style={styles.stepHead} onPress={() => toggle(step.id)}>
                <View style={[styles.num, { backgroundColor: checked ? palette.main : colors.border }]}>
                  {checked ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Text style={styles.numText}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[font.h3, { flex: 1 }]}>{step.title}</Text>
              </Pressable>
              <Text style={font.body}>{step.body}</Text>
              <KosekiFigure id={step.figure} />
              {step.checklist && (
                <View style={styles.checklist}>
                  {step.checklist.map((c) => (
                    <View key={c} style={styles.checkRow}>
                      <Icon name="check" size={18} color={palette.main} style={{ marginTop: 2 }} />
                      <Text style={[font.body, { flex: 1 }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}
              <ExampleBox text={step.example} label="ポイント" />
              <TermList terms={step.terms} />
              <Button3D
                title={checked ? 'できた！' : 'このステップを完了'}
                variant={checked ? 'secondary' : 'blue'}
                onPress={() => toggle(step.id)}
              />
            </View>
          );
        })}

        {guide.tips && (
          <View style={styles.tips}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="bulb" size={22} />
              <Text style={font.h3}>ヒント</Text>
            </View>
            {guide.tips.map((t) => (
              <Text key={t} style={font.body}>
                ・{t}
              </Text>
            ))}
          </View>
        )}

        <Button3D title="書類をスキャンする" onPress={() => router.push('/scan')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  step: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 10 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.textMuted, fontWeight: '800' },
  checklist: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, gap: 6 },
  checkRow: { flexDirection: 'row', gap: 8 },
  tips: { backgroundColor: colors.blueLight, borderRadius: radius.md, padding: 16, gap: 6 },
});
