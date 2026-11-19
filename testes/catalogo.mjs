import assert from "node:assert/strict";

const base = (process.argv[2] || "http://127.0.0.1:8010").replace(/\/$/, "");
const token = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const prefixo = `Teste catalogo ${token}`;
const login = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
const imagem = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=";

function cpfValido() {
  const numeros = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = numeros.reduce((total, numero, indice) => total + numero * (tamanho + 1 - indice), 0);
    numeros.push((soma * 10) % 11 === 10 ? 0 : (soma * 10) % 11);
  }
  return numeros.join("");
}

function cliente() {
  const cookies = new Map();
  return async (acao, dados = null) => {
    const headers = { Cookie: [...cookies].map(([nome, valor]) => `${nome}=${valor}`).join("; ") };
    const opcoes = { headers };
    if (dados !== null) {
      opcoes.method = "POST";
      headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(dados);
    }
    const resposta = await fetch(`${base}/api/index.php?acao=${encodeURIComponent(acao)}`, opcoes);
    for (const cookie of resposta.headers.getSetCookie()) {
      const par = cookie.split(";", 1)[0];
      const indice = par.indexOf("=");
      cookies.set(par.slice(0, indice), par.slice(indice + 1));
    }
    const texto = await resposta.text();
    let corpo;
    try { corpo = JSON.parse(texto); }
    catch { throw new Error(`${acao}: resposta não é JSON (${resposta.status}): ${texto.slice(0, 200)}`); }
    return { status: resposta.status, corpo };
  };
}

function conferir(resposta, status, contexto) {
  assert.equal(resposta.status, status, `${contexto}: ${JSON.stringify(resposta.corpo)}`);
  return resposta.corpo;
}

async function autenticar(api, dados) {
  conferir(await api("login", { login: dados.login, senha: dados.senha }), 200, "login");
  const { tipo } = conferir(await api("desafio"), 200, "2FA");
  const resposta = tipo === "nomeMaterno" ? dados.nomeMaterno : tipo === "cep" ? dados.cep : dados.dataNascimento;
  return conferir(await api("2fa", { resposta }), 200, "2FA correto").usuario;
}

const master = cliente();
const comum = cliente();
const visitante = cliente();
const fixture = {
  nome: `Usuario de Teste ${login}`, dataNascimento: "2000-02-29", sexo: "outro", nomeMaterno: "Maria de Teste",
  cpf: cpfValido(), email: `${login}.${token}@example.com`, telefoneCelular: "(+55)21-999999999", telefoneFixo: "(+55)21-33334444",
  cep: "20040002", logradouro: "Avenida Rio Branco", numero: "1", complemento: "", bairro: "Centro", cidade: "Rio de Janeiro", estado: "RJ",
  endereco: "Avenida Rio Branco, 1, Centro, Rio de Janeiro - RJ, CEP 20040-002", login, senha: "Senhaabc", confirmaSenha: "Senhaabc",
};
const produtoBase = {
  nome: prefixo, categoria: "Mercearia", tipo: "unidade", mercado: `Mercado A ${token}`, preco: "10.50", imagem,
  link: "https://example.com/produto", cupom: "TESTE",
};
let usuarioId;
let baseline;
let pendentesIniciais;
const idsCriados = new Set();
let erro;

async function catalogo() { return conferir(await visitante("produtos"), 200, "catálogo público").produtos; }
async function admin() { return conferir(await master("promocoes"), 200, "catálogo administrativo"); }
async function curtidas(api = visitante) {
  return conferir(await api("curtidas"), 200, "curtidas do catálogo").curtidas;
}
async function estadoCurtida(api, produtoId) {
  return (await curtidas(api)).find((item) => item.produtoId === produtoId);
}
async function enviarEAprovar(dados) {
  conferir(await comum("postar", dados), 201, "postagem pendente");
  const pendente = (await admin()).pendentes.find((p) => p.nome === dados.nome && p.mercado === dados.mercado);
  assert.ok(pendente, "postagem deve aparecer na fila administrativa");
  conferir(await master("aprovar-promocao", { id: pendente.id }), 200, "aprovação");
  conferir(await master("aprovar-promocao", { id: pendente.id }), 404, "aprovação repetida");
  const produto = (await catalogo()).find((p) => p.nome === dados.nome);
  assert.ok(produto, "aprovação deve publicar o produto");
  assert.ok(!Object.hasOwn(produto, "descricao"), "o catálogo não deve expor o campo removido");
  idsCriados.add(produto.id);
  return produto;
}

