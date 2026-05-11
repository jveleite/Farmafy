import { useEffect, useState } from "react";
import { listarVendas, listarItensDaVenda } from "../services/vendas.service";
import { fmt, fmtDataHora, matchStr } from "../lib/format";

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState([]);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [itensVenda, setItensVenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    buscarVendas();
  }, []);

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

  const vendasFiltradas = vendas.filter((v) =>
    matchStr(v.cliente_nome, busca)
  );

  return (
    <div style={styles.container}>

      {/* LISTA */}
      <div style={styles.left}>

        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>📜 Histórico de Vendas</h2>

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.lista}>

          {loading && (
            <div style={styles.empty}>
              Carregando vendas...
            </div>
          )}

          {!loading && vendasFiltradas.length === 0 && (
            <div style={styles.empty}>
              Nenhuma venda encontrada.
            </div>
          )}

          {vendasFiltradas.map((venda) => (
            <div
              key={venda.id}
              style={{
                ...styles.card,
                border:
                  vendaSelecionada?.id === venda.id
                    ? "2px solid #0d7a45"
                    : "1px solid #e2e8f0",
              }}
              onClick={() => abrirVenda(venda)}
            >
              <div style={styles.cardTop}>
                <strong>Venda #{venda.id}</strong>

                <span style={styles.pagamento}>
                  {venda.pagamento}
                </span>
              </div>

              <div style={styles.nome}>
                👤 {venda.cliente_nome || "Não identificado"}
              </div>

              <div style={styles.total}>
                {fmt(venda.total)}
              </div>

              <div style={styles.data}>
                {fmtDataHora(venda.created_at)}
              </div>
            </div>
          ))}
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
                <h2 style={{ margin: 0 }}>
                  Venda #{vendaSelecionada.id}
                </h2>

                <div style={styles.detailCliente}>
                  👤 {vendaSelecionada.cliente_nome || "Não identificado"}
                </div>
              </div>

              <div style={styles.detailTotal}>
                {fmt(vendaSelecionada.total)}
              </div>
            </div>

            <div style={styles.infoBox}>
              <Info
                label="Pagamento"
                value={vendaSelecionada.pagamento}
              />

              <Info
                label="Recebido"
                value={fmt(vendaSelecionada.recebido)}
              />

              <Info
                label="Troco"
                value={fmt(vendaSelecionada.troco)}
              />

              <Info
                label="Data"
                value={new Date(
                  vendaSelecionada.created_at
                ).toLocaleString("pt-BR")}
              />
            </div>

            <div style={styles.itensBox}>
              <h3 style={{ marginTop: 0 }}>
                Produtos
              </h3>

              {itensVenda.map((item) => (
                <div key={item.id} style={styles.item}>
                  <div>
                    <strong>
                      {item.produtos?.nome}
                    </strong>

                    <div style={styles.itemQtd}>
                      {item.quantidade}x unidade(s)
                    </div>
                  </div>

                  <div style={styles.itemPreco}>
                    {fmt(
                      item.preco_unitario *
                        item.quantidade
                    )}
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
      <div style={styles.infoLabel}>
        {label}
      </div>

      <div style={styles.infoValue}>
        {value}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 20,
    padding: 20,
    minHeight: "100vh",
    background: "#f1f5f9",
  },

  left: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
  },

  right: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    overflowY: "auto",
  },

  header: {
    marginBottom: 16,
  },

  input: {
    width: "100%",
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  },

  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 14,
    cursor: "pointer",
    transition: ".15s",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  pagamento: {
    background: "#ecfdf5",
    color: "#0d7a45",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  nome: {
    fontSize: 14,
    color: "#475569",
  },

  total: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    marginTop: 12,
  },

  data: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
  },

  empty: {
    padding: 30,
    textAlign: "center",
    color: "#94a3b8",
  },

  emptyRight: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 12,
    color: "#94a3b8",
  },

  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  detailCliente: {
    color: "#64748b",
    marginTop: 4,
  },

  detailTotal: {
    fontSize: 30,
    fontWeight: 800,
    color: "#0d7a45",
  },

  infoBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
    gap: 12,
    marginBottom: 24,
  },

  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 14,
  },

  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 6,
  },

  infoValue: {
    fontWeight: 700,
    color: "#0f172a",
  },

  itensBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 18,
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },

  itemQtd: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  itemPreco: {
    fontWeight: 700,
    color: "#0d7a45",
  },
};