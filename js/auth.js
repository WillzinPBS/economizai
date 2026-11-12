const LEMBRAR_USUARIO_CHAVE = "economizai_lembrar_usuario";
const LEMBRAR_USUARIO_ATIVO_CHAVE = "economizai_lembrar_usuario_ativo";

function mostrarMensagem(texto, sucesso = false) {
  const mensagem = document.getElementById("mensagem-auth");
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.className = "auth-message " + (sucesso ? "auth-message--sucesso" : "auth-message--erro");
}

function valor(id) { return document.getElementById(id)?.value.trim() || ""; }
function validarNome(nome) { return /^[A-Za-zÀ-ÖØ-öø-ÿ ]{15,80}$/.test(nome); }
function validarLogin(loginDigitado) { return /^[A-Za-z]{6}$/.test(loginDigitado); }
function validarSenha(senha) { return /^[A-Za-z]{8}$/.test(senha); }
function validarTelefoneCelular(telefone) { return /^\(\+55\)\d{2}-\d{8,9}$/.test(telefone); }
function validarTelefoneFixo(telefone) { return /^\(\+55\)\d{2}-\d{8}$/.test(telefone); }
function validarCep(cep) { return /^\d{5}-?\d{3}$/.test(cep); }
function obterPrimeiroNome(nome) { return String(nome || "").trim().split(/\s+/)[0] || ""; }

function validarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, "");
  if (!/^\d{11}$/.test(numeros) || /^(\d)\1{10}$/.test(numeros)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(numeros[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(numeros[tamanho])) return false;
  }
  return true;
}

function atualizarForcaSenhaCadastro() {
  const campo = document.getElementById("senha");
  const indicador = document.getElementById("forca-senha-cadastro");
  if (!campo || !indicador) return;
  const valida = validarSenha(campo.value);
  indicador.className = "auth-forca-senha" + (campo.value ? (valida ? " auth-forca-senha--forte" : " auth-forca-senha--fraca") : "");
  indicador.textContent = campo.value ? (valida ? "Senha válida." : "Use exatamente 8 letras, sem números ou símbolos.") : "";
}

function montarEnderecoCompleto() {
  const campo = document.getElementById("endereco");
  if (!campo) return;
  campo.value = [
    [valor("logradouro"), valor("numero")].filter(Boolean).join(", "),
    valor("complemento"), valor("bairro"),
    [valor("cidade"), valor("estado")].filter(Boolean).join(" - "),
    valor("cep") ? "CEP " + valor("cep") : "",
  ].filter(Boolean).join(", ");
}

function atualizarStatusCep(texto, erro = false) {
  const status = document.getElementById("cep-status");
  if (!status) return;
  status.textContent = texto;
  status.style.color = erro ? "var(--cor-erro)" : "";
}

async function buscarEnderecoPorCep() {
  const cep = valor("cep").replace(/\D/g, "");
  if (cep.length !== 8) { atualizarStatusCep("Informe um CEP com 8 dígitos.", true); return; }
  atualizarStatusCep("Buscando endereço...");
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!resposta.ok) throw new Error();
    const endereco = await resposta.json();
    if (endereco.erro) throw new Error();
    ["logradouro", "bairro"].forEach((id) => { document.getElementById(id).value = endereco[id] || ""; });
    document.getElementById("cidade").value = endereco.localidade || "";
    document.getElementById("estado").value = endereco.uf || "";
    montarEnderecoCompleto();
    atualizarStatusCep("Endereço encontrado. Confira e informe o número.");
  } catch {
    atualizarStatusCep("Não foi possível consultar o CEP. Preencha o endereço manualmente.", true);
  }
}

async function cadastrar() {
  const formulario = document.getElementById("cadastroForm");
  limparErrosFormulario(formulario);
  montarEnderecoCompleto();
  if (!validarCamposObrigatorios(formulario)) { mostrarMensagem("Preencha os campos obrigatórios destacados."); return; }
  const dados = {
    nome: valor("nome"), dataNascimento: valor("data_nascimento"), sexo: valor("sexo"),
    nomeMaterno: valor("nome_materno"), cpf: valor("cpf"), email: valor("email"),
    telefoneCelular: valor("telefone_celular"), telefoneFixo: valor("telefone_fixo"),
    cep: valor("cep"), logradouro: valor("logradouro"), numero: valor("numero"),
    complemento: valor("complemento"), bairro: valor("bairro"), cidade: valor("cidade"),
    estado: valor("estado"), endereco: valor("endereco"), login: valor("login"),
    senha: document.getElementById("senha").value, confirmaSenha: document.getElementById("confirma_senha").value,
  };
  const verificacoes = [
    ["nome", validarNome(dados.nome), "Use entre 15 e 80 letras e espaços."],
    ["nome_materno", /^[A-Za-zÀ-ÖØ-öø-ÿ ]{2,80}$/.test(dados.nomeMaterno), "Use entre 2 e 80 letras e espaços."],
    ["cpf", validarCPF(dados.cpf), "Informe um CPF válido."],
    ["email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email), "Informe um e-mail válido."],
    ["telefone_celular", validarTelefoneCelular(dados.telefoneCelular), "Use (+55)21-999999999."],
    ["telefone_fixo", validarTelefoneFixo(dados.telefoneFixo), "Use (+55)21-33334444."],
    ["cep", validarCep(dados.cep), "Informe um CEP com 8 dígitos."],
    ["login", validarLogin(dados.login), "Use exatamente 6 letras."],
    ["senha", validarSenha(dados.senha), "Use exatamente 8 letras, sem números ou símbolos."],
    ["confirma_senha", dados.senha === dados.confirmaSenha, "A confirmação deve ser igual à senha."],
  ];
  let valido = true;
  verificacoes.forEach(([id, ok, mensagem]) => {
    if (!ok) { definirErroCampo(id, mensagem); valido = false; }
  });
  if (!valido) { mostrarMensagem("Revise os campos destacados."); return; }
  const botao = formulario.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await requisitar("cadastro", dados);
    formulario.reset();
    sessionStorage.setItem("aviso-login", "Cadastro realizado. Entre com seu login e senha.");
    window.location.href = "login.html";
  } catch (erro) { mostrarMensagem(erro.message); }
  finally { botao.disabled = false; }
}

