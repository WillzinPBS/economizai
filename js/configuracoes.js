// Página de configurações do usuário (foto, nome e senha).
// Depende do auth.js (carregar antes): obterUsuarios, salvarUsuarios, validarNome,
// validarSenha, obterPrimeiroNome e logout.
(function () {
  "use strict";

  const TAMANHO_FOTO = 256; // px (quadrada)
  const LIMITE_ARQUIVO_BYTES = 5 * 1024 * 1024; // 5 MB
  const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

  const loginLogado = localStorage.getItem("usuarioLogado");

  // Página só para quem está logado
  if (!loginLogado) {
    window.location.replace("login.html");
    return;
  }

  const $ = (id) => document.getElementById(id);

  // undefined = sem mudança | string = foto nova (data URL) | null = remover foto
  let fotoPendente;

  /* ---------- Dados ---------- */

  function buscarUsuario() {
    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(
      (item) =>
        typeof item.login === "string" &&
        item.login.toLowerCase() === loginLogado.toLowerCase()
    );

    return { usuarios, indice, usuario: indice >= 0 ? usuarios[indice] : null };
  }

  function persistir(usuarios) {
    try {
      salvarUsuarios(usuarios);
      return true;
    } catch {
      return false; // por exemplo, armazenamento do navegador cheio
    }
  }

  function fotoSegura(foto) {
    return typeof foto === "string" && foto.startsWith("data:image/") ? foto : "";
  }

  /* ---------- Avatar e resumo ---------- */

  function desenharAvatar(elemento, foto, nome) {
    elemento.textContent = "";

    const src = fotoSegura(foto);
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      elemento.appendChild(img);
      return;
    }

    const base = obterPrimeiroNome(nome) || loginLogado;
    elemento.textContent = base.charAt(0).toUpperCase();
  }

  function atualizarResumo() {
    const { usuario } = buscarUsuario();
    if (!usuario) {
      logout();
      return;
    }

    $("perfil-nome").textContent = usuario.nome || loginLogado;
    $("perfil-login").textContent = `@${loginLogado}`;
    desenharAvatar($("perfil-avatar"), usuario.foto, usuario.nome);
  }

  function desenharPreviewFoto() {
    const { usuario } = buscarUsuario();
    const foto = fotoPendente === undefined ? usuario?.foto : fotoPendente;

    desenharAvatar($("foto-preview"), foto, usuario?.nome);
    $("foto-remover").disabled = !fotoSegura(foto);
    $("foto-salvar").disabled = fotoPendente === undefined;
  }

  // Faz o menu do topo (economizai-header) refletir foto/nome novos
  function sincronizarHeader() {
    document.querySelectorAll("economizai-header").forEach((header) => {
      if (typeof header.sincronizarUsuario === "function") {
        header.sincronizarUsuario();
      }
    });
  }

  /* ---------- Mensagens e erros ---------- */

  function mostrarStatus(id, texto, tipo) {
    const elemento = $(id);
    elemento.textContent = texto;
    elemento.className =
      "auth-message" +
      (tipo === "sucesso" ? " auth-message--sucesso" : "") +
      (tipo === "erro" ? " auth-message--erro" : "");
  }

  function limparStatus(id) {
    mostrarStatus(id, "", "neutro");
  }

  function erroCampo(id, texto) {
    const campo = $(id);
    const erro = $(`erro-${id}`);

    campo.classList.add("auth-control--invalido");
    campo.setAttribute("aria-invalid", "true");

    if (erro) {
      erro.textContent = texto;
      erro.hidden = false;
    }
  }

  function limparErroDe(campo) {
    campo.classList.remove("auth-control--invalido");
    campo.removeAttribute("aria-invalid");

    const erro = $(`erro-${campo.id}`);
    if (erro) {
      erro.textContent = "";
      erro.hidden = true;
    }
  }

  function limparErros(formulario) {
    formulario.querySelectorAll(".auth-control").forEach(limparErroDe);
  }

  // Ao digitar, some o erro daquele campo
  ["form-nome", "form-senha"].forEach((idFormulario) => {
    $(idFormulario).addEventListener("input", (evento) => {
      if (evento.target.classList.contains("auth-control")) {
        limparErroDe(evento.target);
      }
    });
  });

  /* ---------- Foto ---------- */

  // Corta no centro em quadrado, reduz para 256 px e comprime (JPEG),
  // para caber folgado no localStorage.
  function redimensionarImagem(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const imagem = new Image();

      imagem.onload = () => {
        URL.revokeObjectURL(url);

        const lado = Math.min(imagem.naturalWidth, imagem.naturalHeight);
        const origemX = (imagem.naturalWidth - lado) / 2;
        const origemY = (imagem.naturalHeight - lado) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = TAMANHO_FOTO;
        canvas.height = TAMANHO_FOTO;

        const contexto = canvas.getContext("2d");
        contexto.fillStyle = "#ffffff"; // PNG transparente não vira fundo preto
        contexto.fillRect(0, 0, TAMANHO_FOTO, TAMANHO_FOTO);
        contexto.drawImage(imagem, origemX, origemY, lado, lado, 0, 0, TAMANHO_FOTO, TAMANHO_FOTO);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };

      imagem.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível ler essa imagem. Tente outro arquivo."));
      };

      imagem.src = url;
    });
  }

  $("foto_arquivo").addEventListener("change", async (evento) => {
    const entrada = evento.target;
    const arquivo = entrada.files && entrada.files[0];

    limparStatus("msg-foto");
    if (!arquivo) return;

    try {
      if (!TIPOS_ACEITOS.includes(arquivo.type)) {
        mostrarStatus("msg-foto", "Use uma imagem JPG, PNG ou WebP.", "erro");
        return;
      }

      if (arquivo.size > LIMITE_ARQUIVO_BYTES) {
        mostrarStatus("msg-foto", "A imagem deve ter no máximo 5 MB.", "erro");
        return;
      }

      fotoPendente = await redimensionarImagem(arquivo);
      desenharPreviewFoto();
      mostrarStatus("msg-foto", "Pré-visualização pronta. Clique em “Salvar foto” para confirmar.", "neutro");
    } catch (erro) {
      mostrarStatus("msg-foto", erro.message || "Não foi possível carregar a imagem.", "erro");
    } finally {
      entrada.value = ""; // permite escolher o mesmo arquivo de novo
    }
  });

  $("foto-remover").addEventListener("click", () => {
    const { usuario } = buscarUsuario();

    // Se não há foto salva, "remover" só descarta a escolha pendente
    fotoPendente = fotoSegura(usuario?.foto) ? null : undefined;
    desenharPreviewFoto();

    if (fotoPendente === null) {
      mostrarStatus("msg-foto", "Foto removida da pré-visualização. Clique em “Salvar foto” para confirmar.", "neutro");
    } else {
      limparStatus("msg-foto");
    }
  });

  $("form-foto").addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (fotoPendente === undefined) return;

    const { usuarios, indice } = buscarUsuario();
    if (indice < 0) {
      logout();
      return;
    }

    const removida = fotoPendente === null;

    if (removida) {
      delete usuarios[indice].foto;
    } else {
      usuarios[indice].foto = fotoPendente;
    }

    if (!persistir(usuarios)) {
      mostrarStatus("msg-foto", "Não foi possível salvar a foto. O armazenamento do navegador pode estar cheio.", "erro");
      return;
    }

    fotoPendente = undefined;
    desenharPreviewFoto();
    atualizarResumo();
    sincronizarHeader();
    mostrarStatus("msg-foto", removida ? "Foto removida." : "Foto atualizada.", "sucesso");
  });

  /* ---------- Nome ---------- */

  $("form-nome").addEventListener("submit", (evento) => {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    limparErros(formulario);
    limparStatus("msg-nome");

    const nome = $("nome_config").value.trim().replace(/\s+/g, " ");

    if (!nome) {
      erroCampo("nome_config", "Informe seu nome.");
      mostrarStatus("msg-nome", "Preencha o campo destacado.", "erro");
      return;
    }

    if (!validarNome(nome)) {
      erroCampo("nome_config", "Use entre 15 e 60 caracteres alfabéticos.");
      mostrarStatus("msg-nome", "Revise o nome informado.", "erro");
      return;
    }

    const { usuarios, indice } = buscarUsuario();
    if (indice < 0) {
      logout();
      return;
    }

    if (usuarios[indice].nome === nome) {
      $("nome_config").value = nome;
      mostrarStatus("msg-nome", "Esse já é o seu nome. Nada para salvar.", "neutro");
      return;
    }

    usuarios[indice].nome = nome;

    if (!persistir(usuarios)) {
      mostrarStatus("msg-nome", "Não foi possível salvar o nome. O armazenamento do navegador pode estar cheio.", "erro");
      return;
    }

    $("nome_config").value = nome;
    atualizarResumo();
    desenharPreviewFoto(); // a inicial do avatar acompanha o nome
    sincronizarHeader();
    mostrarStatus("msg-nome", "Nome atualizado.", "sucesso");
  });

  /* ---------- Senha ---------- */

  function atualizarForcaSenha() {
    const campo = $("nova_senha");
    const indicador = $("forca-nova-senha");

    if (!campo.value) {
      indicador.className = "auth-forca-senha";
      indicador.textContent = "";
      return;
    }

    const valida = validarSenha(campo.value.trim());
    indicador.className =
      "auth-forca-senha " + (valida ? "auth-forca-senha--forte" : "auth-forca-senha--fraca");
    indicador.textContent = valida
      ? "Senha válida: mínimo de 8 caracteres."
      : "A senha deve ter no mínimo 8 caracteres.";
  }

  $("nova_senha").addEventListener("input", atualizarForcaSenha);

  function ocultarSenhas() {
    document.querySelectorAll(".auth-toggle-senha").forEach((botao) => {
      $(botao.dataset.alvo).type = "password";
      botao.setAttribute("aria-label", "Mostrar senha");
      botao.querySelector("i").className = "bi bi-eye";
    });
  }

  document.querySelectorAll(".auth-toggle-senha").forEach((botao) => {
    botao.addEventListener("click", () => {
      const campo = $(botao.dataset.alvo);
      const mostrar = campo.type === "password";

      campo.type = mostrar ? "text" : "password";
      botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      botao.querySelector("i").className = mostrar ? "bi bi-eye-slash" : "bi bi-eye";
    });
  });

  $("form-senha").addEventListener("submit", (evento) => {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    limparErros(formulario);
    limparStatus("msg-senha");

    // O auth.js também usa trim() nas senhas (cadastro e login)
    const atual = $("senha_atual").value.trim();
    const nova = $("nova_senha").value.trim();
    const confirmacao = $("confirma_nova_senha").value.trim();

    const { usuarios, indice, usuario } = buscarUsuario();
    if (!usuario) {
      logout();
      return;
    }

    let valido = true;

    if (!atual) {
      erroCampo("senha_atual", "Informe sua senha atual.");
      valido = false;
    } else if (usuario.senha !== atual) {
      erroCampo("senha_atual", "A senha atual está incorreta.");
      valido = false;
    }

    if (!validarSenha(nova)) {
      erroCampo("nova_senha", "A senha deve ter no mínimo 8 caracteres.");
      valido = false;
    } else if (nova === atual) {
      erroCampo("nova_senha", "A nova senha deve ser diferente da atual.");
      valido = false;
    }

    if (confirmacao !== nova) {
      erroCampo("confirma_nova_senha", "A confirmação deve ser igual à nova senha.");
      valido = false;
    }

    if (!valido) {
      mostrarStatus("msg-senha", "Revise os campos destacados.", "erro");
      return;
    }

    usuarios[indice].senha = nova;

    if (!persistir(usuarios)) {
      mostrarStatus("msg-senha", "Não foi possível salvar a senha. O armazenamento do navegador pode estar cheio.", "erro");
      return;
    }

    formulario.reset();
    ocultarSenhas();
    atualizarForcaSenha();
    mostrarStatus("msg-senha", "Senha alterada.", "sucesso");
  });

  /* ---------- Início ---------- */

  const inicial = buscarUsuario().usuario;
  $("nome_config").value = inicial?.nome || "";
  atualizarResumo();
  desenharPreviewFoto();
})();