// Palette modelled on the gamified learning apps studied in Appllama
// (bright unit colours on white, grey "locked" states, chunky 3D buttons).
export const colors = {
  bg: '#FFFFFF',
  surface: '#F7F7F7',
  border: '#E5E5E5',
  locked: '#AFAFAF',
  text: '#3C3C3C',
  textMuted: '#777777',

  green: '#58CC02',
  greenDark: '#58A700',
  greenLight: '#D7FFB8',
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  blueLight: '#DDF4FF',
  orange: '#FF9600',
  orangeDark: '#CD7900',
  yellow: '#FFC800',
  yellowDark: '#E5A800',
  purple: '#CE82FF',
  purpleDark: '#A568CC',
  red: '#FF4B4B',
  redDark: '#EA2B2B',
  redLight: '#FFDFE0',

  male: '#1CB0F6',
  female: '#FF86D0',
} as const;

export type UnitColor = 'green' | 'blue' | 'purple' | 'orange' | 'red';

export const unitPalette: Record<UnitColor, { main: string; dark: string }> = {
  green: { main: colors.green, dark: colors.greenDark },
  blue: { main: colors.blue, dark: colors.blueDark },
  purple: { main: colors.purple, dark: colors.purpleDark },
  orange: { main: colors.orange, dark: colors.orangeDark },
  red: { main: colors.red, dark: colors.redDark },
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '800' as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, lineHeight: 23, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
};
