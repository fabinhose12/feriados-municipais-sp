import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // migrações usam a conexão direta; se não houver, usa a normal
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});