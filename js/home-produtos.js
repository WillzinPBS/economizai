(async () => {
  const lista = document.getElementById("produtos-destaque");
  if (!lista) return;
  const escapar = (valor) => String(valor).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
  try {
    const { produtos } = await requisitar("produtos");
    lista.innerHTML = produtos.slice(0, 3).map((produto) => `
      <article class="produto-card-v" data-categoria="${escapar(produto.categoria)}">
        <div class="imagem-v">
          <img src="${escapar(produto.imagem)}" alt="${escapar(produto.nome)}" loading="lazy">
          <span class="produto-selo"><i class="bi bi-arrow-down-left-circle-fill" aria-hidden="true"></i> Menor preço</span>
        </div>
        <div class="descricao-v">
          <div class="produto-identidade-v">
            <p class="produto-categoria-v">${escapar(produto.categoria)}</p>
            <h2 title="${escapar(produto.nome)}">${escapar(produto.nome)}</h2>
          </div>
          <div class="precificacao-v">
            <div class="precos-v"><strong class="produto-preco">${escapar(produto.preco)}</strong><p class="produto-tipo-v">${escapar(produto.tipo)}</p></div>
            <p class="produto-mercado-v"><i class="bi bi-building" aria-hidden="true"></i> ${escapar(produto.mercado)}</p>
          </div>
          <a class="botao-principal produto-adicionar-v demonstracao" href="produto.html?busca=${encodeURIComponent(produto.nome)}"><span aria-hidden="true">+</span><span>Adicionar</span></a>
          ${produto.outrosMercados.length ? `<div class="produto-ofertas-v"><p class="outros-mercados-titulo-v">Outros mercados:</p>
            ${produto.outrosMercados.map((mercado) => `<div class="outro-mercado-v"><span><i class="bi bi-cart3" aria-hidden="true"></i>${escapar(mercado.nome)}</span><strong>${escapar(mercado.preco)}</strong></div>`).join("")}
          </div>` : ""}
        </div>
      </article>`).join("");
  } catch (erro) { lista.textContent = erro.message; }
})();
