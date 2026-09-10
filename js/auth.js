function obterUsuarios() {
  try {
    const usuarios = JSON.parse(localStorage.getItem("usuarios"));
    return Array.isArray(usuarios) ? usuarios : [];
  } catch {
    return [];
  }
}

const LEMBRAR_USUARIO_CHAVE = "economizai_lembrar_usuario";
const LEMBRAR_USUARIO_ATIVO_CHAVE = "economizai_lembrar_usuario_ativo";

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
  return /^[A-Za-zÀ-ÿ\s]{15,60}$/.test(nome);
}

function validarTelefoneCelular(telefone) {
  return /^\d{2} \d{5}-\d{4}$/.test(telefone);
}

function validarTelefoneFixo(telefone) {
  return /^\(\+55\) \d{2} \d{4}-\d{4}$/.test(telefone);
}

function validarLogin(login) {
  return /^[A-Za-z0-9]{4,30}$/.test(login);
}

function validarSenha(senha) {
  return senha.length >= 8;
}

function validarCep(cep) {
  return /^\d{5}-?\d{3}$/.test(cep);
}

function obterPrimeiroNome(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "";
}

function atualizarForcaSenhaCadastro() {
  const senhaCampo = document.getElementById("senha");
  const indicador = document.getElementById("forca-senha-cadastro");

  if (!senhaCampo || !indicador) return;

  if (!senhaCampo.value) {
    indicador.className = "auth-forca-senha";
    indicador.innerText = "";
    return;
  }

  const senhaValida = validarSenha(senhaCampo.value);
  indicador.className = senhaValida
    ? "auth-forca-senha auth-forca-senha--forte"
    : "auth-forca-senha auth-forca-senha--fraca";
  indicador.innerText = senhaValida
    ? "Senha valida: minimo de 8 caracteres."
    : "A senha deve ter no minimo 8 caracteres.";
}

function montarEnderecoCompleto() {
  const enderecoCampo = document.getElementById("endereco");
  if (!enderecoCampo) return;

  const logradouro = valor("logradouro");
  const numero = valor("numero");
  const complemento = valor("complemento");
  const bairro = valor("bairro");
  const cidade = valor("cidade");
  const estado = valor("estado").toUpperCase();
  const cep = valor("cep");

  const partes = [
    [logradouro, numero].filter(Boolean).join(", "),
    complemento,
    bairro,
    [cidade, estado].filter(Boolean).join(" - "),
    cep ? `CEP ${cep}` : "",
  ].filter(Boolean);

  enderecoCampo.value = partes.join(", ");

  if (enderecoCampo.value && typeof limparErroCampo === "function") {
    limparErroCampo(enderecoCampo);
  }
}

function atualizarStatusCep(texto, erro = false) {
  const status = document.getElementById("cep-status");
  if (!status) return;

  status.textContent = texto;
  status.style.color = erro ? "var(--cor-erro)" : "";
}

async function buscarEnderecoPorCep() {
  const cepCampo = document.getElementById("cep");
  if (!cepCampo) return;

  const cep = cepCampo.value.replace(/\D/g, "");

  if (cep.length !== 8) {
    definirErroCampo("cep", "Informe um CEP com 8 digitos.");
    atualizarStatusCep("CEP invalido.", true);
    return;
  }

  atualizarStatusCep("Buscando endereco...");

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!resposta.ok) throw new Error("Falha ao consultar CEP.");

    const endereco = await resposta.json();
    if (endereco.erro) throw new Error("CEP nao encontrado.");

    document.getElementById("logradouro").value = endereco.logradouro || "";
    document.getElementById("bairro").value = endereco.bairro || "";
    document.getElementById("cidade").value = endereco.localidade || "";
    document.getElementById("estado").value = endereco.uf || "";

    ["cep", "logradouro", "bairro", "cidade", "estado"].forEach((id) => {
      limparErroCampo(id);
    });

    montarEnderecoCompleto();
    atualizarStatusCep("Endereco encontrado. Informe o numero e, se houver, o complemento.");
    document.getElementById("numero").focus();
  } catch (erro) {
    definirErroCampo("cep", erro.message || "Nao foi possivel consultar o CEP.");
    atualizarStatusCep("Nao foi possivel consultar o CEP. Preencha o endereco manualmente.", true);
  }
}

