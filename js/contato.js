// COPIAR INFORMAÇÕES DE CONTATO

const links = document.querySelectorAll(".copiar");

links.forEach(link => {
    link.addEventListener("click", () => {
        const texto = link.dataset.copy;

        navigator.clipboard.writeText(texto)
            .then(() => {
                if (window.Swal) {
                    Swal.fire({
                        icon: "success",
                        title: "Copiado!",
                        text: texto,
                        timer: 1600,
                        showConfirmButton: false
                    });
                }
            })
            .catch(err => {
                console.error("Não foi possível copiar:", err);
            });
    });
});



// FORMULÁRIO DE CONTATO


const formulario = document.querySelector(".form");

const botaoEnviar = formulario?.querySelector(".botao-principal");

const campos = formulario
    ? formulario.querySelectorAll("input, textarea")
    : [];



// VERIFICAR LOGIN


function usuarioEstaLogado() {
    return localStorage.getItem("usuarioLogado") !== null;
}



// ATUALIZAR VISUAL DO BOTÃO


function atualizarEstadoLogin() {

    if (!botaoEnviar) return;

    const icone = botaoEnviar.querySelector(".botao-cadeado");
    const texto = botaoEnviar.querySelector(".botao-texto");

    if (usuarioEstaLogado()) {

        // Usuário está logado
        botaoEnviar.classList.remove("bloqueado");

        if (icone) {
            icone.classList.remove("fa-lock");
            icone.classList.add("fa-unlock");
        }

        if (texto) {
            texto.textContent = "Enviar mensagem";
        }

    } else {

        // Usuário não está logado
        botaoEnviar.classList.add("bloqueado");

        if (icone) {
            icone.classList.remove("fa-unlock");
            icone.classList.add("fa-lock");
        }

        if (texto) {
            texto.textContent = "Enviar mensagem";
        }
    }
}



// VALIDAR CAMPOS


function atualizarEstadoFormulario() {

    if (!formulario) return;

    campos.forEach(campo => {

        if (campo.type !== "email") {

            if (campo.value.trim() === "") {
                campo.setCustomValidity("Preencha este campo.");
            } else {
                campo.setCustomValidity("");
            }
        }
    });
}


// DETECTAR DIGITAÇÃO


campos.forEach(campo => {

    campo.addEventListener("input", () => {
        atualizarEstadoFormulario();
    });

    campo.addEventListener("blur", () => {
        atualizarEstadoFormulario();
    });
});



// ENVIO DO FORMULÁRIO


formulario?.addEventListener("submit", event => {

    event.preventDefault();

  
    // VERIFICAR LOGIN


    if (!usuarioEstaLogado()) {

        window.location.href = "login.html";

        return;
    }


   
    // VALIDAR FORMULÁRIO
   

    atualizarEstadoFormulario();

    if (!formulario.checkValidity()) {

        if (window.Swal) {

            Swal.fire({
                icon: "warning",
                title: "Campos obrigatórios",
                text: "Preencha todos os campos obrigatórios antes de enviar.",
                confirmButtonText: "Entendi"
            });

        } else {

            formulario.reportValidity();
        }

        return;
    }



    // MOSTRAR ESTADO DE ENVIO


    botaoEnviar.disabled = true;

    botaoEnviar.classList.add("enviando");

    const icone = botaoEnviar.querySelector(".botao-cadeado");

    const texto = botaoEnviar.querySelector(".botao-texto");


    if (icone) {

        icone.classList.remove("fa-unlock");
        icone.classList.remove("fa-lock");

        icone.classList.add("fa-spinner");
        icone.classList.add("fa-spin");
    }


    if (texto) {
        texto.textContent = "Enviando...";
    }


    // SIMULAR ENVIO


    setTimeout(() => {

        if (window.Swal) {

            Swal.fire({
                icon: "success",
                title: "Mensagem enviada!",
                text: "Sua mensagem foi enviada com sucesso.",
                confirmButtonText: "Entendi"
            });
        }


        // Limpar formulário
        formulario.reset();


        // Restaurar botão
        botaoEnviar.disabled = false;

        botaoEnviar.classList.remove("enviando");


        if (icone) {

            icone.classList.remove("fa-spinner");
            icone.classList.remove("fa-spin");

            icone.classList.add("fa-unlock");
        }


        if (texto) {
            texto.textContent = "Enviar mensagem";
        }


        atualizarEstadoFormulario();

        atualizarEstadoLogin();

    }, 1000);
});


// INICIALIZAÇÃO

atualizarEstadoFormulario();

atualizarEstadoLogin();