import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initPurchases, PAYWALL_TEST_BYPASS } from '@/lib/purchases';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { usePremium } from '@/store/premium';
import { colors } from '@/theme';

const stores = [useFamily, useGame, usePremium];

function useHydrated() {
  const [hydrated, setHydrated] = useState(() => stores.every((s) => s.persist.hasHydrated()));
  useEffect(() => {
    const check = () => setHydrated(stores.every((s) => s.persist.hasHydrated()));
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, []);
  return hydrated;
}

/** Opens the celebration sheet whenever a reward is queued. */
function RewardWatcher() {
  const router = useRouter();
  const rewardId = useGame((s) => s.pendingReward?.id);
  useEffect(() => {
    if (rewardId) router.push('/celebrate');
  }, [rewardId, router]);
  return null;
}

export default function RootLayout() {
  const hydrated = useHydrated();
  const onboarded = useGame((s) => s.onboarded);
  const entitled = usePremium((s) => s.isPremium);
  const testUnlocked = usePremium((s) => s.testUnlocked);
  const isPremium = entitled || (PAYWALL_TEST_BYPASS && testUnlocked);
  // The app is subscription-only: onboarding → paywall → app. A lapsed subscription returns to the paywall.
  const inApp = onboarded && isPremium;

  useEffect(() => {
    initPurchases();
  }, []);

  useEffect(() => {
    if (hydrated) useGame.getState().rollDay();
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded && !isPremium}>
          <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={inApp}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="person/[slot]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lesson/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="guide/[id]" />
          <Stack.Screen name="route-quiz" options={{ presentation: 'modal' }} />
          <Stack.Screen name="scan" />
          <Stack.Screen name="book" options={{ presentation: 'modal' }} />
          <Stack.Screen name="celebrate" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
      {inApp && <RewardWatcher />}
    </SafeAreaProvider>
  );
}
