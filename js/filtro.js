const divFiltros = document.getElementById("filtro");
const botoes = divFiltros.querySelectorAll('button');

localStorage.setItem('filtro', "fil-todas")

const inv = document.getElementById("invisiveis");
const produtos = document.getElementById("produtos");

const itemsContador = document.getElementById('produtos');
const textoContado = document.getElementById("produtos-contador");

function selecionarCategoria(categoria, botao) {
    botao.classList.remove('btn-light', 'text-dark');
    botao.classList.add('btn-primary', 'bg-green-600');

    const todosProdutos = document.querySelectorAll('.produto-card');

    todosProdutos.forEach(produto => {
        
        if (categoria === "Todas") {
            produtos.appendChild(produto);
            produto.classList.remove('produto-oculto');
            textoContado.textContent = `${itemsContador.children.length} produtos encontrados`;
        } else if (produto.dataset.categoria === categoria) {
            produtos.appendChild(produto);
            produto.classList.remove('produto-oculto');
            textoContado.textContent = `${itemsContador.children.length} produtos encontrados`;
        } else {
            produto.classList.add('produto-oculto');
            inv.appendChild(produto)
            textoContado.textContent = `${itemsContador.children.length} produtos encontrados`;
        }
    });
}

botoes.forEach(botao => {
    botao.addEventListener('click', (event) => {
        const botaoSelecionado = event.currentTarget;
        const getBotaoId = botaoSelecionado.id;
        const getCategoria = botaoSelecionado.textContent.trim();

        // Vai fazer a remoção da cor do botão antigo
        const botaoAnterior = document.getElementById(localStorage.getItem('filtro'))
        botaoAnterior.classList.add('btn-light', 'text-dark');
        botaoAnterior.classList.remove('btn-primary', 'bg-green-600');

        localStorage.setItem('filtro', getBotaoId)
        selecionarCategoria(getCategoria,botaoSelecionado)
        
    })
});

const inputPesquisa = document.querySelector('.form-control');

inputPesquisa.addEventListener('input', () => {
    const pesquisa = inputPesquisa.value.toLowerCase();

    document.querySelectorAll('.produto-card').forEach(produto => {
        const nome = produto.querySelector('h2').textContent.toLowerCase();

        if (nome.includes(pesquisa)) {
            produto.classList.remove('produto-oculto');
            produtos.appendChild(produto);
        } else {
            produto.classList.add('produto-oculto');
            inv.appendChild(produto)
        }

        textoContado.textContent = `${itemsContador.children.length} produtos encontrados`;
    });
});