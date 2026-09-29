import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/theme';

// Small animation kit on top of RN's Animated (no extra native module). Every effect jumps
// straight to its end state when the OS "reduce motion" setting is on.

/** The native driver isn't available on react-native-web. */
export const nativeDriver = Platform.OS !== 'web';

let reduceMotionCache = false;
export function useReducedMotion() {
  const [reduced, setReduced] = useState(reduceMotionCache);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        reduceMotionCache = v;
        setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reduceMotionCache = v;
      setReduced(v);
    });
    return () => sub.remove();
  }, []);
  return reduced;
}

type From = 'bottom' | 'right' | 'left' | 'top';

/** Fades and slides its children in once, on mount. Re-key it to replay. */
export function FadeSlideIn({
  children,
  delay = 0,
  from = 'bottom',
  distance = 24,
  duration = 380,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: From;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const t = useState(() => new Animated.Value(reduced ? 1 : 0))[0];
  useEffect(() => {
    if (reduced) return t.setValue(1);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, duration, reduced]);

  const sign = from === 'bottom' || from === 'right' ? 1 : -1;
  const offset = t.interpolate({ inputRange: [0, 1], outputRange: [distance * sign, 0] });
  const transform = from === 'left' || from === 'right' ? [{ translateX: offset }] : [{ translateY: offset }];
  return <Animated.View style={[style, { opacity: t, transform }]}>{children}</Animated.View>;
}

/** Springs its children from small to full size, on mount. */
export function PopIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const t = useState(() => new Animated.Value(reduced ? 1 : 0))[0];
  useEffect(() => {
    if (reduced) return t.setValue(1);
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(t, { toValue: 1, friction: 5, tension: 140, useNativeDriver: nativeDriver }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, delay, reduced]);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const opacity = t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] });
  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** A value that loops 0 → 1 → 0 forever, for idle bobbing, swaying and pulsing. */
export function useLoop(duration = 1400, enabled = true) {
  const reduced = useReducedMotion();
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!enabled || reduced) return t.setValue(0);
    const half = { duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver };
    const anim = Animated.loop(
      Animated.sequence([Animated.timing(t, { toValue: 1, ...half }), Animated.timing(t, { toValue: 0, ...half })]),
    );
    anim.start();
    return () => anim.stop();
  }, [t, duration, enabled, reduced]);
  return t;
}

/** Counts up from 0 to `to` once; returns the current integer. */
export function useCountUp(to: number, duration = 1200, delay = 0) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        start ??= now;
        const p = Math.min(1, (now - start) / duration);
        setValue(Math.round(to * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [to, duration, delay, reduced]);
  return reduced ? to : value;
}

/** Grows a bar from 0 to `pct` (0..1) of its track width. */
export function GrowBar({
  pct,
  delay = 0,
  color,
  style,
}: {
  pct: number;
  delay?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const t = useState(() => new Animated.Value(reduced ? pct : 0))[0];
  useEffect(() => {
    if (reduced) return t.setValue(pct);
    const anim = Animated.timing(t, {
      toValue: pct,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [t, pct, delay, reduced]);
  const width = t.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return <Animated.View style={[style, { width, backgroundColor: color }]} />;
}

const CONFETTI_COLORS = [colors.green, colors.blue, colors.yellow, colors.orange, colors.red, colors.purple, colors.female];

/** One burst of falling confetti over the whole screen. Doesn't block touches. */
export function Confetti({ count = 36 }: { count?: number }) {
  const reduced = useReducedMotion();
  const { width, height } = Dimensions.get('window');
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      delay: Math.random() * 400,
      duration: 1800 + Math.random() * 1200,
      drift: (Math.random() - 0.5) * 80,
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 7 + Math.random() * 5,
      h: 10 + Math.random() * 6,
    })),
  );
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} fall={height + 40} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  x,
  delay,
  duration,
  drift,
  spin,
  color,
  w,
  h,
  fall,
}: {
  x: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  color: string;
  w: number;
  h: number;
  fall: number;
}) {
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: nativeDriver,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, duration]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-30, fall] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: w,
        height: h,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}
