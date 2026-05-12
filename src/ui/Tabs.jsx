import { colors, radius } from "../styles/tokens";

/**
 * Barra horizontal de abas controlada.
 *
 * Props:
 *  abas    : [{ value, label, icon? }]
 *  ativa   : value da aba ativa
 *  onChange: (value) => void
 */
export default function Tabs({ abas, ativa, onChange }) {
  return (
    <div style={styles.barra}>
      {abas.map((aba) => {
        const isAtiva = aba.value === ativa;
        return (
          <button
            key={aba.value}
            onClick={() => onChange(aba.value)}
            style={{
              ...styles.aba,
              color: isAtiva ? colors.brand : colors.textSubtle,
              borderBottomColor: isAtiva ? colors.brand : "transparent",
              fontWeight: isAtiva ? 700 : 500,
            }}
          >
            {aba.icon && <span style={{ marginRight: 6 }}>{aba.icon}</span>}
            {aba.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  barra: {
    display: "flex",
    gap: 4,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 20,
  },
  aba: {
    background: "transparent",
    border: "none",
    borderBottom: "3px solid",
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
    marginBottom: -1,
  },
};
