function obterUsuariosRecuperacao() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function salvarUsuariosRecuperacao(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function mostrarMensagemRecuperacao(texto, sucesso) {
  const mensagem = document.getElementById("mensagem-recuperacao");
  if (!mensagem) return;

  mensagem.innerText = texto;
  mensagem.className = sucesso
    ? "auth-message auth-message--sucesso"
    : "auth-message auth-message--erro";
}

function valorRecuperacao(id) {
  const campo = document.getElementById(id);
  return campo ? campo.value.trim() : "";
}

function validarLoginRecuperacao(login) {
  return /^[A-Za-z0-9]{6,}$/.test(login);
}

function validarSenhaRecuperacao(senha) {
  return /^[A-Za-z0-9]{8,}$/.test(senha);
}

function obterForcaSenhaRecuperacao(senha) {
  if (!senha) {
    return { classe: "", texto: "" };
  }

  let pontos = 0;

  if (senha.length >= 8) pontos += 1;
  if (/[A-Z]/.test(senha)) pontos += 1;
  if (/[a-z]/.test(senha)) pontos += 1;
  if (/\d/.test(senha)) pontos += 1;
  if (/[^A-Za-z0-9]/.test(senha)) pontos += 1;

  if (pontos <= 2) {
    return { classe: "auth-forca-senha--fraca", texto: "Forca da senha: fraca" };
  }

  if (pontos <= 4) {
    return { classe: "auth-forca-senha--media", texto: "Forca da senha: media" };
  }

  return { classe: "auth-forca-senha--forte", texto: "Forca da senha: forte" };
}

function atualizarForcaSenhaRecuperacao() {
  const senhaCampo = document.getElementById("nova_senha_recuperacao");
  const indicador = document.getElementById("forca-senha-recuperacao");

  if (!senhaCampo || !indicador) {
    return;
  }

  const forca = obterForcaSenhaRecuperacao(senhaCampo.value);
  indicador.className = `auth-forca-senha ${forca.classe}`;
  indicador.innerText = forca.texto;
}

function recuperarSenhaLocal() {
  const login = valorRecuperacao("login_recuperacao");
  const nomeMaterno = valorRecuperacao("nome_materno_recuperacao");
  const novaSenha = valorRecuperacao("nova_senha_recuperacao");
  const confirmaSenha = valorRecuperacao("confirma_senha_recuperacao");

  if (!login || !nomeMaterno || !novaSenha || !confirmaSenha) {
    mostrarMensagemRecuperacao("Preencha todos os campos.", false);
    return;
  }

  if (!validarLoginRecuperacao(login)) {
    mostrarMensagemRecuperacao("Login deve ter no minimo 6 caracteres (letras ou numeros).", false);
    return;
  }

  if (!validarSenhaRecuperacao(novaSenha)) {
    mostrarMensagemRecuperacao("A nova senha deve ter no minimo 8 caracteres (letras ou numeros).", false);
    return;
  }

  if (novaSenha !== confirmaSenha) {
    mostrarMensagemRecuperacao("Nova senha e confirmacao devem ser iguais.", false);
    return;
  }

  const usuarios = obterUsuariosRecuperacao();
  const loginNormalizado = login.toLowerCase();

  const indiceUsuario = usuarios.findIndex((usuario) => {
    if (typeof usuario.login !== "string" || typeof usuario.nomeMaterno !== "string") {
      return false;
    }

    return usuario.login.toLowerCase() === loginNormalizado
      && usuario.nomeMaterno.trim().toLowerCase() === nomeMaterno.toLowerCase();
  });

  if (indiceUsuario === -1) {
    mostrarMensagemRecuperacao("Dados de recuperacao invalidos.", false);
    return;
  }

  usuarios[indiceUsuario].senha = novaSenha;
  salvarUsuariosRecuperacao(usuarios);

  mostrarMensagemRecuperacao("Senha redefinida com sucesso. Redirecionando para login...", true);

  setTimeout(function () {
    window.location.href = "login.html";
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("recuperarSenhaForm");
  const senhaRecuperacao = document.getElementById("nova_senha_recuperacao");

  if (senhaRecuperacao) {
    senhaRecuperacao.addEventListener("input", atualizarForcaSenhaRecuperacao);
    atualizarForcaSenhaRecuperacao();
  }

  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    recuperarSenhaLocal();
  });
});

