import { colors, radius } from "../../styles/tokens";

/**
 * Barra horizontal proporcional a `valor / max`. Visual minimalista,
 * sem biblioteca de gráficos.
 *
 * Props:
 *  valor : number
 *  max   : number  (referência pro 100%)
 *  cor   : string  (default brand)
 */
export default function BarraSimples({ valor, max, cor }) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div style={styles.trilha}>
      <div
        style={{
          ...styles.preenchimento,
          width: `${pct}%`,
          background: cor || colors.brand,
        }}
      />
    </div>
  );
}

const styles = {
  trilha: {
    width: "100%",
    height: 8,
    background: colors.surfaceMute,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  preenchimento: {
    height: "100%",
    transition: "width .3s ease",
    borderRadius: radius.pill,
  },
};
