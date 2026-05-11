import { useState } from "react";
import { buscarMedicamentoPorEAN } from "../services/anvisa.service";

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
      const resultado = await buscarMedicamentoPorEAN(cod);

      if (resultado.encontrado) {
        onProdutoEncontrado({
          nome: resultado.nome,
          principio_ativo: resultado.principio_ativo,
          categoria: resultado.categoria,
          codigo_barras: resultado.codigo_barras,
          _encontrado: true,
        });
      } else {
        onProdutoEncontrado({
          nome: "",
          principio_ativo: "",
          categoria: "Outros",
          codigo_barras: cod,
          _encontrado: false,
        });
        setErro("Medicamento não encontrado na ANVISA. Preencha manualmente.");
      }
      setCodigo("");
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