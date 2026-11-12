(async () => {
  const usuario = await window.sessaoPronta;
  if (!usuario) {
    location.replace("login.html");
    return;
  }
  if (usuario.perfil !== "master") {
    sessionStorage.setItem("erro-sistema", "Somente o usuário master pode acessar esta página.");
    location.replace("erro.html");
    return;
  }

  document.getElementById("conteudo-admin").hidden = false;
  const tela = document.body.dataset.tela;
  const busca = document.getElementById("busca");
  const tabela = document.getElementById("tabela-admin");
  const mensagem = document.getElementById("mensagem-admin");
  const formulario = document.getElementById("form-busca");
  const dialogo = document.getElementById("confirmar-exclusao");
  let selecionado = null;

  function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle("erro", erro);
  }

  function criarCelula(linha, texto) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    linha.appendChild(celula);
    return celula;
  }

  async function carregar() {
    mostrarMensagem("Carregando...");
    try {
      const resultado = await requisitar(`${tela}&busca=${encodeURIComponent(busca.value.trim())}`);
      const registros = resultado[tela];
      tabela.replaceChildren();
      registros.forEach((registro) => {
        const linha = document.createElement("tr");
        if (tela === "usuarios") {
          [registro.nome, registro.login, registro.cpf, registro.email].forEach((texto) => criarCelula(linha, texto));
          const botao = document.createElement("button");
          botao.type = "button";
          botao.className = "admin-botao admin-botao--perigo";
          botao.textContent = "Excluir";
          botao.setAttribute("aria-label", `Excluir ${registro.nome}`);
          botao.addEventListener("click", () => {
            selecionado = registro;
            document.getElementById("nome-exclusao").textContent = registro.nome;
            dialogo.returnValue = "";
            dialogo.showModal();
          });
          criarCelula(linha, "").appendChild(botao);
        } else {
          const data = new Date(registro.dataHora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
          [data, registro.nome, registro.cpf, registro.fator].forEach((texto) => criarCelula(linha, texto));
        }
        tabela.appendChild(linha);
      });
      mostrarMensagem(registros.length ? `${registros.length} registro(s) encontrado(s).` : "Nenhum registro encontrado.");
      const pdf = document.getElementById("baixar-pdf");
      if (pdf) pdf.href = `api/exportar-usuarios.php?busca=${encodeURIComponent(busca.value.trim())}`;
    } catch (erro) {
      mostrarMensagem(erro.message, true);
    }
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    carregar();
  });
  formulario.addEventListener("reset", () => {
    busca.value = "";
    carregar();
  });
  dialogo?.addEventListener("close", async () => {
    if (dialogo.returnValue !== "excluir" || !selecionado) return;
    try {
      const resultado = await requisitar("excluir-usuario", { id: selecionado.id });
      selecionado = null;
      await carregar();
      mostrarMensagem(resultado.mensagem);
    } catch (erro) {
      mostrarMensagem(erro.message, true);
    }
  });
  carregar();
})();
