const produtosMock = JSON.parse(
  document.getElementById("produtos-json").textContent
);
const listaProdutos = document.getElementById("produtos");
const contadorProdutos = document.getElementById("produtos-contador");

const CURTIDAS_CHAVE = "curtidas";

function obterUsuarioLogado() {
  return localStorage.getItem("usuarioLogado");
}

// Formato salvo: { "usuario1": [1, 4], "usuario2": [2] }
function carregarCurtidas() {
  try {
    const dados = JSON.parse(localStorage.getItem(CURTIDAS_CHAVE));
    return dados && typeof dados === "object" && !Array.isArray(dados)
      ? dados
      : {};
  } catch {
    return {};
  }
}

function produtoCurtido(id) {
  const usuario = obterUsuarioLogado();
  if (!usuario) return false;

  return (carregarCurtidas()[usuario] || []).includes(id);
}

function alternarCurtida(id) {
  const usuario = obterUsuarioLogado();
  const curtidas = carregarCurtidas();
  const lista = curtidas[usuario] || [];

  curtidas[usuario] = lista.includes(id)
    ? lista.filter((idAtual) => idAtual !== id)
    : [...lista, id];

  localStorage.setItem(CURTIDAS_CHAVE, JSON.stringify(curtidas));
  return curtidas[usuario].includes(id);
}

function contarCurtidas(id) {
  return Object.values(carregarCurtidas()).filter(
    (lista) => Array.isArray(lista) && lista.includes(id)
  ).length;
}

function atualizarBotaoCurtir(botao) {
  const id = Number(botao.dataset.id);
  const curtido = produtoCurtido(id);
  const total = contarCurtidas(id);

  botao.classList.toggle("curtido", curtido);
  botao.setAttribute("aria-pressed", String(curtido));
  botao.setAttribute(
    "aria-label",
    `Curtir ${botao.dataset.nome} (${total} ${
      total === 1 ? "curtida" : "curtidas"
    })`
  );
  botao.querySelector(".produto-curtir-contagem").textContent = total;
}

function atualizarTodosBotoesCurtir() {
  document.querySelectorAll(".produto-curtir").forEach(atualizarBotaoCurtir);
}

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
          <div class="produto-selo-area">${selo}</div>
          <p class="produto-categoria">${produto.categoria}</p>
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
          <button
            type="button"
            class="produto-curtir"
            data-id="${produto.id}"
            data-nome="${produto.nome}"
            aria-pressed="false"
            aria-label="Curtir ${produto.nome}"
            title="Curtir">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span class="produto-curtir-contagem">0</span>
          </button>

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

atualizarTodosBotoesCurtir();

window.addEventListener("storage", (event) => {
  if (event.key === CURTIDAS_CHAVE) atualizarTodosBotoesCurtir();
});

document.addEventListener("click", (event) => {
  const botao = event.target.closest(".produto-curtir");
  if (!botao) return;

  if (!obterUsuarioLogado()) {
    window.location.href = "login.html";
    return;
  }

  alternarCurtida(Number(botao.dataset.id));
  atualizarBotaoCurtir(botao);
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".produto-info-trigger");

  document.querySelectorAll(".produto-tooltip.aberto").forEach((tooltip) => {
    if (!trigger || tooltip !== trigger.nextElementSibling) {
      tooltip.classList.remove("aberto");
      const gatilhoAnterior = tooltip.previousElementSibling;
      if (gatilhoAnterior)
        gatilhoAnterior.setAttribute("aria-expanded", "false");
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

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
      const produto = produtosMock.find(
        (produtoAtual) => produtoAtual.id === id
      );
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
  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  contadorCarrinho.textContent =
    totalItens === 1 ? "1 item" : `${totalItens} itens`;

  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = `
      <div class="carrinho-vazio">
        <i class="bi bi-cart" aria-hidden="true"></i>
        <h3>Sua lista est&aacute; vazia</h3>
        <p>Adicione produtos para come&ccedil;ar a comparar pre&ccedil;os</p>
      </div>
    `;

    resumoCarrinho.classList.add("d-none");
    configurarComparador(null);
    return;
  }

  resumoCarrinho.classList.remove("d-none");
  listaCarrinho.innerHTML = carrinho
    .map((item) => {
      const subtotal = converterPreco(item.produto.preco) * item.quantidade;

      return `
        <article class="carrinho-item">
          <img
            class="carrinho-item-imagem"
            src="${item.produto.imagem}"
            alt="${item.produto.nome}">

          <div class="carrinho-item-info">
            <h3>${item.produto.nome}</h3>
            <p class="carrinho-item-categoria">${item.produto.categoria}</p>
            <p class="carrinho-item-melhor">
              Menor pre&ccedil;o: <strong>${
                item.produto.mercado
              }</strong> &middot; ${item.produto.preco}
            </p>
          </div>

          <div class="carrinho-item-controles">
            <div class="carrinho-quantidade" role="group" aria-label="Quantidade de ${
              item.produto.nome
            }">
              <button
                type="button"
                class="diminuir-item"
                data-id="${item.produto.id}"
                aria-label="Diminuir quantidade de ${item.produto.nome}">
                &minus;
              </button>

              <span>${item.quantidade}</span>

              <button
                type="button"
                class="aumentar-item"
                data-id="${item.produto.id}"
                aria-label="Aumentar quantidade de ${item.produto.nome}">
                +
              </button>
            </div>

            <strong class="carrinho-item-subtotal">${formatarMoeda(
              subtotal
            )}</strong>

            <button
              type="button"
              class="remover-item"
              data-id="${item.produto.id}"
              aria-label="Remover ${item.produto.nome}">
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
          </div>
        </article>
      `;
    })
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
  const outrosMercados = mercadosOrdenados.slice(1);
  const economia = outrosMercados.length
    ? outrosMercados[0].total - melhorMercado.total
    : 0;

  const blocoEconomia =
    economia > 0
      ? `
      <p class="comparador-economia">
        Voc&ecirc; economiza <strong>${formatarMoeda(economia)}</strong>
        em rela&ccedil;&atilde;o ao ${outrosMercados[0].nome}
      </p>
    `
      : "";

  const blocoOutros = outrosMercados.length
    ? `
      <div class="comparador-outros">
        <p class="comparador-outros-titulo">Outros mercados</p>
        <ol class="comparador-lista" start="2">
          ${outrosMercados
            .map((mercado, indice) => {
              const diferenca = mercado.total - melhorMercado.total;
              const textoDiferenca =
                diferenca > 0
                  ? `+ ${formatarMoeda(diferenca)}`
                  : "Mesmo pre&ccedil;o";

              return `
                <li class="comparador-linha">
                  <span class="comparador-posicao">${indice + 2}&ordm;</span>
                  <span class="comparador-nome">${mercado.nome}</span>
                  <span class="comparador-diferenca">${textoDiferenca}</span>
                  <strong class="comparador-total">${formatarMoeda(
                    mercado.total
                  )}</strong>
                </li>
              `;
            })
            .join("")}
        </ol>
      </div>
    `
    : "";

  resultadoComparacao.classList.remove("d-none");
  resultadoComparacao.innerHTML = `
    <div class="comparador">
      <div class="comparador-destaque">
        <span class="comparador-selo">
          Melhor mercado
        </span>
        <h3>${melhorMercado.nome}</h3>
        <p class="comparador-valor">${formatarMoeda(melhorMercado.total)}</p>
        ${blocoEconomia}
      </div>

      ${blocoOutros}
    </div>
  `;
}

renderizarCarrinho();
