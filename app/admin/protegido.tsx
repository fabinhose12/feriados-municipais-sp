import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { usuarioAtual } from "../../lib/sessao";
import { BotaoGoogle } from "../botao-google";
import { NavAdmin } from "./nav-admin";
import "./admin.css";

export async function ProtegidoAdmin({ children }: { children: ReactNode }) {
  await connection();
  const usuario = await usuarioAtual();

  if (!usuario) {
    return (
      <main className="cal-pagina">
        <h1>Área do administrador</h1>
        <p>Entre com uma conta de administrador para continuar.</p>
        <BotaoGoogle destino="/admin" rotulo="Entrar com Google" />
      </main>
    );
  }

  if (usuario.role !== "ADMIN" || usuario.bloqueado) {
    return (
      <main className="cal-pagina">
        <h1>Acesso restrito</h1>
        <p>
          A conta <strong>{usuario.email}</strong> não tem permissão de administrador.
        </p>
        <p>
          <Link href="/">← Voltar ao calendário</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="cal-pagina">
      <NavAdmin />
      {children}
    </main>
  );
}