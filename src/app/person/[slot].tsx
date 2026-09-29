import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { awardProgress } from '@/lib/progress';
import {
  FREE_MAX_GENERATION,
  PREMIUM_MAX_GENERATION,
  generationOf,
  pathDescription,
  relationLabel,
  xpForSlot,
} from '@/lib/slots';
import { useFamily } from '@/store/family';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';
import type { Gender } from '@/types/family';

const FIELDS = [
  { key: 'familyName', label: '姓', placeholder: '山田' },
  { key: 'givenName', label: '名', placeholder: '太郎' },
  { key: 'familyNameKana', label: 'せい（ふりがな）', placeholder: 'やまだ' },
  { key: 'givenNameKana', label: 'めい（ふりがな）', placeholder: 'たろう' },
  { key: 'birthDateText', label: '生年月日', placeholder: '昭和30年4月1日' },
  { key: 'birthDateIso', label: '生年月日（西暦）', placeholder: '1955-04-01' },
  { key: 'deathDateText', label: '死亡日', placeholder: 'わかれば' },
  { key: 'deathDateIso', label: '死亡日（西暦）', placeholder: 'YYYY-MM-DD' },
  { key: 'birthPlace', label: '出生地', placeholder: '静岡県○○市' },
  { key: 'honseki', label: '本籍', placeholder: '戸籍に書かれた本籍地' },
  { key: 'notes', label: 'メモ', placeholder: 'エピソードや職業など' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

export default function PersonEditor() {
  const router = useRouter();
  const slot = Number(useLocalSearchParams<{ slot: string }>().slot);
  const existing = useFamily((s) => Object.values(s.persons).find((p) => p.slot === slot));
  const isPremium = usePremium((s) => s.isPremium);
  const maxGen = isPremium ? PREMIUM_MAX_GENERATION : FREE_MAX_GENERATION;

  const [form, setForm] = useState<Record<FieldKey, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, (existing?.[f.key] as string | undefined) ?? ''])) as Record<FieldKey, string>,
  );
  const [gender, setGender] = useState<Gender>(existing?.gender ?? (slot === 1 ? 'unknown' : slot % 2 === 0 ? 'male' : 'female'));

  if (!Number.isInteger(slot) || slot < 1) return null;

  if (generationOf(slot) > maxGen) {
    return (
      <SafeAreaView style={[styles.container, { padding: 24, justifyContent: 'center', gap: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="crown" size={28} />
          <Text style={font.h2}>プレミアムで解放</Text>
        </View>
        <Text style={font.body}>{relationLabel(slot)}の世代はプレミアムプランで入力できます。</Text>
        <Button3D title="プランを見る" variant="premium" onPress={() => router.replace('/paywall')} />
      </SafeAreaView>
    );
  }

  const save = () => {
    if (!form.familyName.trim() && !form.givenName.trim()) {
      Alert.alert('名前を入力してください', '姓か名のどちらかは必要です。');
      return;
    }
    const input = Object.fromEntries(
      FIELDS.map((f) => [f.key, form[f.key].trim() || undefined]),
    ) as Partial<Record<FieldKey, string>>;
    const res = useFamily.getState().upsertAtSlot(slot, { ...input, gender });
    router.back();
    if (res.created) {
      awardProgress(xpForSlot(slot), `${relationLabel(slot)}の空欄を埋めた！`, 'personsFilled');
    } else if (res.filledFields > 0) {
      awardProgress(res.filledFields * 5, '情報を追加した！', undefined, false);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('削除しますか？', `${relationLabel(slot)}の情報を削除します。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          useFamily.getState().removePerson(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={colors.locked} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{relationLabel(slot)}</Text>
            <Text style={font.small}>{pathDescription(slot)}</Text>
          </View>
          {!existing && <Text style={styles.xp}>+{xpForSlot(slot)} XP</Text>}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {slot === 1 && (
            <View style={styles.genderRow}>
              {(['male', 'female', 'unknown'] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.genderChip, gender === g && { borderColor: colors.blue, backgroundColor: colors.blueLight }]}
                >
                  <Text style={styles.genderText}>{g === 'male' ? '男性' : g === 'female' ? '女性' : '回答しない'}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {FIELDS.map((f) => (
            <View key={f.key} style={{ gap: 6 }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, f.key === 'notes' && { minHeight: 80, textAlignVertical: 'top' }]}
                value={form[f.key]}
                onChangeText={(t) => setForm({ ...form, [f.key]: t })}
                placeholder={f.placeholder}
                placeholderTextColor={colors.locked}
                multiline={f.key === 'notes'}
              />
            </View>
          ))}
          {existing && existing.sourceDocIds.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="scroll" size={16} />
              <Text style={[font.small, { flex: 1 }]}>{existing.sourceDocIds.length}枚の書類から読み取った情報を含みます</Text>
            </View>
          )}
          <Button3D title="保存する" onPress={save} />
          {existing && <Button3D title="この人を削除" variant="ghost" onPress={remove} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  xp: { fontWeight: '800', color: colors.yellowDark, fontSize: 16 },
  label: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  genderText: { fontWeight: '700', color: colors.text },
});
