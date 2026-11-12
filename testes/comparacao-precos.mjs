import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { compararPrecosCarrinho } = createRequire(import.meta.url)("../js/comparacao-precos.js");

const cafe = {
  nome: "Café Pilão", mercado: "Carrefour", preco: "R$ 27,99",
  outrosMercados: [{ nome: "Atacadão", preco: "R$ 29,99" }, { nome: "Extra", preco: "R$ 34,99" }],
};
const maca = { nome: "Maçã", mercado: "Hortifruti", preco: "R$ 7,99", outrosMercados: [] };

for (const quantidade of [1, 9, 99, 1000]) {
  const resultado = compararPrecosCarrinho([{ produto: cafe, quantidade }, { produto: maca, quantidade }]);
  const mercado = (nome) => resultado.mercados.find((mercado) => mercado.nome === nome);
  assert.equal(resultado.totalMinimoCentavos, (2799 + 799) * quantidade);
  assert.equal(resultado.totalItens, 2 * quantidade);
  assert.equal(resultado.melhorMercado.nome, "Hortifruti");
  assert.equal(resultado.completos.length, 0, "o destaque deve ser identificado como incompleto");
  assert.equal(mercado("Carrefour").acrescimoCentavos, 0);
  assert.equal(mercado("Hortifruti").acrescimoCentavos, 0);
  assert.equal(mercado("Atacadão").acrescimoCentavos, 200 * quantidade);
  assert.equal(mercado("Extra").acrescimoCentavos, 700 * quantidade);
  assert.equal(mercado("Atacadão").totalCentavos, 2999 * quantidade);
  assert.equal(mercado("Extra").itensDisponiveis, quantidade);
}
console.log("OK produtos sem mercados em comum e quantidades de 1 a 1000");

const completo = compararPrecosCarrinho([
  { produto: cafe, quantidade: 9 },
  { produto: { ...maca, mercado: "Carrefour", outrosMercados: [{ nome: "Extra", preco: "R$ 8,99" }] }, quantidade: 3 },
]);
assert.equal(completo.melhorMercado.nome, "Carrefour");
assert.equal(completo.totalMinimoCentavos, 2799 * 9 + 799 * 3);
assert.equal(completo.mercados.find((m) => m.nome === "Extra").acrescimoCentavos, 700 * 9 + 100 * 3);
assert.equal(completo.mercados.find((m) => m.nome === "Atacadão").acrescimoCentavos, 200 * 9);
console.log("OK cesta completa, cobertura parcial e quantidades diferentes");

const combinado = compararPrecosCarrinho([
  { produto: cafe, quantidade: 1 },
  { produto: { ...maca, mercado: "Extra", outrosMercados: [{ nome: "Carrefour", preco: "R$ 8,99" }] }, quantidade: 1 },
]);
assert.equal(combinado.completos.length, 2);
assert.equal(combinado.melhorMercado.nome, "Carrefour", "deve destacar o menor total em um único mercado");
assert.equal(combinado.melhorMercado.totalCentavos, 3698);
assert.equal(combinado.mercados.find((m) => m.nome === "Extra").acrescimoCentavos, 600);
assert.equal(combinado.totalMinimoCentavos, 3598);
assert.equal(combinado.completos[0].nome, "Carrefour");
assert.equal(combinado.completos[0].totalCentavos - combinado.totalMinimoCentavos, 100);
console.log("OK menores preços em mercados diferentes com cestas completas disponíveis");

