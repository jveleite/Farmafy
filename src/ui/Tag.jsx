import { colors, radius } from "../styles/tokens";

// variant: "neutral" | "success" | "danger" | "warning" | "info"
export default function Tag({ variant = "neutral", children, style }) {
  return (
    <span style={{ ...base, ...palette[variant], ...style }}>
      {children}
    </span>
  );
}

const base = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 7px",
  borderRadius: radius.pill,
  fontSize: 11,
  fontWeight: 700,
};

const palette = {
  success: { background: colors.brandBgSoft2, color: colors.brand },
  danger:  { background: colors.dangerBgSoft, color: colors.dangerDark },
  warning: { background: colors.warningBgSoft, color: colors.warning },
  info:    { background: colors.infoBgSoft,    color: colors.info },
  neutral: { background: colors.surfaceMute,   color: colors.textSubtle },
};
