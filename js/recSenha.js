document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await window.sessaoPronta;
  const orientacao = document.getElementById("orientacao-senha");
  const link = document.getElementById("link-alterar-senha");
  if (usuario?.perfil === "comum") {
    orientacao.textContent = "Você já está conectado. Altere sua senha nas configurações da sua conta.";
    link.href = "configuracoes.html#secao-senha";
    link.textContent = "Alterar minha senha";
  }
});
