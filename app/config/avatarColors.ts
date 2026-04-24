// utils/avatarColors.ts

const LETTER_COLORS_LIGHT: Record<string, [string, string]> = {
  A: ["#FFE0E0", "#C0392B"],
  B: ["#FFE8CC", "#D35400"],
  C: ["#FFF4CC", "#B7950B"],
  D: ["#E8F8E8", "#1E8449"],
  E: ["#E0F4FF", "#1A6FA8"],
  F: ["#EDE0FF", "#6C3483"],
  G: ["#FFE0F4", "#A93226"],
  H: ["#E0FFF4", "#117A65"],
  I: ["#FFF0E0", "#CA6F1E"],
  J: ["#E8E0FF", "#5B2C6F"],
  K: ["#E0FFEA", "#1D6A39"],
  L: ["#FFE0EC", "#922B21"],
  M: ["#E0F0FF", "#1A5276"],
  N: ["#FFEEE0", "#BA4A00"],
  O: ["#E8FFE0", "#196F3D"],
  P: ["#F0E0FF", "#76448A"],
  Q: ["#E0FAFF", "#148F77"],
  R: ["#FFE8E0", "#CB4335"],
  S: ["#FFE0F6", "#71245C"],
  T: ["#FFF8E0", "#9A7D0A"],
  U: ["#E0E8FF", "#1F3E8C"],
  V: ["#F8E0FF", "#7D3C98"],
  W: ["#E0FFF8", "#0B6E4F"],
  X: ["#FFE0F8", "#943126"],
  Y: ["#F4FFE0", "#4A7C1F"],
  Z: ["#E0F8FF", "#1A6B8A"],
};

const LETTER_COLORS_DARK: Record<string, [string, string]> = {
  A: ["#4A1010", "#FF8A80"],
  B: ["#4A2800", "#FFB74D"],
  C: ["#3D3000", "#FFE082"],
  D: ["#0D3320", "#69F0AE"],
  E: ["#0D2A40", "#64B5F6"],
  F: ["#2A1040", "#CE93D8"],
  G: ["#4A1030", "#FF80AB"],
  H: ["#0D3328", "#80CBC4"],
  I: ["#3D2200", "#FFCC80"],
  J: ["#1E0E40", "#B39DDB"],
  K: ["#0D3318", "#A5D6A7"],
  L: ["#4A0D20", "#F48FB1"],
  M: ["#0D2540", "#90CAF9"],
  N: ["#3D1E00", "#FFAB76"],
  O: ["#0D3318", "#C8E6C9"],
  P: ["#280D40", "#E040FB"],
  Q: ["#0D3330", "#80DEEA"],
  R: ["#4A1500", "#FF7043"],
  S: ["#3D0A30", "#F48FD8"],
  T: ["#3D3000", "#FFD54F"],
  U: ["#0D1A40", "#82B1FF"],
  V: ["#2E0D40", "#EA80FC"],
  W: ["#0D3328", "#80CBC4"],
  X: ["#4A1030", "#FF6D8A"],
  Y: ["#1E3300", "#CCFF90"],
  Z: ["#0D2E3D", "#80D8FF"],
};

const FALLBACK_LIGHT: [string, string][] = [
  ["#F0F0F0", "#555555"],
  ["#E8E8FF", "#333399"],
  ["#FFE8F0", "#993355"],
];

const FALLBACK_DARK: [string, string][] = [
  ["#2A2A2A", "#CCCCCC"],
  ["#1A1A33", "#9999FF"],
  ["#330D1A", "#FF99BB"],
];

export const getAvatarColors = (
  letter: string | undefined,
  isDark: boolean
): [string, string] => {
  const palette = isDark ? LETTER_COLORS_DARK : LETTER_COLORS_LIGHT;
  const fallback = isDark ? FALLBACK_DARK : FALLBACK_LIGHT;
  if (!letter) return fallback[0];
  const upper = letter.toUpperCase();
  return palette[upper] ?? fallback[upper.charCodeAt(0) % fallback.length];
};