const exemploPrint = compararPrecosCarrinho([
  { quantidade: 4, produto: { mercado: "Extra", preco: "R$ 2,19", outrosMercados: [
    { nome: "Atacadão", preco: "R$ 2,29" }, { nome: "Carrefour", preco: "R$ 2,79" },
  ] } },
  { quantidade: 4, produto: { mercado: "Carrefour", preco: "R$ 20,99", outrosMercados: [
    { nome: "Atacadão", preco: "R$ 22,99" }, { nome: "Extra", preco: "R$ 24,99" },
  ] } },
]);
assert.equal(exemploPrint.melhorMercado.nome, "Carrefour");
assert.equal(exemploPrint.melhorMercado.totalCentavos, 9512);
assert.deepEqual(exemploPrint.mercados.map((m) => m.nome), ["Carrefour", "Atacadão", "Extra"]);
assert.deepEqual(exemploPrint.mercados.map((m) => m.totalCentavos), [9512, 10112, 10872]);
assert.deepEqual(exemploPrint.mercados.map((m) => m.acrescimoCentavos), [0, 600, 1360]);
const parcialMaisBarato = compararPrecosCarrinho([
  { quantidade: 1, produto: { mercado: "Completo", preco: "R$ 10,00", outrosMercados: [{ nome: "Parcial", preco: "R$ 1,00" }] } },
  { quantidade: 1, produto: { mercado: "Completo", preco: "R$ 10,00", outrosMercados: [] } },
]);
assert.equal(parcialMaisBarato.melhorMercado.nome, "Completo");
assert.equal(parcialMaisBarato.melhorMercado.totalCentavos, 2000);
assert.deepEqual(parcialMaisBarato.mercados.map((m) => m.totalCentavos), [100, 2000]);
assert.equal(parcialMaisBarato.mercados[0].acrescimoCentavos, -900);
console.log("OK caso do print, ordem por total e destaque da compra completa sem misturar mercados");

const soCafe = compararPrecosCarrinho([{ produto: cafe, quantidade: 1 }]);
assert.equal(soCafe.alternativaComparavel.nome, "Atacadão");
assert.equal(soCafe.alternativaComparavel.acrescimoCentavos, 200);
for (const mercadoUnico of ["Carrefour", "Hortifruti"]) {
  const comExclusivo = compararPrecosCarrinho([
    { produto: cafe, quantidade: 1 },
    { produto: { ...maca, mercado: mercadoUnico }, quantidade: 30 },
  ]);
  assert.equal(comExclusivo.alternativaComparavel.nome, "Atacadão");
  assert.equal(comExclusivo.alternativaComparavel.acrescimoCentavos, 200);
  assert.equal(comExclusivo.alternativaComparavel.itensComparaveis, 1);
}
const quantidadeComparavel = compararPrecosCarrinho([
  { produto: cafe, quantidade: 9 }, { produto: maca, quantidade: 1000 },
]);
assert.equal(quantidadeComparavel.alternativaComparavel.acrescimoCentavos, 1800);
assert.equal(quantidadeComparavel.alternativaComparavel.itensComparaveis, 9);
assert.equal(compararPrecosCarrinho([{ produto: maca, quantidade: 4 }]).alternativaComparavel, null);
console.log("OK economia preservada ao adicionar itens exclusivos sem inflar a quantidade comparável");

const grande = compararPrecosCarrinho([{ quantidade: 1000, produto: {
  mercado: "Loja A", preco: "R$ 1.234,56", outrosMercados: [
    { nome: "Loja B", preco: "R$ 1.234,66" },
    { nome: "LOJA A", preco: "R$ 1.235,56" },
  ],
} }]);
assert.equal(grande.totalMinimoCentavos, 123456000);
assert.equal(grande.mercados.length, 2);
assert.equal(grande.mercados.find((m) => m.nome === "Loja B").acrescimoCentavos, 10000);
const empate = compararPrecosCarrinho([{ quantidade: 5, produto: {
  mercado: "A", preco: "R$ 0,10", outrosMercados: [{ nome: "B", preco: "R$ 0,10" }],
} }]);
assert.equal(empate.totalMinimoCentavos, 50);
assert(empate.mercados.every((m) => m.acrescimoCentavos === 0));
assert.equal(compararPrecosCarrinho([{ produto: maca, quantidade: 2 }]).melhorMercado.nome, "Hortifruti");
assert.equal(compararPrecosCarrinho([]).totalItens, 0);
console.log("OK centavos, milhares, empates, mercado duplicado, mercado único e carrinho vazio");
