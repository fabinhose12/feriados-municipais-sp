"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { normalizar, validarEnvio } from "../../lib/validacao";

const campo = (f: FormData, nome: string) => String(f.get(nome) ?? "");

export async function enviarFeriado(formData: FormData) {
  // Campo-isca contra robôs: se vier preenchido, finge sucesso e descarta.
  if (campo(formData, "website").trim() !== "") redirect("/contribuir?ok=1");

  const bruto: Record<string, string> = {};
  for (const nome of [
    "municipioId", "novaCidade", "nome", "tipo", "tipoData", "mes", "dia",
    "regraMovel", "fonteTipo", "referencia", "url", "observacao",
  ]) {
    bruto[nome] = campo(formData, nome);
  }

  const v = validarEnvio(bruto);
  if (!v.ok) redirect(`/contribuir?erro=${encodeURIComponent(v.erro)}`);
  const d = v.dados;

  // 1) Cidade: existente, ou nova (entra como PENDENTE até ser revisada)
  let municipioId: number;
  if (d.novaCidade) {
    const todas = await prisma.municipio.findMany({ select: { id: true, nome: true } });
    const achada = todas.find((m) => normalizar(m.nome) === normalizar(d.novaCidade!));
    if (achada) {
      municipioId = achada.id;
    } else {
      const criada = await prisma.municipio.create({
        data: { nome: d.novaCidade, regiao: "OUTRA", status: "PENDENTE" },
      });
      municipioId = criada.id;
    }
  } else {
    const existe = await prisma.municipio.findUnique({ where: { id: d.municipioId! } });
    if (!existe) redirect(`/contribuir?erro=${encodeURIComponent("Cidade não encontrada.")}`);
    municipioId = existe.id;
  }

  // 2) Evita duplicados (mesmo nome e mesma data/regra na mesma cidade)
  const doMunicipio = await prisma.feriado.findMany({
    where: { municipioId, status: { in: ["APROVADO", "PENDENTE"] } },
  });
  const duplicado = doMunicipio.some(
    (f) =>
      normalizar(f.nome) === normalizar(d.nome) &&
      f.tipoData === d.tipoData &&
      f.mes === d.mes &&
      f.dia === d.dia &&
      f.offsetPascoa === d.offsetPascoa,
  );
  if (duplicado)
    redirect(
      `/contribuir?erro=${encodeURIComponent("Esse feriado já foi cadastrado (ou está em análise) para essa cidade.")}`,
    );

  // 3) Salva como PENDENTE, com a fonte informada
  await prisma.feriado.create({
    data: {
      escopo: "MUNICIPAL",
      tipo: d.tipo,
      nome: d.nome,
      tipoData: d.tipoData,
      mes: d.mes,
      dia: d.dia,
      offsetPascoa: d.offsetPascoa,
      municipioId,
      status: "PENDENTE",
      origem: "USUARIO",
      verificado: false,
      observacao: d.observacao,
      fontes: {
        create: {
          tipo: d.fonteTipo,
          referencia: d.referencia,
          url: d.url,
          consultadoEm: new Date(),
        },
      },
    },
  });

  redirect("/contribuir?ok=1");
}