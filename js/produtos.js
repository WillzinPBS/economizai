//Manipulação dos produtos

    const produtosMock = JSON.parse(document.getElementById("produtos-json").textContent);
    const listaProdutos = document.getElementById("produtos");
    const contadorProdutos = document.getElementById("produtos-contador");

    function criarProdutoCard(produto) {
        const seloMenorPreco = produto.menorPreco
            ? '<span class="produto-selo">Menor preço</span>'
            : "";

        const outrosMercados = produto.outrosMercados.map((mercado) => `
            <div class="outro-mercado">
                <span><i class="bi bi-cart3" aria-hidden="true"></i>${mercado.nome}</span>
                <strong>${mercado.preco}</strong>
            </div>
        `).join("");

        return `
            <article class="produto-card">
                <div class="imagem">
                    <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
                    ${seloMenorPreco}
                </div>

                <div class="descricao">
                    <p class="produto-categoria">${produto.categoria}</p>
                    <h2>${produto.nome}</h2>

                    <div class="precificacao">
                        <div class="precos">
                            <strong class="produto-preco">${produto.preco}</strong>
                            <p class="produto-tipo">${produto.tipo}</p>
                        </div>

                        <p class="produto-mercado">
                            <i class="bi bi-building" aria-hidden="true"></i>
                            ${produto.mercado}
                        </p>
                    </div>

                    <button class="botao-principal produto-adicionar" type="button" data-id="${produto.id}">
                        <span aria-hidden="true">+</span>
                        <span>Adicionar</span>
                    </button>

                    <hr>

                    <p class="outros-mercados-titulo">Outros mercados:</p>
                    <div class="outros-mercados">
                        ${outrosMercados}
                    </div>
                </div>
            </article>
        `;
    }

    contadorProdutos.textContent = `${produtosMock.length} produtos encontrados`;

    produtosMock.forEach((produto) => {
        listaProdutos.insertAdjacentHTML("beforeend", criarProdutoCard(produto));
    });

    let carrinho =
    JSON.parse(
        localStorage.getItem("carrinho")
    ) || [];

    function converterPreco(preco) {

    return Number(
        preco
            .replace("R$", "")
            .replace(".", "")
            .replace(",", ".")
            .trim()
    );

}

    document.addEventListener("click", (event) => {

    const botao = event.target.closest(".produto-adicionar");

    if (!botao) return;

    const id = Number(botao.dataset.id);

   const produto = produtosMock.find(
    produto => produto.id === id
);

const itemExistente = carrinho.find(
    item => item.produto.id === id
);

if (itemExistente) {

    itemExistente.quantidade++;

} else {

    carrinho.push({
        produto: produto,
        quantidade: 1
    });

}

renderizarCarrinho();

    console.log("Carrinho:", carrinho);

});

document.addEventListener("click", (event) => {

    const aumentar = event.target.closest(".aumentar-item");

    if (!aumentar) return;

    const id = Number(aumentar.dataset.id);

    const item = carrinho.find(
        item => item.produto.id === id
    );

    if (!item) return;

    item.quantidade++;

    renderizarCarrinho();

});

document.addEventListener("click", (event) => {

    const diminuir = event.target.closest(".diminuir-item");

    if (!diminuir) return;

    const id = Number(diminuir.dataset.id);

    const item = carrinho.find(
        item => item.produto.id === id
    );

    if (!item) return;

    item.quantidade--;

    if (item.quantidade <= 0) {

        carrinho = carrinho.filter(
            item => item.produto.id !== id
        );

    }

    renderizarCarrinho();

});

document.addEventListener("click", (event) => {

    const remover = event.target.closest(".remover-item");

    if (!remover) return;

    const id = Number(remover.dataset.id);

    carrinho = carrinho.filter(
        item => item.produto.id !== id
    );

    renderizarCarrinho();

});

function renderizarCarrinho() {

    localStorage.setItem(
    "carrinho",
    JSON.stringify(carrinho)
);

    const listaCarrinho =
        document.getElementById("lista-carrinho");

    const contadorCarrinho =
        document.getElementById("contador-carrinho");

        const resumoCarrinho =
    document.getElementById("resumo-carrinho");

const totalCarrinho =
    document.getElementById("total-carrinho");

    const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
);

contadorCarrinho.textContent =
    totalItens === 1
        ? "1 item"
        : `${totalItens} itens`;

    if (carrinho.length === 0) {

        listaCarrinho.innerHTML = `
            <div class="text-center py-5">

                <i class="bi bi-cart fs-1 text-secondary"></i>

                <h5 class="mt-3">
                    Sua lista está vazia
                </h5>

                <p class="text-muted">
                    Adicione produtos para começar
                    a comparar preços
                </p>

            </div>
        `;

        resumoCarrinho.classList.add("d-none");

        return;
    }

    const total = carrinho.reduce((acumulador, item) => {

    return acumulador +
        (
            converterPreco(item.produto.preco)
            * item.quantidade
        );

}, 0);

