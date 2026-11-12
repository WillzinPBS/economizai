(async function () {
  "use strict";
  let usuario = await window.sessaoPronta;
  if (!usuario) { window.location.replace("login.html"); return; }
  const $ = (id) => document.getElementById(id);
  let fotoPendente;

  function mensagem(id, texto, sucesso = false) {
    $(id).textContent = texto;
    $(id).className = "auth-message " + (sucesso ? "auth-message--sucesso" : "auth-message--erro");
  }

  function avatar(elemento, foto) {
    elemento.textContent = "";
    if (typeof foto === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(foto)) {
      const imagem = document.createElement("img");
      imagem.src = foto;
      imagem.alt = "";
      elemento.appendChild(imagem);
    } else elemento.textContent = (usuario.nome || usuario.login).charAt(0).toUpperCase();
  }

  function atualizarResumo() {
    $("perfil-nome").textContent = usuario.nome;
    $("perfil-login").textContent = `@${usuario.login} · ${usuario.perfil}`;
    avatar($("perfil-avatar"), usuario.foto);
    avatar($("foto-preview"), fotoPendente === undefined ? usuario.foto : fotoPendente);
    $("foto-remover").disabled = !(fotoPendente === undefined ? usuario.foto : fotoPendente);
    $("foto-salvar").disabled = fotoPendente === undefined;
  }

  async function salvarPerfil(dados) {
    await requisitar("perfil", dados);
    usuario = await carregarSessao();
    if (!usuario) { window.location.replace("login.html"); throw new Error("Entre novamente."); }
  }

  function redimensionarImagem(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const imagem = new Image();
      imagem.onload = () => {
        URL.revokeObjectURL(url);
        const lado = Math.min(imagem.naturalWidth, imagem.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 256;
        const contexto = canvas.getContext("2d");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, 256, 256);
        contexto.drawImage(imagem, (imagem.naturalWidth - lado) / 2, (imagem.naturalHeight - lado) / 2, lado, lado, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      imagem.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a imagem.")); };
      imagem.src = url;
    });
  }

  $("foto_arquivo").addEventListener("change", async (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) throw new Error("Use JPG, PNG ou WebP.");
      if (arquivo.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
      fotoPendente = await redimensionarImagem(arquivo);
      atualizarResumo();
      mensagem("msg-foto", "Pré-visualização pronta. Clique em Salvar foto.", true);
    } catch (erro) { mensagem("msg-foto", erro.message); }
    finally { evento.target.value = ""; }
  });

  $("foto-remover").addEventListener("click", () => {
    fotoPendente = usuario.foto ? null : undefined;
    atualizarResumo();
    mensagem("msg-foto", "Clique em Salvar foto para confirmar a alteração.", true);
  });

  $("form-foto").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (fotoPendente === undefined) return;
    $("foto-salvar").disabled = true;
    try {
      await salvarPerfil({ foto: fotoPendente || "" });
      fotoPendente = undefined;
      mensagem("msg-foto", "Foto atualizada.", true);
    } catch (erro) { mensagem("msg-foto", erro.message); }
    finally { atualizarResumo(); }
  });

  $("form-nome").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = $("nome_config").value.trim().replace(/\s+/g, " ");
    if (!validarNome(nome)) { mensagem("msg-nome", "Use entre 15 e 80 letras e espaços."); return; }
    const botao = evento.currentTarget.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      await salvarPerfil({ nome });
      $("nome_config").value = usuario.nome;
      atualizarResumo();
      mensagem("msg-nome", "Nome atualizado.", true);
    } catch (erro) { mensagem("msg-nome", erro.message); }
    finally { botao.disabled = false; }
  });

  function atualizarForcaSenha() {
    const senha = $("nova_senha").value;
    const valida = validarSenha(senha);
    $("forca-nova-senha").className = "auth-forca-senha" + (senha ? (valida ? " auth-forca-senha--forte" : " auth-forca-senha--fraca") : "");
    $("forca-nova-senha").textContent = senha ? (valida ? "Senha válida." : "Use exatamente 8 letras, sem números ou símbolos.") : "";
  }
  $("nova_senha").addEventListener("input", atualizarForcaSenha);
  document.querySelectorAll(".auth-toggle-senha").forEach((botao) => {
    botao.addEventListener("click", () => {
      const campo = $(botao.dataset.alvo);
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      botao.querySelector("i").className = mostrar ? "bi bi-eye-slash" : "bi bi-eye";
    });
  });

  $("form-senha").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (usuario.perfil !== "comum") return;
    const dados = { senhaAtual: $("senha_atual").value, novaSenha: $("nova_senha").value, confirmaSenha: $("confirma_nova_senha").value };
    if (!dados.senhaAtual || !validarSenha(dados.novaSenha) || dados.novaSenha !== dados.confirmaSenha) {
      mensagem("msg-senha", "Informe a senha atual e confirme uma nova senha com exatamente 8 letras."); return;
    }
    const formulario = evento.currentTarget;
    const botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      await requisitar("senha", dados);
      formulario.reset();
      document.querySelectorAll(".auth-toggle-senha").forEach((item) => {
        $(item.dataset.alvo).type = "password";
        item.setAttribute("aria-label", "Mostrar senha");
        item.querySelector("i").className = "bi bi-eye";
      });
      atualizarForcaSenha();
      mensagem("msg-senha", "Senha alterada.", true);
    } catch (erro) { mensagem("msg-senha", erro.message); }
    finally { botao.disabled = false; }
  });

  $("secao-senha").hidden = usuario.perfil !== "comum";
  $("nome_config").value = usuario.nome;
  atualizarResumo();
})();
