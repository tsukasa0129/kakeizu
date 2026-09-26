import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MascotSays } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { GUIDES, guideCheckKey } from '@/data/guides';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { colors, font, radius, unitPalette } from '@/theme';
import type { RegisterLead } from '@/types/family';

const LEAD_STATUS: Record<RegisterLead['status'], { label: string; color: string; next: RegisterLead['status'] }> = {
  todo: { label: '未請求', color: colors.orange, next: 'requested' },
  requested: { label: '請求中', color: colors.blue, next: 'received' },
  received: { label: '取得済み', color: colors.green, next: 'todo' },
};

export default function GuideTab() {
  const router = useRouter();
  const checks = useGame((s) => s.guideChecks);
  const leads = useFamily((s) => s.leads);
  const setLeadStatus = useFamily((s) => s.setLeadStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Text style={font.h2}>役所ナビ</Text>
        <MascotSays text="戸籍の取り方をいっしょに確認しよう。迷ったら「おすすめルート診断」から！" size={72} />

        <Pressable style={[styles.card, styles.quizCard]} onPress={() => router.push('/route-quiz')}>
          <Text style={{ fontSize: 34 }}>🧭</Text>
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>おすすめルート診断</Text>
            <Text style={{ color: '#fff', fontWeight: '600' }}>3つの質問で、あなたに合った取り方を提案</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>

        {leads.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={font.h3}>次に請求する戸籍</Text>
            <Text style={font.small}>スキャンした書類の「従前戸籍」などから見つかった戸籍です。タップで状態を切り替え。</Text>
            {leads.map((lead) => {
              const st = LEAD_STATUS[lead.status];
              return (
                <Pressable key={lead.id} style={styles.card} onPress={() => setLeadStatus(lead.id, st.next)}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.leadTitle}>{lead.honseki}</Text>
                    {lead.hittousha && <Text style={font.small}>筆頭者：{lead.hittousha}</Text>}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: st.color }]}>
                    <Text style={styles.statusText}>{st.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={font.h3}>取得ガイド</Text>
        {GUIDES.map((g) => {
          const done = g.steps.filter((s) => checks[guideCheckKey(g.id, s.id)]).length;
          const palette = unitPalette[g.color];
          return (
            <Pressable
              key={g.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/guide/[id]', params: { id: g.id } })}
            >
              <View style={[styles.iconBubble, { backgroundColor: palette.main }]}>
                <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={font.h3}>{g.title}</Text>
                <Text style={font.small}>{g.subtitle}</Text>
                <View style={styles.chips}>
                  {g.chips.map((c) => (
                    <Text key={c} style={styles.chip}>
                      {c}
                    </Text>
                  ))}
                </View>
                <ProgressBar value={done / g.steps.length} color={palette.main} height={8} />
              </View>
            </Pressable>
          );
        })}

        <Text style={[font.small, { marginTop: 8 }]}>
          ※ 手数料・受付方法は自治体によって異なる場合があります。最新情報は本籍地・お住まいの市区町村の公式サイトや窓口で確認してください。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#fff',
  },
  quizCard: { backgroundColor: colors.blue, borderColor: colors.blueDark },
  iconBubble: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  leadTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
