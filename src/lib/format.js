// ─── Formatação e parsing de moeda ───────────────────────────────────────────
export const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Aceita os dois formatos:
//   - BR: "1.500,50" (vírgula decimal, ponto milhar) → 1500.50
//   - JS: "1500.50"  (ponto decimal, vindo de input type=number ou toFixed) → 1500.50
export const parseBRL = (str) => {
  if (str == null) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  // Se tem vírgula, é formato BR — remove pontos (milhar) e troca vírgula por ponto.
  if (s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // Sem vírgula: é número JS direto (parseFloat aceita "15.00", "1500", etc).
  return parseFloat(s) || 0;
};

// ─── Datas ───────────────────────────────────────────────────────────────────
export const fmtData = (d) => {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date) ? "—" : date.toLocaleDateString("pt-BR");
};

export const fmtDataHora = (d) => {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date) ? "—" : date.toLocaleString("pt-BR");
};

export const diasParaVencer = (v) => {
  if (!v) return Infinity;
  return Math.ceil((new Date(v) - new Date()) / 86400000);
};

// ─── Strings ─────────────────────────────────────────────────────────────────
// Remove acentos + lowercase. Faz buscas tipo "joao" achar "João".
export const normalizeStr = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Helper: filtro por substring tolerante a acento.
export const matchStr = (haystack, needle) =>
  normalizeStr(haystack).includes(normalizeStr(needle));
