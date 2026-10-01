import { Tabs } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { colors } from '@/theme';

// Tab bar after Duolingo's (studied in Appllama): the app's own colour icons, with the active tab
// sitting in a soft rounded square instead of only changing tint.
const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon name={icon} size={26} style={!focused && styles.iconIdle} />
    </View>
  ),
});

export default function TabsLayout() {
  // Room for the taller active-tab box and a one-line label, plus the home indicator.
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.bar, { height: 68 + bottom, paddingBottom: bottom + 4 }],
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen name="index" options={tab('まなぶ', 'graduation')} />
      <Tabs.Screen name="tree" options={tab('家系図', 'tree')} />
      <Tabs.Screen name="guide" options={tab('役所ナビ', 'office')} />
      <Tabs.Screen name="quests" options={tab('クエスト', 'medal')} />
      <Tabs.Screen name="profile" options={tab('プロフィール', 'person')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 4 },
  item: { paddingTop: 2 },
  label: { fontWeight: '700', fontSize: 11, lineHeight: 15, marginTop: 2 },
  iconWrap: {
    width: 46,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.blueLight, borderColor: '#84D8FF' },
  iconIdle: { opacity: 0.55 },
});
