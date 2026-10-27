import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "../lib/prisma";
import { feriadosDoAno, type FeriadoDoAno } from "../lib/feriados";
import {
  DIAS_SEMANA,
  MESES,
  hojeEmSaoPaulo,
  isoDoDia,
  mesAnterior,
  mesSeguinte,
  montarSemanas,
} from "../lib/calendario";

const styles = {
  pagina: "cal-pagina",
  filtro: "cal-filtro",
  cidades: "cal-cidades",
  aviso: "cal-aviso",
  navegacao: "cal-navegacao",
  grade: "cal-grade",
  cabecalho: "cal-cabecalho",
  dia: "cal-dia",
  vazio: "cal-vazio",
  hoje: "cal-hoje",
  numero: "cal-numero",
  itens: "cal-itens",
  item: "cal-item",
  nacional: "cal-nacional",
  estadual: "cal-estadual",
  municipal: "cal-municipal",
  facultativo: "cal-facultativo",
  naoVerificado: "cal-naoVerificado",
  legenda: "cal-legenda",
  lista: "cal-lista",
};

type Params = { ano?: string; mes?: string; cidade?: string | string[] };

const REGIOES: Record<string, string> = {
  ABC: "Grande ABC",
  GRANDE_SP: "Grande São Paulo",
  CAMPINAS: "Região de Campinas",
  OUTRA: "Outras cidades",
};

function lerNumero(valor: string | undefined, padrao: number, min: number, max: number) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : padrao;
}

function classeDoItem(f: FeriadoDoAno) {
  if (f.tipo === "PONTO_FACULTATIVO") return styles.facultativo;
  if (f.escopo === "NACIONAL") return styles.nacional;
  if (f.escopo === "ESTADUAL") return styles.estadual;
  return styles.municipal;
}