function cadastrar() {
  const formulario = document.getElementById("cadastroForm");
  limparErrosFormulario(formulario);

  montarEnderecoCompleto();

  if (!validarCamposObrigatorios(formulario)) {
    mostrarMensagem("Preencha os campos obrigatorios destacados.", false);
    return;
  }

  const nome = valor("nome");
  const dataNascimento = valor("data_nascimento");
  const sexo = valor("sexo");
  const nomeMaterno = valor("nome_materno");
  const cpf = valor("cpf");
  const telefoneCelular = valor("telefone_celular");
  const telefoneFixo = valor("telefone_fixo");
  const cep = valor("cep");
  const logradouro = valor("logradouro");
  const numero = valor("numero");
  const complemento = valor("complemento");
  const bairro = valor("bairro");
  const cidade = valor("cidade");
  const estado = valor("estado").toUpperCase();
  const endereco = valor("endereco");
  const login = valor("login");
  const senha = valor("senha");
  const confirmaSenha = valor("confirma_senha");

  if (!validarNome(nome)) {
    definirErroCampo("nome", "Use entre 15 e 60 caracteres alfabeticos.");
    mostrarMensagem("Revise o nome informado.", false);
    return;
  }

  if (!validarCep(cep)) {
    definirErroCampo("cep", "Informe um CEP com 8 digitos.");
    mostrarMensagem("Revise o CEP informado.", false);
    return;
  }

  const telefoneCelularValido = validarTelefoneCelular(telefoneCelular);
  const telefoneFixoValido = validarTelefoneFixo(telefoneFixo);

  if (!telefoneCelularValido || !telefoneFixoValido) {
    if (!telefoneCelularValido) {
      definirErroCampo("telefone_celular", "Use o formato 21 98480-7030.");
    }

    if (!telefoneFixoValido) {
      definirErroCampo("telefone_fixo", "Use o formato (+55) 21 3333-4444.");
    }

    mostrarMensagem("Revise os telefones informados.", false);
    return;
  }

  if (!validarLogin(login)) {
    definirErroCampo("login", "Use entre 4 e 30 letras ou numeros.");
    mostrarMensagem("Revise o login informado.", false);
    return;
  }

  if (!validarSenha(senha)) {
    definirErroCampo("senha", "A senha deve ter no minimo 8 caracteres.");
    mostrarMensagem("Revise a senha informada.", false);
    return;
  }

  if (senha !== confirmaSenha) {
    definirErroCampo("confirma_senha", "A confirmacao deve ser igual a senha.");
    mostrarMensagem("Senha e confirmacao devem ser iguais.", false);
    return;
  }

  const usuarios = obterUsuarios();
  const loginNormalizado = login.toLowerCase();
  const existe = usuarios.some(
    (usuario) =>
      typeof usuario.login === "string" &&
      usuario.login.toLowerCase() === loginNormalizado
  );

  if (existe) {
    definirErroCampo("login", "Este login ja esta cadastrado.");
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
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    endereco,
    login: loginNormalizado,
    senha,
  });

  salvarUsuarios(usuarios);
  mostrarMensagem(
    "Cadastro realizado com sucesso. Redirecionando para login...",
    true
  );

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}

function login() {
  const formulario = document.getElementById("loginForm");
  limparErrosFormulario(formulario);

  if (!validarCamposObrigatorios(formulario)) {
    mostrarMensagem("Preencha os campos obrigatorios destacados.", false);
    return;
  }

  const loginDigitado = valor("login");
  const senha = valor("senha");
  const lembrarUsuario = document.getElementById("lembrar_usuario");

  if (!validarLogin(loginDigitado)) {
    definirErroCampo("login", "Use entre 4 e 30 letras ou numeros.");
    mostrarMensagem("Revise o login informado.", false);
    return;
  }

  if (!validarSenha(senha)) {
    definirErroCampo("senha", "A senha deve ter no minimo 8 caracteres.");
    mostrarMensagem("Revise a senha informada.", false);
    return;
  }

  const usuarios = obterUsuarios();
  const loginNormalizado = loginDigitado.toLowerCase();
  const usuario = usuarios.find(
    (item) =>
      typeof item.login === "string" &&
      item.login.toLowerCase() === loginNormalizado
  );

  if (!usuario || usuario.senha !== senha) {
    definirErroCampo("login", "Confira o login informado.");
    definirErroCampo("senha", "Confira a senha informada.");
    mostrarMensagem("Login ou senha invalidos.", false);
    return;
  }

  const lembrarAtivo = Boolean(lembrarUsuario && lembrarUsuario.checked);

  if (lembrarAtivo) {
    localStorage.setItem(LEMBRAR_USUARIO_CHAVE, loginDigitado);
    localStorage.setItem(LEMBRAR_USUARIO_ATIVO_CHAVE, "true");
  } else {
    localStorage.removeItem(LEMBRAR_USUARIO_CHAVE);
    localStorage.removeItem(LEMBRAR_USUARIO_ATIVO_CHAVE);
  }

  localStorage.setItem("usuarioLogado", loginNormalizado);
  window.location.href = "index.html";
}

