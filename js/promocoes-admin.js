(async () => {
  const usuario = await window.sessaoPronta;
  if (!usuario || usuario.perfil !== "master") {
    location.replace(usuario ? "erro.html" : "login.html");
    return;
  }

  const listaPendentes = document.getElementById("lista-promocoes");
  const listaProdutos = document.getElementById("lista-produtos-admin");
  const mensagem = document.getElementById("mensagem-promocoes");
  const busca = document.getElementById("busca-admin-produtos");
  const dialogoEdicao = document.getElementById("editar-produto-dialog");
  const formularioEdicao = document.getElementById("form-editar-produto");
  const mensagemEdicao = document.getElementById("mensagem-edicao");
  const ofertasEdicao = document.getElementById("ofertas-edicao");
  const dialogoExclusao = document.getElementById("excluir-produto-dialog");
  const formularioExclusao = document.getElementById("form-excluir-produto");
  const mensagemExclusao = document.getElementById("mensagem-exclusao");
  let produtos = [];
  let produtoEmEdicao = null;
  let produtoEmExclusao = null;
  let opcoesProntas = false;

  document.getElementById("conteudo-produtos").hidden = false;

  function avisar(texto, erro = false, elemento = mensagem) {
    elemento.textContent = texto;
    elemento.classList.toggle("erro", erro);
  }

  function elemento(tag, texto, classe) {
    const item = document.createElement(tag);
    if (texto !== undefined) item.textContent = texto;
    if (classe) item.className = classe;
    return item;
  }

  function botao(texto, classe, acao) {
    const item = elemento("button", texto, classe || "admin-botao");
    item.type = "button";
    item.addEventListener("click", acao);
    return item;
  }

  function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function criarCard(item) {
    const card = elemento("article", undefined, "promocao-pendente");
    const imagem = elemento("img");
    imagem.src = item.imagem;
    imagem.alt = `Foto de ${item.nome}`;
    imagem.loading = "lazy";
    const detalhes = elemento("div");
    detalhes.append(elemento("h2", item.nome), elemento("p", `${item.categoria} · por ${item.tipo}`));
    const acoes = elemento("div", undefined, "admin-acoes");
    card.append(imagem, detalhes);
    return { card, detalhes, acoes };
  }

  async function decidirPromocao(id, acao, card) {
    const botoes = card.querySelectorAll("button");
    botoes.forEach((item) => { item.disabled = true; });
    try {
      const resultado = await requisitar(acao, { id });
      await carregar();
      avisar(resultado.mensagem);
    } catch (erro) {
      avisar(erro.message, true);
      botoes.forEach((item) => { item.disabled = false; });
    }
  }

  function renderizarPendentes(pendentes) {
    listaPendentes.replaceChildren();
    if (!pendentes.length) {
      listaPendentes.append(elemento("p", "Não há promoções aguardando aprovação.", "admin-mensagem"));
      return;
    }
    pendentes.forEach((item) => {
      const { card, detalhes, acoes } = criarCard(item);
      detalhes.append(elemento("p", `${item.mercado} · ${formatarPreco(item.preco)}`));
      if (item.cupom) detalhes.append(elemento("p", `Cupom: ${item.cupom}`));
      if (/^https?:\/\//i.test(item.link)) {
        const link = elemento("a", "Ver promoção");
        link.href = item.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        detalhes.append(link);
      }
      acoes.append(
        botao("Aprovar", "admin-botao admin-botao--principal", () => decidirPromocao(item.id, "aprovar-promocao", card)),
        botao("Rejeitar", "admin-botao admin-botao--perigo", () => decidirPromocao(item.id, "rejeitar-promocao", card))
      );
      detalhes.append(acoes);
      listaPendentes.append(card);
    });
  }

  function normalizar(valor) {
    return String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function renderizarProdutos() {
    const termo = normalizar(busca.value.trim());
    const filtrados = produtos.filter((produto) => normalizar(`${produto.nome} ${produto.categoria} ${(produto.ofertas || []).map((oferta) => oferta.mercado).join(" ")}`).includes(termo));
    listaProdutos.replaceChildren();
    if (!filtrados.length) {
      listaProdutos.append(elemento("p", "Nenhum produto encontrado.", "admin-mensagem"));
      return;
    }
    filtrados.forEach((produto) => {
      const { card, detalhes, acoes } = criarCard(produto);
      const ofertas = [...(produto.ofertas || [])].sort((a, b) => Number(a.preco) - Number(b.preco));
      ofertas.forEach((oferta, indice) => {
        detalhes.append(elemento("p", `${oferta.mercado}: ${formatarPreco(oferta.preco)}${indice === 0 ? " · menor preço" : ""}`));
      });
      acoes.append(
        botao("Editar", "admin-botao", () => abrirEdicao(produto)),
        botao("Excluir", "admin-botao admin-botao--perigo", () => abrirExclusao(produto))
      );
      detalhes.append(acoes);
      listaProdutos.append(card);
    });
  }

  async function carregar() {
    const resultado = await requisitar("promocoes");
    produtos = resultado.produtos || [];
    renderizarPendentes(resultado.pendentes || []);
    renderizarProdutos();
    avisar(`${(resultado.pendentes || []).length} promoção(ões) pendente(s) · ${produtos.length} produto(s) publicado(s).`);
  }

  async function carregarOpcoes() {
    if (opcoesProntas) return;
    const opcoes = await requisitar("catalogo-opcoes");
    [["categoria", opcoes.categorias], ["tipo", opcoes.tipos]].forEach(([nome, valores]) => {
      const select = formularioEdicao.elements.namedItem(nome);
      select.replaceChildren();
      (valores || []).forEach((valor) => {
        const opcao = elemento("option", valor);
        opcao.value = valor;
        select.append(opcao);
      });
    });
    opcoesProntas = true;
  }

  function campoOferta(campo, rotulo, tipo, valor, obrigatorio = false) {
    const label = elemento("label", rotulo, "auth-field");
    const input = elemento("input");
    input.className = "auth-control";
    input.type = tipo;
    input.dataset.campo = campo;
    input.value = valor ?? "";
    input.required = obrigatorio;
    label.append(input);
    return { label, input };
  }

  function adicionarOferta(oferta = {}) {
    const grupo = elemento("fieldset", undefined, "auth-form");
    if (oferta.id !== undefined) grupo.dataset.id = oferta.id;
    grupo.append(elemento("legend", "Oferta do mercado"));
    const mercado = campoOferta("mercado", "Mercado", "text", oferta.mercado, true);
    mercado.input.maxLength = 100;
    const preco = campoOferta("preco", "Preço (R$)", "number", oferta.preco, true);
    preco.input.min = "0.01";
    preco.input.max = "99999999.99";
    preco.input.step = "0.01";
    const link = campoOferta("link", "Link da promoção (opcional)", "url", oferta.link);
    link.input.maxLength = 2048;
    const cupom = campoOferta("cupom", "Cupom (opcional)", "text", oferta.cupom);
    cupom.input.maxLength = 60;
    const remover = botao("Remover mercado", "admin-botao admin-botao--perigo", () => {
      if (ofertasEdicao.children.length <= 1) {
        avisar("O produto precisa ter pelo menos um mercado.", true, mensagemEdicao);
        return;
      }
      grupo.remove();
    });
    grupo.append(mercado.label, preco.label, link.label, cupom.label, remover);
    ofertasEdicao.append(grupo);
  }

  async function abrirEdicao(produto) {
    try {
      await carregarOpcoes();
      produtoEmEdicao = produto;
      formularioEdicao.reset();
      formularioEdicao.elements.namedItem("nome").value = produto.nome;
      formularioEdicao.elements.namedItem("categoria").value = produto.categoria;
      formularioEdicao.elements.namedItem("tipo").value = produto.tipo;
      ofertasEdicao.replaceChildren();
      (produto.ofertas || []).forEach(adicionarOferta);
      if (!ofertasEdicao.childElementCount) adicionarOferta();
      avisar("", false, mensagemEdicao);
      dialogoEdicao.showModal();
    } catch (erro) {
      avisar(erro.message, true);
    }
  }

  function abrirExclusao(produto) {
    produtoEmExclusao = produto;
    document.getElementById("nome-produto-exclusao").textContent = produto.nome;
    avisar("", false, mensagemExclusao);
    dialogoExclusao.showModal();
  }

  function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (arquivo.size > 1048576) {
        reject(new Error("A imagem deve ter até 1 MB."));
        return;
      }
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      leitor.readAsDataURL(arquivo);
    });
  }

  formularioEdicao.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!produtoEmEdicao) return;
    const salvar = formularioEdicao.querySelector('button[type="submit"]');
    salvar.disabled = true;
    try {
      const dados = new FormData(formularioEdicao);
      const ofertas = [...ofertasEdicao.children].map((grupo) => {
        const oferta = {};
        if (grupo.dataset.id) oferta.id = Number(grupo.dataset.id);
        grupo.querySelectorAll("[data-campo]").forEach((input) => { oferta[input.dataset.campo] = input.value.trim(); });
        return oferta;
      });
      const payload = { id: produtoEmEdicao.id, nome: dados.get("nome"), categoria: dados.get("categoria"), tipo: dados.get("tipo"), ofertas };
      const arquivo = dados.get("imagem");
      if (arquivo?.size) payload.imagem = await lerImagem(arquivo);
      const resultado = await requisitar("editar-produto", payload);
      dialogoEdicao.close();
      await carregar();
      avisar(resultado.mensagem);
    } catch (erro) {
      avisar(erro.message, true, dialogoEdicao.open ? mensagemEdicao : mensagem);
    } finally {
      salvar.disabled = false;
    }
  });

  formularioExclusao.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!produtoEmExclusao) return;
    const excluir = formularioExclusao.querySelector('button[type="submit"]');
    excluir.disabled = true;
    try {
      const resultado = await requisitar("excluir-produto", { id: produtoEmExclusao.id });
      dialogoExclusao.close();
      await carregar();
      avisar(resultado.mensagem);
    } catch (erro) {
      avisar(erro.message, true, dialogoExclusao.open ? mensagemExclusao : mensagem);
    } finally {
      excluir.disabled = false;
    }
  });

  document.getElementById("adicionar-oferta").addEventListener("click", () => adicionarOferta());
  document.getElementById("cancelar-edicao").addEventListener("click", () => dialogoEdicao.close());
  document.getElementById("cancelar-exclusao").addEventListener("click", () => dialogoExclusao.close());
  document.getElementById("form-busca-produtos").addEventListener("submit", (evento) => { evento.preventDefault(); renderizarProdutos(); });
  busca.addEventListener("input", renderizarProdutos);
  try {
    await carregar();
  } catch (erro) {
    avisar(erro.message, true);
  }
})();
