import { prisma } from "./prisma";
import { calcularPascoa, paraISO, somarDias } from "./pascoa";

export type FeriadoBase = {
  tipoData: string; // FIXA | MOVEL
  mes: number | null;
  dia: number | null;
  offsetPascoa: number | null;
  vigenciaDe: number | null;
  vigenciaAte: number | null;
};

export function dataDoFeriado(f: FeriadoBase, ano: number): string | null {
  if (f.vigenciaDe != null && ano < f.vigenciaDe) return null;
  if (f.vigenciaAte != null && ano > f.vigenciaAte) return null;

  if (f.tipoData === "MOVEL") {
    if (f.offsetPascoa == null) return null;
    return paraISO(somarDias(calcularPascoa(ano), f.offsetPascoa));
  }

  if (f.tipoData === "FIXA" && f.mes != null && f.dia != null) {
    const data = new Date(Date.UTC(ano, f.mes - 1, f.dia));
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

export async function feriadosDoAno(
  ano: number,
  municipioIds: number[] = []
): Promise<FeriadoDoAno[]> {
  const registros = await prisma.feriado.findMany({
    where: {
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