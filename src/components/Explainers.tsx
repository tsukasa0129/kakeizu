import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors, font, radius } from '@/theme';

export interface Term {
  word: string;
  meaning: string;
}

/** むずかしい単語の解説ボックス（「ことばの解説」）。 */
export function TermList({ terms }: { terms?: Term[] }) {
  if (!terms || terms.length === 0) return null;
  return (
    <View style={styles.terms}>
      <View style={styles.head}>
        <Icon name="books" size={20} />
        <Text style={[font.h3, { color: colors.purpleDark }]}>ことばの解説</Text>
      </View>
      {terms.map((t) => (
        <View key={t.word} style={{ gap: 2 }}>
          <Text style={styles.word}>{t.word}</Text>
          <Text style={[font.body, { fontSize: 15, lineHeight: 23 }]}>{t.meaning}</Text>
        </View>
      ))}
    </View>
  );
}

/** 具体例・たとえ話のボックス（「たとえば」）。 */
export function ExampleBox({ text, label = 'たとえば' }: { text?: string; label?: string }) {
  if (!text) return null;
  return (
    <View style={styles.example}>
      <View style={styles.head}>
        <Icon name="bulb" size={20} />
        <Text style={[font.h3, { color: colors.blueDark }]}>{label}</Text>
      </View>
      <Text style={[font.body, { fontSize: 16, lineHeight: 25 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  terms: { borderWidth: 2, borderColor: colors.purple, borderRadius: radius.lg, padding: 18, gap: 12 },
  word: { fontSize: 16, fontWeight: '800', color: colors.purpleDark },
  example: { backgroundColor: colors.blueLight, borderRadius: radius.lg, padding: 18, gap: 8 },
});
