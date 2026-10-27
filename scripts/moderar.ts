// Moderação provisória pelo terminal (até existir a tela /admin).
//   npx tsx scripts/moderar.ts listar
//   npx tsx scripts/moderar.ts aprovar <id>
//   npx tsx scripts/moderar.ts rejeitar <id>
import { prisma } from "../lib/prisma";

const [, , comando, idTexto] = process.argv;

async function main() {
  if (comando === "listar") {
    const pendentes = await prisma.feriado.findMany({
      where: { status: "PENDENTE" },
      include: { municipio: true, fontes: true },
      orderBy: { id: "asc" },
    });
    if (pendentes.length === 0) return console.log("Nenhuma contribuição pendente.");
    for (const f of pendentes) {
      const data =
        f.tipoData === "FIXA"
          ? `${String(f.dia).padStart(2, "0")}/${String(f.mes).padStart(2, "0")}`
          : `Páscoa ${f.offsetPascoa! >= 0 ? "+" : ""}${f.offsetPascoa}`;
      console.log(`\n#${f.id} ${f.municipio?.nome}${f.municipio?.status === "PENDENTE" ? " (cidade nova)" : ""}`);
      console.log(`   ${f.nome} — ${data} — ${f.tipo}`);
      for (const s of f.fontes) console.log(`   fonte: ${s.tipo} ${s.referencia ?? ""} ${s.url ?? ""}`);
      if (f.observacao) console.log(`   obs: ${f.observacao}`);
    }
    return;
  }

  const id = Number(idTexto);
  if ((comando === "aprovar" || comando === "rejeitar") && Number.isInteger(id)) {
    const f = await prisma.feriado.findUnique({ where: { id }, include: { municipio: true } });
    if (!f) return console.log("Feriado não encontrado.");

    if (comando === "aprovar") {
      await prisma.feriado.update({ where: { id }, data: { status: "APROVADO", verificado: true } });
      if (f.municipio && f.municipio.status === "PENDENTE")
        await prisma.municipio.update({ where: { id: f.municipio.id }, data: { status: "APROVADO" } });
      console.log(`Feriado #${id} aprovado.`);
    } else {
      await prisma.feriado.update({ where: { id }, data: { status: "REJEITADO" } });
      console.log(`Feriado #${id} rejeitado.`);
    }
    return;
  }

  console.log("Uso: npx tsx scripts/moderar.ts listar | aprovar <id> | rejeitar <id>");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());