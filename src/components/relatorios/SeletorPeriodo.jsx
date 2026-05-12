import { colors, radius } from "../../styles/tokens";

/**
 * Botões de filtro de período. Cada um devolve { ini, fim } como Date.
 *
 * Props:
 *  ativo    : "hoje" | "7d" | "30d" | "mes"
 *  onChange : (chave) => void
 */
const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d",   label: "7 dias" },
  { value: "30d",  label: "30 dias" },
  { value: "mes",  label: "Mês atual" },
];

export default function SeletorPeriodo({ ativo, onChange }) {
  return (
    <div style={styles.barra}>
      {PERIODOS.map((p) => {
        const isAtivo = p.value === ativo;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            style={{
              ...styles.btn,
              background:  isAtivo ? colors.brand : colors.surface,
              color:       isAtivo ? "#fff" : colors.textMuted,
              borderColor: isAtivo ? colors.brand : colors.border,
              fontWeight:  isAtivo ? 700 : 500,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Devolve [dataIni, dataFim] (Date) pra uma chave de período.
 */
export function intervaloDoPeriodo(chave) {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  fim.setDate(fim.getDate() + 1); // próximo dia 00:00 (limite exclusivo)

  const ini = new Date();
  ini.setHours(0, 0, 0, 0);

  if (chave === "hoje") {
    return [ini, fim];
  }
  if (chave === "7d") {
    ini.setDate(ini.getDate() - 6);
    return [ini, fim];
  }
  if (chave === "30d") {
    ini.setDate(ini.getDate() - 29);
    return [ini, fim];
  }
  if (chave === "mes") {
    ini.setDate(1);
    return [ini, fim];
  }
  return [ini, fim];
}

const styles = {
  barra: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  btn: {
    padding: "8px 16px",
    border: "1.5px solid",
    borderRadius: radius.md,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
  },
};
