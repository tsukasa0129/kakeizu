import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';

export function UnitHeader({
  title,
  subtitle,
  color,
  premium,
}: {
  title: string;
  subtitle: string;
  color: { main: string; dark: string };
  premium?: boolean;
}) {
  return (
    <View style={[styles.edge, { backgroundColor: color.dark }]}>
      <View style={[styles.card, { backgroundColor: color.main }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {premium && (
          <View style={styles.pro}>
            <Ionicons name="diamond" size={14} color={colors.purple} />
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { borderRadius: radius.md, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  card: {
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ translateY: -4 }],
  },
  title: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  subtitle: { color: '#fff', fontWeight: '800', fontSize: 19, marginTop: 4 },
  pro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proText: { color: colors.purple, fontWeight: '800', fontSize: 12 },
});
