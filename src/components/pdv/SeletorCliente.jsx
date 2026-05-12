import { useEffect, useRef, useState, useMemo } from "react";
import { matchStr } from "../../lib/format";
import { colors, radius } from "../../styles/tokens";
import Field from "../../ui/Field";
import Input from "../../ui/Input";

/**
 * Dropdown de seleção de cliente. Busca por nome ou telefone.
 *
 * Props:
 *  clientes           : Cliente[]
 *  clienteSelecionado : { id, nome } | null
 *  onSelecionar       : (cliente | null) => void
 */
export default function SeletorCliente({ clientes, clienteSelecionado, onSelecionar }) {
  const [busca, setBusca] = useState("");
  const dropdownRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBusca("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtrados = useMemo(
    () =>
      clientes.filter(
        (c) => matchStr(c.nome, busca) || (c.telefone ?? "").includes(busca)
      ),
    [clientes, busca]
  );

  return (
    <Field label="👤 Cliente">
      <div ref={dropdownRef}>
        {clienteSelecionado ? (
          <div style={styles.badge}>
            <span>👤 {clienteSelecionado.nome}</span>
            <button onClick={() => onSelecionar(null)} style={styles.btnRemover}>
              ×
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
            />
            {busca && (
              <div style={styles.lista}>
                <div
                  className="cliente-item"
                  style={styles.item}
                  onClick={() => {
                    onSelecionar(null);
                    setBusca("");
                  }}
                >
                  <em style={{ color: colors.textFaint }}>Não identificado</em>
                </div>
                {filtrados.length === 0 && (
                  <div style={{ ...styles.item, color: colors.textFaint }}>
                    Nenhum cliente encontrado.
                  </div>
                )}
                {filtrados.map((c) => (
                  <div
                    key={c.id}
                    className="cliente-item"
                    style={styles.item}
                    onClick={() => {
                      onSelecionar({ id: c.id, nome: c.nome });
                      setBusca("");
                    }}
                  >
                    <strong>{c.nome}</strong>
                    {c.telefone && (
                      <div style={{ fontSize: 12, color: colors.textSubtle }}>
                        {c.telefone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

const styles = {
  badge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.md,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 600,
    color: colors.brandText,
  },
  btnRemover: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: colors.textFaint,
    lineHeight: 1,
  },
  lista: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    boxShadow: "0 4px 12px rgba(0,0,0,.1)",
    zIndex: 50,
    maxHeight: 200,
    overflowY: "auto",
    marginTop: 4,
  },
  item: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    transition: "background .1s",
  },
};
