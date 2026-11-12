// A sessão é mantida pelo PHP. O navegador guarda apenas preferências visuais.
window.usuarioAtual = null;

async function requisitar(acao, dados = null) {
  const opcoes = { credentials: "same-origin", cache: "no-store" };
  if (dados !== null) {
    opcoes.method = "POST";
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(dados);
  }

  let resposta;
  let resultado;
  try {
    resposta = await fetch(`api/index.php?acao=${acao}`, opcoes);
    resultado = await resposta.json();
  } catch {
    throw new Error("Não foi possível acessar o servidor. Execute o projeto pelo PHP e confira a conexão.");
  }

  if (!resposta.ok) {
    const erro = new Error(resultado.mensagem || "Não foi possível concluir a operação.");
    erro.status = resposta.status;
    erro.dados = resultado;
    throw erro;
  }
  return resultado;
}

function atualizarSessao(usuario) {
  window.usuarioAtual = usuario;
  window.dispatchEvent(new CustomEvent("sessao-alterada", { detail: usuario }));
}

async function carregarSessao() {
  const dados = await requisitar("sessao");
  atualizarSessao(dados.usuario);
  return dados.usuario;
}

async function encerrarSessao() {
  await requisitar("logout", {});
  atualizarSessao(null);
  location.href = "login.html";
}

// Remove as contas da antiga demonstração, que armazenava senhas no navegador.
localStorage.removeItem("usuarios");
localStorage.removeItem("usuarioLogado");

window.sessaoPronta = carregarSessao().catch((erro) => {
  window.erroSessao = erro.message;
  atualizarSessao(null);
  return null;
});
