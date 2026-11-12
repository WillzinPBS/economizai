import assert from "node:assert/strict";

const base = (process.argv[2] || "http://127.0.0.1:8000").replace(/\/$/, "");
const letras = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");

function gerarCPF() {
  const numeros = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = numeros.reduce((total, numero, indice) => total + numero * (tamanho + 1 - indice), 0);
    const resto = (soma * 10) % 11;
    numeros.push(resto === 10 ? 0 : resto);
  }
  return numeros.join("");
}

function cliente() {
  const cookies = new Map();
  return async function chamar(acao, dados = null, busca = null) {
    const url = new URL(`${base}/api/index.php`);
    url.searchParams.set("acao", acao);
    if (busca !== null) url.searchParams.set("busca", busca);
    const headers = { Cookie: Array.from(cookies, ([nome, valor]) => `${nome}=${valor}`).join("; ") };
    const opcoes = { headers };
    if (dados !== null) {
      opcoes.method = "POST";
      headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(dados);
    }
    const resposta = await fetch(url, opcoes);
    for (const cookie of resposta.headers.getSetCookie()) {
      const par = cookie.split(";", 1)[0];
      const posicao = par.indexOf("=");
      cookies.set(par.slice(0, posicao), par.slice(posicao + 1));
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

const fixture = {
  nome: `Usuario de Teste ${letras}`,
  dataNascimento: "2000-02-29", sexo: "outro", nomeMaterno: "Maria de Teste",
  cpf: gerarCPF(), email: `${letras}.${Date.now()}@example.com`,
  telefoneCelular: "(+55)21-999999999", telefoneFixo: "(+55)21-33334444",
  cep: "20040002", logradouro: "Avenida Rio Branco", numero: "1", complemento: "",
  bairro: "Centro", cidade: "Rio de Janeiro", estado: "RJ",
  endereco: "Avenida Rio Branco, 1, Centro, Rio de Janeiro - RJ, CEP 20040-002",
  login: letras, senha: "Senhaabc", confirmaSenha: "Senhaabc", perfil: "master",
};
const dadosMaster = { login: "master", senha: "Masteraa", nomeMaterno: "Maria Administradora", dataNascimento: "1990-01-01", cep: "20040002" };

function respostaDoDesafio(tipo, dados) {
  assert.ok(["nomeMaterno", "dataNascimento", "cep"].includes(tipo), `Tipo de pergunta inesperado: ${tipo}`);
  if (tipo === "nomeMaterno") return dados.nomeMaterno.toUpperCase();
  if (tipo === "cep") return dados.cep.slice(0, 5) + "-" + dados.cep.slice(5);
  return dados.dataNascimento.split("-").reverse().join("/");
}

async function autenticar(api, dados) {
  conferir(await api("login", { login: dados.login, senha: dados.senha }), 200, "login");
  assert.equal(conferir(await api("sessao"), 200, "sessão antes de 2FA").usuario, null);
  const desafio = conferir(await api("desafio"), 200, "pergunta 2FA");
  const autenticado = conferir(await api("2fa", { resposta: respostaDoDesafio(desafio.tipo, dados) }), 200, "resposta 2FA");
  return { usuario: autenticado.usuario, pergunta: desafio.pergunta };
}

const anonimo = cliente();
const comum = cliente();
const master = cliente();
let usuarioCriado = false;
let usuarioId;
let erroTeste;

try {
  assert.equal(conferir(await anonimo("sessao"), 200, "sessão anônima").usuario, null);
  conferir(await anonimo("usuarios"), 401, "consulta anônima");
  conferir(await anonimo("cadastro", { ...fixture, cpf: "11111111111" }), 400, "CPF inválido");
  conferir(await anonimo("cadastro", { ...fixture, login: "abc12x" }), 400, "login com números");
  conferir(await anonimo("cadastro", { ...fixture, senha: "Senha123", confirmaSenha: "Senha123" }), 400, "senha com números");
  conferir(await anonimo("cadastro", fixture), 201, "cadastro");
  usuarioCriado = true;
  conferir(await anonimo("cadastro", fixture), 409, "cadastro duplicado");
  console.log("OK cadastro, validações e duplicidade");

  conferir(await comum("login", { login: fixture.login, senha: fixture.senha }), 200, "login pendente");
  assert.equal(conferir(await comum("sessao"), 200, "sessão pendente").usuario, null);
  conferir(await comum("usuarios"), 401, "permissão antes de 2FA");
  const desafio = conferir(await comum("desafio"), 200, "desafio inicial");
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const erro = conferir(await comum("2fa", { resposta: "resposta deliberadamente incorreta" }), tentativa === 3 ? 401 : 400, "2FA incorreto");
    assert.equal(erro.restantes, 3 - tentativa);
    if (tentativa === 3) {
      assert.equal(erro.mensagem, "3 tentativas sem sucesso! Favor realizar Login novamente.");
      assert.equal(erro.redirecionar, "login.html");
    }
  }
  conferir(await comum("desafio"), 401, "pendência revogada");
  conferir(await comum("2fa", { resposta: respostaDoDesafio(desafio.tipo, fixture) }), 401, "2FA revogado");
  console.log("OK sessão criada somente após 2FA e bloqueio após três erros");

  const entrada = await autenticar(comum, fixture);
  usuarioId = entrada.usuario.id;
  conferir(await comum("desafio"), 401, "sem desafio após autenticar");
  assert.equal(conferir(await comum("sessao"), 200, "desafio ausente preserva sessão").usuario.id, usuarioId);
  assert.equal(entrada.usuario.perfil, "comum", "cadastro não pode forjar perfil master");
  assert.equal(entrada.usuario.login, fixture.login);
  for (const campo of ["senha", "cpf", "nomeMaterno", "dataNascimento"]) {
    assert.ok(!(campo in entrada.usuario), `sessão expôs ${campo}`);
  }
  conferir(await comum("usuarios"), 403, "consulta master por comum");
  conferir(await comum("logs"), 403, "logs por comum");
  conferir(await comum("excluir-usuario", { id: usuarioId }), 403, "exclusão por comum");
  console.log("OK cadastro sempre comum e permissões no servidor");

  const outroLogin = cliente();
  await autenticar(outroLogin, fixture);
  conferir(await comum("senha", { senhaAtual: "Erradaaa", novaSenha: "Senhadef", confirmaSenha: "Senhadef" }), 400, "senha atual incorreta");
  conferir(await comum("senha", { senhaAtual: fixture.senha, novaSenha: "Senhadef", confirmaSenha: "Senhadef", id: 1 }), 200, "alteração da própria senha");
  assert.equal(conferir(await outroLogin("sessao"), 200, "outra sessão revogada").usuario, null);
  const senhaAntiga = cliente();
  conferir(await senhaAntiga("login", { login: fixture.login, senha: fixture.senha }), 401, "senha antiga revogada");
  fixture.senha = fixture.confirmaSenha = "Senhadef";
  const sessaoParaExcluir = cliente();
  await autenticar(sessaoParaExcluir, fixture);
  console.log("OK troca de senha altera somente a conta da sessão e revoga outras sessões");

  const administrador = await autenticar(master, dadosMaster);
  assert.equal(administrador.usuario.perfil, "master");
  conferir(await master("senha", { senhaAtual: dadosMaster.senha, novaSenha: "Novasenh", confirmaSenha: "Novasenh" }), 403, "master não altera senha");
  conferir(await master("excluir-usuario", { id: administrador.usuario.id }), 404, "master não exclui master");
  const usuarios = conferir(await master("usuarios", null, letras), 200, "busca substring").usuarios;
  assert.ok(usuarios.some((usuario) => usuario.id === usuarioId));
  assert.ok(usuarios.every((usuario) => !('senha' in usuario) && usuario.id !== administrador.usuario.id));
  const porNome = conferir(await master("logs", null, letras), 200, "logs por nome").logs;
  const porCPF = conferir(await master("logs", null, fixture.cpf), 200, "logs por CPF").logs;
  assert.ok(porNome.length >= 1 && porCPF.length >= 1, "2FA bem sucedido deve criar log");
  assert.ok(porNome.some((log) => log.fator === entrada.pergunta && log.nome === fixture.nome));
  assert.ok(porCPF.every((log) => log.cpf === fixture.cpf && log.dataHora && log.fator));
  for (let i = 1; i < porCPF.length; i++) {
    assert.ok(Date.parse(porCPF[i - 1].dataHora) >= Date.parse(porCPF[i].dataHora), "logs devem vir do mais recente");
  }
  const todosLogs = conferir(await master("logs", null, ""), 200, "todos os logs").logs;
  assert.ok(todosLogs.some((log) => log.cpf === fixture.cpf));
  console.log("OK master, busca de usuários e logs por nome/CPF em ordem recente");

  conferir(await master("excluir-usuario", { id: usuarioId }), 200, "exclusão do comum");
  usuarioCriado = false;
  assert.equal(conferir(await sessaoParaExcluir("sessao"), 200, "sessão de excluído").usuario, null);
  conferir(await sessaoParaExcluir("senha", { senhaAtual: fixture.senha, novaSenha: "Novasenh", confirmaSenha: "Novasenh" }), 401, "excluído não altera senha");
  const aposExclusao = conferir(await master("usuarios", null, letras), 200, "lista após excluir").usuarios;
  assert.ok(!aposExclusao.some((usuario) => usuario.id === usuarioId));
  const logsPreservados = conferir(await master("logs", null, fixture.cpf), 200, "logs preservados").logs;
  assert.equal(logsPreservados.length, porCPF.length);
  conferir(await comum("logout", {}), 200, "logout");
  assert.equal(conferir(await comum("sessao"), 200, "sessão após logout").usuario, null);
  console.log("OK exclusão invalida sessão e preserva histórico; logout encerra sessão");
} catch (erro) {
  erroTeste = erro;
} finally {
  if (usuarioCriado) {
    try {
      await autenticar(master, dadosMaster);
      const usuarios = conferir(await master("usuarios", null, letras), 200, "localizar fixture").usuarios;
      const fixtureSalvo = usuarios.find((usuario) => usuario.login === fixture.login && usuario.cpf === fixture.cpf);
      if (fixtureSalvo) conferir(await master("excluir-usuario", { id: fixtureSalvo.id }), 200, "limpar fixture");
    } catch (erro) {
      console.error(`Não foi possível remover a conta de teste ${fixture.login}: ${erro.message}`);
      erroTeste ||= erro;
    }
  }
  try { await master("logout", {}); } catch { /* O erro principal é exibido abaixo. */ }
}

if (erroTeste) {
  console.error(erroTeste);
  process.exitCode = 1;
} else {
  console.log("Todos os testes de integração passaram. Conta de teste removida.");
}
