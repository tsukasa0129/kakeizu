import { StyleSheet, View } from 'react-native';

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
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {pct > 0 && (
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color, borderRadius: height / 2 }]}>
          <View style={[styles.shine, { borderRadius: height / 2 }]} />
        </View>
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
