// ─── Design tokens do FarmaFy ────────────────────────────────────────────────
// Fonte única da verdade pra cores, raios, sombras.
// Quando quiser virar dark-mode, brand-mode, etc., mexe só aqui.

export const colors = {
  // marca
  brand:        "#0d7a45",
  brandDark:    "#0a6238",
  brandText:    "#065f46",
  brandBgSoft:  "#ecfdf5",
  brandBgSoft2: "#edf7f2",
  brandBorder:  "#6ee7b7",

  // perigo / erro
  danger:       "#dc2626",
  dangerDark:   "#b91c1c",
  dangerBgSoft: "#fef2f2",
  dangerBorder: "#fca5a5",

  // alerta / atenção
  warning:        "#c47700",
  warningDark:    "#92400e",
  warningBgSoft:  "#fff3d6",
  warningBgSoft2: "#fffbeb",
  warningBorder:  "#fcd34d",
  warningBorder2: "#fde68a",

  // info
  info:        "#1251a3",
  infoBgSoft:  "#e8f0fb",
  infoBorder:  "#bfdbfe",

  // neutros
  text:        "#0f172a",
  textMuted:   "#475569",
  textSubtle:  "#64748b",
  textFaint:   "#94a3b8",

  border:      "#e2e8f0",
  borderStrong:"#cbd5e1",

  surface:     "#fff",
  surfaceAlt:  "#f8fafc",
  surfaceMute: "#f1f5f9",

  // chrome
  sidebar:     "#0f172a",
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
};

export const shadow = {
  card:  "0 1px 4px rgba(0,0,0,.08)",
  modal: "0 8px 40px rgba(0,0,0,.18)",
  toast: "0 4px 20px rgba(0,0,0,.2)",
};

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
};