try {
  const usuarioMaster = await autenticar(master, { login: "master", senha: "Masteraa", nomeMaterno: "Maria Administradora", cep: "20040002", dataNascimento: "1990-01-01" });
  assert.equal(usuarioMaster.perfil, "master");
  const inicial = await admin();
  baseline = inicial.produtos;
  pendentesIniciais = inicial.pendentes.map((p) => Number(p.id));
  assert.ok(baseline.length > 0, "o catálogo existente deve estar preservado");
  const publico = await catalogo();
  assert.deepEqual(publico.map((p) => p.id), baseline.map((p) => p.id));
  const opcoes = conferir(await visitante("catalogo-opcoes"), 200, "opções do catálogo");
  assert.ok(opcoes.categorias.includes("Mercearia") && opcoes.tipos.includes("quilo"));

  for (const acao of ["editar-produto", "excluir-produto", "aprovar-promocao", "rejeitar-promocao"]) {
    conferir(await visitante(acao, { id: 0 }), 401, `${acao} por visitante`);
  }
  conferir(await visitante("promocoes"), 401, "fila por visitante");
  conferir(await visitante("curtir-produto", { id: 0, curtido: true }), 401, "curtida por visitante");
  conferir(await visitante("postar", produtoBase), 401, "postagem por visitante");
  conferir(await visitante("cadastro", fixture), 201, "usuário de teste");
  usuarioId = (await autenticar(comum, fixture)).id;
  for (const acao of ["editar-produto", "excluir-produto", "aprovar-promocao", "rejeitar-promocao"]) {
    conferir(await comum(acao, { id: 0 }), 403, `${acao} por comum`);
  }
  conferir(await comum("promocoes"), 403, "fila por comum");
  console.log("OK catálogo no banco, permissões e autenticação master/comum");

  conferir(await comum("postar", { ...produtoBase, tipo: "" }), 400, "tipo obrigatório");
  conferir(await comum("postar", { ...produtoBase, preco: "-1" }), 400, "preço negativo");
  conferir(await comum("postar", { ...produtoBase, imagem: "data:image/png;base64,INVALIDO" }), 400, "imagem inválida");
  conferir(await comum("postar", { ...produtoBase, link: "javascript:alert(1)" }), 400, "link inválido");
  conferir(await comum("postar", produtoBase), 201, "postagem do comum");
  assert.ok(!(await catalogo()).some((p) => p.nome === prefixo), "pendente não deve aparecer publicamente");
  const primeira = (await admin()).pendentes.find((p) => p.nome === prefixo);
  assert.ok(primeira);
  conferir(await master("aprovar-promocao", { id: primeira.id }), 200, "aprovar primeiro item");
  const publicado = (await catalogo()).find((p) => p.nome === prefixo);
  idsCriados.add(publicado.id);
  assert.equal(publicado.preco, "R$ 10,50");
  assert.equal(publicado.tipo, "por unidade");
  assert.ok(!Object.hasOwn(publicado, "descricao"));
  assert.ok(!Object.hasOwn(primeira, "descricao"));
  console.log("OK postagem pendente invisível, validações e aprovação");

  assert.deepEqual(await estadoCurtida(visitante, publicado.id), { produtoId: publicado.id, total: 0, curtido: false });
  conferir(await comum("curtir-produto", { id: 0, curtido: true }), 400, "id de curtida inválido");
  conferir(await comum("curtir-produto", { id: 4294967295, curtido: true }), 404, "produto inexistente");
  conferir(await comum("curtir-produto", { id: publicado.id }), 400, "estado obrigatório");
  conferir(await comum("curtir-produto", { id: publicado.id, curtido: "true" }), 400, "estado precisa ser booleano");
  assert.deepEqual(conferir(await comum("curtir-produto", { id: publicado.id, curtido: true, usuario_id: usuarioMaster.id }), 200, "curtida vinculada à sessão"),
    { produtoId: publicado.id, total: 1, curtido: true });
  assert.equal((await estadoCurtida(master, publicado.id)).curtido, false, "o usuário enviado no corpo não pode ser usado para curtir por outra pessoa");
  assert.equal(conferir(await comum("curtir-produto", { id: publicado.id, curtido: true }), 200, "curtida repetida").total, 1);
  assert.equal(conferir(await master("curtir-produto", { id: publicado.id, curtido: true }), 200, "curtida de segundo usuário").total, 2);
  assert.deepEqual(await estadoCurtida(visitante, publicado.id), { produtoId: publicado.id, total: 2, curtido: false });
  const comumNovaSessao = cliente();
  await autenticar(comumNovaSessao, fixture);
  assert.deepEqual(await estadoCurtida(comumNovaSessao, publicado.id), { produtoId: publicado.id, total: 2, curtido: true }, "curtida deve persistir em outra sessão");
  const produtoCurtido = conferir(await comumNovaSessao("produtos"), 200, "catálogo com curtidas").produtos.find((item) => item.id === publicado.id);
  assert.equal(produtoCurtido.totalCurtidas, 2);
  assert.equal(produtoCurtido.curtido, true);
  assert.equal(conferir(await comum("curtir-produto", { id: publicado.id, curtido: false }), 200, "descurtir").total, 1);
  assert.equal(conferir(await comum("curtir-produto", { id: publicado.id, curtido: false }), 200, "descurtir repetido").total, 1);
  const simultaneas = await Promise.all([
    comum("curtir-produto", { id: publicado.id, curtido: true }),
    master("curtir-produto", { id: publicado.id, curtido: true }),
  ]);
  simultaneas.forEach((resposta) => conferir(resposta, 200, "curtidas simultâneas"));
  assert.deepEqual(await estadoCurtida(comum, publicado.id), { produtoId: publicado.id, total: 2, curtido: true });
  console.log("OK curtidas no banco, sessão, contagem pública, persistência, duas contas e operações idempotentes");

  const agrupado = await enviarEAprovar({ ...produtoBase, mercado: `Mercado B ${token}`, preco: "8.90" });
  assert.equal(agrupado.id, publicado.id, "outro mercado deve manter o produto");
  assert.equal(agrupado.preco, "R$ 8,90", "menor preço deve estar em destaque");
  assert.equal(agrupado.mercado, `Mercado B ${token}`);
  assert.deepEqual(agrupado.outrosMercados, [{ nome: produtoBase.mercado, preco: "R$ 10,50" }]);
  await enviarEAprovar({ ...produtoBase, mercado: `Mercado B ${token}`, preco: "9.10" });
  const atualizado = (await catalogo()).find((p) => p.id === publicado.id);
  assert.equal(atualizado.preco, "R$ 9,10", "novo preço do mesmo mercado deve substituir anterior");
  assert.equal(atualizado.outrosMercados.length, 1, "mercado não pode duplicar");
  conferir(await comum("postar", { ...produtoBase, tipo: "quilo" }), 409, "mesmo produto com unidade incompatível");
  console.log("OK agrupamento por produto, preços por mercado e destaque do menor preço");

  const outro = await enviarEAprovar({ ...produtoBase, nome: `${prefixo} outro`, mercado: `Mercado C ${token}`, preco: "20.00" });
  const itemAdmin = (await admin()).produtos.find((p) => p.id === publicado.id);
  const editado = { ...itemAdmin, nome: `${prefixo} editado`, categoria: "Limpeza", tipo: "pacote", ofertas: [
    { mercado: `Mercado editado ${token}`, preco: "7.25", link: "https://example.com/editado", cupom: "NOVO" },
    { mercado: `Mercado B ${token}`, preco: "8.30", link: "", cupom: "" },
  ] };
  conferir(await master("editar-produto", { ...editado, ofertas: [] }), 400, "produto sem ofertas");
  conferir(await master("editar-produto", { ...editado, ofertas: [editado.ofertas[0], editado.ofertas[0]] }), 400, "mercados repetidos");
  conferir(await master("editar-produto", { ...editado, nome: outro.nome, categoria: outro.categoria }), 409, "produto duplicado");
  conferir(await master("editar-produto", editado), 200, "editar produto e ofertas");
  const aposEdicao = (await catalogo()).find((p) => p.id === publicado.id);
  assert.equal(aposEdicao.nome, editado.nome);
  assert.equal(aposEdicao.categoria, "Limpeza");
  assert.equal(aposEdicao.tipo, "por pacote");
  assert.equal(aposEdicao.preco, "R$ 7,25");
  assert.equal(aposEdicao.cupom, "NOVO");
  assert.equal(aposEdicao.outrosMercados.length, 1);
  assert.equal(aposEdicao.imagem, itemAdmin.imagem, "edição sem nova foto preserva a imagem");
  assert.ok(!Object.hasOwn(aposEdicao, "descricao"));
  assert.deepEqual(await estadoCurtida(comum, publicado.id), { produtoId: publicado.id, total: 2, curtido: true }, "edição deve preservar curtidas");
  assert.ok((await admin()).produtos.find((item) => item.id === publicado.id).ofertas.every((oferta) => !Object.hasOwn(oferta, "descricao")));
  console.log("OK edição de produto/ofertas, imagem preservada e validação de duplicidades");

  const rejeitado = { ...produtoBase, nome: `${prefixo} rejeitado` };
  conferir(await comum("postar", rejeitado), 201, "postagem para rejeição");
  const pendenteRejeitado = (await admin()).pendentes.find((p) => p.nome === rejeitado.nome);
  conferir(await master("rejeitar-promocao", { id: pendenteRejeitado.id }), 200, "rejeitar promoção");
  assert.ok(!(await catalogo()).some((p) => p.nome === rejeitado.nome));
  conferir(await master("excluir-produto", { id: publicado.id }), 200, "exclusão de produto");
  idsCriados.delete(publicado.id);
  assert.ok(!(await catalogo()).some((p) => p.id === publicado.id));
  assert.ok(!(await admin()).produtos.some((p) => p.id === publicado.id));
  assert.ok(!(await curtidas()).some((item) => item.produtoId === publicado.id));
  conferir(await comum("curtir-produto", { id: publicado.id, curtido: true }), 404, "produto excluído não pode ser curtido");
  conferir(await master("excluir-produto", { id: publicado.id }), 404, "exclusão repetida");
  console.log("OK rejeição e exclusão de produto/ofertas");
} catch (falha) {
  erro = falha;
} finally {
  for (const id of idsCriados) {
    const resposta = await master("excluir-produto", { id });
    if (![200, 404].includes(resposta.status)) erro ||= new Error(`Falha ao limpar produto fixture ${id}`);
  }
  if (usuarioId) conferir(await master("excluir-usuario", { id: usuarioId }), 200, "limpeza do usuário fixture");
  if (baseline) {
    const final = await admin();
    assert.deepEqual(final.produtos, baseline, "os produtos e preços existentes devem permanecer iguais após os testes");
    assert.deepEqual(final.pendentes.map((p) => Number(p.id)), pendentesIniciais, "pendentes originais devem estar preservados");
    console.log(`OK limpeza dos fixtures e preservação de ${baseline.length} produtos existentes`);
  }
}

if (erro) throw erro;
console.log("Todos os testes do catálogo passaram.");
