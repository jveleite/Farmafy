import { useEffect, useState } from "react";
import { listarVendas, listarItensDaVenda } from "../services/vendas.service";
import { fmt, fmtDataHora, matchStr } from "../lib/format";
import { colors, radius, shadow } from "../styles/tokens";
import Input from "../ui/Input";
import Tag from "../ui/Tag";

export default function HistoricoVendas() {
  const [vendas, setVendas]                       = useState([]);
  const [vendaSelecionada, setVendaSelecionada]   = useState(null);
  const [itensVenda, setItensVenda]               = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [busca, setBusca]                         = useState("");

  useEffect(() => { buscarVendas(); }, []);

  async function buscarVendas() {
    setLoading(true);
    try {
      setVendas(await listarVendas());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function abrirVenda(venda) {
    setVendaSelecionada(venda);
    try {
      setItensVenda(await listarItensDaVenda(venda.id));
    } catch (e) {
      console.error(e);
    }
  }

  const vendasFiltradas = vendas.filter((v) => matchStr(v.cliente_nome, busca));

  return (
    <div style={styles.container}>
      {/* LISTA */}
      <div style={styles.left}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, marginBottom: 12 }}>📜 Histórico de Vendas</h2>
          <Input
            placeholder="🔍 Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div style={styles.lista}>
          {loading && <div style={styles.empty}>Carregando vendas...</div>}

          {!loading && vendasFiltradas.length === 0 && (
            <div style={styles.empty}>Nenhuma venda encontrada.</div>
          )}

          {vendasFiltradas.map((venda) => {
            const ativa = vendaSelecionada?.id === venda.id;
            return (
              <div
                key={venda.id}
                onClick={() => abrirVenda(venda)}
                style={{
                  ...styles.card,
                  border: `${ativa ? 2 : 1}px solid ${ativa ? colors.brand : colors.border}`,
                }}
              >
                <div style={styles.cardTop}>
                  <strong>Venda #{venda.id}</strong>
                  <Tag variant="success">{venda.pagamento}</Tag>
                </div>
                <div style={styles.nome}>
                  👤 {venda.cliente_nome || "Não identificado"}
                </div>
                <div style={styles.total}>{fmt(venda.total)}</div>
                <div style={styles.data}>{fmtDataHora(venda.created_at)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETALHES */}
      <div style={styles.right}>
        {!vendaSelecionada ? (
          <div style={styles.emptyRight}>
            <div style={{ fontSize: 48 }}>🧾</div>
            <div>Selecione uma venda</div>
          </div>
        ) : (
          <>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Venda #{vendaSelecionada.id}</h2>
                <div style={styles.detailCliente}>
                  👤 {vendaSelecionada.cliente_nome || "Não identificado"}
                </div>
              </div>
              <div style={styles.detailTotal}>{fmt(vendaSelecionada.total)}</div>
            </div>

            <div style={styles.infoBox}>
              <Info label="Pagamento" value={vendaSelecionada.pagamento} />
              <Info label="Recebido"  value={fmt(vendaSelecionada.recebido)} />
              <Info label="Troco"     value={fmt(vendaSelecionada.troco)} />
              <Info label="Data"      value={fmtDataHora(vendaSelecionada.created_at)} />
            </div>

            <div style={styles.itensBox}>
              <h3 style={{ marginTop: 0 }}>Produtos</h3>
              {itensVenda.map((item) => (
                <div key={item.id} style={styles.item}>
                  <div>
                    <strong>{item.produtos?.nome}</strong>
                    <div style={styles.itemQtd}>
                      {item.quantidade}x unidade(s)
                    </div>
                  </div>
                  <div style={styles.itemPreco}>
                    {fmt(item.preco_unitario * item.quantidade)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 20,
    minHeight: "100vh",
  },
  left: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    boxShadow: shadow.card,
  },
  right: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    overflowY: "auto",
    boxShadow: shadow.card,
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
  },
  card: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    cursor: "pointer",
    transition: "all .15s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nome: { fontSize: 14, color: colors.textMuted },
  total: {
    fontSize: 24,
    fontWeight: 800,
    color: colors.text,
    marginTop: 12,
  },
  data: { marginTop: 8, fontSize: 12, color: colors.textFaint },
  empty: { padding: 30, textAlign: "center", color: colors.textFaint },
  emptyRight: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 12,
    color: colors.textFaint,
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  detailCliente: { color: colors.textSubtle, marginTop: 4 },
  detailTotal: {
    fontSize: 30,
    fontWeight: 800,
    color: colors.brand,
    fontFamily: "monospace",
  },
  infoBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 14,
  },
  infoLabel: { fontSize: 12, color: colors.textSubtle, marginBottom: 6 },
  infoValue: { fontWeight: 700, color: colors.text },
  itensBox: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 18,
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: `1px solid ${colors.surfaceMute}`,
  },
  itemQtd: { fontSize: 13, color: colors.textSubtle, marginTop: 4 },
  itemPreco: {
    fontWeight: 700,
    color: colors.brand,
    fontFamily: "monospace",
  },
};
