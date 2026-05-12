import { useState } from "react";
import Tabs from "../../ui/Tabs";
import VisaoGeral from "./VisaoGeral";
import FiadoAReceber from "./FiadoAReceber";
import Despesas from "./Despesas";
import Caixa from "./Caixa";

const ABAS = [
  { value: "visao",    label: "Visão geral", icon: "📊" },
  { value: "fiado",    label: "Fiado",       icon: "🤝" },
  { value: "despesas", label: "Despesas",    icon: "📋" },
  { value: "caixa",    label: "Caixa",       icon: "💰" },
];

/**
 * Tela de Financeiro — orquestra 4 abas independentes.
 * Cada aba carrega seus próprios dados (sem estado compartilhado por enquanto).
 */
export default function Financeiro() {
  const [aba, setAba] = useState("visao");

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>💰 Financeiro</h2>

      <Tabs abas={ABAS} ativa={aba} onChange={setAba} />

      {aba === "visao"    && <VisaoGeral />}
      {aba === "fiado"    && <FiadoAReceber />}
      {aba === "despesas" && <Despesas />}
      {aba === "caixa"    && <Caixa />}
    </div>
  );
}
