import { colors, radius, shadow } from "../styles/tokens";

// <Modal aberto={...} onClose={...} titulo="..." maxWidth={520}>...</Modal>
export default function Modal({
  aberto,
  onClose,
  titulo,
  children,
  maxWidth = 520,
  footer,
}) {
  if (!aberto) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...modalStyle, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {titulo && (
          <div style={titleStyle}>
            <span>{titulo}</span>
            <button style={btnFechar} onClick={onClose} aria-label="Fechar">
              ✕
            </button>
          </div>
        )}
        {children}
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.46)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
};

const modalStyle = {
  background: colors.surface,
  borderRadius: radius.xl,
  padding: 22,
  width: "100%",
  maxHeight: "92vh",
  overflowY: "auto",
  boxShadow: shadow.modal,
};

const titleStyle = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const btnFechar = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  background: "transparent",
  border: `1.5px solid ${colors.border}`,
  color: colors.text,
};

const footerStyle = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 16,
  paddingTop: 14,
  borderTop: `1px solid ${colors.border}`,
};
