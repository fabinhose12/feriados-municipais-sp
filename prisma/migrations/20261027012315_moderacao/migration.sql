-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feriado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "escopo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'FERIADO',
    "nome" TEXT NOT NULL,
    "tipoData" TEXT NOT NULL,
    "mes" INTEGER,
    "dia" INTEGER,
    "offsetPascoa" INTEGER,
    "vigenciaDe" INTEGER,
    "vigenciaAte" INTEGER,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'APROVADO',
    "origem" TEXT NOT NULL DEFAULT 'ADMIN',
    "observacao" TEXT,
    "municipioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Feriado_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Feriado" ("atualizadoEm", "criadoEm", "dia", "escopo", "id", "mes", "municipioId", "nome", "offsetPascoa", "tipo", "tipoData", "verificado", "vigenciaAte", "vigenciaDe") SELECT "atualizadoEm", "criadoEm", "dia", "escopo", "id", "mes", "municipioId", "nome", "offsetPascoa", "tipo", "tipoData", "verificado", "vigenciaAte", "vigenciaDe" FROM "Feriado";
DROP TABLE "Feriado";
ALTER TABLE "new_Feriado" RENAME TO "Feriado";
CREATE INDEX "Feriado_municipioId_mes_dia_idx" ON "Feriado"("municipioId", "mes", "dia");
CREATE INDEX "Feriado_status_idx" ON "Feriado"("status");
CREATE TABLE "new_Municipio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "codigoIbge" TEXT,
    "regiao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'APROVADO'
);
INSERT INTO "new_Municipio" ("ativo", "codigoIbge", "id", "nome", "regiao") SELECT "ativo", "codigoIbge", "id", "nome", "regiao" FROM "Municipio";
DROP TABLE "Municipio";
ALTER TABLE "new_Municipio" RENAME TO "Municipio";
CREATE UNIQUE INDEX "Municipio_nome_key" ON "Municipio"("nome");
CREATE UNIQUE INDEX "Municipio_codigoIbge_key" ON "Municipio"("codigoIbge");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
