let produtosCatalogo = [];
const listaProdutos = document.getElementById("produtos");
const contadorProdutos = document.getElementById("produtos-contador");



function escaparHtmlProduto(valor) {
  return String(valor).replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[caractere]);
}

function obterUsuarioLogado() {
  return window.usuarioAtual?.login;
}

function atualizarProtecaoPrecos() {
  const usuarioLogado = Boolean(obterUsuarioLogado());
  document.querySelectorAll(".precificacao-protegida").forEach((precos) => {
    precos.classList.toggle("sem-blur", usuarioLogado);
    const alerta = precos.parentElement.querySelector(".container-alert");
    if (alerta) alerta.hidden = usuarioLogado;
  });
}

let curtidasProdutos = new Map();
const curtidasPendentes = new Set();
let versaoConsultaCurtidas = 0;

async function carregarCurtidasServidor() {
  if (curtidasPendentes.size) return;
  const versao = ++versaoConsultaCurtidas;
  try {
    const { curtidas } = await requisitar("curtidas");
    if (versao !== versaoConsultaCurtidas) return;
    curtidasProdutos = new Map(curtidas.map((item) => [item.produtoId, item]));
    atualizarTodosBotoesCurtir();
  } catch {
    // Mantém a última contagem recebida; o próximo carregamento sincroniza.
  }
}

