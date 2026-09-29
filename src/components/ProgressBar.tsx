import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/components/Motion';
import { colors } from '@/theme';

export function ProgressBar({
  value,
  color = colors.green,
  height = 16,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const reduced = useReducedMotion();
  const anim = useState(() => new Animated.Value(pct))[0];
  // Glide to the new value instead of jumping (width can't use the native driver).
  useEffect(() => {
    if (reduced) return anim.setValue(pct);
    const a = Animated.timing(anim, { toValue: pct, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [anim, pct, reduced]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {pct > 0 && (
        <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: height / 2 }]}>
          <View style={[styles.shine, { borderRadius: height / 2 }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', minWidth: 16 },
  shine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
