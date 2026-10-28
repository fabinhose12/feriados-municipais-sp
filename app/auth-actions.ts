"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";

// Só aceita caminhos internos (evita redirecionar para sites de terceiros)
function destinoSeguro(valor: FormDataEntryValue | null, padrao: string): string {
  const v = String(valor ?? "");
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : padrao;
}

export async function entrarComGoogle(formData: FormData) {
  const destino = destinoSeguro(formData.get("destino"), "/");
  const resposta = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: destino },
    headers: await headers(),
  });
  if (resposta?.url) redirect(resposta.url);
  redirect("/");
}

export async function sair() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}