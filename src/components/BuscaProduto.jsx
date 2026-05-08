import { useState } from "react";

export default function BuscaProduto({ busca, setBusca, onProdutoEncontrado }) {
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  async function consultarAnvisa() {
    const cod = codigo.trim();
    if (!cod) return;

    setBuscando(true);
    setErro("");

    try {
      const url = `https://consultas.anvisa.gov.br/api/consulta/medicamentos/produtos/?count=1&filter%5BcodoBarras%5D=${cod}`;
      const res = await fetch(url);
      const json = await res.json();

      const produto = json?.content?.[0];

      if (produto) {
        // Encontrou na ANVISA — repassa os dados pro componente pai
        onProdutoEncontrado({
          nome: produto.nomeProduto || "",
          principio_ativo: produto.principioAtivo || "",
          categoria: "Outros",
          codigo_barras: cod,
          _encontrado: true
        });
        setCodigo("");
      } else {
        // Não encontrou — abre formulário manual com o código já preenchido
        onProdutoEncontrado({
          nome: "",
          principio_ativo: "",
          categoria: "Outros",
          codigo_barras: cod,
          _encontrado: false
        });
        setCodigo("");
        setErro("Medicamento não encontrado na ANVISA. Preencha manualmente.");
      }
    } catch (e) {
      setErro("Erro ao consultar ANVISA. Verifique sua conexão.");
    }

    setBuscando(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") consultarAnvisa();
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Busca por nome — busca dentro dos produtos já cadastrados */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>🔍 Buscar produto cadastrado</label>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Digite o nome ou princípio ativo..."
          style={inputStyle}
        />
      </div>

      {/* Busca por código de barras — consulta ANVISA */}
      <div>
        <label style={labelStyle}>📦 Bipar ou digitar código de barras (cadastro novo)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bipe o medicamento ou digite o código EAN-13..."
            style={{ ...inputStyle, flex: 1, fontSize: 15, fontWeight: 600 }}
            autoComplete="off"
          />
          <button
            onClick={consultarAnvisa}
            disabled={buscando || !codigo.trim()}
            style={btnStyle}
          >
            {buscando ? "Buscando..." : "Consultar"}
          </button>
        </div>
        {erro && (
          <div style={{ marginTop: 6, fontSize: 12.5, color: "#c47700", fontWeight: 600 }}>
            ⚠️ {erro}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 10.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".3px",
  color: "#64748b", marginBottom: 4
};

const inputStyle = {
  fontFamily: "inherit", fontSize: 14, padding: "8px 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  width: "100%", background: "#fff", color: "#0f172a", outline: "none"
};

const btnStyle = {
  padding: "8px 16px", borderRadius: 8, border: "none",
  background: "#0d7a45", color: "#fff", fontFamily: "inherit",
  fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
};