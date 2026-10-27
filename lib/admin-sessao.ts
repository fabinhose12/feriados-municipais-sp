import { cookies } from "next/headers";
import { COOKIE_ADMIN, tokenValido } from "./admin-token";

export async function estaLogado(): Promise<boolean> {
  const jar = await cookies();
  return tokenValido(jar.get(COOKIE_ADMIN)?.value);
}