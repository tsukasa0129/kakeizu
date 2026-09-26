import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { ProgressBar } from '@/components/ProgressBar';
import { BADGES } from '@/data/badges';
import { DAILY_QUESTS } from '@/lib/progress';
import { dayKey } from '@/lib/storage';
import { useGame } from '@/store/game';
import { colors, font, radius } from '@/theme';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function QuestsScreen() {
  const game = useGame();

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: WEEKDAYS[d.getDay()] };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={styles.streakHero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakNum}>{game.streak}</Text>
            <Text style={styles.streakLabel}>日連続で学習中！</Text>
            <Text style={styles.streakSub}>最長記録 {game.longestStreak}日</Text>
          </View>
          <Text style={{ fontSize: 72 }}>🔥</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.weekRow}>
            {week.map((d) => {
              const active = game.activeDays.includes(d.key);
              return (
                <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={font.small}>{d.label}</Text>
                  <View style={[styles.dayDot, active && { backgroundColor: colors.orange, borderColor: colors.orangeDark }]}>
                    {active && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.questHero}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[font.h2, { color: '#fff' }]}>デイリークエスト</Text>
            <Text style={{ color: '#fff', fontWeight: '600' }}>毎日0時にリセット。達成してXPをゲット！</Text>
          </View>
          <Mascot size={70} mood="wow" />
        </View>

        <View style={[styles.card, { gap: 18 }]}>
          {DAILY_QUESTS.map((q) => {
            const target = q.target(game);
            const cur = Math.min(q.current(game), target);
            const claimed = game.claimedQuests.includes(q.id);
            const ready = cur >= target && !claimed;
            return (
              <View key={q.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 26 }}>{q.emoji}</Text>
                  <Text style={[font.h3, { flex: 1 }]}>{q.title}</Text>
                  <Text style={styles.reward}>+{q.xp}XP</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar value={cur / target} color={colors.yellow} height={14} />
                  </View>
                  <Text style={font.small}>
                    {cur}/{target}
                  </Text>
                </View>
                {ready && <Button3D title="報酬を受け取る 🎁" onPress={() => game.claimQuest(q.id, q.xp)} />}
                {claimed && <Text style={[font.small, { color: colors.greenDark, fontWeight: '700' }]}>受け取り済み ✓</Text>}
              </View>
            );
          })}
        </View>

        <Text style={font.h2}>バッジ</Text>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => {
            const earned = game.badges.includes(b.id);
            return (
              <View key={b.id} style={[styles.badge, !earned && { opacity: 0.4 }]}>
                <View style={[styles.badgeIcon, earned && { borderColor: colors.yellow, backgroundColor: '#FFF7D6' }]}>
                  <Text style={{ fontSize: 30 }}>{earned ? b.emoji : '🔒'}</Text>
                </View>
                <Text style={styles.badgeTitle} numberOfLines={1}>
                  {b.title}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {b.description}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  streakHero: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakNum: { fontSize: 56, fontWeight: '900', color: '#fff' },
  streakLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },
  streakSub: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 4 },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questHero: {
    backgroundColor: '#7B4DFF',
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reward: { fontWeight: '800', color: colors.yellowDark },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badge: { width: '30%', alignItems: 'center', gap: 4 },
  badgeIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  badgeTitle: { fontSize: 12, fontWeight: '800', color: colors.text },
  badgeDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
});
