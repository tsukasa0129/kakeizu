import * as WebBrowser from 'expo-web-browser';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon, type IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { notify } from '@/lib/notify';
import { getManagementURL } from '@/lib/purchases';
import { isDemoMode } from '@/lib/extract';
import { displayName, useFamily } from '@/store/family';
import { levelForXp, useGame, xpForLevel } from '@/store/game';
import { colors, font, radius } from '@/theme';

const DOC_LABELS: Record<string, string> = {
  koseki_zenbu: '戸籍謄本',
  koseki_kojin: '戸籍抄本',
  joseki: '除籍謄本',
  kaisei_genkoseki: '改製原戸籍',
  other: 'その他',
};

export default function ProfileScreen() {
  const game = useGame();
  const persons = useFamily((s) => s.persons);
  const documents = useFamily((s) => s.documents);
  const me = Object.values(persons).find((p) => p.slot === 1);

  const level = levelForXp(game.xp);
  const levelStart = xpForLevel(level);
  const levelEnd = xpForLevel(level + 1);

  const onManage = async () => {
    const url = await getManagementURL().catch(() => null);
    if (url) WebBrowser.openBrowserAsync(url);
    else notify('サブスクリプション', '管理できるサブスクリプションが見つかりませんでした。');
  };

  const onReset = () =>
    Alert.alert('データを削除', '家系図・XP・進捗をすべて削除します。元に戻せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: () => {
          useFamily.getState().reset();
          useGame.getState().reset();
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={styles.top}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{me?.givenName?.[0] ?? me?.familyName?.[0] ?? '？'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{me ? displayName(me) : 'ゲスト'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="crown" size={16} />
              <Text style={font.small}>プレミアム会員</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={font.h3}>レベル {level}</Text>
          <ProgressBar value={(game.xp - levelStart) / (levelEnd - levelStart)} color={colors.blue} />
          <Text style={font.small}>次のレベルまで {levelEnd - game.xp} XP</Text>
        </View>

        <View style={styles.statsGrid}>
          <Stat icon="flame" value={game.streak} label="連続日数" />
          <Stat icon="bolt" value={game.xp} label="合計XP" />
          <Stat icon="tree" value={Object.keys(persons).length} label="登録人数" />
          <Stat icon="scroll" value={documents.length} label="読み取った書類" />
        </View>

        {documents.length > 0 && (
          <View style={styles.card}>
            <Text style={font.h3}>読み取った書類</Text>
            {documents.map((d) => (
              <View key={d.id} style={styles.docRow}>
                <Icon name="scroll" size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{DOC_LABELS[d.type] ?? d.title}</Text>
                  <Text style={font.small}>
                    {[d.hittousha && `筆頭者 ${d.hittousha}`, `${d.personCount}人`, new Date(d.scannedAt).toLocaleDateString('ja-JP')]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, { gap: 10 }]}>
          <Text style={font.h3}>プライバシー</Text>
          <Text style={font.small}>
            家系図のデータはこの端末内に保存されます。書類の画像はAI読み取りのためだけにサーバーへ送信され、保存されません。
            {isDemoMode() ? '\n（現在はデモモード：画像は送信されず、サンプル結果が表示されます）' : ''}
          </Text>
          <Button3D title="サブスクリプションを管理" variant="secondary" onPress={onManage} />
          <Button3D title="すべてのデータを削除" variant="danger" onPress={onReset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={28} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={font.small}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.greenLight,
    borderWidth: 3,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.greenDark },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
});
