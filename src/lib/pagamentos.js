// Constantes compartilhadas entre PDV e ModalPagamento.
// Antes ficavam duplicadas como PAGAMENTOS no PDV.jsx e FORMAS no ModalPagamento.jsx.

export const FORMAS_PAGAMENTO = [
  { value: "PIX",      label: "PIX",      emoji: "⚡" },
  { value: "Dinheiro", label: "Dinheiro", emoji: "💵" },
  { value: "Credito",  label: "Crédito",  emoji: "💳" },
  { value: "Debito",   label: "Débito",   emoji: "🏧" },
  { value: "Fiado",    label: "Fiado",    emoji: "🤝" },
];

export const findForma = (value) =>
  FORMAS_PAGAMENTO.find((f) => f.value === value);

// Sugestão de notas inteiras pra "valor recebido" em pagamento em dinheiro.
// Ex: total R$ 27,50 → sugere R$ 30, R$ 50, R$ 100, R$ 200.
export function calcAtalhosNotas(valor) {
  const notas = [5, 10, 20, 50, 100, 200];
  const result = [];
  for (const n of notas) {
    const multiplo = Math.ceil(valor / n) * n;
    if (!result.includes(multiplo) && result.length < 4) result.push(multiplo);
    if (result.length >= 4) break;
  }
  return result;
}
