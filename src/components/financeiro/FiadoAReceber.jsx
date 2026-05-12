import { useEffect, useMemo, useState } from "react";
import { listarFiadoAberto, quitarFiado } from "../../services/financeiro.service";
import { useToast } from "../../ui/Toast";
import { fmt, fmtData } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Tag from "../../ui/Tag";

/**
 * Lista de vendas em fiado agrupadas por cliente.
 * Botão "Quitar" preenche fiado_quitado_em.
 */
export default function FiadoAReceber() {
  const toast = useToast();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      setVendas(await listarFiadoAberto());
    } catch (e) {
      toast("Erro ao carregar fiado: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function quitar(venda) {
    if (!confirm(`Marcar venda #${venda.id} de ${venda.cliente_nome} como paga?`)) return;
    try {
      await quitarFiado(venda.id);
      toast("Fiado quitado!");
      carregar();
    } catch (e) {
      toast("Erro ao quitar: " + e.message, "erro");
    }
  }

  // Agrupa por cliente
  const grupos = useMemo(() => {
    const m = new Map();
    for (const v of vendas) {
      const chave = `${v.cliente_id ?? 0}|${v.cliente_nome || "—"}`;
      const prev = m.get(chave) || { nome: v.cliente_nome || "—", total: 0, vendas: [] };
      m.set(chave, { ...prev, total: prev.total + Number(v.total), vendas: [...prev.vendas, v] });
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [vendas]);

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  if (vendas.length === 0) {
    return (
      <div style={styles.vazio}>
        🎉 Nenhum fiado em aberto.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {grupos.map((g, i) => (
        <div key={i} style={styles.grupo}>
          <div style={styles.cabecalho}>
            <strong style={{ fontSize: 15 }}>👤 {g.nome}</strong>
            <Tag variant="danger">⚠️ {fmt(g.total)}</Tag>
          </div>
          <div style={styles.lista}>
            {g.vendas.map((v) => (
              <div key={v.id} style={styles.linha}>
                <div>
                  <b>Venda #{v.id}</b>
                  <span style={{ color: colors.textSubtle, marginLeft: 8 }}>
                    {fmtData(v.created_at)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <b style={{ fontFamily: "monospace" }}>{fmt(v.total)}</b>
                  <Button size="sm" onClick={() => quitar(v)}>✓ Quitar</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  loading: { padding: 30, color: colors.textSubtle, textAlign: "center" },
  vazio: {
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.xl,
    padding: 30,
    textAlign: "center",
    color: colors.brandText,
    fontWeight: 600,
  },
  grupo: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    overflow: "hidden",
    boxShadow: shadow.card,
  },
  cabecalho: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: colors.surfaceAlt,
    borderBottom: `1px solid ${colors.border}`,
  },
  lista: { display: "flex", flexDirection: "column" },
  linha: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: `1px solid ${colors.surfaceMute}`,
    fontSize: 13,
  },
};
