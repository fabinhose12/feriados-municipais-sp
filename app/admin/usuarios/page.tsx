import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "../../../lib/prisma";
import { usuarioAtual } from "../../../lib/sessao";
import { ProtegidoAdmin } from "../protegido";
import { definirBloqueio, definirPapel } from "./actions";

type Params = { q?: string; ok?: string; erro?: string };

const dataCurta = (d: Date) =>
  d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

async function Lista({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();
  const { q = "", ok, erro } = await searchParams;
  const eu = await usuarioAtual();
  const termo = q.trim().slice(0, 80);

  const usuarios = await prisma.user.findMany({
    where: termo
      ? { OR: [{ name: { contains: termo } }, { email: { contains: termo } }] }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { feriados: true } } },
  });
  const total = await prisma.user.count();

  return (
    <>
      <h1>Usuários</h1>
      <p className="cal-meta">
        {total} conta{total === 1 ? "" : "s"} cadastrada{total === 1 ? "" : "s"}. Mostrando até 100.
      </p>

      {ok && <p className="cal-ok">{ok.slice(0, 200)}</p>}
      {erro && <p className="cal-erro">{erro.slice(0, 200)}</p>}

      <form method="get" className="adm-busca">
        <input type="text" name="q" defaultValue={termo} placeholder="Buscar por nome ou e-mail" />
        <button type="submit">Buscar</button>
      </form>

      <div className="adm-tabela-caixa">
        <table className="adm-tabela">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Papel</th>
              <th>Situação</th>
              <th>Envios</th>
              <th>Desde</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhuma conta encontrada.</td>
              </tr>
            )}
            {usuarios.map((u) => {
              const souEu = u.id === eu?.id;
              const ehAdm = u.role === "ADMIN";
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {souEu && <span className="adm-badge">você</span>}
                    <div className="adm-meta">{u.email}</div>
                  </td>
                  <td>
                    <span className={ehAdm ? "adm-papel adm-papel-admin" : "adm-papel"}>
                      {ehAdm ? "Administrador" : "Usuário"}
                    </span>
                  </td>
                  <td>{u.bloqueado ? <span className="adm-badge">bloqueado</span> : "Ativo"}</td>
                  <td>{u._count.feriados}</td>
                  <td>{dataCurta(u.createdAt)}</td>
                  <td>
                    {souEu ? (
                      <span className="adm-meta">—</span>
                    ) : (
                      <div className="adm-celula-acoes">
                        <form action={definirPapel}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="papel" value={ehAdm ? "USER" : "ADMIN"} />
                          <button type="submit" className="adm-btn">
                            {ehAdm ? "Rebaixar" : "Tornar admin"}
                          </button>
                        </form>
                        {!ehAdm && (
                          <form action={definirBloqueio}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="bloquear" value={u.bloqueado ? "nao" : "sim"} />
                            <button
                              type="submit"
                              className={u.bloqueado ? "adm-btn" : "adm-btn adm-btn-perigo"}
                            >
                              {u.bloqueado ? "Desbloquear" : "Bloquear"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  return (
    <Suspense
      fallback={
        <main className="cal-pagina">
          <p>Carregando…</p>
        </main>
      }
    >
      <ProtegidoAdmin>
        <Lista searchParams={searchParams} />
      </ProtegidoAdmin>
    </Suspense>
  );
}