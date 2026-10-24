export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Semanas do mês (domingo primeiro). Células vazias = null.
export function montarSemanas(ano: number, mes: number): (number | null)[][] {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay(); // 0 = domingo
  const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  const celulas: (number | null)[] = [
    ...Array<null>(inicio).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

export function isoDoDia(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function mesAnterior(ano: number, mes: number) {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function mesSeguinte(ano: number, mes: number) {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

// Data de hoje no fuso de São Paulo (o servidor pode estar em outro fuso)
export function hojeEmSaoPaulo() {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "2026-10-23"
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia, iso };
}