function atualizarBotaoCurtir(botao) {
  const id = Number(botao.dataset.id);
  const estado = curtidasProdutos.get(id) || { total: 0, curtido: false };
  const curtido = Boolean(obterUsuarioLogado()) && estado.curtido;
  botao.classList.toggle("curtido", curtido);
  botao.setAttribute("aria-pressed", String(curtido));
  botao.disabled = curtidasPendentes.has(id);
  botao.setAttribute("aria-label", `${curtido ? "Descurtir" : "Curtir"} ${botao.dataset.nome} (${estado.total} ${estado.total === 1 ? "curtida" : "curtidas"})`);
  botao.title = curtido ? "Descurtir" : "Curtir";
  botao.querySelector(".produto-curtir-contagem").textContent = estado.total;
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
            <div class="precificacao precificacao-protegida">
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

const campoBuscaProdutos = document.getElementById("busca-produtos");
let categoriaSelecionada = "Todas";
let atualizarFiltroProdutos = () => {};
if (campoBuscaProdutos) {
  const normalizarBusca = (valor) =>
    valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  const parametrosBusca = new URLSearchParams(window.location.search);
  campoBuscaProdutos.value = parametrosBusca.get("busca") || "";

  const filtrarProdutos = () => {
    const termo = normalizarBusca(campoBuscaProdutos.value);
    const cards = [...listaProdutos.querySelectorAll(".produto-card")];
    let encontrados = 0;

    cards.forEach((card) => {
      const corresponde = normalizarBusca(card.textContent).includes(termo) &&
        (categoriaSelecionada === "Todas" || normalizarBusca(card.dataset.categoria) === normalizarBusca(categoriaSelecionada));
      card.hidden = !corresponde;
      if (corresponde) encontrados += 1;
    });

    contadorProdutos.textContent = `${encontrados} produtos encontrados`;
  };
  atualizarFiltroProdutos = filtrarProdutos;

  campoBuscaProdutos.addEventListener("input", filtrarProdutos);
  document.querySelectorAll("#filtro button").forEach((botao) => {
    botao.addEventListener("click", () => {
      categoriaSelecionada = botao.textContent.trim();
      document.querySelectorAll("#filtro button").forEach((item) => {
        const ativo = item === botao;
        item.classList.toggle("btn-primary", ativo);
        item.classList.toggle("bg-green-600", ativo);
        item.classList.toggle("btn-light", !ativo);
        item.classList.toggle("text-dark", !ativo);
      });
      filtrarProdutos();
    });
  });
  filtrarProdutos();
}

function normalizarChaveProduto(valor) {
  return String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function precoNumerico(valor) {
  return Number(String(valor).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
}

function escaparOferta(produto) {
  return {
    ...produto,
    nome: escaparHtmlProduto(produto.nome), categoria: escaparHtmlProduto(produto.categoria),
    mercado: escaparHtmlProduto(produto.mercado), tipo: escaparHtmlProduto(produto.tipo),
    imagem: escaparHtmlProduto(produto.imagem),
    outrosMercados: produto.outrosMercados.map((mercado) => ({...mercado, nome: escaparHtmlProduto(mercado.nome)})),
  };
}

async function carregarProdutosCatalogo() {
  contadorProdutos.textContent = "Carregando produtos...";
  try {
    const resposta = await requisitar("produtos");
    curtidasProdutos = new Map(resposta.produtos.map((produto) => [produto.id, {
      produtoId: produto.id, total: produto.totalCurtidas || 0, curtido: Boolean(produto.curtido),
    }]));
    produtosCatalogo = resposta.produtos.map(escaparOferta);
    listaProdutos.replaceChildren();
    produtosCatalogo.forEach((produto) => listaProdutos.insertAdjacentHTML("beforeend", criarProdutoCard(produto)));
    carrinho = carregarCarrinho();
    atualizarFiltroProdutos();
    atualizarTodosBotoesCurtir();
    atualizarProtecaoPrecos();
    renderizarCarrinho();
  } catch (erro) {
    contadorProdutos.textContent = erro.message;
  }
}

atualizarTodosBotoesCurtir();
window.sessaoPronta?.then(atualizarProtecaoPrecos);
window.addEventListener("sessao-alterada", atualizarProtecaoPrecos);
window.addEventListener("sessao-alterada", carregarCurtidasServidor);

window.addEventListener("focus", carregarCurtidasServidor);

document.addEventListener("click", async (event) => {
  const botao = event.target.closest(".produto-curtir");
  if (!botao) return;
  if (!obterUsuarioLogado()) {
    window.location.href = "login.html";
    return;
  }
  const id = Number(botao.dataset.id);
  if (curtidasPendentes.has(id)) return;
  const mensagem = document.getElementById("mensagem-curtidas");
  if (mensagem) mensagem.textContent = "";
  const estado = curtidasProdutos.get(id) || { total: 0, curtido: false };
  curtidasPendentes.add(id);
  versaoConsultaCurtidas += 1;
  atualizarBotaoCurtir(botao);
  try {
    const resposta = await requisitar("curtir-produto", { id, curtido: !estado.curtido });
    curtidasProdutos.set(id, resposta);
  } catch (erro) {
    if (erro.status === 401) { location.href = "login.html"; return; }
    if (mensagem) mensagem.textContent = erro.message;
  } finally {
    curtidasPendentes.delete(id);
    atualizarTodosBotoesCurtir();
  }
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
    return itensSalvos.map((item) => {
      const id = Number(item.produtoId ?? item.produto?.id);
      const produto = item.produto
        ? produtosCatalogo.find((produto) => produto.nome === item.produto.nome && produto.categoria === item.produto.categoria)
        : produtosCatalogo.find((produto) => produto.id === id);
      const quantidade = Math.floor(Number(item.quantidade));
      return { produto, quantidade: Number.isSafeInteger(quantidade) && quantidade > 0 ? quantidade : 1 };
    }).filter((item) => item.produto);
  } catch { return []; }
}

let carrinho = [];

function converterPreco(preco) {
  return precoNumerico(preco);
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

  if (adicionar && !obterUsuarioLogado()) {
    window.location.href = "login.html";
    return;
  }

  const id = Number(acao.dataset.id);
  const item = encontrarItem(id);

  if (adicionar) {
    if (item) {
      item.quantidade += 1;
    } else {
      const produto = produtosCatalogo.find(
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
  localStorage.setItem("carrinho", JSON.stringify(carrinho.map((item) => ({ produtoId: item.produto.id, quantidade: item.quantidade }))));

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
  return compararPrecosCarrinho(carrinho);
}

function configurarComparador(comparacao) {
  const resultadoComparacao = document.getElementById("resultado-comparacao");
  if (!comparacao?.mercados.length) {
    resultadoComparacao.classList.add("d-none");
    resultadoComparacao.innerHTML = "";
    return;
  }

  const { mercados, completos, melhorMercado, alternativaComparavel, totalItens } = comparacao;
  const listaCompleta = melhorMercado.itensDisponiveis === totalItens;
  const outrosMercados = mercados;
  const alternativaCompleta = completos.find((mercado) => mercado !== melhorMercado);
  const alternativa = alternativaCompleta || alternativaComparavel;
  const economia = alternativa ? alternativa.acrescimoCentavos : 0;
  const avisoCobertura = !listaCompleta
    ? "Nenhum mercado possui a lista completa. Este &eacute; o subtotal do mercado com maior cobertura." : "";
  const mensagemEconomia = economia > 0
    ? `Voc&ecirc; economiza <strong>${formatarMoeda(economia / 100)}</strong> ${alternativaCompleta ? "na compra completa" : `nos ${alternativa.itensComparaveis} ${alternativa.itensComparaveis === 1 ? "item com pre&ccedil;os compar&aacute;veis" : "itens com pre&ccedil;os compar&aacute;veis"}`} em rela&ccedil;&atilde;o ao ${alternativa.nome}.`
    : mercados.some((mercado) => mercado.itensComparaveis > 0)
      ? "A economia considera apenas os itens com pre&ccedil;os em mais de um mercado."
      : "Os itens da lista n&atilde;o possuem outros pre&ccedil;os dispon&iacute;veis para compara&ccedil;&atilde;o.";
  const explicacao = [mensagemEconomia,avisoCobertura].filter(Boolean).join("<br><br>");

  const blocoOutros = outrosMercados.length ? `
    <div class="comparador-outros">
      <p class="comparador-outros-titulo">Pre&ccedil;os por mercado</p>
      <p class="comparador-referencia">${listaCompleta ? `Do menor para o maior pre&ccedil;o. Diferen&ccedil;a para ${melhorMercado.nome} nos mesmos itens e quantidades.` : "Subtotais do menor para o maior. Nos itens sem oferta no destaque, a diferen&ccedil;a usa o menor pre&ccedil;o cadastrado."}</p>
      <ul class="comparador-lista">
        ${outrosMercados.map((mercado, indice) => {
          const acrescimo = mercado.acrescimoCentavos;
          const destaque = mercado === melhorMercado;
          const textoDiferenca = destaque ? (listaCompleta ? "Mais vantajoso" : "Maior cobertura") :
            acrescimo > 0 ? `+ ${formatarMoeda(acrescimo / 100)}` :
            acrescimo < 0 ? `- ${formatarMoeda(Math.abs(acrescimo) / 100)}` : "Mesmo pre&ccedil;o";
          return `
            <li class="comparador-linha">
              <span class="comparador-posicao" aria-hidden="true">${indice + 1}&ordm;</span>
              <span class="comparador-nome">${mercado.nome}<small class="comparador-cobertura">${mercado.itensDisponiveis} de ${totalItens} itens${mercado.itensDisponiveis < totalItens ? " &middot; subtotal parcial" : ""}</small></span>
              <span class="comparador-diferenca ${acrescimo <= 0 ? "comparador-diferenca--menor" : ""}">${textoDiferenca}</span>
              <strong class="comparador-total">${formatarMoeda(mercado.totalCentavos / 100)}</strong>
            </li>`;
        }).join("")}
      </ul>
    </div>` : "";

  resultadoComparacao.classList.remove("d-none");
  resultadoComparacao.innerHTML = `
    <div class="comparador">
      <div class="comparador-destaque">
        <span class="comparador-selo">${listaCompleta ? "Melhor mercado no total" : "Melhor cobertura dispon&iacute;vel"}</span>
        <h3>${melhorMercado.nome}</h3>
        <p class="comparador-valor">${formatarMoeda(melhorMercado.totalCentavos / 100)}</p>
        <p>${melhorMercado.itensDisponiveis} de ${totalItens} itens dispon&iacute;veis</p>
        ${explicacao ? `<p class="comparador-economia">${explicacao}</p>` : ""}
      </div>
      ${blocoOutros}
    </div>`;
}

carregarProdutosCatalogo();
