import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/theme';

export function UnitHeader({
  title,
  subtitle,
  color,
}: {
  title: string;
  subtitle: string;
  color: { main: string; dark: string };
}) {
  return (
    <View style={[styles.edge, { backgroundColor: color.dark }]}>
      <View style={[styles.card, { backgroundColor: color.main }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
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
});
