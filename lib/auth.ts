import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";


const id = process.env.GOOGLE_CLIENT_ID;
console.log(
  "[auth] GOOGLE_CLIENT_ID:",
  id ? `${id.slice(0, 15)}… (${id.length} caracteres, termina certo: ${id.endsWith(".apps.googleusercontent.com")})` : "NÃO DEFINIDO",
);
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  user: {
    additionalFields: {
      // input: false => o usuário NÃO consegue definir esses campos por conta própria
      role: { type: "string", required: false, defaultValue: "USER", input: false },
      bloqueado: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },

  // Permite que Server Actions gravem os cookies de sessão
  plugins: [nextCookies()],
});