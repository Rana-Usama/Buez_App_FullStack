// src/config/Gradients.ts

/* =========================================================
   Onboarding Mesh Gradients
========================================================= */
export const OnboardingGradients = {
  meshTopLeft: [
    "#7A6BFF",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#5768FE",
    "#FF9FF3",
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
    "#253275", // Colors.primary
    "#0B1544",
  ] as const,

  filterActive: [
    "#253275", // Colors.primary
    "#4557B0",
  ] as const,

  /* -------- Top Rated Cards -------- */
  topRated: [
    "#eeede4ff",
    "#EFEACE",
    "#967852ff",
  ] as const,

  topRatedDark: [
    "#e2d9a6ff",
    "#1B1919",
    "#84643cff",
  ] as const,

  risingTalent: [
    "#e8dff0ff",
    "#c0aed2ff",
    "#A8CABA",
  ] as const,

  risingTalentDark: [
    "#8357b1ff",
    "#1B1919",
    "#99d9bbff",
  ] as const,

  beginner: [
    "#ebf9f7ff",
    "#98d3ccff",
    "#57a872ff",
  ] as const,

  beginnerDark: [
    "#79b7b0ff",
    "#1B1919",
    "#3f6a4dff",
  ] as const,

  defaultCard: [
    "#7C8CDD",
    "#B4BDE9",
    "#4C669F",
  ] as const,

  defaultCardDark: [
    "#7C8CDD",
    "#1B1919",
    "#4C669F",
  ] as const,
};


/* =========================================================
   Top Rated Users Card Gradients
========================================================= */
export const TopRatedUserGradients = {
  pro: {
     light: ["#eeeeeeff", "#fdf5dfff"] as const,
    dark: ["#403f3813", "#2d2d39ff"] as const,
  },
  rising: {
    light: ["#f1f5f1ff", "#d4e6d4ff"] as const, // Mint to Teal - for rising talent
    dark: ["#2a282cff", "#231f27ff"] as const,
  },
  beginner: {
   light: ["#fefefeff", "#b0debfff"] as const, // Light purple to violet - for beginners
    dark: ["#2e3231ff", "#2a332dff"] as const,
  },
  default: {
   light: ["#F5F5F5", "#EEEEEE"] as const, // Light blue to blue - default
    dark: ["#313445", "#0F1F43"] as const,
  },
};


export default {
  OnboardingGradients,
  HomeGradients,
  TopRatedUserGradients
};
