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
  return /^[A-Za-zÀ-ÿ\s]{3,60}$/.test(nome);
}

function validarTelefone(telefone) {
  return /^\(\+55\)\s\d{2}\s\d{4,5}-\d{4}$/.test(telefone);
}

function validarLogin(login) {
  return /^[A-Za-z0-9]{6,}$/.test(login);
}

function validarSenha(senha) {
  return /^[A-Za-z0-9]{8,}$/.test(senha);
}

function obterForcaSenha(senha) {
  if (!senha) {
    return { classe: "", texto: "" };
  }

  let pontos = 0;

  if (/^[A-Za-z0-9]+$/.test(senha)) pontos += 1;
  if (senha.length >= 8) pontos += 1;
  if (senha.length >= 12) pontos += 1;
  if (/[A-Z]/.test(senha)) pontos += 1;
  if (/[a-z]/.test(senha)) pontos += 1;
  if (/\d/.test(senha)) pontos += 1;

  if (pontos <= 3) {
    return {
      classe: "auth-forca-senha--fraca",
      texto: "Forca da senha: fraca",
    };
  }

  if (pontos <= 5) {
    return {
      classe: "auth-forca-senha--media",
      texto: "Forca da senha: media",
    };
  }

  return { classe: "auth-forca-senha--forte", texto: "Forca da senha: forte" };
}

function atualizarForcaSenhaCadastro() {
  const senhaCampo = document.getElementById("senha");
  const indicador = document.getElementById("forca-senha-cadastro");

  if (!senhaCampo || !indicador) {
    return;
  }

  const forca = obterForcaSenha(senhaCampo.value);
  indicador.className = `auth-forca-senha ${forca.classe}`;
  indicador.innerText = forca.texto;
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
    !nome ||
    !dataNascimento ||
    !sexo ||
    !nomeMaterno ||
    !cpf ||
    !telefoneCelular ||
    !telefoneFixo ||
    !endereco ||
    !login ||
    !senha ||
    !confirmaSenha
  ) {
    mostrarMensagem("Preencha todos os campos obrigatorios.", false);
    return;
  }

  if (!validarNome(nome)) {
    mostrarMensagem(
      "Nome deve ter entre 3 e 60 caracteres alfabeticos.",
      false
    );
    return;
  }

  if (!validarTelefone(telefoneCelular) || !validarTelefone(telefoneFixo)) {
    mostrarMensagem(
      "Telefone celular e fixo devem estar no formato (+55) XX XXXXX-XXXX.",
      false
    );
    return;
  }

  if (!validarLogin(login)) {
    mostrarMensagem(
      "Login deve ter no minimo 6 caracteres (letras ou numeros).",
      false
    );
    return;
  }

  if (!validarSenha(senha)) {
    mostrarMensagem(
      "Senha deve ter no minimo 8 caracteres (letras ou numeros).",
      false
    );
    return;
  }

  if (senha !== confirmaSenha) {
    mostrarMensagem("Senha e confirma senha devem ser iguais.", false);
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
    senha,
  });

  salvarUsuarios(usuarios);
  mostrarMensagem(
    "Cadastro realizado com sucesso. Redirecionando para login...",
    true
  );
  setTimeout(function () {
    window.location.href = "login.html";
  }, 800);
}

function login() {
  const loginDigitado = valor("login");
  const senha = valor("senha");
  const lembrarUsuario = document.getElementById("lembrar_usuario");

  if (!loginDigitado || !senha) {
    mostrarMensagem("Preencha login e senha.", false);
    return;
  }

  if (!validarLogin(loginDigitado)) {
    mostrarMensagem(
      "Login deve ter no minimo 6 caracteres (letras ou numeros).",
      false
    );
    return;
  }

  if (!validarSenha(senha)) {
    mostrarMensagem(
      "Senha deve ter no minimo 8 caracteres (letras ou numeros).",
      false
    );
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

  if (!loginCampo || !lembrarUsuario) {
    return;
  }

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

  const usuario = localStorage.getItem("usuarioLogado");

  if (usuario === null) {
    if (targetElement) {
      targetElement.innerHTML = "";
    }

    if (redirecionarSeAusente) {
      window.location.href = "index.html";
    }

    return null;
  }

  if (targetElement) {
    targetElement.innerText = "Bem-vindo, " + usuario + "!";
    return usuario;
  }

  const areaUsuario = document.getElementById("user-div");
  if (areaUsuario) {
    areaUsuario.innerText = "Bem-vindo, " + usuario + "!";
  }

  return usuario;
}

function aplicarMascaraTelefone(input) {
  input.addEventListener("input", () => {
    // Remove tudo que não for número
    let numeros = input.value.replace(/\D/g, "");

    // Se o usuário tentar digitar 55 no começo, remove
    if (numeros.startsWith("55")) {
      numeros = numeros.slice(2);
    }

    // DDD (2) + número (9) = 11 dígitos
    numeros = numeros.slice(0, 11);

    let resultado = "(+55) ";

    if (numeros.length >= 2) {
      resultado += numeros.slice(0, 2);

      const telefone = numeros.slice(2);

      if (telefone.length > 0) {
        if (telefone.length <= 8) {
          resultado +=
            " " +
            telefone.replace(/(\d{4})(\d{0,4})/, "$1-$2");
        } else {
          resultado +=
            " " +
            telefone.replace(/(\d{5})(\d{0,4})/, "$1-$2");
        }
      }
    } else {
      resultado += numeros;
    }

    input.value = resultado;
  });

  input.addEventListener("focus", () => {
    if (!input.value) {
      input.value = "(+55) ";
    }
  });
}

function aplicarMascaraCPF(input) {
  input.addEventListener("input", () => {
    let valor = input.value.replace(/\D/g, "");

    valor = valor.substring(0, 11);

    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    input.value = valor;
  });
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}


document.addEventListener("DOMContentLoaded", () => {
  const celular = document.getElementById("telefone_celular");
  const fixo = document.getElementById("telefone_fixo");

  if (celular) aplicarMascaraTelefone(celular);
  if (fixo) aplicarMascaraTelefone(fixo);

  const cpf = document.getElementById("cpf");

  if (cpf) {
    aplicarMascaraCPF(cpf);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const senhaCadastro = document.getElementById("senha");

  if (senhaCadastro) {
    senhaCadastro.addEventListener("input", atualizarForcaSenhaCadastro);
    atualizarForcaSenhaCadastro();
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuarioLogado");

  if (usuario) {
    document.querySelectorAll("#blur").forEach(elemento => {
      elemento.removeAttribute("id");
    });

    document.querySelectorAll(".container-alert").forEach(alerta => {
      alerta.remove();
    });
  }
});