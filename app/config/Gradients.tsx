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
    "#E2CE5D",
    "#EFEACE",
    "#D39345",
  ] as const,

  topRatedDark: [
    "#E2CE5D",
    "#1B1919",
    "#D39345",
  ] as const,

  risingTalent: [
    "#6A11CB",
    "#CDAFEC",
    "#A8CABA",
  ] as const,

  risingTalentDark: [
    "#6A11CB",
    "#1B1919",
    "#A8CABA",
  ] as const,

  beginner: [
    "#00B09B",
    "#BCEEE8",
    "#50C878",
  ] as const,

  beginnerDark: [
    "#00B09B",
    "#1B1919",
    "#50C878",
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
    light: ["#888CAD", "#9E9CF4"] as const,
    dark: ["#585546", "#4F3617"] as const,
  },
  rising: {
    light: ["#888CAD", "#9E9CF4"] as const,
    dark: ["#372D41", "#240D3D"] as const,
  },
  beginner: {
    light: ["#888CAD", "#9E9CF4"] as const,
    dark: ["#2C403E", "#104521"] as const,
  },
  default: {
    light: ["#888CAD", "#9E9CF4"] as const,
    dark: ["#313445", "#0F1F43"] as const,
  },
};


export default {
  OnboardingGradients,
  HomeGradients,
  TopRatedUserGradients
};
