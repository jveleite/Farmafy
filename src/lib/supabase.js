import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Falha cedo e clara em vez de erro misterioso de fetch.
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. " +
    "Copie .env.example para .env.local e preencha."
  );
}

export const supabase = createClient(url, key);
