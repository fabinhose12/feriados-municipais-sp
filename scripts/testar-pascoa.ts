import { calcularPascoa, paraISO, somarDias } from "../lib/pascoa";

// Datas conhecidas da Páscoa
const esperado: Record<number, string> = {
  2024: "2024-03-31",
  2025: "2025-04-20",
  2026: "2026-04-05",
  2027: "2027-03-28",
  2028: "2028-04-16",
  2029: "2029-04-01",
  2030: "2030-04-21",
};

let ok = true;
for (const [ano, data] of Object.entries(esperado)) {
  const obtido = paraISO(calcularPascoa(Number(ano)));
  const certo = obtido === data;
  if (!certo) ok = false;
  console.log(`${ano}: ${obtido} ${certo ? "OK" : `ERRO (esperado ${data})`}`);
}

const pascoa2026 = calcularPascoa(2026);
console.log("Sexta-feira Santa 2026:", paraISO(somarDias(pascoa2026, -2)));
console.log("Corpus Christi 2026:", paraISO(somarDias(pascoa2026, 60)));

process.exit(ok ? 0 : 1);