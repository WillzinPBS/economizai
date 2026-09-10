const produtosMock = JSON.parse(
  document.getElementById("produtos-json").textContent
);
const listaProdutos = document.getElementById("produtos");
const contadorProdutos = document.getElementById("produtos-contador");

function criarProdutoCard(produto) {
  const selos = {
    seloMenorPreco: `
      <span class="produto-selo">
        <i class="bi bi-arrow-down-left-circle-fill"></i> Menor pre&ccedil;o
      </span>
    `,
    seloQueima: `
      <span class="produto-seloQueima">
        <i class="bi bi-fire"></i> &Uacute;ltimas unidades
      </span>
    `,
    seloUltimos: `
      <span class="produto-seloUltimos">
        <i class="bi bi-lightning-fill"></i> Oferta rel&acirc;mpago
      </span>
    `,
  };

  const selo = selos[produto.selo] || "";
  const outrosMercados = produto.outrosMercados
    .map(
      (mercado) => `
        <div class="outro-mercado">
          <span><i class="bi bi-cart3" aria-hidden="true"></i>${mercado.nome}</span>
          <strong>${mercado.preco}</strong>
        </div>
      `
    )
    .join("");

  return `
    <article class="produto-card" data-categoria="${produto.categoria}">
      <div class="imagem">
        <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
      </div>

      <div class="descricao">
        <div class="produto-identidade">
          <div class="produto-identidade-topo">
            <p class="produto-categoria">${produto.categoria}</p>
            ${selo}
          </div>
          <h2>${produto.nome}</h2>
        </div>

        <div class="produto-preco-info">
          <div class="container-precificacao">
            <div class="precificacao" id="blur">
              <div class="precos">
                <strong class="produto-preco">${produto.preco}</strong>
                <p class="produto-tipo">${produto.tipo}</p>
              </div>

              <button class="produto-info-trigger" type="button" aria-expanded="false" aria-describedby="mercados-${produto.id}">
                <i class="bi bi-building" aria-hidden="true"></i>
                Comparar mercados
              </button>

              <div class="produto-tooltip" id="mercados-${produto.id}" role="tooltip">
                <p class="outros-mercados-titulo">Outros mercados</p>
                <div class="outros-mercados">
                  ${outrosMercados}
                </div>
              </div>
            </div>

            <div class="container-alert">
              <i class="fa-solid fa-lock"></i>
              <h3>Fa&ccedil;a login para ter acesso</h3>
              <a href="login.html" class="container-alert-link">Entrar</a>
            </div>
          </div>
        </div>

        <div class="produto-acao">
          <button class="botao-principal produto-adicionar" type="button" data-id="${produto.id}">
            <span aria-hidden="true">+</span>
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

contadorProdutos.textContent = `${produtosMock.length} produtos encontrados`;
produtosMock.forEach((produto) => {
  listaProdutos.insertAdjacentHTML("beforeend", criarProdutoCard(produto));
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".produto-info-trigger");

  document.querySelectorAll(".produto-tooltip.aberto").forEach((tooltip) => {
    if (!trigger || tooltip !== trigger.nextElementSibling) {
      tooltip.classList.remove("aberto");
      const gatilhoAnterior = tooltip.previousElementSibling;
      if (gatilhoAnterior) gatilhoAnterior.setAttribute("aria-expanded", "false");
    }
  });

  if (!trigger) return;

  const tooltip = trigger.nextElementSibling;
  const aberto = tooltip.classList.toggle("aberto");
  trigger.setAttribute("aria-expanded", String(aberto));
});

function carregarCarrinho() {
  try {
    const itensSalvos = JSON.parse(localStorage.getItem("carrinho"));
    if (!Array.isArray(itensSalvos)) return [];

    return itensSalvos
      .map((item) => {
        const produtoAtual = produtosMock.find(
          (produto) => produto.id === item?.produto?.id
        );

        if (!produtoAtual) return null;

        return {
          produto: produtoAtual,
          quantidade: Math.max(1, Number(item.quantidade) || 1),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

let carrinho = carregarCarrinho();

function converterPreco(preco) {
  return Number(
    String(preco).replace("R$", "").replace(".", "").replace(",", ".").trim()
  );
}

function obterPrecosProduto(produto) {
  return [
    { nome: produto.mercado, preco: produto.preco },
    ...produto.outrosMercados,
  ];
}

function encontrarItem(id) {
  return carrinho.find((item) => item.produto.id === id);
}

document.addEventListener("click", (event) => {
  const adicionar = event.target.closest(".produto-adicionar");
  const aumentar = event.target.closest(".aumentar-item");
  const diminuir = event.target.closest(".diminuir-item");
  const remover = event.target.closest(".remover-item");
  const acao = adicionar || aumentar || diminuir || remover;

  if (!acao) return;

  if (adicionar && !localStorage.getItem("usuarioLogado")) {
    window.location.href = "login.html";
    return;
  }

  const id = Number(acao.dataset.id);
  const item = encontrarItem(id);

  if (adicionar) {
    if (item) {
      item.quantidade += 1;
    } else {
      const produto = produtosMock.find((produtoAtual) => produtoAtual.id === id);
      if (produto) carrinho.push({ produto, quantidade: 1 });
    }
  }

  if (aumentar && item) {
    item.quantidade += 1;
  }

  if (diminuir && item) {
    item.quantidade -= 1;
    if (item.quantidade <= 0) {
      carrinho = carrinho.filter((itemAtual) => itemAtual.produto.id !== id);
    }
  }

  if (remover) {
    carrinho = carrinho.filter((itemAtual) => itemAtual.produto.id !== id);
  }

  renderizarCarrinho();
});

function renderizarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  const listaCarrinho = document.getElementById("lista-carrinho");
  const contadorCarrinho = document.getElementById("contador-carrinho");
  const resumoCarrinho = document.getElementById("resumo-carrinho");
  const totalCarrinho = document.getElementById("total-carrinho");
  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  contadorCarrinho.textContent =
    totalItens === 1 ? "1 item" : `${totalItens} itens`;

  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart fs-1 text-secondary"></i>
        <h5 class="mt-3">Sua lista est&aacute; vazia</h5>
        <p class="text-muted">
          Adicione produtos para come&ccedil;ar a comparar pre&ccedil;os
        </p>
      </div>
    `;

    resumoCarrinho.classList.add("d-none");
    configurarComparador(null);
    return;
  }

  const totalMenoresPrecos = carrinho.reduce((total, item) => {
    return total + converterPreco(item.produto.preco) * item.quantidade;
  }, 0);

  totalCarrinho.textContent = totalMenoresPrecos.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  resumoCarrinho.classList.remove("d-none");
  listaCarrinho.innerHTML = carrinho
    .map(
      (item) => `
        <div class="bg-light p-3 rounded-4 d-flex flex-wrap align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center">
            <img
              src="${item.produto.imagem}"
              class="rounded-3 me-3 img-animada"
              style="width:80px;height:80px;object-fit:cover;"
              alt="${item.produto.nome}">

            <div>
              <h6 class="mb-0 fw-bold">${item.produto.nome}</h6>
              <small class="text-muted">
                Menor pre&ccedil;o: ${item.produto.mercado} - ${item.produto.preco}
              </small>
            </div>
          </div>

          <div class="d-flex align-items-center">
            <div class="d-flex align-items-center border rounded-3 bg-white me-3">
              <button
                class="btn btn-sm border-0 px-3 diminuir-item"
                data-id="${item.produto.id}"
                aria-label="Diminuir quantidade de ${item.produto.nome}">
                -
              </button>

              <span class="px-2 fw-bold">${item.quantidade}</span>

              <button
                class="btn btn-sm border-0 px-3 aumentar-item"
                data-id="${item.produto.id}"
                aria-label="Aumentar quantidade de ${item.produto.nome}">
                +
              </button>
            </div>

            <button
              class="btn text-danger p-0 remover-item"
              data-id="${item.produto.id}"
              aria-label="Remover ${item.produto.nome}">
              <i class="bi bi-trash3 fs-5"></i>
            </button>
          </div>
        </div>
      `
    )
    .join("");

  configurarComparador(compararMercados());
}

