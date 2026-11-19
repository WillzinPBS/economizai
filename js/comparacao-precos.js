// Todos os totais são calculados em centavos antes de serem formatados.
function compararPrecosCarrinho(itens) {
  const mercados = new Map();
  const itensCalculados = [];
  let totalMinimoCentavos = 0;
  let totalItens = 0;

  const chave = (nome) => String(nome).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

  const centavos = (preco) => {
    const texto = String(preco).replace(/[^\d,.-]/g, "");
    const valor = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
    return Math.round(Number(valor) * 100);
  };

  for (const item of itens) {
    const quantidade = Math.floor(Number(item.quantidade));
    if (!Number.isFinite(quantidade) || quantidade < 1) continue;
    const ofertas = new Map();
    for (const oferta of [
      { nome: item.produto.mercado, preco: item.produto.preco },
      ...(item.produto.outrosMercados || []),
    ]) {
      const preco = centavos(oferta.preco);
      if (!oferta.nome || !Number.isFinite(preco) || preco < 0) continue;
      const id = chave(oferta.nome);
      const anterior = ofertas.get(id);
      if (!anterior || preco < anterior.preco) ofertas.set(id, { nome: oferta.nome, preco });
    }
    if (!ofertas.size) continue;

    const menorPreco = Math.min(...[...ofertas.values()].map((oferta) => oferta.preco));
    itensCalculados.push({ ofertas, menorPreco, quantidade });
    totalMinimoCentavos += menorPreco * quantidade;
    totalItens += quantidade;
    for (const [id, oferta] of ofertas) {
      const mercado = mercados.get(id) || {
        nome: oferta.nome, totalCentavos: 0, minimoCentavos: 0, itensDisponiveis: 0, produtosDisponiveis: 0,
      };
      mercado.totalCentavos += oferta.preco * quantidade;
      mercado.minimoCentavos += menorPreco * quantidade;
      mercado.itensDisponiveis += quantidade;
      mercado.produtosDisponiveis += 1;
      mercados.set(id, mercado);
    }
  }

  const lista = [...mercados.values()].sort((a, b) =>
    a.totalCentavos - b.totalCentavos || a.nome.localeCompare(b.nome, "pt-BR"));
  const completos = lista.filter((mercado) => mercado.itensDisponiveis === totalItens)
    .sort((a, b) => a.totalCentavos - b.totalCentavos);
  const melhorMercado = completos[0] || [...lista].sort((a, b) =>
    b.produtosDisponiveis - a.produtosDisponiveis || b.itensDisponiveis - a.itensDisponiveis || a.totalCentavos - b.totalCentavos
  )[0] || null;

  // Compara os mesmos produtos com os preços do mercado destacado.
  // Sem lista completa, usa o menor preço quando o destaque não vende o item.
  for (const mercado of lista) {
    let referenciaCentavos = 0;
    mercado.itensComparaveis = 0;
    mercado.produtosComparaveis = 0;
    for (const item of itensCalculados) {
      if (!item.ofertas.has(chave(mercado.nome))) continue;
      const referencia = item.ofertas.get(chave(melhorMercado.nome));
      referenciaCentavos += (referencia ? referencia.preco : item.menorPreco) * item.quantidade;
      if (item.ofertas.size > 1) {
        mercado.itensComparaveis += item.quantidade;
        mercado.produtosComparaveis += 1;
      }
    }
    mercado.acrescimoCentavos = mercado.totalCentavos - referenciaCentavos;
  }

  // Itens vendidos em um único mercado não eliminam a economia dos demais.
  const alternativaComparavel = lista.filter((mercado) =>
    mercado !== melhorMercado && mercado.itensComparaveis > 0 && mercado.acrescimoCentavos > 0
  ).sort((a, b) =>
    b.produtosComparaveis - a.produtosComparaveis ||
    b.itensComparaveis - a.itensComparaveis || a.acrescimoCentavos - b.acrescimoCentavos
  )[0] || null;

  return { mercados: lista, completos, melhorMercado, alternativaComparavel, totalMinimoCentavos, totalItens };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { compararPrecosCarrinho };
}