async function login() {
  const formulario = document.getElementById("loginForm");
  limparErrosFormulario(formulario);
  if (!validarCamposObrigatorios(formulario)) { mostrarMensagem("Preencha login e senha."); return; }
  const loginDigitado = valor("login");
  const senha = document.getElementById("senha").value;
  if (!validarLogin(loginDigitado) || !validarSenha(senha)) {
    mostrarMensagem("O login deve ter 6 letras e a senha, 8 letras."); return;
  }
  const botao = formulario.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await window.sessaoPronta;
    await requisitar("login", { login: loginDigitado, senha });
    if (document.getElementById("lembrar_usuario").checked) {
      localStorage.setItem(LEMBRAR_USUARIO_CHAVE, loginDigitado);
      localStorage.setItem(LEMBRAR_USUARIO_ATIVO_CHAVE, "true");
    } else {
      localStorage.removeItem(LEMBRAR_USUARIO_CHAVE);
      localStorage.removeItem(LEMBRAR_USUARIO_ATIVO_CHAVE);
    }
    window.location.href = "2fa.html";
  } catch (erro) {
    if (erro.status >= 500) {
      sessionStorage.setItem("erro-sistema", erro.message);
      window.location.href = "erro.html";
    } else mostrarMensagem(erro.message);
  }
  finally { botao.disabled = false; }
}

function preencherLoginLembrado() {
  const campo = document.getElementById("login");
  const lembrar = document.getElementById("lembrar_usuario");
  if (!campo || !lembrar) return;
  lembrar.checked = localStorage.getItem(LEMBRAR_USUARIO_ATIVO_CHAVE) === "true";
  if (lembrar.checked) campo.value = localStorage.getItem(LEMBRAR_USUARIO_CHAVE) || "";
}

async function verificarLogin(opcoes = {}) {
  const usuario = await window.sessaoPronta;
  if (!usuario) {
    if (opcoes.redirecionarSeAusente !== false) window.location.href = "login.html";
    return null;
  }
  if (opcoes.targetElement) opcoes.targetElement.textContent = `Bem-vindo, ${usuario.login}!`;
  return usuario.login;
}

async function logout() {
  try {
    await requisitar("logout", {});
    atualizarSessao(null);
    window.location.href = "login.html";
  } catch (erro) { mostrarMensagem(erro.message); }
}

function aplicarMascaraTelefone(input, tipo) {
  input.addEventListener("input", () => {
    const numeros = input.value.replace(/^\(\+55\)\s*/, "").replace(/\D/g, "").slice(0, tipo === "fixo" ? 10 : 11);
    input.value = numeros ? `(+55)${numeros.slice(0, 2)}${numeros.length > 2 ? "-" + numeros.slice(2) : ""}` : "";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const cadastro = document.getElementById("cadastroForm");
  ["telefone_celular", "telefone_fixo"].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) aplicarMascaraTelefone(campo, id === "telefone_fixo" ? "fixo" : "celular");
  });
  const cpf = document.getElementById("cpf");
  if (cpf) cpf.addEventListener("input", () => {
    cpf.value = cpf.value.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });
  const cep = document.getElementById("cep");
  if (cep) {
    cep.addEventListener("input", () => { cep.value = cep.value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"); });
    cep.addEventListener("blur", buscarEnderecoPorCep);
  }
  ["logradouro", "numero", "complemento", "bairro", "cidade", "estado", "cep"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", montarEnderecoCompleto);
  });
  document.getElementById("senha")?.addEventListener("input", atualizarForcaSenhaCadastro);
  if (cadastro) cadastro.addEventListener("submit", (evento) => { evento.preventDefault(); cadastrar(); });
  const aviso = sessionStorage.getItem("aviso-login");
  if (document.getElementById("loginForm") && aviso) {
    mostrarMensagem(aviso, aviso.startsWith("Cadastro"));
    sessionStorage.removeItem("aviso-login");
  }
  document.querySelectorAll("#cadastroForm, #loginForm").forEach((formulario) => {
    formulario.addEventListener("reset", () => {
      limparErrosFormulario(formulario); mostrarMensagem("");
      formulario.querySelectorAll(".auth-toggle-senha").forEach((botao) => {
        document.getElementById(botao.dataset.alvo).type = "password";
        botao.setAttribute("aria-label", "Mostrar senha");
        botao.querySelector("i").className = "fa-solid fa-eye";
      });
      setTimeout(atualizarForcaSenhaCadastro, 0);
      atualizarStatusCep("Preencha o CEP para consultar o endereço.");
    });
  });
  const usuario = await window.sessaoPronta;
  if (usuario) {
    document.querySelectorAll("#blur").forEach((elemento) => elemento.removeAttribute("id"));
    document.querySelectorAll(".container-alert").forEach((elemento) => elemento.remove());
  }
});
