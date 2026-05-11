// Consulta o catálogo público de medicamentos da ANVISA por código de barras.
// ATENÇÃO: a ANVISA bloqueia CORS em produção. Próximo passo (Rodada 7) é
// proxiar via Edge Function do Supabase. Hoje funciona no dev porque o
// browser permite mais coisas em localhost.

const ENDPOINT = "https://consultas.anvisa.gov.br/api/consulta/medicamentos/produtos/";

export async function buscarMedicamentoPorEAN(codigoBarras) {
  const cod = String(codigoBarras || "").trim();
  if (!cod) return null;

  const url = `${ENDPOINT}?count=1&filter%5BcodoBarras%5D=${cod}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ANVISA respondeu ${res.status}`);

  const json = await res.json();
  const produto = json?.content?.[0];

  if (!produto) {
    return { encontrado: false, codigo_barras: cod };
  }

  return {
    encontrado: true,
    nome: produto.nomeProduto || "",
    principio_ativo: produto.principioAtivo || "",
    categoria: "Outros",
    codigo_barras: cod,
  };
}
