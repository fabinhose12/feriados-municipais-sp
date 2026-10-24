import { prisma } from "../lib/prisma";

const ABC = [
  "Santo André", "São Bernardo do Campo", "São Caetano do Sul",
  "Diadema", "Mauá", "Ribeirão Pires", "Rio Grande da Serra",
];

const GRANDE_SP = [
  "São Paulo", "Arujá", "Barueri", "Biritiba-Mirim", "Caieiras", "Cajamar",
  "Carapicuíba", "Cotia", "Embu das Artes", "Embu-Guaçu", "Ferraz de Vasconcelos",
  "Francisco Morato", "Franco da Rocha", "Guararema", "Guarulhos",
  "Itapecerica da Serra", "Itapevi", "Itaquaquecetuba", "Jandira", "Juquitiba",
  "Mairiporã", "Mogi das Cruzes", "Osasco", "Pirapora do Bom Jesus", "Poá",
  "Salesópolis", "Santa Isabel", "Santana de Parnaíba", "São Lourenço da Serra",
  "Suzano", "Taboão da Serra", "Vargem Grande Paulista",
];

const CAMPINAS = ["Indaiatuba"];

const BASE = [
  { escopo: "NACIONAL", nome: "Confraternização Universal", mes: 1, dia: 1 },
  { escopo: "NACIONAL", nome: "Tiradentes", mes: 4, dia: 21 },
  { escopo: "NACIONAL", nome: "Dia do Trabalho", mes: 5, dia: 1 },
  { escopo: "NACIONAL", nome: "Independência do Brasil", mes: 9, dia: 7 },
  { escopo: "NACIONAL", nome: "Nossa Senhora Aparecida", mes: 10, dia: 12 },
  { escopo: "NACIONAL", nome: "Finados", mes: 11, dia: 2 },
  { escopo: "NACIONAL", nome: "Proclamação da República", mes: 11, dia: 15 },
  { escopo: "NACIONAL", nome: "Dia da Consciência Negra", mes: 11, dia: 20 },
  { escopo: "NACIONAL", nome: "Natal", mes: 12, dia: 25 },
  { escopo: "ESTADUAL", nome: "Revolução Constitucionalista", mes: 7, dia: 9 },
];

async function main() {
  const grupos: [string[], string][] = [
    [ABC, "ABC"],
    [GRANDE_SP, "GRANDE_SP"],
    [CAMPINAS, "CAMPINAS"],
  ];

  for (const [nomes, regiao] of grupos) {
    for (const nome of nomes) {
      await prisma.municipio.upsert({
        where: { nome },
        update: { regiao },
        create: { nome, regiao },
      });
    }
  }

  const jaTemBase = await prisma.feriado.count({
    where: { escopo: { in: ["NACIONAL", "ESTADUAL"] } },
  });

  if (jaTemBase === 0) {
    for (const f of BASE) {
      await prisma.feriado.create({
        data: { ...f, tipo: "FERIADO", tipoData: "FIXA" },
      });
    }
    await prisma.feriado.create({
      data: {
        escopo: "NACIONAL",
        nome: "Sexta-feira Santa",
        tipo: "FERIADO",
        tipoData: "MOVEL",
        offsetPascoa: -2,
      },
    });
  }

  console.log("Seed concluído:", await prisma.municipio.count(), "municípios.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());