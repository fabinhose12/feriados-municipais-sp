-- CreateTable
CREATE TABLE "Municipio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "codigoIbge" TEXT,
    "regiao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Feriado" (
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
    "municipioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Feriado_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fonte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "feriadoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT,
    "url" TEXT,
    "consultadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fonte_feriadoId_fkey" FOREIGN KEY ("feriadoId") REFERENCES "Feriado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nome_key" ON "Municipio"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_codigoIbge_key" ON "Municipio"("codigoIbge");

-- CreateIndex
CREATE INDEX "Feriado_municipioId_mes_dia_idx" ON "Feriado"("municipioId", "mes", "dia");
