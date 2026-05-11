import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase";
import ModalPagamento from "./ModalPagamento";

// ─── Ícones inline ────────────────────────────────────────────────────────────
const Icon = {
  search:  () => <span style={{ fontSize: 16 }}>🔍</span>,
  trash:   () => <span style={{ fontSize: 14 }}>🗑️</span>,
  user:    () => <span style={{ fontSize: 14 }}>👤</span>,
  spinner: () => (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff",
      borderRadius: "50%", animation: "spin .7s linear infinite",
      verticalAlign: "middle", marginRight: 6,
    }} />
  ),
};

const PAGAMENTOS = [
  { value: "PIX",      label: "PIX",      emoji: "⚡" },
  { value: "Dinheiro", label: "Dinheiro", emoji: "💵" },
  { value: "Credito",  label: "Crédito",  emoji: "💳" },
  { value: "Debito",   label: "Débito",   emoji: "🏧" },
  { value: "Fiado",    label: "Fiado",    emoji: "🤝" },
];

export default function PDV() {
  const [produtos, setProdutos]                     = useState([]);
  const [clientes, setClientes]                     = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null); // { id, nome }
  const [buscaCliente, setBuscaCliente]             = useState("");
  const [busca, setBusca]                           = useState("");
  const [carrinho, setCarrinho]                     = useState([]);
  const [pagamento, setPagamento]                   = useState("PIX"); // forma pré-selecionada no PDV
  const [toast, setToast]                           = useState(null);
  const [finalizando, setFinalizando]               = useState(false);
  const [flashIds, setFlashIds]                     = useState(new Set());
  const [confirmLimpar, setConfirmLimpar]           = useState(false);
  const [modalPagamento, setModalPagamento]         = useState(false);
  const dropdownRef = useRef(null);
  const toastTimer  = useRef(null);

  // ── Fechar dropdown ao clicar fora ───────────────────────────────────────────
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setBuscaCliente("");
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => { buscarProdutos(); buscarClientes(); }, []);

  async function buscarProdutos() {
    const { data, error } = await supabase.from("produtos").select("*").gt("estoque", 0).order("nome");
    if (!error) setProdutos(data || []);
  }
  async function buscarClientes() {
    const { data, error } = await supabase.from("clientes").select("*").order("nome");
    if (!error) setClientes(data || []);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function mostrarToast(msg, tipo = "ok") {
    clearTimeout(toastTimer.current);
    setToast({ msg, tipo });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // ── Flash card ────────────────────────────────────────────────────────────────
  function dispararFlash(id) {
    setFlashIds(prev => new Set(prev).add(id));
    setTimeout(() => setFlashIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 500);
  }

  // ── Carrinho ──────────────────────────────────────────────────────────────────
  function adicionarProduto(produto) {
    const existe   = carrinho.find(i => i.id === produto.id);
    const qtdAtual = existe ? existe.quantidade : 0;
    if (qtdAtual >= produto.estoque) { mostrarToast("Estoque insuficiente.", "erro"); return; }
    dispararFlash(produto.id);
    if (existe) setCarrinho(c => c.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    else        setCarrinho(c => [...c, { ...produto, quantidade: 1 }]);
  }

  function alterarQuantidade(id, tipo) {
    setCarrinho(c => c.map(item => {
      if (item.id !== id) return item;
      if (tipo === "mais" && item.quantidade >= item.estoque) { mostrarToast("Estoque insuficiente.", "erro"); return item; }
      return { ...item, quantidade: Math.max(1, tipo === "mais" ? item.quantidade + 1 : item.quantidade - 1) };
    }));
  }

  function editarQuantidade(id, valor) {
    const estoqueMax = (produtos.find(p => p.id === id) ?? carrinho.find(i => i.id === id))?.estoque ?? 1;
    const qtd = Math.min(Math.max(1, Number(valor) || 1), estoqueMax);
    setCarrinho(c => c.map(i => i.id === id ? { ...i, quantidade: qtd } : i));
  }

  function removerItem(id) { setCarrinho(c => c.filter(i => i.id !== id)); }
  function limparCarrinho() { setCarrinho([]); setConfirmLimpar(false); }

  const total = useMemo(() => carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0), [carrinho]);

  const produtosFiltrados = useMemo(
    () => produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [produtos, busca]
  );
  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.toLowerCase();
    return clientes.filter(c => c.nome?.toLowerCase().includes(q) || c.telefone?.includes(q));
  }, [clientes, buscaCliente]);

  // ── Finalizar venda ───────────────────────────────────────────────────────────
  async function finalizarVenda(dadosPagamento) {
    if (carrinho.length === 0) { mostrarToast("Carrinho vazio.", "erro"); return; }
    setFinalizando(true);
    try {
      const { data: venda, error: erroVenda } = await supabase
        .from("vendas")
        .insert({
  cliente_id: dadosPagamento.cliente_id,
  cliente_nome: clienteSelecionado?.nome || "Não identificado",
  total,
  pagamento: dadosPagamento.formas.map(f => f.forma).join(" + "),
  recebido: dadosPagamento.recebido,
  troco: dadosPagamento.troco,
})
        .select().single();
      if (erroVenda) throw erroVenda;

      const { error: erroItens } = await supabase.from("itens_venda").insert(
        carrinho.map(item => ({
          venda_id: venda.id, produto_id: item.id,
          quantidade: item.quantidade, preco_unitario: item.preco,
        }))
      );
      if (erroItens) throw erroItens;

      await Promise.all(
        carrinho.map(item =>
          supabase.from("produtos").update({ estoque: item.estoque - item.quantidade }).eq("id", item.id)
        )
      );

      mostrarToast("✅ Venda finalizada com sucesso!");
      setCarrinho([]);
      setClienteSelecionado(null);
      buscarProdutos();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao finalizar venda.", "erro");
    } finally {
      setFinalizando(false);
    }
  }

  // ── Abrir modal já com a forma escolhida no PDV ───────────────────────────────
  function abrirModal() {
    if (carrinho.length === 0) { mostrarToast("Carrinho vazio.", "erro"); return; }
    setModalPagamento(true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes flash  { 0%,100%{background:#fff;} 50%{background:#d1fae5;} }
        .produto-card.flash { animation: flash .45s ease; }
        .carrinho-item { animation: fadeIn .2s ease; }
        .btn-forma { transition: all .15s; cursor: pointer; }
        .btn-forma:hover { filter: brightness(.96); }
        .btn-adicionar { transition: opacity .15s; }
        .btn-adicionar:disabled { opacity:.4; cursor:not-allowed; }
        .btn-adicionar:not(:disabled):hover { filter:brightness(1.1); }
        .cliente-item:hover { background:#f1f5f9; }
        .btn-finalizar { transition: filter .15s; }
        .btn-finalizar:not(:disabled):hover { filter:brightness(1.08); }
      `}</style>

      {/* ── Modal recebe a forma já escolhida ── */}
      <ModalPagamento
        aberto={modalPagamento}
        total={total}
        formaInicial={pagamento}                          // ← passa a forma pré-selecionada
        cliente={clienteSelecionado}
        onCancelar={() => setModalPagamento(false)}
        onConfirmar={(dadosPagamento) => {
          setModalPagamento(false);
          finalizarVenda(dadosPagamento);
        }}
      />

      <div style={styles.container}>

        {/* ════ PRODUTOS ════ */}
        <div style={styles.left}>
          <div style={styles.header}>
            <h2 style={{ margin: 0 }}>🛒 PDV Farmafy</h2>
            <div style={{ position: "relative", marginTop: 12 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <Icon.search />
              </span>
              <input
                style={{ ...styles.input, paddingLeft: 36, paddingRight: busca ? 36 : 12 }}
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              {busca && (
                <button onClick={() => setBusca("")} style={styles.btnLimparInput} title="Limpar">×</button>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? "s" : ""} disponíve{produtosFiltrados.length !== 1 ? "is" : "l"}
            </div>
          </div>

          <div style={styles.listaProdutos}>
            {produtosFiltrados.map(produto => {
              const noCarrinho      = carrinho.find(i => i.id === produto.id);
              const qtdCarrinho     = noCarrinho?.quantidade ?? 0;
              const estoqueRestante = produto.estoque - qtdCarrinho;
              const estoqueBaixo    = produto.estoque <= 5;
              const semEstoque      = estoqueRestante <= 0;
              return (
                <div
                  key={produto.id}
                  className={`produto-card${flashIds.has(produto.id) ? " flash" : ""}`}
                  style={{ ...styles.card, borderColor: estoqueBaixo ? "#fde68a" : "#e2e8f0", background: estoqueBaixo ? "#fffbeb" : "#fff" }}
                >
                  <div>
                    <strong style={{ fontSize: 15 }}>{produto.nome}</strong>
                    <div style={styles.preco}>
                      {Number(produto.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <div style={{ ...styles.estoque, color: estoqueBaixo ? "#b45309" : "#64748b", fontWeight: estoqueBaixo ? "bold" : "normal" }}>
                      {estoqueBaixo ? "⚠️ " : ""}Estoque: {produto.estoque}
                      {qtdCarrinho > 0 && <span style={{ color: "#0d7a45", marginLeft: 6 }}>({qtdCarrinho} no carrinho)</span>}
                    </div>
                  </div>
                  <button
                    className="btn-adicionar"
                    style={{ ...styles.botao, background: semEstoque ? "#94a3b8" : "#0d7a45" }}
                    onClick={() => adicionarProduto(produto)}
                    disabled={semEstoque}
                  >
                    {semEstoque ? "Esgotado" : "+ Adicionar"}
                  </button>
                </div>
              );
            })}
            {produtosFiltrados.length === 0 && (
              <div style={{ color: "#94a3b8", padding: 24, gridColumn: "1/-1" }}>Nenhum produto encontrado.</div>
            )}
          </div>
        </div>

        {/* ════ CARRINHO ════ */}
        <div style={styles.right}>

          {/* Cabeçalho */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>
              💳 Carrinho
              {carrinho.length > 0 && (
                <span style={styles.badge}>{carrinho.reduce((a, i) => a + i.quantidade, 0)}</span>
              )}
            </h2>
            {carrinho.length > 0 && (
              confirmLimpar ? (
                <div style={{ display: "flex", gap: 6, fontSize: 13 }}>
                  <span style={{ alignSelf: "center", color: "#64748b" }}>Limpar?</span>
                  <button onClick={limparCarrinho} style={styles.btnConfirm}>Sim</button>
                  <button onClick={() => setConfirmLimpar(false)} style={styles.btnCancelar}>Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmLimpar(true)} style={styles.btnLimparCarrinho}>
                  <Icon.trash /> Limpar
                </button>
              )
            )}
          </div>

          {/* Itens */}
          <div style={styles.carrinho}>
            {carrinho.length === 0 ? (
              <div style={styles.vazio}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
                <div>Nenhum item no carrinho.</div>
                <div style={{ fontSize: 13, marginTop: 4, color: "#94a3b8" }}>Clique em "+ Adicionar" para começar.</div>
              </div>
            ) : (
              carrinho.map(item => (
                <div key={item.id} className="carrinho-item" style={styles.item}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 14, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.nome}
                    </strong>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {Number(item.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} /un
                    </div>
                    <div style={styles.subtotal}>
                      {(item.preco * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <div style={styles.controles}>
                    <button style={styles.btnQtd} onClick={() => alterarQuantidade(item.id, "menos")}>−</button>
                    <input
                      type="number" min={1} max={item.estoque} value={item.quantidade}
                      onChange={e => editarQuantidade(item.id, e.target.value)}
                      style={styles.inputQtd}
                    />
                    <button style={styles.btnQtd} onClick={() => alterarQuantidade(item.id, "mais")}>+</button>
                    <button style={styles.btnExcluir} onClick={() => removerItem(item.id)} title="Remover">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          <div style={styles.footer}>

            {/* Cliente */}
            <div style={{ marginBottom: 14 }} ref={dropdownRef}>
              <label style={styles.label}><Icon.user /> Cliente</label>
              {clienteSelecionado ? (
                <div style={styles.clienteBadge}>
                  <span>👤 {clienteSelecionado.nome}</span>
                  <button onClick={() => setClienteSelecionado(null)} style={styles.btnRemoverCliente}>×</button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input
                    type="text" value={buscaCliente}
                    onChange={e => setBuscaCliente(e.target.value)}
                    placeholder="Buscar por nome ou telefone..."
                    style={{ ...styles.select, marginBottom: 0 }}
                  />
                  {buscaCliente && (
                    <div style={styles.listaClientes}>
                      <div className="cliente-item" style={styles.clienteItem}
                        onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }}>
                        <em style={{ color: "#94a3b8" }}>Não identificado</em>
                      </div>
                      {clientesFiltrados.length === 0 && (
                        <div style={{ ...styles.clienteItem, color: "#94a3b8" }}>Nenhum cliente encontrado.</div>
                      )}
                      {clientesFiltrados.map(c => (
                        <div key={c.id} className="cliente-item" style={styles.clienteItem}
                          onClick={() => { setClienteSelecionado({ id: c.id, nome: c.nome }); setBuscaCliente(""); }}>
                          <strong>{c.nome}</strong>
                          {c.telefone && <div style={{ fontSize: 12, color: "#64748b" }}>{c.telefone}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Forma de pagamento — seleção rápida no PDV */}
            <label style={styles.label}>Forma de pagamento</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {PAGAMENTOS.map(p => (
                <button
                  key={p.value}
                  className="btn-forma"
                  onClick={() => setPagamento(p.value)}
                  style={{
                    flex: 1, minWidth: 52,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 3, padding: "8px 4px", borderRadius: 8,
                    border: `2px solid ${pagamento === p.value ? "#0d7a45" : "#e2e8f0"}`,
                    background: pagamento === p.value ? "#ecfdf5" : "#fff",
                    color: pagamento === p.value ? "#0d7a45" : "#475569",
                    fontWeight: pagamento === p.value ? 700 : 500, fontSize: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Total */}
            <div style={{
              ...styles.totalBox,
              background:   carrinho.length > 0 ? "#ecfdf5" : "#f8fafc",
              borderColor:  carrinho.length > 0 ? "#6ee7b7" : "#e2e8f0",
            }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Total</span>
              <span style={{ fontSize: 28, fontWeight: "bold", color: carrinho.length > 0 ? "#0d7a45" : "#94a3b8" }}>
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <button
              className="btn-finalizar"
              style={{ ...styles.finalizar, background: carrinho.length === 0 ? "#94a3b8" : "#0d7a45" }}
              onClick={abrirModal}
              disabled={finalizando || carrinho.length === 0}
            >
              {finalizando ? <><Icon.spinner />Finalizando...</> : `Pagar ${PAGAMENTOS.find(p=>p.value===pagamento)?.emoji} ${PAGAMENTOS.find(p=>p.value===pagamento)?.label}`}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 20, right: 20,
          background: toast.tipo === "erro" ? "#dc2626" : "#0d7a45",
          color: "#fff", padding: "14px 20px", borderRadius: 10,
          fontWeight: "bold", zIndex: 999,
          animation: "fadeIn .2s ease", boxShadow: "0 4px 12px rgba(0,0,0,.2)",
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

const styles = {
  container:       { display:"grid", gridTemplateColumns:"1fr 400px", gap:20, padding:20, minHeight:"100vh", background:"#f1f5f9" },
  left:            { background:"#fff", borderRadius:12, padding:20, display:"flex", flexDirection:"column" },
  right:           { background:"#fff", borderRadius:12, padding:20, height:"calc(100vh - 40px)", position:"sticky", top:20, display:"flex", flexDirection:"column" },
  header:          { marginBottom:16 },
  label:           { display:"block", fontSize:12, fontWeight:"bold", color:"#475569", marginBottom:6 },
  input:           { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #ccc", fontSize:14, boxSizing:"border-box" },
  btnLimparInput:  { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94a3b8", lineHeight:1 },
  listaProdutos:   { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, overflowY:"auto", flex:1, paddingRight:4 },
  card:            { border:"1px solid #e2e8f0", borderRadius:10, padding:14, display:"flex", flexDirection:"column", justifyContent:"space-between", gap:12 },
  preco:           { fontSize:19, fontWeight:"bold", marginTop:8, color:"#0f172a" },
  estoque:         { fontSize:13, marginTop:2 },
  botao:           { color:"#fff", border:"none", padding:"10px 0", borderRadius:8, cursor:"pointer", fontWeight:"bold", fontSize:14 },
  carrinho:        { flex:1, overflowY:"auto", marginTop:16, paddingRight:2 },
  item:            { borderBottom:"1px solid #f1f5f9", padding:"10px 0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 },
  subtotal:        { marginTop:2, fontWeight:"bold", color:"#0f172a", fontSize:14 },
  controles:       { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  btnQtd:          { width:28, height:28, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", fontWeight:"bold", background:"#f8fafc", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },
  inputQtd:        { width:42, height:28, textAlign:"center", border:"1px solid #e2e8f0", borderRadius:6, fontSize:14, MozAppearance:"textfield" },
  btnExcluir:      { background:"#fee2e2", color:"#dc2626", border:"none", width:28, height:28, borderRadius:6, cursor:"pointer", fontWeight:"bold" },
  footer:          { borderTop:"1px solid #f1f5f9", paddingTop:16 },
  select:          { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #ccc", marginBottom:16, background:"#fff", fontSize:14, boxSizing:"border-box" },
  totalBox:        { display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid", borderRadius:10, padding:"10px 16px", marginBottom:14, transition:"all .3s" },
  finalizar:       { width:"100%", color:"#fff", border:"none", padding:16, borderRadius:10, fontSize:17, fontWeight:"bold", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
  vazio:           { color:"#94a3b8", textAlign:"center", marginTop:40, lineHeight:1.6 },
  badge:           { display:"inline-flex", alignItems:"center", justifyContent:"center", background:"#0d7a45", color:"#fff", borderRadius:"999px", fontSize:12, fontWeight:"bold", width:22, height:22, marginLeft:8 },
  btnLimparCarrinho: { background:"none", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:4 },
  btnConfirm:      { background:"#dc2626", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontWeight:"bold" },
  btnCancelar:     { background:"#f1f5f9", color:"#475569", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer" },
  clienteBadge:    { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:8, padding:"8px 12px", fontSize:14, fontWeight:"600", color:"#065f46" },
  btnRemoverCliente: { background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94a3b8", lineHeight:1 },
  listaClientes:   { position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,.1)", zIndex:50, maxHeight:200, overflowY:"auto" },
  clienteItem:     { padding:"10px 14px", cursor:"pointer", fontSize:14, transition:"background .1s" },
};