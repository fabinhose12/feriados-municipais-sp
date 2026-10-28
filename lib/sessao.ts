import { headers } from "next/headers";
import { auth } from "./auth";

export type Usuario = {
  id: string;
  name: string;
  email: string;
  role: string; // USER | ADMIN
  bloqueado: boolean;
};

// Usuário logado (ou null). Sempre lê o papel direto do banco.
export async function usuarioAtual(): Promise<Usuario | null> {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return null;

  const u = sessao.user as typeof sessao.user & { role?: string; bloqueado?: boolean };
  return {
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    role: u.role ?? "USER",
    bloqueado: Boolean(u.bloqueado),
  };
}

export async function ehAdmin(): Promise<boolean> {
  const u = await usuarioAtual();
  return u !== null && u.role === "ADMIN" && !u.bloqueado;
}