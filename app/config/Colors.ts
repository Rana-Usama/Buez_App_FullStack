const Colors = {
  primary: "#253275",
  secondary: "#DD53A8",
  lightPrimary: "#F4FFF4",
  heading: "#6B7280",
  lightWhite: "#F7F7F7",
  lightGrey: "#9CA3AF",
  grey: "#808080",
  white: "#FFFFFF",
  black: "black",
  darkGrey2: "#322D31",
  darkGrey: "#a6a9c2",
  newInputFieldBorder: "#DEDEDE",
  inputFieldBorder: "#393939",
  inputFieldBackgroundColor: "#F9FAFB",
  inputFieldPlaceholder: "#94A3B8",
  detailsText: "#64748B",
  detailsBorder: "#F1F5F9",
  red: "#FF4D4F",
  cartsBackground: "#F8FAFC",
  cartsTitle: "#4B5563",

  // GroupDetails / UI accents
  gold: "#FFD700",
  orange: "#FFA500",
  gold20: "#FFD70020",
  memberBubble: "rgba(242,249,249,1)",

  star: "#FFD700",
  success2: "#4557B0",
  switch: "rgb(224, 224, 227)",
  white5: "rgba(218, 218, 218, 1)",
  cardBorderLight: "rgba(236, 238, 251, 1)",
  primary2: "#4557B0",
  border: "rgba(208, 208, 208, 1)",
  stroke: "#D1D5DB",
  chat: "#A7ADCE",
  desc: "#64748B",
  skip: "#475569",
  pureWhite: "white",
  pureBlack: "black",
  modal: "rgba(218, 218, 218, 0.5)",
  chat1: "rgb(255, 255, 255)",
  chat2: "rgb(87, 90, 138)",

  // Chat screen specific colors
  chatDarkBg: "rgba(13,13,20,1)",
  overlayDark: "rgba(0,0,0,0.5)",
  loaderLightOverlay: "rgba(255,255,255,0.6)",
  loaderDarkOverlay: "rgba(4,4,4,0.6)",
  dangerRed: "#F44336",
  green  : "#4CAF50",
  w1 : "rgba(241,241,241,1)",
  w2 : "rgba(255,255,255,1)",
  w3 : "rgba(241,241,241,1)",
  gr1 : "rgba(145,144,144,1)",

  // GroupDetails additional colors
  heroGradientDark: ["#1f22388f", "#3a2850ff", "#1a1a2eff"] as const,
  heroGradientLight: ["#a5a5bd48", "#6183a9c7", "#3c6954c9"] as const,
  heroIconGradientDark: ["#8268a1ff", "#1a1a2eff"] as const,
  heroIconGradientLight: ["#4C63F6", "#6fafa0ff"] as const,
  backBtnBg: "rgba(255,255,255,0.2)",
  categoryBadgeBg: "rgba(255,255,255,0.15)",
  categoryBadgeText: "rgba(255,255,255,0.85)",
  heroStatsBg: "rgba(255,255,255,0.2)",
  heroStatsLabel: "rgba(255,255,255,0.7)",
  heroStatsDivider: "rgba(255,255,255,0.2)",
  heroTitleColor: "#FFF",
  lastMsgTextColor: "rgba(255,255,255,0.8)",
  infoFooterBgDark: "rgba(255,255,255,0.03)",
  infoFooterBgLight: "rgba(0,0,0,0.025)",
  infoFooterBorderDark: "rgba(255,255,255,0.06)",
  infoFooterBorderLight: "rgba(0,0,0,0.05)",
  sectionBgDark: "rgba(255,255,255,0.06)",
  sectionBgLight: "rgba(0,0,0,0.05)",
  primaryLight: "rgba(255,255,255,0.2)",
  chatLoadingBgOverlay: "rgba(0,0,0,0.35)",
  chatLoadingBtnBgLight: "rgba(255,255,255,0.2)",
  hom1:"#F1F3F5",
  hom2:"#131214ff",
  white15 : 'rgba(255,255,255,0.15)',
  white3 : 'rgba(255,255,255,0.3)',


   taskTypeBadgeBg: (primary: string) => primary + "20",
  progressBarEmpty: "#F8F9FA",
  statusAlertSuccess: "#4CAF50",
  statusAlertSuccessBg: (color: string) => color + "20",
  statusAlertWarning: "#FF9800",
  statusAlertWarningBg: (color: string) => color + "20",
  statusAlertError: "#F44336",
  statusAlertErrorBg: (color: string) => color + "20",
  buttonRemove: "#FF5252",
  buttonRemoveShadow: "#FF5252",
  workerAvatarBorder: (primary: string) => primary + "40",
  profileButtonBg: "rgba(227, 227, 236, 0.61)",
  tabsBackgroundLight: "#F1F3F5",
  tabsBackgroundDark: "#1A1A1A",
  helpBackgroundLight: "#F8F9FA",
  
  // Modal Colors
  modalSuccessGradient: ["#4CAF50", "#2E7D32"] as const,
  modalWarningGradient: ["#FF9800", "#F57C00"] as const,
  modalErrorGradient: ["#F44336", "#D32F2F"] as const,
  modalDestructiveGradient: ["#FF5252", "#D32F2F"] as const,


   categoryColors: {
    dark: {
      all: {
        backgroundColor: "#1e3b8a96",
        iconColor: "#648ebdff",
        borderColor: "#3c4c6640",
        backgroundColorHex: "#45506b58",
        iconColorHex: "#67819eff",
      },
      cleaning: {
        backgroundColor: "#14532D",
        iconColor: "#86EFAC",
        borderColor: "#50765240",
        backgroundColorHex: "#284e379d",
        iconColorHex: "#629b78ff",
      },
      moving: {
        backgroundColor: "#7C2D12",
        iconColor: "#FDBA74",
        borderColor: "#76675040",
        backgroundColorHex: "#422a23bc",
        iconColorHex: "#a38767ff",
      },
      gardening: {
        backgroundColor: "#365314",
        iconColor: "#BBF7D0",
        borderColor: "#59694540",
        backgroundColorHex: "#33491ba9",
        iconColorHex: "#4a9764ff",
      },
      gaming: {
        backgroundColor: "#581C87",
        iconColor: "#D8B4FE",
        borderColor: "#63416940",
        backgroundColorHex: "#36184ca3",
        iconColorHex: "#8664a9ff",
      },
      plumbing: {
        backgroundColor: "#0B3D91",
        iconColor: "#82CFFF",
        borderColor: "#37567640",
        backgroundColorHex: "#0a2c6fa8",
        iconColorHex: "#4c85cbff",
      },
      electrical: {
        backgroundColor: "#5C3D00",
        iconColor: "#FFD86B",
        borderColor: "#66554040",
        backgroundColorHex: "#4b2f0086",
        iconColorHex: "#c7a53fff",
      },
      carpentry: {
        backgroundColor: "#3E2723",
        iconColor: "#FFAB91",
        borderColor: "#5a3f3840",
        backgroundColorHex: "#3a1f197c",
        iconColorHex: "#91503eff",
      },
      painting: {
        backgroundColor: "#4A148C",
        iconColor: "#E1BEE7",
        borderColor: "#5f2c5f40",
        backgroundColorHex: "#3d0f76a1",
        iconColorHex: "#a36cacff",
      },
      delivery: {
        backgroundColor: "#263238",
        iconColor: "#90A4AE",
        borderColor: "#455A6440",
        backgroundColorHex: "#1b2a30a1",
        iconColorHex: "#7ea6baff",
      },
      tutoring: {
        backgroundColor: "#1A237E",
        iconColor: "#8C9EFF",
        borderColor: "#2f3f7640",
        backgroundColorHex: "#151b509a",
        iconColorHex: "#5d6bbcff",
      },
      eventSetup: {
        backgroundColor: "#004D40",
        iconColor: "#80CBC4",
        borderColor: "#2b5e5640",
        backgroundColorHex: "#00332f9f",
        iconColorHex: "#60a7a0ff",
      },
      photography: {
        backgroundColor: "#311B92",
        iconColor: "#B39DDB",
        borderColor: "#4a2b7f40",
        backgroundColorHex: "#220f6faa",
        iconColorHex: "#8267b0ff",
      },
      petCare: {
        backgroundColor: "#2E7D32",
        iconColor: "#A5D6A7",
        borderColor: "#41764b40",
        backgroundColorHex: "#1f4d1f9f",
        iconColorHex: "#74aa76ff",
      },
      other: {
        backgroundColor: "#374151",
        iconColor: "#D1D5DB",
        borderColor: "#46414140",
        backgroundColorHex: "#37415197",
        iconColorHex: "#778cacff",
      },
    },

    // ── CATEGORY FILTER COLORS - LIGHT MODE ──
    light: {
      all: {
        backgroundColor: "#E3F2FD",
        iconColor: "#2196F3",
        borderColor: "#2196F340",
        backgroundColorHex: "#E3F2FD",
        iconColorHex: "#2196F3",
      },
      cleaning: {
        backgroundColor: "#E8F5E9",
        iconColor: "#4CAF50",
        borderColor: "#4CAF5040",
        backgroundColorHex: "#E8F5E9",
        iconColorHex: "#4CAF50",
      },
      moving: {
        backgroundColor: "#FFF3E0",
        iconColor: "#FF9800",
        borderColor: "#FF980040",
        backgroundColorHex: "#FFF3E0",
        iconColorHex: "#FF9800",
      },
      gardening: {
        backgroundColor: "#F1F8E9",
        iconColor: "#8BC34A",
        borderColor: "#8BC34A40",
        backgroundColorHex: "#F1F8E9",
        iconColorHex: "#8BC34A",
      },
      gaming: {
        backgroundColor: "#F3E5F5",
        iconColor: "#9C27B0",
        borderColor: "#9C27B040",
        backgroundColorHex: "#F3E5F5",
        iconColorHex: "#9C27B0",
      },
      plumbing: {
        backgroundColor: "#E3F2FD",
        iconColor: "#2196F3",
        borderColor: "#2196F340",
        backgroundColorHex: "#E3F2FD",
        iconColorHex: "#2196F3",
      },
      electrical: {
        backgroundColor: "#FFF8E1",
        iconColor: "#FFB300",
        borderColor: "#FFB30040",
        backgroundColorHex: "#FFF8E1",
        iconColorHex: "#FFB300",
      },
      carpentry: {
        backgroundColor: "#FBE9E7",
        iconColor: "#FF5722",
        borderColor: "#FF572240",
        backgroundColorHex: "#FBE9E7",
        iconColorHex: "#FF5722",
      },
      painting: {
        backgroundColor: "#F3E5F5",
        iconColor: "#AB47BC",
        borderColor: "#AB47BC40",
        backgroundColorHex: "#F3E5F5",
        iconColorHex: "#AB47BC",
      },
      delivery: {
        backgroundColor: "#E0F7FA",
        iconColor: "#00ACC1",
        borderColor: "#00ACC140",
        backgroundColorHex: "#E0F7FA",
        iconColorHex: "#00ACC1",
      },
      tutoring: {
        backgroundColor: "#E8EAF6",
        iconColor: "#3F51B5",
        borderColor: "#3F51B540",
        backgroundColorHex: "#E8EAF6",
        iconColorHex: "#3F51B5",
      },
      eventSetup: {
        backgroundColor: "#E0F2F1",
        iconColor: "#00796B",
        borderColor: "#00796B40",
        backgroundColorHex: "#E0F2F1",
        iconColorHex: "#00796B",
      },
      photography: {
        backgroundColor: "#F3E5F5",
        iconColor: "#8E24AA",
        borderColor: "#8E24AA40",
        backgroundColorHex: "#F3E5F5",
        iconColorHex: "#8E24AA",
      },
      petCare: {
        backgroundColor: "#E8F5E9",
        iconColor: "#43A047",
        borderColor: "#43A04740",
        backgroundColorHex: "#E8F5E9",
        iconColorHex: "#43A047",
      },
      other: {
        backgroundColor: "#E0E0E0",
        iconColor: "#757575",
        borderColor: "#75757540",
        backgroundColorHex: "#d4d8e2ff",
        iconColorHex: "#53636aff",
      },
    },
  },

  // ─── Centralised palette (added by the colour refactor) ───────────────────
  // Every value below already existed inline somewhere in the app and is
  // reproduced here byte-for-byte in canonical form — no colour was changed,
  // invented or re-tuned. Only values used in 2+ places were promoted;
  // genuine one-offs deliberately stay inline rather than becoming
  // meaningless names. Alpha variants of brand colours are named after the
  // colour they tint (primaryAlpha08 = the primary at 8% opacity).

  // Opaque tones
  blackSolid: "#000000", // 49x, 26 file(s)
  blueDark: "#1a1e4a", // 18x, 5 file(s)
  white2: "#eceff9", // 15x, 3 file(s)
  blue: "#8892b0", // 15x, 4 file(s)
  white4: "#eef0ff", // 14x, 5 file(s)
  blueDark2: "#1b1f45", // 12x, 3 file(s)
  blueDark3: "#0b1544", // 7x, 7 file(s)
  greyLight: "#e5e7eb", // 7x, 6 file(s)
  blue2: "#6b7db3", // 7x, 4 file(s)
  teal: "#4ecdc4", // 6x, 6 file(s)
  teal2: "#79b7b0", // 6x, 5 file(s)
  black2: "rgb(13,14,26)", // 6x, 2 file(s)
  yellow: "#bfa824", // 5x, 4 file(s)
  indigo: "#9b6fc1", // 5x, 4 file(s)
  white6: "#e9ecef", // 5x, 1 file(s)
  blue3: "#465493", // 4x, 1 file(s)
  greyLight2: "rgb(234,233,233)", // 4x, 2 file(s)
  yellowDark: "#3d3000", // 4x, 2 file(s)
  purpleDark: "#4a1030", // 4x, 2 file(s)
  tealDark: "#0d3328", // 4x, 2 file(s)
  teal3: "#80cbc4", // 4x, 2 file(s)
  greenDark: "#0d3318", // 4x, 2 file(s)
  indigoLight: "#d3c2e23a", // 4x, 3 file(s)
  black3: "#1b1919", // 4x, 1 file(s)
  white7: "#e8e9ef", // 4x, 1 file(s)
  white8: "#f4f4fa", // 4x, 1 file(s)
  white9: "rgb(238,238,238)", // 4x, 2 file(s)
  black4: "#050505", // 4x, 3 file(s)
  blue4: "#4a5a8a", // 4x, 2 file(s)
  blueLight: "#dde3ff", // 4x, 2 file(s)
  green2: "#34a853", // 3x, 2 file(s)
  red2: "#ff6b6b", // 3x, 3 file(s)
  green3: "#95e06c", // 3x, 3 file(s)
  indigoLight2: "#a78bfa", // 3x, 3 file(s)
  blue5: "#60a5fa", // 3x, 3 file(s)
  orange2: "#fbbf24", // 3x, 3 file(s)
  orange3: "#f97316", // 3x, 3 file(s)
  pink: "#ec4899", // 3x, 3 file(s)
  teal4: "#14b8a6", // 3x, 3 file(s)
  indigo2: "#8b5cf6", // 3x, 3 file(s)
  red3: "#f43f5e", // 3x, 3 file(s)
  teal5: "#06b6d4", // 3x, 3 file(s)
  orange4: "#d97706", // 3x, 3 file(s)
  greyLight3: "#cccccc", // 3x, 3 file(s)
  orange5: "#f4b740", // 3x, 3 file(s)
  blue6: "rgb(174,179,200)", // 3x, 1 file(s)
  blue7: "#7a6bff", // 3x, 3 file(s)
  teal6: "#45b7d1", // 3x, 3 file(s)
  green4: "#96ceb4", // 3x, 3 file(s)
  blue8: "#5768fe", // 3x, 3 file(s)
  purpleLight: "#ff9ff3", // 3x, 3 file(s)
  blueLight2: "#cbd5e1", // 3x, 1 file(s)
  greyLight4: "#e2e8f0", // 3x, 2 file(s)
  greyDark: "#41444a", // 3x, 1 file(s)
  blueLight3: "#e4e8fb", // 3x, 1 file(s)
  secondarySolid: "#dd53a820", // 3x, 3 file(s)
  green5: "#71a5821a", // 3x, 2 file(s)
  greyDark2: "#22282d", // 3x, 1 file(s)
  greyDark3: "#333333", // 3x, 3 file(s)
  blueLight4: "#e8ebfa", // 2x, 1 file(s)
  blue9: "#314495", // 2x, 2 file(s)
  blue10: "#5e617d", // 2x, 1 file(s)
  blueDark4: "#23273b", // 2x, 2 file(s)
  blueDark5: "#1a1d2c", // 2x, 2 file(s)
  greyLight5: "#b4b6b8", // 2x, 2 file(s)
  orange6: "#ffa726", // 2x, 1 file(s)
  grey2: "#757575", // 2x, 1 file(s)
  greyDark4: "rgb(53,52,57)", // 2x, 2 file(s)
  redLight: "#ffe0e0", // 2x, 2 file(s)
  red4: "#c0392b", // 2x, 2 file(s)
  orangeLight: "#ffe8cc", // 2x, 2 file(s)
  orange7: "#d35400", // 2x, 2 file(s)
  yellowLight: "#fff4cc", // 2x, 2 file(s)
  yellow2: "#b7950b", // 2x, 2 file(s)
  white10: "#e8f8e8", // 2x, 2 file(s)
  green6: "#1e8449", // 2x, 2 file(s)
  blueLight5: "#e0f4ff", // 2x, 2 file(s)
  blue11: "#1a6fa8", // 2x, 2 file(s)
  indigoLight3: "#ede0ff", // 2x, 2 file(s)
  indigo3: "#6c3483", // 2x, 2 file(s)
  purpleLight2: "#ffe0f4", // 2x, 2 file(s)
  red5: "#a93226", // 2x, 2 file(s)
  greenLight: "#e0fff4", // 2x, 2 file(s)
  tealDark2: "#117a65", // 2x, 2 file(s)
  orangeLight2: "#fff0e0", // 2x, 2 file(s)
  orange8: "#ca6f1e", // 2x, 2 file(s)
  indigoLight4: "#e8e0ff", // 2x, 2 file(s)
  indigo4: "#5b2c6f", // 2x, 2 file(s)
  greenLight2: "#e0ffea", // 2x, 2 file(s)
  greenDark2: "#1d6a39", // 2x, 2 file(s)
  pinkLight: "#ffe0ec", // 2x, 2 file(s)
  red6: "#922b21", // 2x, 2 file(s)
  blueLight6: "#e0f0ff", // 2x, 2 file(s)
  blue12: "#1a5276", // 2x, 2 file(s)
  orangeLight3: "#ffeee0", // 2x, 2 file(s)
  orange9: "#ba4a00", // 2x, 2 file(s)
  greenLight3: "#e8ffe0", // 2x, 2 file(s)
  greenDark3: "#196f3d", // 2x, 2 file(s)
  indigoLight5: "#f0e0ff", // 2x, 2 file(s)
  indigo5: "#76448a", // 2x, 2 file(s)
  tealLight: "#e0faff", // 2x, 2 file(s)
  teal7: "#148f77", // 2x, 2 file(s)
  orangeLight4: "#ffe8e0", // 2x, 2 file(s)
  red7: "#cb4335", // 2x, 2 file(s)
  purpleLight3: "#ffe0f6", // 2x, 2 file(s)
  purple: "#71245c", // 2x, 2 file(s)
  yellow3: "#9a7d0a", // 2x, 2 file(s)
  blueLight7: "#e0e8ff", // 2x, 2 file(s)
  blue13: "#1f3e8c", // 2x, 2 file(s)
  indigoLight6: "#f8e0ff", // 2x, 2 file(s)
  indigo6: "#7d3c98", // 2x, 2 file(s)
  tealLight2: "#e0fff8", // 2x, 2 file(s)
  tealDark3: "#0b6e4f", // 2x, 2 file(s)
  purpleLight4: "#ffe0f8", // 2x, 2 file(s)
  red8: "#943126", // 2x, 2 file(s)
  greenLight4: "#f4ffe0", // 2x, 2 file(s)
  green7: "#4a7c1f", // 2x, 2 file(s)
  tealLight3: "#e0f8ff", // 2x, 2 file(s)
  teal8: "#1a6b8a", // 2x, 2 file(s)
  redDark: "#4a1010", // 2x, 2 file(s)
  redLight2: "#ff8a80", // 2x, 2 file(s)
  orangeDark: "#4a2800", // 2x, 2 file(s)
  orange10: "#ffb74d", // 2x, 2 file(s)
  yellowLight2: "#ffe082", // 2x, 2 file(s)
  greenDark4: "#0d3320", // 2x, 2 file(s)
  green8: "#69f0ae", // 2x, 2 file(s)
  blueDark6: "#0d2a40", // 2x, 2 file(s)
  blue14: "#64b5f6", // 2x, 2 file(s)
  indigoDark: "#2a1040", // 2x, 2 file(s)
  purple2: "#ce93d8", // 2x, 2 file(s)
  pinkLight2: "#ff80ab", // 2x, 2 file(s)
  orangeDark2: "#3d2200", // 2x, 2 file(s)
  orangeLight5: "#ffcc80", // 2x, 2 file(s)
  indigoDark2: "#1e0e40", // 2x, 2 file(s)
  indigo7: "#b39ddb", // 2x, 2 file(s)
  green9: "#a5d6a7", // 2x, 2 file(s)
  pinkDark: "#4a0d20", // 2x, 2 file(s)
  pinkLight3: "#f48fb1", // 2x, 2 file(s)
  blueDark7: "#0d2540", // 2x, 2 file(s)
  blueLight8: "#90caf9", // 2x, 2 file(s)
  orangeDark3: "#3d1e00", // 2x, 2 file(s)
  orange11: "#ffab76", // 2x, 2 file(s)
  greenLight5: "#c8e6c9", // 2x, 2 file(s)
  indigoDark3: "#280d40", // 2x, 2 file(s)
  purple3: "#e040fb", // 2x, 2 file(s)
  tealDark4: "#0d3330", // 2x, 2 file(s)
  teal9: "#80deea", // 2x, 2 file(s)
  orangeDark4: "#4a1500", // 2x, 2 file(s)
  red9: "#ff7043", // 2x, 2 file(s)
  purpleDark2: "#3d0a30", // 2x, 2 file(s)
  purpleLight5: "#f48fd8", // 2x, 2 file(s)
  yellow4: "#ffd54f", // 2x, 2 file(s)
  blueDark8: "#0d1a40", // 2x, 2 file(s)
  blueLight9: "#82b1ff", // 2x, 2 file(s)
  indigoDark4: "#2e0d40", // 2x, 2 file(s)
  purple4: "#ea80fc", // 2x, 2 file(s)
  red10: "#ff6d8a", // 2x, 2 file(s)
  greenDark5: "#1e3300", // 2x, 2 file(s)
  greenLight6: "#ccff90", // 2x, 2 file(s)
  tealDark5: "#0d2e3d", // 2x, 2 file(s)
  tealLight4: "#80d8ff", // 2x, 2 file(s)
  white11: "#f0f0f0", // 2x, 2 file(s)
  greyDark5: "#555555", // 2x, 2 file(s)
  blueLight10: "#e8e8ff", // 2x, 2 file(s)
  blue15: "#333399", // 2x, 2 file(s)
  pinkLight4: "#ffe8f0", // 2x, 2 file(s)
  pink2: "#993355", // 2x, 2 file(s)
  greyDark6: "#2a2a2a", // 2x, 2 file(s)
  blueDark9: "#1a1a33", // 2x, 2 file(s)
  blueLight11: "#9999ff", // 2x, 2 file(s)
  pinkDark2: "#330d1a", // 2x, 2 file(s)
  pinkLight5: "#ff99bb", // 2x, 2 file(s)
  blue16: "#667eea", // 2x, 2 file(s)
  white12: "#eef1fb", // 2x, 2 file(s)
  blue17: "#7c8cdd", // 2x, 1 file(s)
  blue18: "#4c669f", // 2x, 1 file(s)
  green10: "#5ac567", // 2x, 1 file(s)
  orange12: "#f5a623", // 2x, 1 file(s)
  blue19: "#5c61aa", // 2x, 1 file(s)
  blueLight12: "#e8eaff", // 2x, 2 file(s)
  white13: "#f4f6ff", // 2x, 1 file(s)
  blueDark10: "#1a1a2e", // 2x, 1 file(s)
  grey3: "#aaaaaa", // 2x, 2 file(s)
  teal10: "#2bb6a3", // 2x, 1 file(s)
  blue20: "#9aa3c4", // 2x, 1 file(s)
  blue21: "#8094c8", // 2x, 1 file(s)
  white14: "#f6f7f9", // 2x, 2 file(s)
  black5: "rgb(19,19,21)", // 2x, 1 file(s)
  black6: "rgb(23,24,33)", // 2x, 1 file(s)
  greyDark7: "#26292f", // 2x, 1 file(s)
  blue22: "#4a5580", // 2x, 2 file(s)
  blue23: "#838aa8", // 2x, 1 file(s)
  blueDark11: "#1e2240", // 2x, 1 file(s)
  blueLight13: "#d1d5e8", // 2x, 1 file(s)
  black7: "rgb(10,12,27)", // 2x, 1 file(s)

  // Translucent overlays / tints
  whiteAlpha10: "rgba(255,255,255,0.1)", // 28x, 21 file(s)
  whiteAlpha08: "rgba(255,255,255,0.08)", // 14x, 11 file(s)
  whiteAlpha04: "rgba(255,255,255,0.04)", // 13x, 10 file(s)
  primaryAlpha08: "rgba(37,50,117,0.08)", // 11x, 5 file(s)
  slateAlpha08: "rgba(17,24,39,0.08)", // 10x, 9 file(s)
  primaryAlpha10: "rgba(37,50,117,0.1)", // 10x, 8 file(s)
  primary2Alpha15: "rgba(69,87,176,0.15)", // 10x, 5 file(s)
  primaryAlpha06: "rgba(37,50,117,0.06)", // 7x, 4 file(s)
  primary2Alpha20: "rgba(69,87,176,0.2)", // 7x, 6 file(s)
  whiteAlpha05: "rgba(255,255,255,0.05)", // 6x, 5 file(s)
  indigoAlpha20: "rgba(126,115,158,0.2)", // 6x, 2 file(s)
  whiteAlpha90: "rgba(255,255,255,0.9)", // 6x, 4 file(s)
  primary2Alpha12: "rgba(69,87,176,0.12)", // 6x, 3 file(s)
  primaryAlpha07: "rgba(37,50,117,0.07)", // 5x, 5 file(s)
  whiteAlpha18: "rgba(255,255,255,0.18)", // 5x, 4 file(s)
  primary2Alpha40: "rgba(69,87,176,0.4)", // 5x, 3 file(s)
  greyLightAlpha48: "rgba(215,215,215,0.48)", // 4x, 3 file(s)
  blackAlpha06: "rgba(0,0,0,0.06)", // 4x, 4 file(s)
  yellowAlpha10: "rgba(255,215,0,0.1)", // 4x, 3 file(s)
  blueAlpha34: "rgba(87,84,121,0.34)", // 4x, 2 file(s)
  primaryAlpha15: "rgba(37,50,117,0.15)", // 4x, 3 file(s)
  primary2Alpha18: "rgba(69,87,176,0.18)", // 4x, 4 file(s)
  primaryAlpha12: "rgba(37,50,117,0.12)", // 4x, 2 file(s)
  blackAlpha45: "rgba(0,0,0,0.45)", // 3x, 2 file(s)
  whiteAlpha12: "rgba(255,255,255,0.12)", // 3x, 3 file(s)
  slateAlpha06: "rgba(17,24,39,0.06)", // 3x, 3 file(s)
  whiteAlpha14: "rgba(255,255,255,0.14)", // 3x, 2 file(s)
  whiteAlpha22: "rgba(255,255,255,0.22)", // 3x, 3 file(s)
  whiteAlpha50: "rgba(255,255,255,0.5)", // 3x, 3 file(s)
  whiteAlpha75: "rgba(255,255,255,0.75)", // 3x, 3 file(s)
  blackAlpha10: "rgba(0,0,0,0.1)", // 3x, 3 file(s)
  whiteAlpha40: "rgba(255,255,255,0.4)", // 3x, 2 file(s)
  primaryAlpha90: "rgba(37,50,117,0.9)", // 3x, 3 file(s)
  primaryAlpha92: "rgba(37,50,117,0.92)", // 3x, 3 file(s)
  whiteAlpha66: "rgba(239,239,250,0.66)", // 3x, 1 file(s)
  blackAlpha60: "rgba(0,0,0,0.6)", // 2x, 2 file(s)
  whiteAlpha16: "rgba(255,255,255,0.16)", // 2x, 2 file(s)
  greyDarkAlpha71: "rgba(71,72,82,0.71)", // 2x, 1 file(s)
  slateAlpha55: "rgba(17,24,39,0.55)", // 2x, 2 file(s)
  greyLightAlpha25: "rgba(222,219,219,0.25)", // 2x, 2 file(s)
  orangeAlpha14: "rgba(244,183,64,0.14)", // 2x, 1 file(s)
  whiteAlpha45: "rgba(255,255,255,0.45)", // 2x, 2 file(s)
  whiteAlpha98: "rgba(255,255,255,0.98)", // 2x, 2 file(s)
  whiteAlpha07: "rgba(255,255,255,0.07)", // 2x, 2 file(s)
  whiteAlpha61: "rgba(255,255,255,0.61)", // 2x, 1 file(s)
  blackAlpha30: "rgba(0,0,0,0.3)", // 2x, 2 file(s)
  blackAlpha55: "rgba(0,0,0,0.55)", // 2x, 2 file(s)
  blackAlpha03: "rgba(13,14,20,0.03)", // 2x, 1 file(s)
  primary2Alpha25: "rgba(69,87,176,0.25)", // 2x, 2 file(s)

  filterActiveGradient: ["#200f61ff", "#293b96ff"] as const,
};

export default Colors;
