"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import {
  COOKIE_ADMIN,
  DURACAO_SEGUNDOS,
  adminConfigurado,
  criarToken,
  senhaConfere,
} from "../../lib/admin-token";
import { estaLogado } from "../../lib/admin-sessao";

const erroLogin = (msg: string) => `/admin/login?erro=${encodeURIComponent(msg)}`;

export async function entrar(formData: FormData) {
  if (!adminConfigurado())
    redirect(erroLogin("Defina ADMIN_PASSWORD no arquivo .env e reinicie o servidor."));

  const senha = String(formData.get("senha") ?? "");
  if (!senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 800)); // atrasa tentativas seguidas
    redirect(erroLogin("Senha incorreta."));
  }

  const jar = await cookies();
  jar.set(COOKIE_ADMIN, criarToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: DURACAO_SEGUNDOS,
  });
  redirect("/admin");
}

export async function sair() {
  const jar = await cookies();
  jar.set(COOKIE_ADMIN, "", { path: "/admin", maxAge: 0 });
  redirect("/admin/login");
}

// Server Actions são endpoints públicos: cada uma confere o login de novo.
async function exigirLogin() {
  if (!(await estaLogado())) redirect("/admin/login");
}

function lerId(formData: FormData): number {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function aprovar(formData: FormData) {
  await exigirLogin();
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
  await exigirLogin();
  const id = lerId(formData);
  if (!id) return;

  await prisma.feriado.update({ where: { id }, data: { status: "REJEITADO" } });

  revalidatePath("/admin");
  revalidatePath("/");
}