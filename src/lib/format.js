// ─── Formatação e parsing de moeda ───────────────────────────────────────────
export const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const parseBRL = (str) =>
  parseFloat(String(str).replace(/\./g, "").replace(",", ".")) || 0;

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
