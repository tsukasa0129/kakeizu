import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { Mascot, MascotSays } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { ROUTE_QUESTIONS, guideById, recommendRoute } from '@/data/guides';
import { colors, font, radius } from '@/theme';

export default function RouteQuiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  const finished = i >= ROUTE_QUESTIONS.length;
  const q = ROUTE_QUESTIONS[i];

  if (finished) {
    const rec = recommendRoute(answers);
    const guide = guideById(rec.guideId)!;
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }]}>
        <Mascot size={140} mood="wow" />
        <Text style={font.small}>あなたへのおすすめは…</Text>
        <Icon name={guide.icon} size={48} />
        <Text style={[font.h1, { textAlign: 'center' }]}>{guide.title}</Text>
        <Text style={[font.body, { textAlign: 'center' }]}>{rec.reason}</Text>
        <View style={{ width: '100%', gap: 8 }}>
          <Button3D
            title="このガイドを見る"
            onPress={() => router.replace({ pathname: '/guide/[id]', params: { id: guide.id } })}
          />
          <Button3D title="閉じる" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.locked} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={i / ROUTE_QUESTIONS.length} />
        </View>
      </View>
      <View style={{ padding: 20, gap: 20 }}>
        <MascotSays text={q.question} />
        {q.options.map((o) => (
          <Pressable
            key={o.value}
            style={styles.option}
            onPress={() => {
              setAnswers({ ...answers, [q.id]: o.value });
              setI(i + 1);
            }}
          >
            <Text style={styles.optionText}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  option: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.border, borderRadius: radius.md, padding: 18 },
  optionText: { fontSize: 17, fontWeight: '700', color: colors.text },
});
