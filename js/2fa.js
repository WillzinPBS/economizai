(async function () {
  const pergunta = document.getElementById("pergunta-2fa");
  const campo = document.getElementById("resposta-2fa");
  const botao = document.getElementById("confirmar-2fa");
  const mensagem = document.getElementById("mensagem-2fa");
  const tentativas = document.getElementById("tentativas-2fa");

  function voltarLogin(texto) {
    sessionStorage.setItem("aviso-login", texto);
    window.location.replace("login.html");
  }

  function mostrarDesafio(desafio) {
    pergunta.textContent = desafio.pergunta;
    campo.type = desafio.tipo === "dataNascimento" || desafio.tipo === "data_nascimento" ? "date" : "text";
    campo.placeholder = desafio.tipo === "cep" ? "00000-000" : "Digite sua resposta";
    tentativas.textContent = `${desafio.restantes} tentativa(s) restante(s).`;
    campo.disabled = false;
    botao.disabled = false;
    campo.focus();
  }

  try {
    const usuario = await window.sessaoPronta;
    if (usuario) {
      window.location.replace("index.html");
      return;
    }
    mostrarDesafio(await requisitar("desafio"));
  } catch (erro) {
    voltarLogin(erro.message || "Faça login para confirmar o segundo fator.");
    return;
  }

  document.getElementById("form-2fa").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const resposta = campo.value.trim();
    if (!resposta) return;
    botao.disabled = true;
    mensagem.textContent = "";
    try {
      const resultado = await requisitar("2fa", { resposta });
      if (resultado.usuario) atualizarSessao(resultado.usuario);
      else await carregarSessao();
      window.location.href = "index.html";
    } catch (erro) {
      if (erro.dados?.redirecionar || erro.dados?.restantes === 0 || erro.status === 401) {
        voltarLogin(erro.message);
        return;
      }
      mensagem.textContent = erro.message;
      mensagem.className = "auth-message auth-message--erro";
      campo.value = "";
      try { mostrarDesafio(await requisitar("desafio")); }
      catch (falha) { voltarLogin(falha.message); }
    } finally { botao.disabled = false; }
  });
})();
