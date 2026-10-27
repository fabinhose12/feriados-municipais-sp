// Autenticação simples do admin: senha no .env + cookie assinado (HMAC).
// Sem dependências do Next, para poder ser testado isoladamente.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_ADMIN = "admin_sessao";
export const DURACAO_SEGUNDOS = 8 * 60 * 60; // 8 horas

function segredo(): string | null {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || null;
}

function assinar(texto: string, chave: string): string {
  return createHmac("sha256", chave).update(texto).digest("hex");
}

export function adminConfigurado(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

// Compara a senha informada com a do .env sem vazar informação pelo tempo de resposta.
export function senhaConfere(informada: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) return false;
  const a = createHash("sha256").update(informada).digest();
  const b = createHash("sha256").update(esperada).digest();
  return timingSafeEqual(a, b);
}

export function criarToken(agora: number = Date.now()): string {
  const chave = segredo();
  if (!chave) throw new Error("ADMIN_PASSWORD não definido");
  const expira = Math.floor(agora / 1000) + DURACAO_SEGUNDOS;
  return `${expira}.${assinar(String(expira), chave)}`;
}

export function tokenValido(token: string | undefined, agora: number = Date.now()): boolean {
  const chave = segredo();
  if (!token || !chave) return false;

  const [expiraTexto, assinatura] = token.split(".");
  if (!expiraTexto || !assinatura) return false;

  const expira = Number(expiraTexto);
  if (!Number.isInteger(expira) || expira < Math.floor(agora / 1000)) return false;

  const esperada = Buffer.from(assinar(expiraTexto, chave));
  const recebida = Buffer.from(assinatura);
  return esperada.length === recebida.length && timingSafeEqual(esperada, recebida);
}