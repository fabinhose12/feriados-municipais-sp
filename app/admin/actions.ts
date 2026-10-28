"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { ehAdmin } from "../../lib/sessao";

async function exigirAdmin() {
  if (!(await ehAdmin())) redirect("/admin");
}

function lerId(formData: FormData): number {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function aprovar(formData: FormData) {
  await exigirAdmin();
  const id = lerId(formData);
  if (!id) return;

  const feriado = await prisma.feriado.findUnique({ where: { id }, include: { municipio: true } });
  if (!feriado) return;

  await prisma.feriado.update({ where: { id }, data: { status: "APROVADO", verificado: true } });
  if (feriado.municipio && feriado.municipio.status !== "APROVADO") {
    await prisma.municipio.update({
      where: { id: feriado.municipio.id },
      data: { status: "APROVADO" },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejeitar(formData: FormData) {
  await exigirAdmin();
  const id = lerId(formData);
  if (!id) return;

  await prisma.feriado.update({ where: { id }, data: { status: "REJEITADO" } });

  revalidatePath("/admin");
  revalidatePath("/");
}

async function definirBloqueio(formData: FormData, bloqueado: boolean) {
  await exigirAdmin();
  const autorId = String(formData.get("autorId") ?? "");
  if (!autorId) return;

  const alvo = await prisma.user.findUnique({ where: { id: autorId } });
  if (!alvo || alvo.role === "ADMIN") return; // não bloqueia administradores

  await prisma.user.update({ where: { id: autorId }, data: { bloqueado } });
  revalidatePath("/admin");
}

export async function bloquearAutor(formData: FormData) {
  await definirBloqueio(formData, true);
}

export async function desbloquearAutor(formData: FormData) {
  await definirBloqueio(formData, false);
}