function preencherLoginLembrado() {
  const loginCampo = document.getElementById("login");
  const lembrarUsuario = document.getElementById("lembrar_usuario");

  if (!loginCampo || !lembrarUsuario) return;

  const lembrarAtivo =
    localStorage.getItem(LEMBRAR_USUARIO_ATIVO_CHAVE) === "true";
  const loginSalvo = localStorage.getItem(LEMBRAR_USUARIO_CHAVE) || "";

  lembrarUsuario.checked = lembrarAtivo && Boolean(loginSalvo);

  if (lembrarUsuario.checked) {
    loginCampo.value = loginSalvo;
  }
}

function verificarLogin(opcoes = {}) {
  const { redirecionarSeAusente = true, targetElement = null } = opcoes;
  const loginSalvo = localStorage.getItem("usuarioLogado");

  if (!loginSalvo) {
    if (targetElement) targetElement.innerHTML = "";
    if (redirecionarSeAusente) window.location.href = "index.html";
    return null;
  }

  const usuario = obterUsuarios().find(
    (item) =>
      typeof item.login === "string" &&
      item.login.toLowerCase() === loginSalvo.toLowerCase()
  );
  const primeiroNome = obterPrimeiroNome(usuario?.nome) || loginSalvo;

  if (targetElement) {
    targetElement.innerText = `Bem-vindo, ${primeiroNome}!`;
  }

  return primeiroNome;
}

function aplicarMascaraTelefone(input, tipo) {
  input.addEventListener("input", () => {
    // Para o telefone fixo, o campo e reformatado com o literal "(+55) " na
    // frente. Sem remove-lo antes de extrair os digitos, o "55" desse
    // prefixo e relido como se fosse digitado, corrompendo o DDD a cada tecla.
    const valorSemPrefixo =
      tipo === "fixo" ? input.value.replace(/^\(\+55\)\s*/, "") : input.value;

    let numeros = valorSemPrefixo.replace(/\D/g, "");
    const quantidadeMaxima = tipo === "celular" ? 11 : 10;
    const tamanhoPrimeiroBloco = tipo === "celular" ? 5 : 4;

    numeros = numeros.slice(0, quantidadeMaxima);

    const ddd = numeros.slice(0, 2);
    const telefone = numeros.slice(2);
    const primeiroBloco = telefone.slice(0, tamanhoPrimeiroBloco);
    const segundoBloco = telefone.slice(tamanhoPrimeiroBloco);

    const telefoneFormatado = `${ddd}${primeiroBloco ? ` ${primeiroBloco}` : ""}${segundoBloco ? `-${segundoBloco}` : ""}`;

    input.value = numeros
      ? tipo === "celular"
        ? telefoneFormatado
        : `(+55) ${telefoneFormatado}`
      : "";
  });
}

function aplicarMascaraCPF(input) {
  input.addEventListener("input", () => {
    let texto = input.value.replace(/\D/g, "").slice(0, 11);
    texto = texto.replace(/(\d{3})(\d)/, "$1.$2");
    texto = texto.replace(/(\d{3})(\d)/, "$1.$2");
    texto = texto.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    input.value = texto;
  });
}

function aplicarMascaraCep(input) {
  input.addEventListener("input", () => {
    const numeros = input.value.replace(/\D/g, "").slice(0, 8);
    input.value = numeros.replace(/(\d{5})(\d)/, "$1-$2");
  });
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const formularioCadastro = document.getElementById("cadastroForm");
  const celular = document.getElementById("telefone_celular");
  const fixo = document.getElementById("telefone_fixo");
  const cpf = document.getElementById("cpf");
  const cep = document.getElementById("cep");
  const senhaCadastro = document.getElementById("senha");

  if (celular) aplicarMascaraTelefone(celular, "celular");
  if (fixo) aplicarMascaraTelefone(fixo, "fixo");
  if (cpf) aplicarMascaraCPF(cpf);

  if (cep) {
    aplicarMascaraCep(cep);
    cep.addEventListener("blur", buscarEnderecoPorCep);
  }

  ["logradouro", "numero", "complemento", "bairro", "cidade", "estado", "cep"]
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach((campo) => campo.addEventListener("input", montarEnderecoCompleto));

  if (senhaCadastro) {
    senhaCadastro.addEventListener("input", atualizarForcaSenhaCadastro);
    atualizarForcaSenhaCadastro();
  }

  if (formularioCadastro) {
    formularioCadastro.addEventListener("submit", (event) => {
      event.preventDefault();
      cadastrar();
    });
  }

  const usuario = localStorage.getItem("usuarioLogado");
  if (usuario) {
    document.querySelectorAll("#blur").forEach((elemento) => {
      elemento.removeAttribute("id");
    });

    document.querySelectorAll(".container-alert").forEach((alerta) => {
      alerta.remove();
    });
  }
});
