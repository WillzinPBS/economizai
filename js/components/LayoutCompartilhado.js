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
            <botao-principal label="Entrar" icon="user"></botao-principal>
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
