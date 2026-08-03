
import Colors from "./Colors";// utils/avatarColors.ts

const LETTER_COLORS_LIGHT: Record<string, [string, string]> = {
  A: [Colors.redLight, Colors.red4],
  B: [Colors.orangeLight, Colors.orange7],
  C: [Colors.yellowLight, Colors.yellow2],
  D: [Colors.white10, Colors.green6],
  E: [Colors.blueLight5, Colors.blue11],
  F: [Colors.indigoLight3, Colors.indigo3],
  G: [Colors.purpleLight2, Colors.red5],
  H: [Colors.greenLight, Colors.tealDark2],
  I: [Colors.orangeLight2, Colors.orange8],
  J: [Colors.indigoLight4, Colors.indigo4],
  K: [Colors.greenLight2, Colors.greenDark2],
  L: [Colors.pinkLight, Colors.red6],
  M: [Colors.blueLight6, Colors.blue12],
  N: [Colors.orangeLight3, Colors.orange9],
  O: [Colors.greenLight3, Colors.greenDark3],
  P: [Colors.indigoLight5, Colors.indigo5],
  Q: [Colors.tealLight, Colors.teal7],
  R: [Colors.orangeLight4, Colors.red7],
  S: [Colors.purpleLight3, Colors.purple],
  T: ["#FFF8E0", Colors.yellow3],
  U: [Colors.blueLight7, Colors.blue13],
  V: [Colors.indigoLight6, Colors.indigo6],
  W: [Colors.tealLight2, Colors.tealDark3],
  X: [Colors.purpleLight4, Colors.red8],
  Y: [Colors.greenLight4, Colors.green7],
  Z: [Colors.tealLight3, Colors.teal8],
};

const LETTER_COLORS_DARK: Record<string, [string, string]> = {
  A: [Colors.redDark, Colors.redLight2],
  B: [Colors.orangeDark, Colors.orange10],
  C: [Colors.yellowDark, Colors.yellowLight2],
  D: [Colors.greenDark4, Colors.green8],
  E: [Colors.blueDark6, Colors.blue14],
  F: [Colors.indigoDark, Colors.purple2],
  G: [Colors.purpleDark, Colors.pinkLight2],
  H: [Colors.tealDark, Colors.teal3],
  I: [Colors.orangeDark2, Colors.orangeLight5],
  J: [Colors.indigoDark2, Colors.indigo7],
  K: [Colors.greenDark, Colors.green9],
  L: [Colors.pinkDark, Colors.pinkLight3],
  M: [Colors.blueDark7, Colors.blueLight8],
  N: [Colors.orangeDark3, Colors.orange11],
  O: [Colors.greenDark, Colors.greenLight5],
  P: [Colors.indigoDark3, Colors.purple3],
  Q: [Colors.tealDark4, Colors.teal9],
  R: [Colors.orangeDark4, Colors.red9],
  S: [Colors.purpleDark2, Colors.purpleLight5],
  T: [Colors.yellowDark, Colors.yellow4],
  U: [Colors.blueDark8, Colors.blueLight9],
  V: [Colors.indigoDark4, Colors.purple4],
  W: [Colors.tealDark, Colors.teal3],
  X: [Colors.purpleDark, Colors.red10],
  Y: [Colors.greenDark5, Colors.greenLight6],
  Z: [Colors.tealDark5, Colors.tealLight4],
};

const FALLBACK_LIGHT: [string, string][] = [
  [Colors.white11, Colors.greyDark5],
  [Colors.blueLight10, Colors.blue15],
  [Colors.pinkLight4, Colors.pink2],
];

const FALLBACK_DARK: [string, string][] = [
  [Colors.greyDark6, Colors.greyLight3],
  [Colors.blueDark9, Colors.blueLight11],
  [Colors.pinkDark2, Colors.pinkLight5],
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