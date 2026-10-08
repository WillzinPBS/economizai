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
  return /^[A-Za-z0-9]{4,30}$/.test(login);
}

function validarSenhaRecuperacao(senha) {
  return senha.length >= 8;
}

function obterForcaSenhaRecuperacao(senha) {
  if (!senha) {
    return { classe: "", texto: "" };
  }

  return validarSenhaRecuperacao(senha)
    ? {
        classe: "auth-forca-senha--forte",
        texto: "Senha valida: minimo de 8 caracteres.",
      }
    : {
        classe: "auth-forca-senha--fraca",
        texto: "A senha deve ter no minimo 8 caracteres.",
      };
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
  const formulario = document.getElementById("recuperarSenhaForm");
  limparErrosFormulario(formulario);

  if (!validarCamposObrigatorios(formulario)) {
    mostrarMensagemRecuperacao("Preencha os campos obrigatorios destacados.", false);
    return;
  }

  const login = valorRecuperacao("login_recuperacao");
  const nomeMaterno = valorRecuperacao("nome_materno_recuperacao");
  const novaSenha = valorRecuperacao("nova_senha_recuperacao");
  const confirmaSenha = valorRecuperacao("confirma_senha_recuperacao");

  if (!validarLoginRecuperacao(login)) {
    definirErroCampo("login_recuperacao", "Use entre 4 e 30 letras ou numeros.");
    mostrarMensagemRecuperacao("Revise o login informado.", false);
    return;
  }

  if (!validarSenhaRecuperacao(novaSenha)) {
    definirErroCampo("nova_senha_recuperacao", "A senha deve ter no minimo 8 caracteres.");
    mostrarMensagemRecuperacao("Revise a nova senha informada.", false);
    return;
  }

  if (novaSenha !== confirmaSenha) {
    definirErroCampo("confirma_senha_recuperacao", "A confirmacao deve ser igual a nova senha.");
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
    definirErroCampo("login_recuperacao", "Confira o login informado.");
    definirErroCampo("nome_materno_recuperacao", "Confira o nome materno informado.");
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

