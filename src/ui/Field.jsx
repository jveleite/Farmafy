import { colors } from "../styles/tokens";

// Wrapper rótulo + filho. Substitui o `Campo` duplicado em Produtos e Clientes.
export default function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 11, ...style }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".3px",
  color: colors.textSubtle,
  marginBottom: 4,
};
