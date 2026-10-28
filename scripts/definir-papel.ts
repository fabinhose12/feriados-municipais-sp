
import { prisma } from "../lib/prisma";

const [, , emailBruto, papel] = process.argv;

async function main() {
  if (!emailBruto || (papel !== "ADMIN" && papel !== "USER")) {
    console.log("Uso: npx tsx scripts/definir-papel.ts email@exemplo.com ADMIN|USER");
    return;
  }
  const email = emailBruto.trim().toLowerCase();
  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario) {
    console.log(`Nenhuma conta com o e-mail ${email}. Entre no site com o Google primeiro.`);
    return;
  }
  await prisma.user.update({ where: { email }, data: { role: papel } });
  console.log(`${usuario.name} (${email}) agora é ${papel}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());