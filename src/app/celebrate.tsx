import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { badgeById } from '@/data/badges';
import { levelForXp, useGame } from '@/store/game';
import { colors, font, radius } from '@/theme';

export default function Celebrate() {
  const router = useRouter();
  const reward = useGame((s) => s.pendingReward);
  const xp = useGame((s) => s.xp);
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scale]);

  const close = () => {
    useGame.getState().consumeReward();
    if (router.canGoBack()) router.back();
  };

  if (!reward) return <View style={styles.backdrop} />;

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.sheet, { transform: [{ scale }] }]}>
        <Mascot size={130} mood="wow" animate />
        <Text style={[font.h2, { textAlign: 'center' }]}>{reward.title}</Text>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderColor: colors.yellow }]}>
            <Text style={[styles.statHead, { backgroundColor: colors.yellow }]}>獲得XP</Text>
            <View style={styles.statBody}>
              <Icon name="bolt" size={24} />
              <Text style={[styles.statValue, { color: colors.yellowDark }]}>{reward.xp}</Text>
            </View>
          </View>
          <View style={[styles.stat, { borderColor: colors.orange }]}>
            <Text style={[styles.statHead, { backgroundColor: colors.orange }]}>連続記録</Text>
            <View style={styles.statBody}>
              <Icon name="flame" size={24} />
              <Text style={[styles.statValue, { color: colors.orange }]}>{reward.streak}</Text>
            </View>
          </View>
        </View>

        {reward.leveledUp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="party" size={24} />
            <Text style={[font.h3, { color: colors.blue }]}>レベル {levelForXp(xp)} にアップ！</Text>
          </View>
        )}

        {reward.badges.map((id) => {
          const b = badgeById(id);
          return b ? (
            <View key={id} style={styles.badge}>
              <Icon name={b.icon} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeKicker}>新しいバッジ</Text>
                <Text style={font.h3}>{b.title}</Text>
              </View>
            </View>
          ) : null;
        })}

        <Button3D title="つづける" onPress={close} style={{ alignSelf: 'stretch' }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 22, alignItems: 'center', gap: 14 },
  statsRow: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  stat: { flex: 1, borderWidth: 2, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center' },
  statHead: { alignSelf: 'stretch', textAlign: 'center', color: '#fff', fontWeight: '800', paddingVertical: 4, fontSize: 12 },
  statBody: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  statValue: { fontSize: 22, fontWeight: '900' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    backgroundColor: '#FFF7D6',
    borderRadius: radius.md,
    padding: 12,
  },
  badgeKicker: { fontSize: 11, fontWeight: '800', color: colors.yellowDark },
});
