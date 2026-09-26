import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';

import { colors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const tab = (title: string, icon: IconName, iconFocused: IconName) => ({
  title,
  tabBarIcon: ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons name={focused ? iconFocused : icon} size={size} color={focused ? colors.blue : colors.locked} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.locked,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { borderTopWidth: 2, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={tab('まなぶ', 'home-outline', 'home')} />
      <Tabs.Screen name="tree" options={tab('家系図', 'git-network-outline', 'git-network')} />
      <Tabs.Screen name="guide" options={tab('役所ナビ', 'map-outline', 'map')} />
      <Tabs.Screen name="quests" options={tab('クエスト', 'trophy-outline', 'trophy')} />
      <Tabs.Screen name="profile" options={tab('プロフィール', 'person-circle-outline', 'person-circle')} />
    </Tabs>
  );
}
