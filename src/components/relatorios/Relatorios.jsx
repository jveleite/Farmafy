import { useEffect, useState } from "react";
import { gerarRelatorio } from "../../services/relatorios.service";
import { useToast } from "../../ui/Toast";
import { colors } from "../../styles/tokens";
import SeletorPeriodo, { intervaloDoPeriodo } from "./SeletorPeriodo";
import CardsResumo from "./CardsResumo";
import TopProdutos from "./TopProdutos";
import VendasPorPagamento from "./VendasPorPagamento";

/**
 * Tela de Relatórios — orquestra filtro de período + métricas.
 */
export default function Relatorios() {
  const toast = useToast();
  const [periodo, setPeriodo] = useState("hoje");
  const [loading, setLoading] = useState(true);
  const [dados, setDados]     = useState(null);

  useEffect(() => {
    carregar(periodo);
  }, [periodo]);

  async function carregar(chave) {
    setLoading(true);
    try {
      const [ini, fim] = intervaloDoPeriodo(chave);
      setDados(await gerarRelatorio(ini, fim));
    } catch (e) {
      toast("Erro ao gerar relatório: " + e.message, "erro");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>📊 Relatórios</h2>

      <SeletorPeriodo ativo={periodo} onChange={setPeriodo} />

      {loading || !dados ? (
        <div style={styles.loading}>Carregando...</div>
      ) : (
        <>
          <CardsResumo
            qtdVendas={dados.qtdVendas}
            faturamento={dados.faturamento}
            lucroEstimado={dados.lucroEstimado}
            ticketMedio={dados.ticketMedio}
          />

          <div style={styles.grid2}>
            <TopProdutos produtos={dados.topProdutos} />
            <VendasPorPagamento itens={dados.porPagamento} />
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  loading: { color: colors.textSubtle, padding: 30, textAlign: "center" },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 14,
  },
};
