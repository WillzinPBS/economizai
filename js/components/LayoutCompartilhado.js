class EconomizaiHeader extends HTMLElement {
  static get observedAttributes() {
    return ["active-page"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        header {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 999;
          width: 100%;
          height: 72px;
          background-color: #ffffff;
          box-shadow: 1px 0 6px 0 rgba(0, 0, 0, 0.40);
        }

        .menu {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: min(1120px, calc(100% - 32px));
          height: 72px;
          gap: 24px;
        }

        .logo-link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .menu img {
          width: 152px;
          max-width: 80%;
          display: block;
        }

        nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-left: auto;
          margin-right: auto;
        }

        nav a {
          text-align: center;
          padding: 8px 12px;
          color: rgba(0, 0, 0, 0.70);
          text-decoration: none;
          transition: 0.2s ease;
        }

        nav a:hover {
          background-color: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.80);
          border-radius: 8px;
        }

        .login {
          display: flex;
          align-items: center;
        }

        .login .botao-principal {
          width: auto;
          height: auto;
        }

        #visitando {
          padding: 8px 14px;
          border-radius: 8px;
          background-color: #dcfce7;
          color: #166534;
        }

        .botao-principal {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          background: #16a34a;
          color: #ffffff;
          font-size: 14px;
          font-weight: 400;
          line-height: normal;
          cursor: pointer;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .botao-principal:visited {
          color: #ffffff;
        }

        .botao-principal:hover {
          filter: brightness(0.9);
          color: #ffffff;
        }

        .botao-principal:active {
          transform: scale(0.98);
        }

        .icon,
        .botao-principal svg {
          width: 18px;
          height: 18px;
          color: var(--botao-icon-color, currentColor);
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          header {
            height: auto;
          }

          .menu {
            flex-wrap: wrap;
            justify-content: center;
            height: auto;
            padding: 12px 0;
            gap: 16px;
          }

          nav {
            order: 3;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .menu img {
            width: 132px;
          }
        }
      </style>
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
            <a class="botao-principal" href="login.html">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Entrar</span>
            </a>
          </div>
        </div>
      </header>
    `;
  }
}

class EconomizaiFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        footer {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 72px;
          margin-top: auto;
          background-color: #ffffff;
          box-shadow: 1px 0 1px 0 rgba(0, 0, 0, 0.40);
        }

        footer div {
          width: min(1120px, calc(100% - 32px));
          text-align: center;
        }

        footer span {
          color: rgba(0, 0, 0, 0.70);
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          footer {
            height: auto;
            min-height: 72px;
            padding: 12px 0;
          }
        }
      </style>
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
