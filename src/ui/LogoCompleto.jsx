import { colors } from "../styles/tokens";
import Logo from "./Logo";

/**
 * Composição completa da marca:
 *
 *      Farma  [pílula]  fy
 *           FarmaFy
 *
 * O texto "Farma|fy" abraça a pílula no ponto onde os dois tons se separam.
 * Embaixo, o nome "FarmaFy" aparece em peso menor como assinatura.
 *
 * Props:
 *  size : tamanho da pílula em px (largura). Default 96.
 *         O texto escala proporcionalmente.
 */
export default function LogoCompleto({ size = 96 }) {
  // Texto das laterais é cerca de metade da largura da pílula
  const fontLat = Math.round(size * 0.36);
  // Nome embaixo é menor e mais leve
  const fontMarca = Math.round(size * 0.22);

  return (
    <div style={styles.wrapper}>
      <div style={styles.composicao}>
        <span style={{ ...styles.lateral, fontSize: fontLat, color: colors.brandDark }}>
          Farma
        </span>
        <Logo size={size} />
        <span style={{ ...styles.lateral, fontSize: fontLat, color: colors.brand }}>
          fy
        </span>
      </div>
      <div style={{ ...styles.marca, fontSize: fontMarca }}>FarmaFy</div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  composicao: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  lateral: {
    fontFamily: '"Outfit", system-ui, -apple-system, sans-serif',
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  marca: {
    fontFamily: '"Outfit", system-ui, -apple-system, sans-serif',
    fontWeight: 300,
    color: colors.textSubtle,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    marginTop: 4,
  },
};