function compararMercados() {
  if (!carrinho.length) return null;

  const nomesMercados = [
    ...new Set(
      carrinho.flatMap((item) =>
        obterPrecosProduto(item.produto).map((mercado) => mercado.nome)
      )
    ),
  ];

  const mercados = nomesMercados
    .map((nome) => {
      let total = 0;

      for (const item of carrinho) {
        const oferta = obterPrecosProduto(item.produto).find(
          (mercado) => mercado.nome === nome
        );

        if (!oferta) return null;
        total += converterPreco(oferta.preco) * item.quantidade;
      }

      return { nome, total };
    })
    .filter(Boolean)
    .sort((a, b) => a.total - b.total);

  return mercados.length ? mercados : null;
}

function configurarComparador(mercadosOrdenados) {
  const resultadoComparacao = document.getElementById("resultado-comparacao");

  if (!mercadosOrdenados?.length) {
    resultadoComparacao.classList.add("d-none");
    resultadoComparacao.innerHTML = "";
    return;
  }

  const melhorMercado = mercadosOrdenados[0];
  const economia =
    mercadosOrdenados.length > 1
      ? mercadosOrdenados[1].total - melhorMercado.total
      : 0;

  resultadoComparacao.classList.remove("d-none");
  resultadoComparacao.innerHTML = `
    <div class="card border-0 bg-success text-white p-4">
      <h5 class="fw-bold mb-2">Melhor mercado para a lista</h5>
      <h2 class="fw-bold mb-3">${melhorMercado.nome}</h2>

      <div class="mb-3">
        ${mercadosOrdenados
          .map(
            (mercado, indice) => `
              <div class="d-flex justify-content-between mb-2">
                <span>${indice + 1}. ${mercado.nome}</span>
                <strong>
                  ${mercado.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            `
          )
          .join("")}
      </div>

      <div>
        <strong>Economia sobre a segunda op&ccedil;&atilde;o:</strong>
        ${economia.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </div>
    </div>
  `;
}

renderizarCarrinho();