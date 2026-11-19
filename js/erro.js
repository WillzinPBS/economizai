const mensagemErro = sessionStorage.getItem("erro-sistema");
if (mensagemErro) {
  document.getElementById("erro-mensagem").textContent = mensagemErro;
  sessionStorage.removeItem("erro-sistema");
}
