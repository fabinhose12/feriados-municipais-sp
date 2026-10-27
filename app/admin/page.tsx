import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "../../lib/prisma";
import { estaLogado } from "../../lib/admin-sessao";
import { dataDoFeriado } from "../../lib/feriados";
import { hojeEmSaoPaulo } from "../../lib/calendario";
import { REGRAS_MOVEIS, TIPOS_FONTE } from "../../lib/validacao";
import { aprovar, rejeitar, sair } from "./actions";
import "./admin.css";

type DadosData = {
  tipoData: string;
  mes: number | null;
  dia: number | null;
  offsetPascoa: number | null;
  vigenciaDe: number | null;
  vigenciaAte: number | null;
};

function descreverData(f: DadosData, ano: number): string {
  const exemplo = dataDoFeriado(f, ano);
  const [a, m, d] = exemplo ? exemplo.split("-") : [];
  const emAno = exemplo ? ` — em ${a}: ${d}/${m}` : "";

  if (f.tipoData === "FIXA")
    return `${String(f.dia).padStart(2, "0")}/${String(f.mes).padStart(2, "0")} (todo ano)`;

  const regra = Object.values(REGRAS_MOVEIS).find((r) => r.offset === f.offsetPascoa);
  const base = regra
    ? regra.rotulo
    : `Páscoa ${f.offsetPascoa! >= 0 ? "+" : ""}${f.offsetPascoa} dias`;
  return `${base} (data móvel)${emAno}`;
}

const dataHora = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

async function Painel() {
  await connection();
  if (!(await estaLogado())) redirect("/admin/login");

  const ano = hojeEmSaoPaulo().ano;

  const pendentes = await prisma.feriado.findMany({
    where: { status: "PENDENTE" },
    include: { municipio: true, fontes: true },
    orderBy: { id: "asc" },
  });
  const recentes = await prisma.feriado.findMany({
    where: { status: "APROVADO", origem: "USUARIO" },
    include: { municipio: true },
    orderBy: { atualizadoEm: "desc" },
    take: 10,
  });

  return (
    <main className="cal-pagina">
      <div className="adm-topo">
        <h1>Moderação</h1>
        <div className="adm-topo-links">
          <Link href="/">Calendário</Link>
          <form action={sair}>
            <button type="submit">Sair</button>
          </form>
        </div>
      </div>

      <h2>Pendentes ({pendentes.length})</h2>
      {pendentes.length === 0 && <p className="adm-vazio">Nenhuma contribuição aguardando revisão.</p>}

      {pendentes.map((f) => (
        <section key={f.id} className="adm-cartao">
          <div className="adm-titulo">
            {f.municipio?.nome}
            {f.municipio?.status !== "APROVADO" && <span className="adm-badge">cidade nova</span>}
          </div>
          <div>
            <strong>{f.nome}</strong>
            {f.tipo === "PONTO_FACULTATIVO" ? " · ponto facultativo" : ""}
          </div>
          <div className="adm-meta">{descreverData(f, ano)}</div>

          {f.fontes.map((s) => (
            <div key={s.id} className="adm-fonte">
              Fonte: {TIPOS_FONTE[s.tipo] ?? s.tipo}
              {s.referencia ? ` · ${s.referencia}` : ""}
              {s.url && /^https?:\/\//i.test(s.url) && (
                <>
                  {" · "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.url}
                  </a>
                </>
              )}
            </div>
          ))}
          {f.observacao && <div className="adm-meta">Obs.: {f.observacao}</div>}
          <div className="adm-meta">Enviado em {dataHora(f.criadoEm)}</div>

          <div className="adm-acoes">
            <form action={aprovar}>
              <input type="hidden" name="id" value={f.id} />
              <button type="submit" className="adm-aprovar">
                Aprovar
              </button>
            </form>
            <form action={rejeitar}>
              <input type="hidden" name="id" value={f.id} />
              <button type="submit" className="adm-rejeitar">
                Rejeitar
              </button>
            </form>
          </div>
        </section>
      ))}

      <h2>Aprovados recentemente (enviados por usuários)</h2>
      {recentes.length === 0 && <p className="adm-vazio">Nenhum ainda.</p>}
      {recentes.map((f) => (
        <section key={f.id} className="adm-cartao">
          <div>
            <strong>{f.municipio?.nome}</strong> — {f.nome}
          </div>
          <div className="adm-meta">{descreverData(f, ano)}</div>
          <div className="adm-acoes">
            <form action={rejeitar}>
              <input type="hidden" name="id" value={f.id} />
              <button type="submit" className="adm-rejeitar">
                Remover do calendário
              </button>
            </form>
          </div>
        </section>
      ))}
    </main>
  );
}

export default function Admin() {
  return (
    <Suspense
      fallback={
        <main className="cal-pagina">
          <p>Carregando…</p>
        </main>
      }
    >
      <Painel />
    </Suspense>
  );
}
