// Validação do formulário de contribuição (sem dependências do banco).

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const REGRAS_MOVEIS: Record<string, { rotulo: string; offset: number }> = {
  CARNAVAL_SEGUNDA: { rotulo: "Segunda-feira de Carnaval", offset: -48 },
  CARNAVAL_TERCA: { rotulo: "Terça-feira de Carnaval", offset: -47 },
  QUARTA_CINZAS: { rotulo: "Quarta-feira de Cinzas", offset: -46 },
  SEXTA_SANTA: { rotulo: "Sexta-feira Santa", offset: -2 },
  CORPUS_CHRISTI: { rotulo: "Corpus Christi", offset: 60 },
};

export const TIPOS_FONTE: Record<string, string> = {
  LEI: "Lei municipal",
  SITE_PREFEITURA: "Site da prefeitura",
  DIARIO_OFICIAL: "Diário oficial",
  OUTRO: "Outro",
};

export type DadosValidos = {
  municipioId: number | null;
  novaCidade: string | null;
  nome: string;
  tipo: "FERIADO" | "PONTO_FACULTATIVO";
  tipoData: "FIXA" | "MOVEL";
  mes: number | null;
  dia: number | null;
  offsetPascoa: number | null;
  fonteTipo: string;
  referencia: string | null;
  url: string | null;
  observacao: string | null;
};

export type Resultado =
  | { ok: true; dados: DadosValidos }
  | { ok: false; erro: string };

const limpar = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();

export function validarEnvio(b: Record<string, string>): Resultado {
  // Cidade: uma existente (id) ou uma nova (texto)
  const id = Number(b.municipioId);
  let municipioId: number | null = null;
  let novaCidade: string | null = null;
  if (Number.isInteger(id) && id > 0) {
    municipioId = id;
  } else {
    const nomeCidade = limpar(b.novaCidade);
    if (!nomeCidade) return { ok: false, erro: "Escolha uma cidade ou informe o nome de uma nova." };
    if (!/^[\p{L}][\p{L}\s'’.-]{2,59}$/u.test(nomeCidade))
      return { ok: false, erro: "Nome de cidade inválido (use de 3 a 60 letras)." };
    novaCidade = nomeCidade;
  }

  const nome = limpar(b.nome);
  if (nome.length < 3 || nome.length > 80)
    return { ok: false, erro: "O nome do feriado deve ter de 3 a 80 caracteres." };

  const tipo = b.tipo === "PONTO_FACULTATIVO" ? "PONTO_FACULTATIVO" : "FERIADO";

  let tipoData: "FIXA" | "MOVEL";
  let mes: number | null = null;
  let dia: number | null = null;
  let offsetPascoa: number | null = null;

  if (b.tipoData === "MOVEL") {
    tipoData = "MOVEL";
    const regra = REGRAS_MOVEIS[b.regraMovel];
    if (!regra) return { ok: false, erro: "Escolha a regra do feriado móvel." };
    offsetPascoa = regra.offset;
  } else {
    tipoData = "FIXA";
    mes = Number(b.mes);
    dia = Number(b.dia);
    if (!Number.isInteger(mes) || !Number.isInteger(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31)
      return { ok: false, erro: "Informe um dia e um mês válidos." };
    // 2024 é bissexto: aceita 29/02 e rejeita datas como 31/04
    if (new Date(Date.UTC(2024, mes - 1, dia)).getUTCMonth() !== mes - 1)
      return { ok: false, erro: "Essa data não existe (confira o dia e o mês)." };
  }

  const fonteTipo = b.fonteTipo in TIPOS_FONTE ? b.fonteTipo : "";
  if (!fonteTipo) return { ok: false, erro: "Escolha o tipo de fonte." };

  const referencia = limpar(b.referencia) || null;
  const url = limpar(b.url) || null;
  if (!referencia && !url)
    return { ok: false, erro: "Informe a fonte: o número da lei ou o link da página oficial." };
  if (referencia && referencia.length > 100) return { ok: false, erro: "Referência muito longa." };
  if (url && (url.length > 300 || !/^https?:\/\/\S+$/i.test(url)))
    return { ok: false, erro: "O link precisa começar com http:// ou https://." };

  const observacao = limpar(b.observacao) || null;
  if (observacao && observacao.length > 300)
    return { ok: false, erro: "A observação deve ter no máximo 300 caracteres." };

  return {
    ok: true,
    dados: { municipioId, novaCidade, nome, tipo, tipoData, mes, dia, offsetPascoa, fonteTipo, referencia, url, observacao },
  };
}