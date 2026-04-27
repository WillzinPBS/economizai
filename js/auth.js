function obterUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function mostrarMensagem(texto, sucesso) {
  const mensagem = document.getElementById("mensagem-auth");
  if (!mensagem) return;

  mensagem.innerText = texto;
  mensagem.className = sucesso
    ? "auth-message auth-message--sucesso"
    : "auth-message auth-message--erro";
}

function valor(id) {
  const campo = document.getElementById(id);
  return campo ? campo.value.trim() : "";
}

function validarNome(nome) {
  return /^[A-Za-z\s]{15,60}$/.test(nome);
}

function validarTelefone(telefone) {
  return /^\(\+55\)\d{2}-\d{9}$/.test(telefone);
}

function validarLogin(login) {
  return /^[A-Za-z]{6}$/.test(login);
}

function validarSenha(senha) {
  return /^[A-Za-z]{8}$/.test(senha);
}

function cadastrar() {
  const nome = valor("nome");
  const dataNascimento = valor("data_nascimento");
  const sexo = valor("sexo");
  const nomeMaterno = valor("nome_materno");
  const cpf = valor("cpf");
  const telefoneCelular = valor("telefone_celular");
  const telefoneFixo = valor("telefone_fixo");
  const endereco = valor("endereco");
  const login = valor("login");
  const senha = valor("senha");
  const confirmaSenha = valor("confirma_senha");

  if (
    !nome || !dataNascimento || !sexo || !nomeMaterno || !cpf ||
    !telefoneCelular || !telefoneFixo || !endereco || !login || !senha || !confirmaSenha
  ) {
    mostrarMensagem("Preencha todos os campos obrigatorios.", false);
    return;
  }

  if (!validarNome(nome)) {
    mostrarMensagem("Nome deve ter entre 15 e 60 caracteres alfabeticos.", false);
    return;
  }

  if (!validarTelefone(telefoneCelular) || !validarTelefone(telefoneFixo)) {
    mostrarMensagem("Telefone celular e fixo devem estar no formato (+55)XX-XXXXXXXXX.", false);
    return;
  }

  if (!validarLogin(login)) {
    mostrarMensagem("Login deve ter exatamente 6 caracteres alfabeticos.", false);
    return;
  }

  if (!validarSenha(senha)) {
    mostrarMensagem("Senha deve ter exatamente 8 caracteres alfabeticos.", false);
    return;
  }

  if (senha !== confirmaSenha) {
    mostrarMensagem("Senha e confirma senha devem ser iguais.", false);
    return;
  }

  const usuarios = obterUsuarios();
  const loginNormalizado = login.toLowerCase();
  const existe = usuarios.some((usuario) => typeof usuario.login === "string" && usuario.login.toLowerCase() === loginNormalizado);

  if (existe) {
    mostrarMensagem("Login ja cadastrado.", false);
    return;
  }

  usuarios.push({
    nome,
    dataNascimento,
    sexo,
    nomeMaterno,
    cpf,
    telefoneCelular,
    telefoneFixo,
    endereco,
    login: loginNormalizado,
    senha
  });

  salvarUsuarios(usuarios);
  mostrarMensagem("Cadastro realizado com sucesso. Redirecionando para login...", true);
  setTimeout(function () {
    window.location.href = "login.html";
  }, 800);
}

function login() {
  const loginDigitado = valor("login");
  const senha = valor("senha");

  if (!loginDigitado || !senha) {
    mostrarMensagem("Preencha login e senha.", false);
    return;
  }

  if (!validarLogin(loginDigitado)) {
    mostrarMensagem("Login deve ter exatamente 6 caracteres alfabeticos.", false);
    return;
  }

  if (!validarSenha(senha)) {
    mostrarMensagem("Senha deve ter exatamente 8 caracteres alfabeticos.", false);
    return;
  }

  const usuarios = obterUsuarios();
  const loginNormalizado = loginDigitado.toLowerCase();
  const usuario = usuarios.find((item) => typeof item.login === "string" && item.login.toLowerCase() === loginNormalizado);

  if (!usuario || usuario.senha !== senha) {
    mostrarMensagem("Login ou senha invalidos.", false);
    return;
  }

  localStorage.setItem("usuarioLogado", loginNormalizado);
  window.location.href = "index.html";
}

function verificarLogin() {
  const usuario = localStorage.getItem("usuarioLogado");
  if (usuario === null) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}
