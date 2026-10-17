export const Palette = {
  black: 0x1a1c2c,
  nearBlack: 0x0d0d12,
  darkPurple: 0x5d275d,
  deepViolet: 0x3a1a5a,
  lavender: 0xa8a2d8,
  mutedMagenta: 0xb36aa3,
  red: 0xb13e53,
  darkCrimson: 0x4a1a2a,
  warningRed: 0x8b1a2a,
  orange: 0xef7d57,
  burntOrange: 0xcc5533,
  yellow: 0xffcd75,
  lime: 0xa7f070,
  green: 0x38b764,
  mutedGreen: 0x6b8e7a,
  teal: 0x257179,
  desatCyan: 0x5a8d9e,
  navy: 0x29366f,
  deepNavy: 0x141a2f,
  blue: 0x3b5dc9,
  sky: 0x41a6f6,
  cyan: 0x73eff7,
  white: 0xf4f4f4,
  silver: 0x94b0c2,
  gray: 0x566c86,
  slate: 0x333c57,
  warmHighlight: 0xddc9a0,
  coldHighlight: 0xd0d8f0,
  brightPurple: 0xb14ecf,
} as const;

export type PaletteColor = (typeof Palette)[keyof typeof Palette];

export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
