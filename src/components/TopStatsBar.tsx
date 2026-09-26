import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { levelForXp, useGame } from '@/store/game';
import { usePremium } from '@/store/premium';
import { colors } from '@/theme';

export function TopStatsBar() {
  const router = useRouter();
  const streak = useGame((s) => s.streak);
  const xp = useGame((s) => s.xp);
  const todayXp = useGame((s) => s.todayXp);
  const isPremium = usePremium((s) => s.isPremium);
  const activeToday = todayXp > 0;

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.item}
        onPress={() => router.push(isPremium ? '/profile' : '/paywall')}
        accessibilityLabel="プレミアム"
      >
        <Text style={styles.emoji}>{isPremium ? '👑' : '🌱'}</Text>
        <Text style={[styles.value, { color: isPremium ? colors.purple : colors.green }]}>
          {isPremium ? 'PRO' : 'FREE'}
        </Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => router.push('/quests')} accessibilityLabel="連続記録">
        <Text style={[styles.emoji, !activeToday && styles.dim]}>🔥</Text>
        <Text style={[styles.value, { color: activeToday ? colors.orange : colors.locked }]}>{streak}</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => router.push('/profile')} accessibilityLabel="XP">
        <Text style={styles.emoji}>⚡</Text>
        <Text style={[styles.value, { color: colors.yellowDark }]}>{xp}</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => router.push('/profile')} accessibilityLabel="レベル">
        <Text style={styles.emoji}>🏅</Text>
        <Text style={[styles.value, { color: colors.blue }]}>Lv{levelForXp(xp)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  emoji: { fontSize: 22 },
  dim: { opacity: 0.35 },
  value: { fontSize: 16, fontWeight: '800' },
});
