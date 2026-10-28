"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { usuarioAtual } from "../../../lib/sessao";

const voltar = (tipo: "ok" | "erro", msg: string) =>
  `/admin/usuarios?${tipo}=${encodeURIComponent(msg)}`;

// Server Actions são endereços públicos: cada uma confere o papel de admin.
async function exigirAdmin() {
  const u = await usuarioAtual();
  if (!u || u.role !== "ADMIN" || u.bloqueado) redirect("/admin");
  return u;
}

export async function definirPapel(formData: FormData) {
  const admin = await exigirAdmin();
  const id = String(formData.get("userId") ?? "");
  const papel = formData.get("papel") === "ADMIN" ? "ADMIN" : "USER";
  if (!id) redirect(voltar("erro", "Conta inválida."));

  if (id === admin.id) redirect(voltar("erro", "Você não pode alterar o seu próprio papel."));

  const alvo = await prisma.user.findUnique({ where: { id } });
  if (!alvo) redirect(voltar("erro", "Conta não encontrada."));

  await prisma.user.update({
    where: { id },
    // quem vira admin também sai do bloqueio
    data: papel === "ADMIN" ? { role: "ADMIN", bloqueado: false } : { role: "USER" },
  });

  revalidatePath("/admin/usuarios");
  redirect(
    voltar(
      "ok",
      papel === "ADMIN"
        ? `${alvo.name} agora é administrador.`
        : `${alvo.name} voltou a ser usuário comum.`,
    ),
  );
}

export async function definirBloqueio(formData: FormData) {
  const admin = await exigirAdmin();
  const id = String(formData.get("userId") ?? "");
  const bloquear = formData.get("bloquear") === "sim";
  if (!id) redirect(voltar("erro", "Conta inválida."));

  if (id === admin.id) redirect(voltar("erro", "Você não pode bloquear a si mesmo."));

  const alvo = await prisma.user.findUnique({ where: { id } });
  if (!alvo) redirect(voltar("erro", "Conta não encontrada."));
  if (alvo.role === "ADMIN")
    redirect(voltar("erro", "Rebaixe o administrador para usuário antes de bloquear."));

  await prisma.user.update({ where: { id }, data: { bloqueado: bloquear } });

  revalidatePath("/admin/usuarios");
  redirect(
    voltar("ok", bloquear ? `${alvo.name} foi bloqueado.` : `${alvo.name} foi desbloqueado.`),
  );
}