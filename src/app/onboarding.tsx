import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot, MascotSays } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { awardProgress } from '@/lib/progress';
import { xpForSlot } from '@/lib/slots';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { colors, font, radius } from '@/theme';

const GOALS = [
  { xp: 10, label: '気軽に', sub: '1日5分' },
  { xp: 30, label: 'ふつう', sub: '1日10分' },
  { xp: 50, label: 'しっかり', sub: '1日15分' },
  { xp: 80, label: '本気', sub: '1日20分' },
];

const MOTIVES = ['ルーツを知りたい', '子どもに残したい', '相続の準備', 'お墓・法事のため', 'なんとなく興味'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [motive, setMotive] = useState<string | null>(null);
  const [goal, setGoal] = useState(30);
  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');

  const total = 4;

  const finish = () => {
    useFamily.getState().upsertAtSlot(1, {
      familyName: familyName.trim(),
      givenName: givenName.trim(),
      notes: motive ? `きっかけ: ${motive}` : undefined,
    });
    useGame.getState().finishOnboarding(goal);
    awardProgress(xpForSlot(1), 'あなたが家系図の最初の1人に！', 'personsFilled');
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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep(step - 1)} hitSlop={12}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar value={step / total} />
          </View>
        </View>

        <View style={styles.body}>
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

          {step === 3 && (
            <>
              <MascotSays text="まずは家系図の真ん中、あなたのお名前を教えてね。" />
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
              <Text style={[font.small, { marginTop: 12 }]}>
                入力した情報はこの端末の中だけに保存されます。
              </Text>
            </>
          )}

          {step === 4 && (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <Mascot size={150} mood="wow" />
              <Text style={[font.h2, styles.centerText]}>準備完了！</Text>
              <Text style={[font.body, styles.centerText]}>
                レッスンで戸籍の取り方を学び、{'\n'}役所で書類を取ったらスキャン。{'\n'}空欄が埋まるたびにXPがもらえます。
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          {step < 4 ? (
            <Button3D
              title="つづける"
              disabled={(step === 1 && !motive) || (step === 3 && !familyName.trim() && !givenName.trim())}
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <Button3D title="家系図づくりをはじめる" onPress={finish} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Option({
  label,
  trailing,
  selected,
  onPress,
}: {
  label: string;
  trailing?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        selected && { borderColor: colors.blue, backgroundColor: colors.blueLight },
      ]}
    >
      <Text style={[styles.optionText, selected && { color: colors.blueDark }]}>{label}</Text>
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
  body: { flex: 1, padding: 20, gap: 20 },
  options: { gap: 10 },
  option: {
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionTrailing: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
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
  bottom: { padding: 20, width: '100%', position: 'relative' },
});
