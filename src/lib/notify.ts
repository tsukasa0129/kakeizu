import { Alert, Platform } from 'react-native';

/** Alert.alert is a no-op on react-native-web, so fall back to the browser dialog there. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
