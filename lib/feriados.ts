import { prisma } from "./prisma";
import { calcularPascoa, paraISO, somarDias } from "./pascoa";

// Formato mínimo que a função precisa (compatível com o model Feriado do Prisma)
export type FeriadoBase = {
  tipoData: string; // FIXA | MOVEL
  mes: number | null;
  dia: number | null;
  offsetPascoa: number | null;
  vigenciaDe: number | null;
  vigenciaAte: number | null;
};

// Retorna "YYYY-MM-DD" ou null se o feriado não vale naquele ano / está mal cadastrado.
export function dataDoFeriado(f: FeriadoBase, ano: number): string | null {
  if (f.vigenciaDe != null && ano < f.vigenciaDe) return null;
  if (f.vigenciaAte != null && ano > f.vigenciaAte) return null;

  if (f.tipoData === "MOVEL") {
    if (f.offsetPascoa == null) return null;
    return paraISO(somarDias(calcularPascoa(ano), f.offsetPascoa));
  }

  if (f.tipoData === "FIXA" && f.mes != null && f.dia != null) {
    const data = new Date(Date.UTC(ano, f.mes - 1, f.dia));
    // Evita datas inválidas (ex.: 31/04 viraria 01/05)
    if (data.getUTCMonth() !== f.mes - 1) return null;
    return paraISO(data);
  }

  return null;
}

export type FeriadoDoAno = {
  data: string;
  nome: string;
  tipo: string;   // FERIADO | PONTO_FACULTATIVO
  escopo: string; // NACIONAL | ESTADUAL | MUNICIPAL
  municipioId: number | null;
  verificado: boolean;
};

// Feriados de um ano: nacionais + estaduais + municipais das cidades pedidas.
// Só entram os já APROVADOS (contribuições pendentes não aparecem no calendário).
export async function feriadosDoAno(
  ano: number,
  municipioIds: number[] = []
): Promise<FeriadoDoAno[]> {
  const registros = await prisma.feriado.findMany({
    where: {
      status: "APROVADO",
      OR: [
        { escopo: { in: ["NACIONAL", "ESTADUAL"] } },
        { municipioId: { in: municipioIds } },
      ],
    },
  });

  const lista: FeriadoDoAno[] = [];
  for (const r of registros) {
    const data = dataDoFeriado(r, ano);
    if (!data) continue;
    lista.push({
      data,
      nome: r.nome,
      tipo: r.tipo,
      escopo: r.escopo,
      municipioId: r.municipioId,
      verificado: r.verificado,
    });
  }

  return lista.sort((a, b) => a.data.localeCompare(b.data));
}