totalCarrinho.textContent =
    total.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

resumoCarrinho.classList.remove("d-none");

   listaCarrinho.innerHTML = carrinho.map(item => `
    <div class="bg-light p-3 rounded-4 d-flex flex-wrap align-items-center justify-content-between mb-3">

        <div class="d-flex align-items-center">
            <img
                src="${item.produto.imagem}"
                class="rounded-3 me-3 img-animada"
                style="width:80px;height:80px;object-fit:cover;"
                alt="${item.produto.nome}">

            <div>
                <h6 class="mb-0 fw-bold">
                    ${item.produto.nome}
                </h6>

                <small class="text-muted">
                    ${item.produto.categoria}
                </small>
            </div>
        </div>

        <div class="d-flex align-items-center">

            <div class="d-flex align-items-center border rounded-3 bg-white me-3">

                <button
                    class="btn btn-sm border-0 px-3 diminuir-item"
                    data-id="${item.produto.id}">
                    -
                </button>

                <span class="px-2 fw-bold">
                    ${item.quantidade}
                </span>

                <button
                    class="btn btn-sm border-0 px-3 aumentar-item"
                    data-id="${item.produto.id}">
                    +
                </button>

            </div>

            <button
                class="btn text-danger p-0 remover-item"
                data-id="${item.produto.id}">
                <i class="bi bi-trash3 fs-5"></i>
            </button>

        </div>

    </div>
`).join("");

}

renderizarCarrinho();

const btnComparar =
    document.getElementById("btn-comparar");

    btnComparar.addEventListener("click", () => {

    const resultado =
    compararMercados();

    const melhorMercado =
        resultado.melhorMercado;

    const mercados =
        resultado.mercados;

    const mercadosOrdenados =
    [...mercados].sort(
        (a, b) => a.total - b.total
    );

    const economia =
        mercadosOrdenados[1].total -
        mercadosOrdenados[0].total;

    const resultadoComparacao =
        document.getElementById("resultado-comparacao");

    resultadoComparacao.classList.remove("d-none");

   resultadoComparacao.innerHTML = `
    <div class="card border-0 bg-success text-white p-4">

        <h5 class="fw-bold mb-3">
            🏆 Melhor opção para você
        </h5>

        <h2 class="fw-bold mb-3">
            ${melhorMercado.nome}
        </h2>

        <div class="mb-3">

    ${mercadosOrdenados.map((mercado, index) => `

        <div class="d-flex justify-content-between mb-2">

            <span>
                ${index === 0 ? "🥇" :
                  index === 1 ? "🥈" :
                  "🥉"}

                ${mercado.nome}
            </span>

            <strong>
                ${mercado.total.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                )}
            </strong>

        </div>

    `).join("")}

</div>

        <div>
        <strong>Economia:</strong>
        ${economia.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )}
                </div>

    </div>
`;

});

renderizarCarrinho();

function compararMercados() {

    let totalAtacadao = 0;
    let totalCarrefour = 0;
    let totalExtra = 0;

    carrinho.forEach(item => {

        const precoAtacadao = Number(
            item.produto.preco
                .replace("R$", "")
                .replace(",", ".")
                .trim()
        );

        totalAtacadao += precoAtacadao * item.quantidade;

        const carrefour =
            item.produto.outrosMercados.find(
                mercado => mercado.nome === "Carrefour"
            );

        const precoCarrefour = Number(
            carrefour.preco
                .replace("R$", "")
                .replace(",", ".")
                .trim()
        );

        totalCarrefour += precoCarrefour * item.quantidade;

        const extra =
        item.produto.outrosMercados.find(
            mercado => mercado.nome === "Extra"
        );

        const precoExtra = Number(
            extra.preco
                .replace("R$", "")
                .replace(",", ".")
                .trim()
);

totalExtra += precoExtra * item.quantidade;

    });

    console.log(
    "Atacadão:",
    totalAtacadao.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
);

    console.log(
        "Carrefour:",
        totalCarrefour.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
);

console.log(
    "Extra:",
    totalExtra.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
);

const mercados = [
    {
        nome: "Atacadão",
        total: totalAtacadao
    },
    {
        nome: "Carrefour",
        total: totalCarrefour
    },
    {
        nome: "Extra",
        total: totalExtra
    }
];

const melhorMercado = mercados.reduce(
    (menor, atual) =>
        atual.total < menor.total ? atual : menor
);

return {
    melhorMercado,
    mercados
};

}

