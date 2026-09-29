import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { levelForXp, useGame } from '@/store/game';
import { colors } from '@/theme';

export function TopStatsBar() {
  const router = useRouter();
  const streak = useGame((s) => s.streak);
  const xp = useGame((s) => s.xp);
  const todayXp = useGame((s) => s.todayXp);
  const activeToday = todayXp > 0;

  return (
    <View style={styles.bar}>
      <Pressable style={styles.item} onPress={() => router.push('/quests')} accessibilityLabel="連続記録">
        <Icon name="flame" size={24} style={!activeToday && styles.dim} />
        <Text style={[styles.value, { color: activeToday ? colors.orange : colors.locked }]}>{streak}</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => router.push('/profile')} accessibilityLabel="XP">
        <Icon name="bolt" size={24} />
        <Text style={[styles.value, { color: colors.yellowDark }]}>{xp}</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => router.push('/profile')} accessibilityLabel="レベル">
        <Icon name="medal" size={24} />
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
  dim: { opacity: 0.35 },
  value: { fontSize: 16, fontWeight: '800' },
});
