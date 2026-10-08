function obterCampo(campoOuId) {
  return typeof campoOuId === "string"
    ? document.getElementById(campoOuId)
    : campoOuId;
}

function obterContainerCampo(campo) {
  return campo ? campo.closest(".auth-field") : null;
}

function limparErroCampo(campoOuId) {
  const campo = obterCampo(campoOuId);
  const container = obterContainerCampo(campo);

  if (!campo || !container) return;

  campo.classList.remove("auth-control--invalido");
  campo.removeAttribute("aria-invalid");

  const mensagem = container.querySelector(".auth-field-error");
  if (mensagem) {
    mensagem.remove();
  }
}

function definirErroCampo(campoOuId, texto) {
  const campo = obterCampo(campoOuId);
  const container = obterContainerCampo(campo);

  if (!campo || !container) return;

  limparErroCampo(campo);
  campo.classList.add("auth-control--invalido");
  campo.setAttribute("aria-invalid", "true");

  const mensagem = document.createElement("p");
  mensagem.className = "auth-field-error";
  mensagem.textContent = texto;
  container.appendChild(mensagem);
}

function campoEstaVazio(campo) {
  return !String(campo.value || "").trim();
}

function limparErrosFormulario(formulario) {
  if (!formulario) return;

  formulario.querySelectorAll(".auth-control").forEach(limparErroCampo);
}

function validarCamposObrigatorios(formulario) {
  if (!formulario) return true;

  let primeiroCampoInvalido = null;

  formulario.querySelectorAll("[required]").forEach((campo) => {
    if (campoEstaVazio(campo)) {
      definirErroCampo(campo, "Campo obrigatorio.");
      primeiroCampoInvalido ||= campo;
    }
  });

  if (primeiroCampoInvalido) {
    primeiroCampoInvalido.focus();
    return false;
  }

  return true;
}

function configurarValidacaoVisual(formulario) {
  if (!formulario) return;

  formulario.querySelectorAll(".auth-control").forEach((campo) => {
    const evento = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(evento, () => {
      if (!campoEstaVazio(campo)) {
        limparErroCampo(campo);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".auth-form")
    .forEach(configurarValidacaoVisual);
});
