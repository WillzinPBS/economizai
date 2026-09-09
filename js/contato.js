const links = document.querySelectorAll(".copiar");

links.forEach(link => {
    link.addEventListener("click", () => {

        const texto = link.dataset.copy;

        navigator.clipboard.writeText(texto)
            .then(() => {
                if (window.Swal) {
                    Swal.fire("Copiado: " + texto);
                }
            })
            .catch(err => {
                console.error(err);
            });

    });
});
