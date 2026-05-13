// ════════════════════════════════════════════════════════════════════════════
// Edge Function: enviar-convite
// ════════════════════════════════════════════════════════════════════════════
//
// Envia email de convite via Resend (https://resend.com — free tier 3k/mês).
//
// Como deployar (via Dashboard Supabase, SEM CLI):
//   1. Painel Supabase → Edge Functions → New function
//   2. Nome: enviar-convite
//   3. Cole o código abaixo no editor → Deploy
//
// Secrets necessárias (Painel → Edge Functions → Manage secrets):
//   RESEND_API_KEY  — sua chave do Resend
//   APP_URL         — URL do app em produção (ex: https://farmafy.com.br)
//                     em dev pode usar http://localhost:5173
//   FROM_EMAIL      — opcional. Default "FarmaFy <onboarding@resend.dev>"
//                     (este endereço de teste só envia pra emails que VOCÊ
//                     verificou no Resend. Pra produção real, verifique
//                     seu próprio domínio no Resend e use ex.: "FarmaFy <noreply@suafarmacia.com.br>")
//
// Como chamar (do frontend):
//   await supabase.functions.invoke("enviar-convite", {
//     body: { email, farmaciaNome, convidadoPor }
//   });
// ════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL        = Deno.env.get("APP_URL")    || "http://localhost:5173";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") || "FarmaFy <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, farmaciaNome, convidadoPor } = await req.json();

    if (!email || !farmaciaNome) {
      return json({ error: "email e farmaciaNome obrigatórios" }, 400);
    }
    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY não configurada nas secrets" }, 500);
    }

    const subject = `Convite para ${farmaciaNome} no FarmaFy`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="color:#0d7a45;margin:0 0 8px">💊 Você foi convidado pra ${farmaciaNome}</h2>
        <p>${convidadoPor ? `<b>${convidadoPor}</b> te convidou` : "Você foi convidado"} pra fazer parte da equipe da farmácia <b>${farmaciaNome}</b> no FarmaFy.</p>

        <h3 style="margin-top:24px">Como entrar:</h3>
        <ol style="line-height:1.8">
          <li>Acesse <a href="${APP_URL}" style="color:#0d7a45">${APP_URL}</a></li>
          <li>Clique em <b>Cadastrar</b></li>
          <li>Use exatamente este email: <b>${email}</b></li>
          <li>Crie uma senha</li>
          <li>Deixe o campo <b>"Nome da farmácia"</b> em branco</li>
        </ol>

        <p style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 14px;color:#065f46;font-size:14px">
          O sistema vai reconhecer o convite automaticamente e te colocar direto
          na equipe da <b>${farmaciaNome}</b>.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:12px;text-align:center">
          FarmaFy — Sistema de Gestão de Farmácias
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.message || "Erro ao enviar email" }, res.status);
    }

    return json({ ok: true, id: data.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
