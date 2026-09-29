import * as WebBrowser from 'expo-web-browser';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Seller name shown on the App Store product page; the sheet must name the developer.
const DEVELOPER_NAME = '家系図クエスト';
const LEARN_MORE_URL = 'https://apps.apple.com/jp/story/id1760810284';

interface Props {
  visible: boolean;
  onContinue: () => void;
  onCancel: () => void;
  /** Fires after the sheet has fully closed (iOS); present follow-up UI from here. */
  onDismiss?: () => void;
}

/**
 * Apple's required disclosure sheet for alternative payments within the app (Japan storefront),
 * drawn per "Alternative Payment Options — Disclosure sheet design specifications" with Apple's
 * official Japanese strings and icons. iOS 27.2 replaces this with a system sheet.
 */
export function ExternalPurchaseNotice({ visible, onContinue, onCancel, onDismiss }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
      onDismiss={onDismiss}
    >
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.body}>
          <Text style={styles.title}>続行すると、Appleではなくデベロッパと取引することになります。</Text>

          <View style={styles.row}>
            <Image source={require('../../assets/external-purchase/person-card.png')} style={styles.icon} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>外部アカウントと購入</Text>
              <Text style={styles.rowBody}>
                このアプリで行われたアカウント作成や購入、およびプライバシーとセキュリティは、デベロッパである「
                {DEVELOPER_NAME}」によって管理されます。
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Image source={require('../../assets/external-purchase/info-circle.png')} style={styles.icon} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>利用できなくなるApp Storeの機能</Text>
              <Text style={styles.rowBody}>
                この購入では、あなたのApp Storeアカウント、登録されているお支払い方法、およびその他のAppleに関連した機能は使用できません。返金については、デベロッパにお問い合わせください。
              </Text>
            </View>
          </View>

          <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(LEARN_MORE_URL)}>
            詳細を見る
          </Text>
        </View>

        <View style={styles.buttons}>
          <Pressable style={styles.button} onPress={onContinue} accessibilityRole="button">
            <Text style={styles.buttonText}>続ける</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.buttonText}>キャンセル</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  body: { flex: 1, paddingTop: 56, gap: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#000', lineHeight: 28 },
  row: { flexDirection: 'row', gap: 12 },
  icon: { width: 32, height: 32 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  rowBody: { fontSize: 15, color: '#8A8A8E', lineHeight: 20 },
  link: { fontSize: 15, color: '#007AFF' },
  buttons: { gap: 10, paddingBottom: 16 },
  button: { height: 50, borderRadius: 25, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, color: '#007AFF' },
});
