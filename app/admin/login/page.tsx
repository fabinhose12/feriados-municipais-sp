import Link from "next/link";
import { Suspense } from "react";
import { entrar } from "../actions";

type Params = { erro?: string };

async function Formulario({ searchParams }: { searchParams: Promise<Params> }) {
  const { erro } = await searchParams;
  return (
    <main className="cal-pagina">
      <p>
        <Link href="/">← Voltar ao calendário</Link>
      </p>
      <h1>Área de moderação</h1>
      {erro && <p className="cal-erro">{erro.slice(0, 200)}</p>}
      <form action={entrar} className="cal-form">
        <label>
          Senha
          <input type="password" name="senha" required autoFocus autoComplete="current-password" />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}

export default function Login({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <Suspense
      fallback={
        <main className="cal-pagina">
          <p>Carregando…</p>
        </main>
      }
    >
      <Formulario searchParams={searchParams} />
    </Suspense>
  );
}