async function Calendario({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await connection(); 
  const params = await searchParams;
  const hoje = hojeEmSaoPaulo();
  const ano = lerNumero(params.ano, hoje.ano, 2000, 2100);
  const mes = lerNumero(params.mes, hoje.mes, 1, 12);

  const cidadesParam = Array.isArray(params.cidade)
    ? params.cidade
    : params.cidade
      ? [params.cidade]
      : [];

  const municipios = await prisma.municipio.findMany({
    where: { ativo: true, status: "APROVADO" },
    orderBy: { nome: "asc" },
  });
  const nomePorId = new Map(municipios.map((m) => [m.id, m.nome]));
  const selecionados = cidadesParam
    .map(Number)
    .filter((id) => nomePorId.has(id));

  const feriadosAno = await feriadosDoAno(ano, selecionados);
  const prefixo = `${ano}-${String(mes).padStart(2, "0")}`;
  const doMes = feriadosAno.filter((f) => f.data.startsWith(prefixo));

  const porDia = new Map<string, FeriadoDoAno[]>();
  for (const f of doMes) porDia.set(f.data, [...(porDia.get(f.data) ?? []), f]);

  const comMunicipal = new Set(
    feriadosAno.filter((f) => f.escopo === "MUNICIPAL").map((f) => f.municipioId),
  );
  const semDados = selecionados
    .filter((id) => !comMunicipal.has(id))
    .map((id) => nomePorId.get(id));

  const montarLink = (a: number, m: number) => {
    const q = new URLSearchParams({ ano: String(a), mes: String(m) });
    selecionados.forEach((id) => q.append("cidade", String(id)));
    return `/?${q.toString()}`;
  };
  const anterior = mesAnterior(ano, mes);
  const seguinte = mesSeguinte(ano, mes);

  const grupos = Object.keys(REGIOES)
    .map((chave) => ({
      chave,
      titulo: REGIOES[chave],
      cidades: municipios.filter((m) => m.regiao === chave),
    }))
    .filter((g) => g.cidades.length > 0);

  const rotulo = (f: FeriadoDoAno) =>
    f.escopo === "MUNICIPAL" && f.municipioId
      ? `${nomePorId.get(f.municipioId)}: ${f.nome}`
      : f.nome;

  return (
    <main className={styles.pagina}>
      <h1>Feriados municipais — SP</h1>
      <p><Link href="/contribuir">Contribuir com um feriado</Link></p>

      <form method="get" className={styles.filtro}>
        <input type="hidden" name="ano" value={ano} />
        <input type="hidden" name="mes" value={mes} />
        <details open={selecionados.length === 0}>
          <summary>
            Cidades ({selecionados.length} selecionada{selecionados.length === 1 ? "" : "s"})
          </summary>
          {grupos.map((g) => (
            <fieldset key={g.chave}>
              <legend>{g.titulo}</legend>
              <div className={styles.cidades}>
                {g.cidades.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      name="cidade"
                      value={c.id}
                      defaultChecked={selecionados.includes(c.id)}
                    />{" "}
                    {c.nome}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </details>
        <button type="submit">Aplicar</button>
      </form>

      {selecionados.length === 0 && (
        <p className={styles.aviso}>
          Selecione as cidades para ver os feriados municipais. Por enquanto,
          só os feriados nacionais e estaduais aparecem.
        </p>
      )}
      {semDados.length > 0 && (
        <p className={styles.aviso}>
          Ainda não há feriados municipais cadastrados em {ano} para:{" "}
          {semDados.join(", ")}. Isso não significa que não existam.
        </p>
      )}

      <nav className={styles.navegacao}>
        <Link href={montarLink(anterior.ano, anterior.mes)}>← Anterior</Link>
        <h2>
          {MESES[mes - 1]} de {ano}
        </h2>
        <Link href={montarLink(seguinte.ano, seguinte.mes)}>Próximo →</Link>
      </nav>

      <div className={styles.grade}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} className={styles.cabecalho}>
            {d}
          </div>
        ))}
        {montarSemanas(ano, mes)
          .flat()
          .map((dia, i) => {
            if (dia === null) return <div key={i} className={styles.vazio} />;
            const iso = isoDoDia(ano, mes, dia);
            const itens = porDia.get(iso) ?? [];
            return (
              <div
                key={i}
                className={`${styles.dia} ${iso === hoje.iso ? styles.hoje : ""}`}
              >
                <span className={styles.numero}>{dia}</span>
                <div className={styles.itens}>
                  {itens.map((f, k) => (
                    <span
                      key={k}
                      title={rotulo(f)}
                      className={`${styles.item} ${classeDoItem(f)} ${
                        f.escopo === "MUNICIPAL" && !f.verificado ? styles.naoVerificado : ""
                      }`}
                    >
                      {rotulo(f)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <ul className={styles.legenda}>
        <li><span className={`${styles.item} ${styles.nacional}`}>Nacional</span></li>
        <li><span className={`${styles.item} ${styles.estadual}`}>Estadual</span></li>
        <li><span className={`${styles.item} ${styles.municipal}`}>Municipal</span></li>
        <li><span className={`${styles.item} ${styles.facultativo}`}>Ponto facultativo</span></li>
        <li><span className={`${styles.item} ${styles.municipal} ${styles.naoVerificado}`}>Municipal não verificado</span></li>
      </ul>

      <h3>Feriados do mês</h3>
      {doMes.length === 0 ? (
        <p>Nenhum feriado cadastrado neste mês para a seleção atual.</p>
      ) : (
        <ul className={styles.lista}>
          {doMes.map((f, k) => {
            const [a, m, d] = f.data.split("-").map(Number);
            const semana = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("pt-BR", {
              weekday: "short",
              timeZone: "UTC",
            });
            return (
              <li key={k}>
                <strong>
                  {String(d).padStart(2, "0")}/{String(m).padStart(2, "0")}
                </strong>{" "}
                ({semana}) — {f.nome}
                {f.escopo === "MUNICIPAL" && f.municipioId ? ` · ${nomePorId.get(f.municipioId)}` : ""}
                {f.tipo === "PONTO_FACULTATIVO" ? " · ponto facultativo" : ""}
                {f.escopo === "MUNICIPAL" && !f.verificado ? " · não verificado" : ""}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  return (
    <Suspense
      fallback={
        <main className={styles.pagina}>
          <p>Carregando calendário…</p>
        </main>
      }
    >
      <Calendario searchParams={searchParams} />
    </Suspense>
  );
}