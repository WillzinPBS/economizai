class EconomizaiHeader extends HTMLElement {
  static get observedAttributes() {
    return ["active-page"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  isActive(page) {
    return (this.getAttribute("active-page") || "").toLowerCase() === page;
  }

  getNavLink(page, href, label) {
    const activeAttribute = this.isActive(page) ? ' id="visitando" aria-current="page"' : "";
    return `<a href="${href}"${activeAttribute}>${label}</a>`;
  }

  render() {
    this.innerHTML = `
      <header>
        <div class="menu">
          <a class="logo-link" href="index.html" aria-label="Ir para a pagina inicial do Economizai">
            <img src="img/logoecom.png" alt="Logo Economizai">
          </a>
          <nav aria-label="Navegacao principal">
            ${this.getNavLink("home", "index.html", "Home")}
            ${this.getNavLink("produtos", "produto.html", "Produtos")}
            ${this.getNavLink("como-funciona", "comofunciona.html", "Como Funciona")}
            ${this.getNavLink("contato", "contato.html", "Contato")}
          </nav>
          <div class="login">
            <button class="btn botao-principal" type="button">
              <svg
                class="icon lucide-mail" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>
              </svg>
              <span>Entrar</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }
}

class EconomizaiFooter extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <footer>
        <div>
          <span>&copy; 2026 Economizai - Projeto Academico - Encontre os melhores precos para sua lista de compras</span>
        </div>
      </footer>
    `;
  }
}

if (!customElements.get("economizai-header")) {
  customElements.define("economizai-header", EconomizaiHeader);
}

if (!customElements.get("economizai-footer")) {
  customElements.define("economizai-footer", EconomizaiFooter);
}
