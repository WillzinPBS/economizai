const ECONOMIZAI_THEME_STORAGE_KEY = "economizai-theme";
const ECONOMIZAI_FONT_STORAGE_KEY = "economizai-font-size";
const TAMANHO_FONTE_PADRAO = 100;
const TAMANHO_FONTE_MINIMO = 90;
const TAMANHO_FONTE_MAXIMO = 120;
const TAMANHO_FONTE_PASSO = 10;

function limitarTamanhoFonte(tamanho) {
  const numero = Number(tamanho);

  if (Number.isNaN(numero)) {
    return TAMANHO_FONTE_PADRAO;
  }

  return Math.min(TAMANHO_FONTE_MAXIMO, Math.max(TAMANHO_FONTE_MINIMO, numero));
}

function obterTemaAtual() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function obterTemaSalvo() {
  try {
    const temaSalvo = localStorage.getItem(ECONOMIZAI_THEME_STORAGE_KEY);
    return temaSalvo === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function aplicarTema(tema, salvar = true) {
  const temaNormalizado = tema === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", temaNormalizado);
  document.documentElement.style.colorScheme = temaNormalizado;

  if (salvar) {
    try {
      localStorage.setItem(ECONOMIZAI_THEME_STORAGE_KEY, temaNormalizado);
    } catch {
      // O tema continua funcionando mesmo se o navegador bloquear o localStorage.
    }
  }

  document.querySelectorAll("economizai-header").forEach((header) => {
    if (typeof header.sincronizarTema === "function") {
      header.sincronizarTema(temaNormalizado);
    }
  });
}

function alternarTema() {
  const novoTema = obterTemaAtual() === "dark" ? "light" : "dark";
  aplicarTema(novoTema);
}

function obterTamanhoFonteAtual() {
  const tamanhoAtual = document.documentElement.getAttribute("data-font-size");
  return limitarTamanhoFonte(tamanhoAtual || TAMANHO_FONTE_PADRAO);
}

function obterTamanhoFonteSalvo() {
  try {
    const tamanhoSalvo = localStorage.getItem(ECONOMIZAI_FONT_STORAGE_KEY);
    return limitarTamanhoFonte(tamanhoSalvo || TAMANHO_FONTE_PADRAO);
  } catch {
    return TAMANHO_FONTE_PADRAO;
  }
}

function aplicarTamanhoFonte(tamanho, salvar = true) {
  const tamanhoNormalizado = limitarTamanhoFonte(tamanho);
  document.documentElement.setAttribute("data-font-size", tamanhoNormalizado);
  document.documentElement.style.fontSize = `${tamanhoNormalizado}%`;

  if (salvar) {
    try {
      localStorage.setItem(ECONOMIZAI_FONT_STORAGE_KEY, tamanhoNormalizado);
    } catch {
      // A fonte continua funcionando mesmo se o navegador bloquear o localStorage.
    }
  }

  document.querySelectorAll("economizai-header").forEach((header) => {
    if (typeof header.sincronizarFonte === "function") {
      header.sincronizarFonte(tamanhoNormalizado);
    }
  });
}

function diminuirFonte() {
  aplicarTamanhoFonte(obterTamanhoFonteAtual() - TAMANHO_FONTE_PASSO);
}

function aumentarFonte() {
  aplicarTamanhoFonte(obterTamanhoFonteAtual() + TAMANHO_FONTE_PASSO);
}

aplicarTema(obterTemaSalvo(), false);
aplicarTamanhoFonte(obterTamanhoFonteSalvo(), false);

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

  isActive(page) {
    return (this.getAttribute("active-page") || "").toLowerCase() === page;
  }

  getNavLink(page, href, label) {
    const activeAttribute = this.isActive(page) ? ' id="visitando"' : "";
    return `<a href="${href}"${activeAttribute}>${label}</a>`;
  }

  render() {
    const temaAtual = obterTemaAtual();
    const tamanhoFonteAtual = obterTamanhoFonteAtual();
    this.setAttribute("theme", temaAtual);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 0.875rem;
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
          background-color: var(--cor-header-bg, #ffffff);
          box-shadow: 1px 0 6px 0 var(--cor-header-sombra, rgba(0, 0, 0, 0.40));
          border-bottom: 1px solid var(--cor-borda, transparent);
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
          transition: filter 0.2s ease;
        }

        :host([theme="dark"]) .logo-link img {
          filter: brightness(1.15) contrast(1.08) drop-shadow(0 0 1px rgba(255, 255, 255, 0.85));
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
          color: var(--cor-texto-secundario, rgba(0, 0, 0, 0.70));
          text-decoration: none;
          transition: 0.2s ease;
        }

        nav a:hover {
          background-color: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.03));
          color: var(--cor-texto, rgba(0, 0, 0, 0.80));
          border-radius: 8px;
        }

        .acoes-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .controle-fonte {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .botao-tema,
        .botao-fonte {
          width: 38px;
          height: 38px;
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 999px;
          background-color: transparent;
          color: var(--cor-texto-secundario, rgba(0, 0, 0, 0.70));
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .botao-tema:hover,
        .botao-fonte:hover:not(:disabled) {
          background-color: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.03));
          color: var(--cor-texto, rgba(0, 0, 0, 0.80));
        }

        .botao-fonte {
          font-size: 0.875rem;
          font-weight: 700;
          line-height: 1;
        }

        .botao-fonte:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .botao-tema svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          flex-shrink: 0;
        }

        .icone-sol {
          display: none;
        }

        :host([theme="dark"]) .icone-lua {
          display: none;
        }

        :host([theme="dark"]) .icone-sol {
          display: block;
        }

        .login {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .usuario-bemvindo {
          color: var(--cor-texto-secundario, rgba(0, 0, 0, 0.70));
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .login .botao-principal {
          width: auto;
          height: auto;
        }

        #visitando {
          padding: 8px 14px;
          border-radius: 8px;
          background-color: var(--cor-nav-ativo-bg, #dcfce7);
          color: var(--cor-nav-ativo-texto, #166534);
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
          background: var(--cor-botao-principal, #16a34a);
          color: #ffffff;
          font-size: 0.875rem;
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
          background: var(--cor-botao-principal-hover, #15803d);
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
          <a class="logo-link" href="index.html" aria-label="Ir para a página inicial do Economizai">
            <img src="img/logoecom.png" alt="Logo Economizai">
          </a>
          <nav aria-label="Navegação principal">
            ${this.getNavLink("home", "index.html", "Início")}
            ${this.getNavLink("produtos", "produto.html", "Produtos")}
            ${this.getNavLink("como-funciona", "comofunciona.html", "Como funciona")}
            ${this.getNavLink("contato", "contato.html", "Contato")}
          </nav>
          <div class="acoes-header">
            <div class="controle-fonte" aria-label="Tamanho da fonte">
              <button class="botao-fonte botao-diminuir-fonte" type="button" aria-label="Diminuir fonte" title="Diminuir fonte">A-</button>
              <button class="botao-fonte botao-aumentar-fonte" type="button" aria-label="Aumentar fonte" title="Aumentar fonte">A+</button>
            </div>
            <button class="botao-tema" type="button" aria-label="Alternar tema" title="Alternar tema">
              <svg class="icone-tema icone-lua" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>
              </svg>
              <svg class="icone-tema icone-sol" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/>
                <path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            </button>
            <div class="login" id="user-div">
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
        </div>
      </header>
    `;

    const botaoTema = this.shadowRoot.querySelector(".botao-tema");
    const botaoDiminuirFonte = this.shadowRoot.querySelector(".botao-diminuir-fonte");
    const botaoAumentarFonte = this.shadowRoot.querySelector(".botao-aumentar-fonte");

    botaoTema.addEventListener("click", alternarTema);
    botaoDiminuirFonte.addEventListener("click", diminuirFonte);
    botaoAumentarFonte.addEventListener("click", aumentarFonte);

    this.sincronizarTema(temaAtual);
    this.sincronizarFonte(tamanhoFonteAtual);
    this.sincronizarUsuario();
  }

  sincronizarTema(tema) {
    const temaNormalizado = tema === "dark" ? "dark" : "light";
    this.setAttribute("theme", temaNormalizado);

    const botaoTema = this.shadowRoot?.querySelector(".botao-tema");
    if (!botaoTema) {
      return;
    }

    const estaEscuro = temaNormalizado === "dark";
    botaoTema.setAttribute("title", estaEscuro ? "Ativar tema claro" : "Ativar tema escuro");
  }

  sincronizarFonte(tamanho) {
    const tamanhoNormalizado = limitarTamanhoFonte(tamanho);

    const botaoDiminuirFonte = this.shadowRoot?.querySelector(".botao-diminuir-fonte");
    const botaoAumentarFonte = this.shadowRoot?.querySelector(".botao-aumentar-fonte");

    if (!botaoDiminuirFonte || !botaoAumentarFonte) {
      return;
    }

    botaoDiminuirFonte.disabled = tamanhoNormalizado <= TAMANHO_FONTE_MINIMO;
    botaoAumentarFonte.disabled = tamanhoNormalizado >= TAMANHO_FONTE_MAXIMO;
  }

  sincronizarUsuario() {
    const usuarioArea = this.shadowRoot?.querySelector("#user-div");
    if (!usuarioArea) {
      return;
    }

    let usuario = null;

    if (typeof window.verificarLogin === "function") {
      usuario = window.verificarLogin({
        redirecionarSeAusente: false,
        targetElement: usuarioArea
      });
    } else {
      usuario = localStorage.getItem("usuarioLogado");
    }

    if (!usuario) {
      usuarioArea.innerHTML = `
        <a class="botao-principal" href="login.html">
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Entrar</span>
        </a>
      `;
      return;
    }

    const usuarioSeguro = String(usuario)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    usuarioArea.innerHTML = `<span class="usuario-bemvindo">Bem-vindo, ${usuarioSeguro}!</span>`;
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
          font-size: 0.875rem;
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
          background-color: var(--cor-footer-bg, #ffffff);
          box-shadow: 1px 0 1px 0 var(--cor-footer-sombra, rgba(0, 0, 0, 0.40));
          border-top: 1px solid var(--cor-borda, transparent);
        }

        footer div {
          width: min(1120px, calc(100% - 32px));
          text-align: center;
        }

        footer span {
          color: var(--cor-texto-secundario, rgba(0, 0, 0, 0.70));
          font-size: 0.8125rem;
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
          <span>&copy; 2026 Economizai - Projeto acadêmico - Encontre os melhores preços para sua lista de compras</span>
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


