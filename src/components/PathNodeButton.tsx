import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { PathNode } from '@/data/path';
import type { NodeStatus } from '@/lib/progress';
import { colors } from '@/theme';

const SIZE = 72;

const ICONS: Record<PathNode['kind'], keyof typeof Ionicons.glyphMap> = {
  slot: 'person',
  lesson: 'book',
  guide: 'map',
  scan: 'scan',
  chest: 'gift',
};

interface Props {
  node: PathNode;
  status: NodeStatus;
  progress: number;
  color: { main: string; dark: string };
  offset: number;
  onPress: () => void;
}

/** A round "stepping stone" on the learning path, offset left/right to form a winding trail. */
export function PathNodeButton({ node, status, progress, color, offset, onPress }: Props) {
  const done = status === 'done';
  const active = status === 'active';
  const bg = done ? colors.yellow : active ? color.main : colors.border;
  const edge = done ? colors.yellowDark : active ? color.dark : '#CECECE';
  const iconColor = done || active ? '#fff' : colors.locked;
  const icon: keyof typeof Ionicons.glyphMap =
    done && node.kind !== 'chest' ? 'checkmark' : ICONS[node.kind];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={node.label}
      style={[styles.wrap, { transform: [{ translateX: offset }] }]}
    >
      {({ pressed }) => (
        <>
          {active && (
            <View style={[styles.tooltip, { borderColor: colors.border }]}>
              <Text style={[styles.tooltipText, { color: color.main }]}>はじめる</Text>
              <View style={styles.tooltipTail} />
            </View>
          )}
          <View style={styles.ringBox}>
            {active && progress > 0 && progress < 1 && (
              <Svg width={SIZE + 22} height={SIZE + 22} style={StyleSheet.absoluteFill}>
                <Circle cx={(SIZE + 22) / 2} cy={(SIZE + 22) / 2} r={SIZE / 2 + 8} stroke={colors.border} strokeWidth={7} fill="none" />
                <Circle
                  cx={(SIZE + 22) / 2}
                  cy={(SIZE + 22) / 2}
                  r={SIZE / 2 + 8}
                  stroke={color.main}
                  strokeWidth={7}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * (SIZE / 2 + 8) * progress} 1000`}
                  rotation={-90}
                  origin={`${(SIZE + 22) / 2}, ${(SIZE + 22) / 2}`}
                />
              </Svg>
            )}
            <View style={[styles.edge, { backgroundColor: edge }]}>
              <View style={[styles.face, { backgroundColor: bg, transform: [{ translateY: pressed ? 0 : -6 }] }]}>
                <Ionicons name={icon} size={32} color={iconColor} />
              </View>
            </View>
          </View>
          <Text style={[styles.label, { color: status === 'locked' ? colors.locked : colors.text }]}>
            {node.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 10, alignSelf: 'center' },
  ringBox: { width: SIZE + 22, height: SIZE + 22, alignItems: 'center', justifyContent: 'center' },
  edge: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, marginTop: 6 },
  face: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 2, fontSize: 13, fontWeight: '700' },
  tooltip: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 2,
  },
  tooltipText: { fontWeight: '800', fontSize: 14 },
  tooltipTail: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
});
