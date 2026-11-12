document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await window.sessaoPronta;
  if (!usuario) {
    location.replace("login.html");
    return;
  }

  const formulario = document.getElementById("form-postar");
  const mensagem = document.getElementById("mensagem-postar");
  try {
    const opcoes = await requisitar("catalogo-opcoes");
    [["categoria", opcoes.categorias], ["tipo", opcoes.tipos]].forEach(([campo, valores]) => {
      const seletor = formulario.elements[campo];
      seletor.replaceChildren(new Option("Selecione", ""), ...valores.map((valor) => new Option(campo === "tipo" ? `Por ${valor}` : valor, valor)));
    });
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const dados = new FormData(formulario);
    const arquivo = dados.get("imagem");
    if (!arquivo || !arquivo.size || arquivo.size > 1048576) {
      mensagem.textContent = "Selecione uma imagem com até 1 MB.";
      return;
    }
    const imagem = await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      leitor.readAsDataURL(arquivo);
    }).catch((erro) => {
      mensagem.textContent = erro.message;
      return null;
    });
    if (!imagem) return;

    const botao = formulario.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
      const resposta = await requisitar("postar", {
        nome: dados.get("nome"), categoria: dados.get("categoria"), tipo: dados.get("tipo"), mercado: dados.get("mercado"),
        link: dados.get("link"), imagem, preco: dados.get("preco"), cupom: dados.get("cupom"),
      });
      mensagem.textContent = resposta.mensagem;
      formulario.reset();
    } catch (erro) {
      mensagem.textContent = erro.message;
    } finally {
      botao.disabled = false;
    }
  });
});
