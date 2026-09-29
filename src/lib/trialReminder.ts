import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PurchasesIntroPrice } from 'react-native-purchases';

const DAY_MS = 24 * 60 * 60 * 1000;
const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Length of a free trial in days, or null when the intro offer isn't free (or there is none). */
export function freeTrialDays(intro: PurchasesIntroPrice | null | undefined): number | null {
  if (!intro || intro.price > 0) return null;
  const days = (UNIT_DAYS[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
}

/** Day (counted from today) on which the "trial ends tomorrow" reminder goes out. */
export const reminderDay = (trialDays: number) => Math.max(1, trialDays - 1);

/** Asks for notification permission on the paywall's reminder step. Web has no local notifications. */
export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

/** Schedules the reminder promised on the paywall: one day before the free trial converts. */
export async function scheduleTrialReminder(trialDays: number) {
  if (Platform.OS === 'web') return;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'お知らせ',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '無料体験はあと1日で終了します',
        body: '続ける場合は何もしなくてOK。やめる場合はストアの設定から解約できます。',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + reminderDay(trialDays) * DAY_MS),
      },
    });
  } catch (e) {
    console.warn('trial reminder', e);
  }
}
