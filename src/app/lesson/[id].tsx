import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { lessonById } from '@/data/lessons';
import { awardProgress } from '@/lib/progress';
import { useGame } from '@/store/game';
import { colors, font, radius } from '@/theme';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = lessonById(id);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  if (!lesson) return null;
  const total = lesson.cards.length + lesson.quiz.length;
  const inQuiz = step >= lesson.cards.length;
  const card = lesson.cards[step];
  const q = inQuiz ? lesson.quiz[step - lesson.cards.length] : null;
  const correct = q && picked === q.answer;

  const finish = () => {
    const first = useGame.getState().completeLesson(lesson.id);
    router.back();
    const xp = first ? lesson.xp + (mistakes === 0 ? 5 : 0) : 5;
    awardProgress(xp, mistakes === 0 ? 'パーフェクト！レッスン完了' : 'レッスン完了！', 'lessons');
  };

  const next = () => {
    setPicked(null);
    setChecked(false);
    if (step + 1 >= total) finish();
    else setStep(step + 1);
  };

  const check = () => {
    setChecked(true);
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setMistakes(mistakes + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.locked} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={step / total} />
        </View>
      </View>

      {!inQuiz && card && (
        <View style={styles.body}>
          <Text style={styles.kicker}>
            {lesson.emoji} {lesson.title}
          </Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 56 }}>{card.emoji}</Text>
            <Text style={font.h2}>{card.title}</Text>
            <Text style={[font.body, { fontSize: 17, lineHeight: 27 }]}>{card.body}</Text>
          </View>
        </View>
      )}

      {q && (
        <View style={styles.body}>
          <Text style={styles.kicker}>クイズ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Mascot size={70} mood="think" />
            <Text style={[font.h2, { flex: 1 }]}>{q.question}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {q.choices.map((c, i) => {
              const selected = picked === i;
              const showRight = checked && i === q.answer;
              const showWrong = checked && selected && i !== q.answer;
              return (
                <Pressable
                  key={c}
                  disabled={checked}
                  onPress={() => setPicked(i)}
                  style={[
                    styles.choice,
                    selected && { borderColor: colors.blue, backgroundColor: colors.blueLight },
                    showRight && { borderColor: colors.green, backgroundColor: colors.greenLight },
                    showWrong && { borderColor: colors.red, backgroundColor: colors.redLight },
                  ]}
                >
                  <Text style={styles.choiceText}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View
        style={[
          styles.footer,
          checked && { backgroundColor: correct ? colors.greenLight : colors.redLight, borderTopColor: 'transparent' },
        ]}
      >
        {checked && q && (
          <View style={{ gap: 4, marginBottom: 8 }}>
            <Text style={[font.h3, { color: correct ? colors.greenDark : colors.redDark }]}>
              {correct ? 'すばらしい！' : '正解は…'}
            </Text>
            <Text style={[font.body, { color: correct ? colors.greenDark : colors.redDark }]}>{q.explanation}</Text>
          </View>
        )}
        {!inQuiz ? (
          <Button3D title="つづける" onPress={next} />
        ) : !checked ? (
          <Button3D title="チェック" disabled={picked === null} onPress={check} />
        ) : (
          <Button3D title="つづける" variant={correct ? 'primary' : 'danger'} onPress={next} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  body: { flex: 1, padding: 20, gap: 18 },
  kicker: { fontWeight: '800', color: colors.purple, fontSize: 14 },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg, padding: 22, gap: 12 },
  choice: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  choiceText: { fontSize: 16, fontWeight: '700', color: colors.text },
  footer: { padding: 20, paddingBottom: 28, borderTopWidth: 2, borderTopColor: colors.border },
});
