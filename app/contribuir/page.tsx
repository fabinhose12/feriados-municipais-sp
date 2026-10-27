import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "../../lib/prisma";
import { REGRAS_MOVEIS, TIPOS_FONTE } from "../../lib/validacao";
import { enviarFeriado } from "./actions";

type Params = { ok?: string; erro?: string };

async function Formulario({ searchParams }: { searchParams: Promise<Params> }) {
  const { ok, erro } = await searchParams;
  const municipios = await prisma.municipio.findMany({
    where: { ativo: true, status: "APROVADO" },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="cal-pagina">
      <p>
        <Link href="/">← Voltar ao calendário</Link>
      </p>
      <h1>Contribuir com um feriado</h1>
      <p>
        Cadastre um feriado municipal e informe a fonte oficial. Toda contribuição
        passa por revisão antes de aparecer no calendário.
      </p>

      {ok && (
        <p className="cal-ok">
          Recebido! O feriado vai aparecer no calendário depois de revisado.
        </p>
      )}
      {erro && <p className="cal-erro">{erro.slice(0, 200)}</p>}

      <form action={enviarFeriado} className="cal-form">
        <fieldset>
          <legend>Cidade</legend>
          <label>
            Cidade cadastrada
            <select name="municipioId" defaultValue="">
              <option value="">— Outra cidade (digite abaixo) —</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ou informe uma cidade nova
            <input type="text" name="novaCidade" maxLength={60} placeholder="Ex.: Jundiaí" />
          </label>
        </fieldset>

        <label>
          Nome do feriado
          <input type="text" name="nome" required minLength={3} maxLength={80} placeholder="Ex.: Aniversário da cidade" />
        </label>

        <label>
          Tipo
          <select name="tipo" defaultValue="FERIADO">
            <option value="FERIADO">Feriado</option>
            <option value="PONTO_FACULTATIVO">Ponto facultativo</option>
          </select>
        </label>

        <fieldset>
          <legend>Data</legend>
          <label>
            <span>
              <input type="radio" name="tipoData" value="FIXA" defaultChecked /> Data fixa (todo ano no mesmo dia)
            </span>
          </label>
          <div className="linha">
            <label>
              Dia
              <input type="number" name="dia" min={1} max={31} />
            </label>
            <label>
              Mês
              <input type="number" name="mes" min={1} max={12} />
            </label>
          </div>
          <label>
            <span>
              <input type="radio" name="tipoData" value="MOVEL" /> Data móvel (depende da Páscoa)
            </span>
          </label>
          <label>
            Regra
            <select name="regraMovel" defaultValue="">
              <option value="">—</option>
              {Object.entries(REGRAS_MOVEIS).map(([chave, r]) => (
                <option key={chave} value={chave}>
                  {r.rotulo}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Fonte (obrigatória)</legend>
          <label>
            Tipo de fonte
            <select name="fonteTipo" defaultValue="LEI">
              {Object.entries(TIPOS_FONTE).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Número da lei ou referência
            <input type="text" name="referencia" maxLength={100} placeholder="Ex.: Lei nº 1.234/2000" />
          </label>
          <label>
            Link da página oficial
            <input type="text" name="url" maxLength={300} placeholder="https://..." />
          </label>
          <p>Informe pelo menos a referência ou o link.</p>
        </fieldset>

        <label>
          Observação (opcional)
          <textarea name="observacao" maxLength={300} rows={3} />
        </label>

        {/* Campo-isca contra robôs: fica escondido e deve ficar vazio */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="cal-oculto" />

        <button type="submit">Enviar para revisão</button>
      </form>
    </main>
  );
}

export default function Contribuir({ searchParams }: { searchParams: Promise<Params> }) {
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
