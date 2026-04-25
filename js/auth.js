usuarios = [
  { user: "admin", email: "admin@admin.com", senha: "123456" }
]

function cadastrar() {
  const user = document.getElementById("user").value.toLowerCase()
  const email = document.getElementById("email").value
  const senha = document.getElementById("senha").value
  const confSenha = document.getElementById("confirma_senha").value
  const erro = document.getElementById("erro")

  if (user === "" || email === "" || senha === "" || confSenha === "") {
    erro.innerText = "Preencha todos os campos"
    return
  }

  if (!validarEmail(email)) {
    erro.innerText = "E-mail inválido"
    return
  }

  if (senha !== confSenha) {
    erro.innerText = "As senhas não coincidem"
    return
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || []
  const usuarioExistente = usuarios.find(u => u.user === user)

  if (usuarioExistente) {
    erro.innerText = "Usuário já existe"
    return
  }

  const novoUsuario = {
    user: user,
    email: email,
    senha: senha
  }

  usuarios.push(novoUsuario)
  localStorage.setItem("usuarios", JSON.stringify(usuarios))
  erro.innerText = "Usuário cadastrado com sucesso"
}

function login() {
  const user = document.getElementById("user").value.toLowerCase()
  const senha = document.getElementById("senha").value
  const erro = document.getElementById("erro")

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || []
  const usuario = usuarios.find(u => u.user === user)

  if (!usuario) {
    erro.innerText = "Usuário não encontrado"
    return
  }

  if (usuario.senha !== senha) {
    erro.innerText = "Senha incorreta"
    return
  }

  localStorage.setItem("usuarioLogado", user)
  window.location.href = "login.html"
}

function verificarLogin() {
  const usuario = localStorage.getItem("usuarioLogado")

  if (usuario === null) {
    window.location.href = "login.html"
  }
}

function logout() {

  localStorage.removeItem("usuarioLogado")
  window.location.href = "login.html"

}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
