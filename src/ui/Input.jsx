import { forwardRef } from "react";
import { colors, radius } from "../styles/tokens";

const Input = forwardRef(function Input({ style, ...rest }, ref) {
  return <input ref={ref} {...rest} style={{ ...base, ...style }} />;
});

export default Input;

const base = {
  fontFamily: "inherit",
  fontSize: 14,
  padding: "8px 10px",
  border: `1.5px solid ${colors.border}`,
  borderRadius: radius.md,
  width: "100%",
  background: colors.surface,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
};
