import { supabase } from "../lib/supabase";

export async function carregarMinhaFarmacia() {
  // RLS já filtra: o user só vê a própria farmácia.
  const { data, error } = await supabase
    .from("farmacias")
    .select("id, nome, cnpj, cidade, uf, endereco, telefone, chave_pix")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function atualizarMinhaFarmacia(id, dados) {
  const { error } = await supabase
    .from("farmacias")
    .update(dados)
    .eq("id", id);
  if (error) throw error;
}
