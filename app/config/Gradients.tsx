
import Colors from "./Colors";// src/config/Gradients.ts

/* =========================================================
   Onboarding Mesh Gradients
========================================================= */
export const OnboardingGradients = {
  meshTopLeft: [
    Colors.blue7,
    Colors.teal,
    Colors.teal6,
    Colors.green4,
    Colors.blue8,
    Colors.purpleLight,
  ] as const,

  meshBottomRight: [
    "#8BC7FF",
    "#796AFF",
    "#238B6E",
    "#A18CD1",
    "#FBC2EB",
    "#FDA085",
  ] as const,
};

/* =========================================================
   Home / Common Gradients
========================================================= */
export const HomeGradients = {
  navHeader: [
    Colors.primary, // Colors.primary
    Colors.blueDark3,
  ] as const,

  filterActive: [
    Colors.primary, // Colors.primary
    Colors.success2,
  ] as const,

  /* -------- Top Rated Cards (brand-aligned, soft) -------- */
  // Single soft gradient for all rank cards — light periwinkle in light mode,
  // muted slate-indigo in dark mode. Keeps the home screen consistent with the
  // app theme without the heavy primary navy. Rank is shown via the badge.
  topRatedBrand: ["#F5F7FE", "#EAEFFB", "#DCE3F6"] as const,
  topRatedBrandDark: ["#2B3052", Colors.blueDark4, Colors.blueDark5] as const,

  topRated: ["#eeede4ff", "#EFEACE", "#967852ff"] as const,

  topRatedDark: ["#e2d9a6ff", Colors.black3, "#84643cff"] as const,

  risingTalent: ["#e8dff0ff", "#c0aed2ff", "#A8CABA"] as const,

  risingTalentDark: ["#8357b1ff", Colors.black3, "#99d9bbff"] as const,

  beginner: ["#ebf9f7ff", "#98d3ccff", "#57a872ff"] as const,

  beginnerDark: [Colors.teal2, Colors.black3, "#3f6a4dff"] as const,

  defaultCard: [Colors.blue17, "#B4BDE9", Colors.blue18] as const,

  defaultCardDark: [Colors.blue17, Colors.black3, Colors.blue18] as const,
};

/* =========================================================
   Top Rated Users Card Gradients
========================================================= */
export const TopRatedUserGradients = {
  pro: {
    light: [Colors.white7, Colors.white8] as const,
    dark: ["#403f3813", "#2d2d39ff"] as const,
  },
  rising: {
    light: [Colors.white7, Colors.white8] as const,
    dark: ["#2a282cff", "#231f27ff"] as const,
  },
  beginner: {
    light: [Colors.white7, Colors.white8] as const,
    dark: ["#2e3231ff", "#2a332dff"] as const,
  },
  default: {
    light: [Colors.white7, Colors.white8] as const,
    dark: ["#313445", "#0F1F43"] as const,
  },
};

export default {
  OnboardingGradients,
  HomeGradients,
  TopRatedUserGradients,
};
