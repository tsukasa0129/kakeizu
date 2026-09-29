import type { ReactElement } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Flat, two-tone icons drawn on a 24×24 grid in the app palette.
// Used instead of emoji so the look is identical on iOS / Android / web.

const WOOD = '#C98B4B';
const WOOD_DARK = '#A0672E';
const PAPER = '#FFF3D6';
const SKIN = '#FFD7A8';
const W = '#FFFFFF';

type Draw = (color?: string) => ReactElement;

const ICONS = {
  crown: () => (
    <G>
      <Path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z" fill={colors.yellow} strokeLinejoin="round" />
      <Rect x={5} y={17} width={14} height={3.5} rx={1} fill={colors.yellowDark} />
      <Circle cx={3} cy={8} r={1.7} fill={colors.orange} />
      <Circle cx={12} cy={5} r={1.7} fill={colors.orange} />
      <Circle cx={21} cy={8} r={1.7} fill={colors.orange} />
    </G>
  ),
  sprout: () => (
    <G>
      <Ellipse cx={12} cy={20.5} rx={6.5} ry={1.8} fill={WOOD} />
      <Path d="M12 20.5V12" stroke={colors.greenDark} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M12 13.5C7 13.5 4 10.5 4 6c5 0 8 3 8 7.5z" fill={colors.green} />
      <Path d="M12 11.5C12 7 15 4 20 4c0 4.5-3 7.5-8 7.5z" fill={colors.greenDark} />
    </G>
  ),
  flame: () => (
    <G>
      <Path
        d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3.5 2-5 3-7.5 1 2.5 2 3 2.5 3.5 1-2.5 1-5.5.5-8z"
        fill={colors.orange}
      />
      <Path d="M12 11c1 2 3 3 3 5.5a3 3 0 0 1-6 0c0-2 2-3 3-5.5z" fill={colors.yellow} />
    </G>
  ),
  bolt: () => (
    <Path
      d="M13.5 2L5 13.5h6L10 22l9-12h-6z"
      fill={colors.yellow}
      stroke={colors.yellowDark}
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  ),
  medal: () => (
    <G>
      <Polygon points="6.5,2 11,2 14,9.5 9.5,9.5" fill={colors.blue} />
      <Polygon points="17.5,2 13,2 10,9.5 14.5,9.5" fill={colors.red} />
      <Circle cx={12} cy={15} r={7} fill={colors.yellow} />
      <Circle cx={12} cy={15} r={4.3} fill="none" stroke={colors.yellowDark} strokeWidth={1.6} />
    </G>
  ),
  scroll: () => (
    <G>
      <Rect x={5} y={4} width={14} height={16} fill={PAPER} stroke={WOOD} strokeWidth={1.4} />
      <Path d="M8.5 9.5h7M8.5 12.5h7M8.5 15.5h4.5" stroke={WOOD} strokeWidth={1.4} strokeLinecap="round" />
      <Rect x={3} y={2.5} width={18} height={3.5} rx={1.75} fill={WOOD_DARK} />
      <Rect x={3} y={18} width={18} height={3.5} rx={1.75} fill={WOOD_DARK} />
    </G>
  ),
  compass: () => (
    <G>
      <Circle cx={12} cy={12} r={10} fill={colors.blue} />
      <Circle cx={12} cy={12} r={7.5} fill={W} />
      <Polygon points="12,5.5 14.2,12 9.8,12" fill={colors.red} />
      <Polygon points="12,18.5 14.2,12 9.8,12" fill={colors.locked} />
      <Circle cx={12} cy={12} r={1.4} fill={colors.text} />
    </G>
  ),
  check: (c = colors.green) => (
    <Path d="M5 12.5l5 5L19 7" fill="none" stroke={c} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  ),
  cross: (c = colors.red) => (
    <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke={c} strokeWidth={3.2} strokeLinecap="round" />
  ),
  arrowRight: (c = colors.blue) => (
    <Path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  ),
  repeat: (c = colors.blue) => (
    <Path
      d="M4 11V9.5a3 3 0 0 1 3-3h11M15 3.5l3 3-3 3M20 13v1.5a3 3 0 0 1-3 3H6M9 14.5l-3 3 3 3"
      fill="none"
      stroke={c}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  flag: () => (
    <G>
      <Path d="M5.5 3v18.5" stroke={colors.textMuted} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M6.5 4h12l-3 4 3 4h-12z" fill={colors.green} strokeLinejoin="round" />
    </G>
  ),
  tree: () => (
    <G>
      <Rect x={10.5} y={13} width={3} height={8.5} rx={1} fill={WOOD_DARK} />
      <Circle cx={7.5} cy={12} r={4.5} fill={colors.greenDark} />
      <Circle cx={16.5} cy={12} r={4.5} fill={colors.greenDark} />
      <Circle cx={12} cy={8} r={6} fill={colors.green} />
    </G>
  ),
  pin: () => (
    <G>
      <Path d="M12 22s-7-7.5-7-12.5a7 7 0 0 1 14 0C19 14.5 12 22 12 22z" fill={colors.red} />
      <Circle cx={12} cy={9.5} r={2.8} fill={W} />
    </G>
  ),
  rocket: () => (
    <G>
      <Path d="M8 12l-3 4v2.5l3-2zM16 12l3 4v2.5l-3-2z" fill={colors.red} />
      <Path d="M10 16h4l-2 5.5z" fill={colors.orange} />
      <Path d="M12 2c4 3 5 8 4 14H8C7 10 8 5 12 2z" fill={colors.blueLight} stroke={colors.blue} strokeWidth={1.3} />
      <Circle cx={12} cy={9} r={2.2} fill={colors.blue} />
    </G>
  ),
  envelope: () => (
    <G>
      <Rect x={2.5} y={5.5} width={19} height={13} rx={2} fill={colors.blueLight} stroke={colors.blue} strokeWidth={1.6} />
      <Path d="M3 7l9 6.5L21 7" fill="none" stroke={colors.blue} strokeWidth={1.6} strokeLinejoin="round" />
    </G>
  ),
  search: () => (
    <G>
      <Path d="M15 15l5.5 5.5" stroke={colors.text} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={10.5} cy={10.5} r={6} fill={colors.blueLight} stroke={colors.blue} strokeWidth={2.4} />
    </G>
  ),
  party: () => (
    <G>
      <Polygon points="3,21 8,9 15,16" fill={colors.yellow} stroke={colors.yellowDark} strokeWidth={1.2} strokeLinejoin="round" />
      <Circle cx={17} cy={5} r={1.5} fill={colors.red} />
      <Circle cx={20} cy={15} r={1.3} fill={colors.purple} />
      <Path d="M13 3l1 3M19 10l2.5-1M10 4.5q1.5 2-.5 3.5" fill="none" stroke={colors.blue} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M15.5 9.5l2-2" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  ),
  bulb: () => (
    <G>
      <Path d="M12 2.5A6.5 6.5 0 0 0 8 14v2h8v-2a6.5 6.5 0 0 0-4-11.5z" fill={colors.yellow} />
      <Rect x={8.5} y={17} width={7} height={2} rx={1} fill={colors.locked} />
      <Rect x={9.5} y={20} width={5} height={2} rx={1} fill={colors.locked} />
      <Path d="M9.5 8a3 3 0 0 1 2.5-2.5" fill="none" stroke={W} strokeWidth={1.5} strokeLinecap="round" />
    </G>
  ),
  gift: () => (
    <G>
      <Rect x={4} y={10} width={16} height={11} rx={1.5} fill={colors.red} />
      <Rect x={3} y={7} width={18} height={4} rx={1} fill={colors.redDark} />
      <Rect x={10.5} y={7} width={3} height={14} fill={colors.yellow} />
      <Path d="M12 7C9 3 5.5 4.5 7.5 7zM12 7c3-4 6.5-2.5 4.5 0z" fill={colors.yellow} stroke={colors.yellowDark} strokeWidth={1} />
    </G>
  ),
  lock: () => (
    <G>
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke={colors.locked} strokeWidth={2.6} />
      <Rect x={5} y={10.5} width={14} height={11} rx={2.5} fill={colors.locked} />
      <Circle cx={12} cy={15} r={1.6} fill={W} />
      <Rect x={11.2} y={15} width={1.6} height={3} rx={0.8} fill={W} />
    </G>
  ),
  shop: () => (
    <G>
      <Rect x={4} y={9} width={16} height={12} rx={1} fill={colors.blueLight} />
      <Rect x={6} y={12} width={3} height={3} rx={0.5} fill={colors.blue} />
      <Rect x={15} y={12} width={3} height={3} rx={0.5} fill={colors.blue} />
      <Rect x={10} y={13.5} width={4} height={7.5} rx={0.5} fill={colors.blue} />
      <Rect x={3} y={4} width={18} height={5.5} rx={1.2} fill={colors.green} />
      <Path d="M7.5 4v5.5M12 4v5.5M16.5 4v5.5" stroke={W} strokeWidth={1.5} />
    </G>
  ),
  book: () => (
    <G>
      <Path d="M12 6C9.5 4.5 6 4.5 3 5.5V19c3-1 6.5-1 9 .5z" fill={W} stroke={colors.blue} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 6c2.5-1.5 6-1.5 9-.5V19c-3-1-6.5-1-9 .5z" fill={W} stroke={colors.blue} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M5.5 9h4M5.5 12h4M14.5 9h4M14.5 12h4" stroke={colors.blueLight} strokeWidth={1.4} strokeLinecap="round" />
    </G>
  ),
  cityHall: () => (
    <G>
      <Polygon points="12,2.5 22,8 2,8" fill={colors.textMuted} />
      <Rect x={2.5} y={8} width={19} height={1.8} fill={colors.textMuted} />
      <Rect x={4} y={10} width={2.5} height={8} fill={colors.locked} />
      <Rect x={8.5} y={10} width={2.5} height={8} fill={colors.locked} />
      <Rect x={13} y={10} width={2.5} height={8} fill={colors.locked} />
      <Rect x={17.5} y={10} width={2.5} height={8} fill={colors.locked} />
      <Rect x={2} y={18.5} width={20} height={3} rx={0.5} fill={colors.textMuted} />
    </G>
  ),
  person: () => (
    <G>
      <Circle cx={12} cy={8} r={4} fill={colors.blue} />
      <Path d="M4 21a8 7 0 0 1 16 0z" fill={colors.blue} />
    </G>
  ),
  family: () => (
    <G>
      <Circle cx={7} cy={6.5} r={2.8} fill={colors.male} />
      <Path d="M2.5 19v-5a4.5 4.5 0 0 1 9 0v5z" fill={colors.male} />
      <Circle cx={17} cy={6.5} r={2.8} fill={colors.female} />
      <Path d="M12.5 19v-5a4.5 4.5 0 0 1 9 0v5z" fill={colors.female} />
      <Circle cx={12} cy={12.5} r={2.3} fill={colors.green} stroke={W} strokeWidth={1} />
      <Path d="M8.8 21.5V19a3.2 3.2 0 0 1 6.4 0v2.5z" fill={colors.green} stroke={W} strokeWidth={1} />
    </G>
  ),
  baby: () => (
    <G>
      <Circle cx={12} cy={12} r={8.5} fill={SKIN} />
      <Path d="M12 3.5c-1.5 1.5-1 3 .5 3" fill="none" stroke={WOOD_DARK} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={9} cy={11.5} r={1.1} fill={colors.text} />
      <Circle cx={15} cy={11.5} r={1.1} fill={colors.text} />
      <Circle cx={7.5} cy={14.5} r={1.4} fill={colors.female} opacity={0.6} />
      <Circle cx={16.5} cy={14.5} r={1.4} fill={colors.female} opacity={0.6} />
      <Path d="M10.5 15.5q1.5 1.5 3 0" fill="none" stroke={colors.text} strokeWidth={1.3} strokeLinecap="round" />
    </G>
  ),
  folder: () => (
    <G>
      <Path d="M2.5 6A1.5 1.5 0 0 1 4 4.5h5l2 2h9A1.5 1.5 0 0 1 21.5 8v10.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5z" fill={colors.yellowDark} />
      <Rect x={2.5} y={9} width={19} height={11} rx={1.5} fill={colors.yellow} />
    </G>
  ),
  document: () => (
    <G>
      <Path d="M6.5 2.5H14l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5z" fill={W} stroke={colors.blue} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M14 2.5v5h5" fill={colors.blueLight} stroke={colors.blue} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M8 12h8M8 15h8M8 18h5" stroke={colors.blue} strokeWidth={1.4} strokeLinecap="round" />
    </G>
  ),
  redBook: () => (
    <G>
      <Rect x={5} y={2.5} width={14} height={19} rx={1.5} fill={colors.red} />
      <Rect x={5} y={2.5} width={3} height={19} rx={1} fill={colors.redDark} />
      <Rect x={10} y={6} width={6.5} height={4} rx={0.8} fill={W} />
    </G>
  ),
  office: () => (
    <G>
      <Rect x={5} y={3} width={14} height={18.5} rx={1} fill={colors.textMuted} />
      {[6, 10, 14].map((y) => (
        <G key={y}>
          <Rect x={7.5} y={y} width={3} height={2.2} rx={0.4} fill={colors.blueLight} />
          <Rect x={13.5} y={y} width={3} height={2.2} rx={0.4} fill={colors.blueLight} />
        </G>
      ))}
      <Rect x={10.5} y={17.5} width={3} height={4} fill={colors.blueLight} />
    </G>
  ),
  idCard: () => (
    <G>
      <Rect x={2.5} y={5} width={19} height={14} rx={2} fill={colors.blueLight} stroke={colors.blue} strokeWidth={1.5} />
      <Circle cx={8} cy={10.5} r={2.2} fill={colors.blue} />
      <Path d="M4.8 16a3.2 3 0 0 1 6.4 0z" fill={colors.blue} />
      <Path d="M13.5 10h5M13.5 13h5M13.5 16h3" stroke={colors.blue} strokeWidth={1.5} strokeLinecap="round" />
    </G>
  ),
  hourglass: () => (
    <G>
      <Path
        d="M7 4.5h10c0 4.5-4 6-4 7.5s4 3 4 7.5H7c0-4.5 4-6 4-7.5s-4-3-4-7.5z"
        fill={colors.blueLight}
        stroke={colors.blue}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d="M9 7.5h6c-.5 1.5-2.5 2.5-3 3.5-.5-1-2.5-2-3-3.5zM8.5 19c.5-2.5 2.5-3 3.5-4 1 1 3 1.5 3.5 4z" fill={colors.yellow} />
      <Rect x={5} y={2} width={14} height={2.5} rx={1} fill={colors.textMuted} />
      <Rect x={5} y={19.5} width={14} height={2.5} rx={1} fill={colors.textMuted} />
    </G>
  ),
  warning: () => (
    <G>
      <Path d="M12 3l10 17.5H2z" fill={colors.yellow} stroke={colors.yellowDark} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12 9v5" stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={12} cy={17.3} r={1.3} fill={colors.text} />
    </G>
  ),
  yen: () => (
    <G>
      <Rect x={2} y={6} width={20} height={12} rx={2} fill={colors.greenLight} stroke={colors.green} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={3.8} fill={colors.green} />
      <Path d="M10.3 9.7L12 12l1.7-2.3M12 12v2.8M10.6 12.6h2.8" fill="none" stroke={W} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  ),
  postbox: () => (
    <G>
      <Rect x={10.5} y={16.5} width={3} height={4.5} fill={colors.textMuted} />
      <Rect x={7.5} y={20.5} width={9} height={1.5} rx={0.75} fill={colors.textMuted} />
      <Path d="M6 8a6 4 0 0 1 12 0v9H6z" fill={colors.red} />
      <Rect x={8.5} y={8.5} width={7} height={1.6} rx={0.8} fill={colors.redDark} />
      <Path d="M10 12.3h4M10 13.8h4M12 13.8V16" stroke={W} strokeWidth={1.1} strokeLinecap="round" />
    </G>
  ),
  postOffice: () => (
    <G>
      <Rect x={3} y={9} width={18} height={12} rx={1} fill={W} stroke={colors.red} strokeWidth={1.5} />
      <Polygon points="12,3 22,9 2,9" fill={colors.red} strokeLinejoin="round" />
      <Path d="M9.5 12.5h5M9.5 14.3h5M12 14.3v4.2" stroke={colors.red} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  ),
  pen: () => (
    <G>
      <Path d="M15.5 4.5l4 4L9 19l-4-4z" fill={colors.blue} />
      <Path d="M5 15l4 4-5.5 1.5z" fill={colors.text} />
      <Path d="M15.5 4.5L17 3a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2l-1.5 1.5z" fill={colors.blueDark} />
    </G>
  ),
  calendar: () => (
    <G>
      <Rect x={3} y={4.5} width={18} height={16.5} rx={2} fill={W} stroke={colors.red} strokeWidth={1.5} />
      <Path d="M3 6.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3z" fill={colors.red} />
      <Rect x={7} y={2.5} width={2} height={4} rx={1} fill={colors.textMuted} />
      <Rect x={15} y={2.5} width={2} height={4} rx={1} fill={colors.textMuted} />
      {[
        [8, 13],
        [12, 13],
        [16, 13],
        [8, 17],
        [12, 17],
      ].map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={colors.locked} />
      ))}
    </G>
  ),
  castle: () => (
    <G>
      <Polygon points="5,21.5 19,21.5 17.5,16 6.5,16" fill={colors.textMuted} />
      <Rect x={7.5} y={11} width={9} height={5} fill={W} stroke={colors.text} strokeWidth={0.8} />
      <Rect x={11} y={12.5} width={2} height={2.5} fill={colors.text} />
      <Path d="M4.5 12l3-2.5h9l3 2.5z" fill={colors.blueDark} />
      <Rect x={9} y={6.5} width={6} height={3} fill={W} stroke={colors.text} strokeWidth={0.8} />
      <Path d="M7 7.5L9.5 5h5L17 7.5z" fill={colors.blueDark} />
      <Path d="M9.5 4.5L12 2l2.5 2.5z" fill={colors.blueDark} />
    </G>
  ),
  torii: () => (
    <G>
      <Rect x={6} y={7} width={2.2} height={14.5} fill={colors.red} />
      <Rect x={15.8} y={7} width={2.2} height={14.5} fill={colors.red} />
      <Rect x={4} y={10} width={16} height={2} fill={colors.red} />
      <Path d="M2 5q10 2 20 0v2.5q-10 2-20 0z" fill={colors.text} />
    </G>
  ),
  cabinet: () => (
    <G>
      <Rect x={4} y={2.5} width={16} height={19} rx={1.5} fill={colors.locked} />
      <Rect x={6} y={4.5} width={12} height={7} rx={1} fill={colors.border} />
      <Rect x={6} y={13.5} width={12} height={6} rx={1} fill={colors.border} />
      <Rect x={10} y={7.3} width={4} height={1.5} rx={0.75} fill={colors.textMuted} />
      <Rect x={10} y={15.8} width={4} height={1.5} rx={0.75} fill={colors.textMuted} />
    </G>
  ),
  graduation: () => (
    <G>
      <Path d="M6 11.5V16c0 2 12 2 12 0v-4.5L12 14z" fill={colors.textMuted} />
      <Polygon points="12,4 23,9 12,14 1,9" fill={colors.text} />
      <Path d="M20 10v6" stroke={colors.yellow} strokeWidth={1.5} />
      <Circle cx={20} cy={16.8} r={1.3} fill={colors.yellow} />
    </G>
  ),
  gem: () => (
    <G>
      <Polygon points="7,3.5 17,3.5 21.5,9 2.5,9" fill="#9BE3FF" />
      <Polygon points="2.5,9 21.5,9 12,21" fill={colors.blue} />
      <Path d="M7 3.5L9.5 9 12 3.5 14.5 9 17 3.5M9.5 9L12 21l2.5-12" fill="none" stroke={W} strokeWidth={1} strokeLinejoin="round" opacity={0.7} />
    </G>
  ),
  books: () => (
    <G>
      <Rect x={3} y={16.5} width={18} height={4.5} rx={1} fill={colors.blue} />
      <Rect x={4.5} y={11.5} width={15} height={4.5} rx={1} fill={colors.green} />
      <Rect x={3.5} y={6.5} width={16} height={4.5} rx={1} fill={colors.red} />
      <Path d="M6 18.75h3M7.5 13.75h3M6.5 8.75h3" stroke={W} strokeWidth={1.4} strokeLinecap="round" />
    </G>
  ),
} satisfies Record<string, Draw>;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  /** Stroke colour override for the line icons (check / cross / arrowRight / repeat). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 24, color, style }: Props) {
  const draw: Draw = ICONS[name];
  return (
    <View style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {draw(color)}
      </Svg>
    </View>
  );
}
