import { colors, radius } from "../styles/tokens";

// variants: "primary" | "ghost" | "danger" | "warning" | "info"
// size: "sm" | "md"
export default function Button({
  variant = "primary",
  size = "md",
  children,
  style,
  ...rest
}) {
  return (
    <button {...rest} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

const base = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: radius.md,
  fontFamily: "inherit",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "filter .15s",
  whiteSpace: "nowrap",
};

const sizes = {
  sm: { padding: "5px 10px", fontSize: 12 },
  md: { padding: "7px 14px", fontSize: 13 },
};

const variants = {
  primary: {
    background: colors.brand,
    color: "#fff",
    border: "none",
  },
  ghost: {
    background: "transparent",
    color: colors.text,
    border: `1.5px solid ${colors.border}`,
  },
  danger: {
    background: colors.dangerBgSoft,
    color: colors.dangerDark,
    border: `1px solid ${colors.dangerBorder}`,
  },
  warning: {
    background: colors.warningBgSoft,
    color: colors.warning,
    border: `1px solid ${colors.warningBorder}`,
  },
  info: {
    background: colors.infoBgSoft,
    color: colors.info,
    border: `1px solid ${colors.infoBorder}`,
  },
};
