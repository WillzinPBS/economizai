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

  disconnectedCallback() {
    this.encerrarMenuUsuario();
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

        .drop-box {
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

        .drop-box:hover,
        .drop-box:hover:not(:disabled) {
          background-color: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.03));
          color: var(--cor-texto, rgba(0, 0, 0, 0.80));
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

        .pesquisa {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          width: 100%;          /* ocupa a largura do pai */
          min-width: 300px;     /* garante um mínimo para o texto caber */
          border: solid 1px rgba(66, 65, 65, 0.4);
          box-sizing: border-box;
          border-radius: 8px;
          transition: 0.2s ease;
        }

        .pesquisa:hover {
          border-color: rgba(148, 202, 126, 0.4);
        }

        .pesquisa input {
          flex: 1;
          min-width: 0;
          padding: 0;           /* remove o padding padrão do navegador */
          border: none;
          outline: none;
          background: transparent;
          text-overflow: ellipsis;
        }

        .pesquisa button {
          flex-shrink: 0;
          padding: 0;           /* remove o padding padrão do botão (~6px de cada lado) */
          background-color: transparent;
          border: none;
          outline: none;
          cursor: pointer;
        }

        .botao-postar {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          padding: 8px 14px;
          border: none;
          border-radius: 12px;
          color: var(--cor-texto, black);
          font-size: 0.875rem;
          font-weight: 600;
          line-height: normal;
          cursor: pointer;
          text-decoration: none;
          transition: 0.2s ease;
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 12px;
          z-index: 1000;
        }

        .botao-postar:hover {
          color: var(--cor-botao-principal, #16a34a);
        }

        .botao-postar i {
          color: #16a34a
        }

        .acessibilidade {
          position: relative;
        }

        .menu-acessibilidade {
          display: none;
          position: absolute;
          top: 48px;
          right: 0;
          width: 240px;
          max-width: calc(100vw - 24px);
          padding: 16px;
          background: var(--cor-header-bg, #fff);
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }

        .acessibilidade.aberto .menu-acessibilidade {
          display: block;
        }

        .menu-acessibilidade strong {
          display: block;
          margin-bottom: 14px;
          color: var(--cor-texto, #111);
        }

        .menu-acessibilidade .controle-fonte {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .menu-acessibilidade .controle-fonte span {
          flex: 1;
          font-size: 0.85rem;
          color: var(--cor-texto-secundario, #555);
          text-align: center;
        }

        .menu-acessibilidade .botao-fonte {
          flex-shrink: 0;
          width: 36px;
          height: 32px;
          border-radius: 8px;
        }

        .opcao-acessibilidade {
          width: 100%;
          min-height: 40px;
          padding: 10px;
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 8px;
          background: transparent;
          color: var(--cor-texto, #111);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
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
          border-radius: 12px;
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

        /* ===== Menu do usuário ===== */

        /* Garante que o atributo hidden funcione mesmo com display definido em outras regras */
        [hidden] {
          display: none !important;
        }

        .usuario-menu {
          position: relative;
        }

        .usuario-gatilho {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 12px 0 4px;
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 999px;
          background-color: transparent;
          color: var(--cor-texto, rgba(0, 0, 0, 0.80));
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .usuario-gatilho:hover,
        .usuario-gatilho[aria-expanded="true"] {
          background-color: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.03));
        }

        .usuario-gatilho:focus-visible,
        .usuario-item:focus-visible {
          outline: 2px solid var(--cor-botao-principal, #16a34a);
          outline-offset: 2px;
        }

        .usuario-avatar {
          display: inline-flex;
          overflow: hidden;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--cor-botao-principal, #16a34a);
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 700;
          line-height: 1;
        }

        .usuario-avatar img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .usuario-avatar--grande {
          width: 44px;
          height: 44px;
          font-size: 1.125rem;
        }

        .usuario-nome-curto {
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .usuario-seta {
          font-size: 0.75rem;
          transition: transform 0.2s ease;
        }

        .usuario-gatilho[aria-expanded="true"] .usuario-seta {
          transform: rotate(180deg);
        }

        .usuario-painel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 1000;
          width: 260px;
          max-width: calc(100vw - 24px);
          padding: 8px;
          background: var(--cor-header-bg, #ffffff);
          border: 1px solid var(--cor-borda, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          animation: usuario-painel-entrada 0.15s ease;
        }

        @keyframes usuario-painel-entrada {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .usuario-painel {
            animation: none;
          }
        }

        .usuario-cabecalho {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          padding: 10px 8px 12px;
          border-bottom: 1px solid var(--cor-borda, #e5e7eb);
        }

        .usuario-dados {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.3;
        }

        .usuario-dados strong,
        .usuario-dados span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .usuario-dados strong {
          color: var(--cor-texto, #111111);
        }

        .usuario-dados span {
          color: var(--cor-texto-secundario, #555555);
          font-size: 0.75rem;
        }

        .usuario-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--cor-texto, #111111);
          font: inherit;
          text-align: left;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .usuario-item i {
          font-size: 1rem;
        }

        .usuario-item:hover {
          background: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.03));
        }

        .usuario-item--sair:hover {
          background: rgba(220, 38, 38, 0.08);
          color: var(--cor-erro, #dc2626);
        }


        /* No celular, só o avatar (+ seta) para o header não estourar */
        @media (max-width: 640px) {
          .usuario-nome-curto {
            display: none;
          }

          .usuario-gatilho {
            padding-right: 10px;
          }
        }

        /* ===== Fim do menu do usuário ===== */

        .fechar-acessibilidade {
          display: none;
        }

        @media (max-width: 900px) {
          header {
            height: auto;
          }

          .menu-acessibilidade {
            right: -10px;
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

          .menu-acessibilidade {
            position: fixed;
            top: 70px;
            right: 12px;
            left: 12px;
            width: auto;
            max-width: none;
          }

          .fechar-acessibilidade {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 8px;
            background: transparent;
            color: var(--cor-texto, #111);
            cursor: pointer;
            font-size: 16px;
          }

          .fechar-acessibilidade:hover {
            background: var(--cor-realce-verde-suave, rgba(0, 0, 0, 0.05));
          }

          .menu-acessibilidade {
            padding-top: 50px;
          }

          .menu-acessibilidade .controle-fonte {
            gap: 6px;
          }

          .menu-acessibilidade .controle-fonte span {
            font-size: 0.8rem;
          }

          .menu-acessibilidade .botao-fonte {
            width: 40px;
            height: 36px;
          }
        }

        @media (max-width: 380px) {
          .menu-acessibilidade {
            top: 65px;
            right: 8px;
            left: 8px;
            padding: 12px;
          }

          .menu-acessibilidade .controle-fonte span {
            font-size: 0.75rem;
          }
        }
      </style>
      <head>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
      </head>
      <header>
        <div class="menu">
          <a class="logo-link" href="index.html" aria-label="Ir para a página inicial do Economizai">
            <img src="img/logoecom.png" id="logoSrc" alt="Logo Economizai">
          </a>
          <nav aria-label="Navegação principal">
            ${this.getNavLink("home", "index.html", "Início")}
            ${this.getNavLink("produtos", "produto.html", "Produtos")}
            <div class="container">
              <form class="pesquisa">
              <input type="text" placeholder="Busque promoções e mercados">
              <button type="submit"><i class="bi bi-search"></i></button>
              </form>
            </div>

            <!-- ${this.getNavLink("como-funciona", "comofunciona.html", "Como funciona")} -->
            ${this.getNavLink("contato", "contato.html", "Contato")}
          </nav>
          <div class="acoes-header">
            <div class="postar">
              <a class="botao-postar" href="postar.html">
                <i class="bi bi-plus-circle"></i>
                <span>Postar</span>
              </a>
            </div>


            <div class="acessibilidade">
              <button class="drop-box" type="button" aria-label="Acessibilidades" title="Acessibilidades">
                <i class="bi bi-universal-access-circle"></i>
              </button>

              <div class="menu-acessibilidade">
                <strong>Acessibilidade</strong>

                <button class="fechar-acessibilidade" type="button" aria-label="Fechar acessibilidade">
                  <i class="bi bi-x-lg"></i>
                </button>

                <div class="controle-fonte">
                  <button class="botao-fonte botao-diminuir-fonte" type="button">A−</button>
                  <span>Tamanho da fonte</span>
                  <button class="botao-fonte botao-aumentar-fonte" type="button">A+</button>
                </div>

                <button class="opcao-acessibilidade botao-tema" type="button">
                  <i class="bi bi-moon"></i>
                  <span>Modo escuro</span>
                </button>
              </div>
            </div>

            <div class="login" id="user-div">
              <!-- Visitante -->
              <a class="botao-principal" id="botao-entrar" href="login.html">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Entrar</span>
              </a>

              <!-- Usuário logado (preenchido por sincronizarUsuario) -->
              <div class="usuario-menu" id="usuario-menu" hidden>
                <button class="usuario-gatilho" id="usuario-gatilho" type="button"
                  aria-expanded="false" aria-controls="usuario-painel">
                  <span class="usuario-avatar" id="usuario-avatar" aria-hidden="true"></span>
                  <span class="usuario-nome-curto" id="usuario-nome-curto"></span>
                  <i class="bi bi-chevron-down usuario-seta" aria-hidden="true"></i>
                </button>

                <div class="usuario-painel" id="usuario-painel" hidden>
                  <div class="usuario-cabecalho">
                    <span class="usuario-avatar usuario-avatar--grande" id="usuario-avatar-grande" aria-hidden="true"></span>
                    <div class="usuario-dados">
                      <strong id="usuario-nome-completo"></strong>
                      <span id="usuario-login-texto"></span>
                    </div>
                  </div>

                  <a class="usuario-item" href="configuracoes.html">
                    <i class="bi bi-gear" aria-hidden="true"></i>
                    <span>Configurações</span>
                  </a>

                  <button class="usuario-item usuario-item--sair" id="botao-sair" type="button">
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;

    const botaoTema = this.shadowRoot.querySelector(".botao-tema");
    const botaoDiminuirFonte = this.shadowRoot.querySelector(".botao-diminuir-fonte");
    const botaoAumentarFonte = this.shadowRoot.querySelector(".botao-aumentar-fonte");

    const botaoAcessibilidade = this.shadowRoot.querySelector(".drop-box");
    const acessibilidade = this.shadowRoot.querySelector(".acessibilidade");

    const botaoFecharAcessibilidade =
      this.shadowRoot.querySelector(".fechar-acessibilidade");

    botaoFecharAcessibilidade.addEventListener("click", () => {
      acessibilidade.classList.remove("aberto");
    });

    botaoAcessibilidade.addEventListener("click", (event) => {
      event.stopPropagation();
      // O stopPropagation impede o "clicar fora" do menu de usuário de rodar,
      // então fechamos ele aqui para os dois nunca ficarem abertos juntos.
      this.fecharMenuUsuario();
      acessibilidade.classList.toggle("aberto");
    });

    botaoTema.addEventListener("click", alternarTema);
    botaoDiminuirFonte.addEventListener("click", diminuirFonte);
    botaoAumentarFonte.addEventListener("click", aumentarFonte);

    this.ligarMenuUsuario();

    this.sincronizarTema(temaAtual);
    this.sincronizarFonte(tamanhoFonteAtual);
    this.sincronizarUsuario();
  }

  sincronizarTema(tema) {
    const temaNormalizado = tema === "dark" ? "dark" : "light";
    this.setAttribute("theme", temaNormalizado);

    const logoEconomiza = this.shadowRoot.querySelector('#logoSrc');
    console.log(logoEconomiza)

    if (temaNormalizado === "dark") {
      logoEconomiza.src = 'img/logobranca.png';
    } else {
      logoEconomiza.src = 'img/logoecom.png';
    }

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

  // Decide o que mostrar: botão "Entrar" (visitante) ou menu do usuário (logado).
  // Não recria o HTML — só alterna visibilidade e preenche os textos.
  sincronizarUsuario() {
    const raiz = this.shadowRoot;
    const menu = raiz?.getElementById("usuario-menu");
    const botaoEntrar = raiz?.getElementById("botao-entrar");

    if (!menu || !botaoEntrar) {
      return;
    }

    const login = localStorage.getItem("usuarioLogado");

    // Visitante: só o botão "Entrar"
    if (!login) {
      botaoEntrar.hidden = false;
      menu.hidden = true;
      this.fecharMenuUsuario();
      return;
    }

    // Logado: busca o nome completo no cadastro
    let usuarios = [];
    try {
      const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios"));
      usuarios = Array.isArray(usuariosSalvos) ? usuariosSalvos : [];
    } catch {
      usuarios = [];
    }

    const cadastro = usuarios.find(
      (usuario) =>
        typeof usuario.login === "string" &&
        usuario.login.toLowerCase() === login.toLowerCase()
    );

    const nomeCompleto = String(cadastro?.nome || login).trim();
    const primeiroNome = nomeCompleto.split(/\s+/)[0];
    const inicial = primeiroNome.charAt(0).toUpperCase();

    // textContent (e não innerHTML) para o nome nunca ser interpretado como HTML
    const fotoValida =
    typeof cadastro?.foto === "string" && cadastro.foto.startsWith("data:image/");

  ["usuario-avatar", "usuario-avatar-grande"].forEach((id) => {
    const elemento = raiz.getElementById(id);
    elemento.textContent = "";

    if (fotoValida) {
      const img = document.createElement("img");
      img.src = cadastro.foto;
      img.alt = "";
      elemento.appendChild(img);
    } else {
      elemento.textContent = inicial;
    }
  });
    raiz.getElementById("usuario-nome-curto").textContent = primeiroNome;

    const nomeCompletoEl = raiz.getElementById("usuario-nome-completo");
    nomeCompletoEl.textContent = nomeCompleto;
    nomeCompletoEl.title = nomeCompleto;

    raiz.getElementById("usuario-login-texto").textContent = `@${login}`;
    raiz
      .getElementById("usuario-gatilho")
      .setAttribute("aria-label", `Menu do usuário ${primeiroNome}`);

    botaoEntrar.hidden = true;
    menu.hidden = false;
  }

  // Liga os eventos do menu do usuário. Roda uma vez por render().
  ligarMenuUsuario() {
    const raiz = this.shadowRoot;
    const menu = raiz.getElementById("usuario-menu");
    const gatilho = raiz.getElementById("usuario-gatilho");
    const painel = raiz.getElementById("usuario-painel");
    const botaoSair = raiz.getElementById("botao-sair");

    if (!menu || !gatilho || !painel || !botaoSair) {
      return;
    }

    // Evita listeners duplicados no document se o componente for renderizado de novo
    this.encerrarMenuUsuario();

    gatilho.addEventListener("click", () => {
      if (painel.hidden) this.abrirMenuUsuario();
      else this.fecharMenuUsuario();
    });

    botaoSair.addEventListener("click", () => this.sair());

    // Fecha ao clicar fora (composedPath atravessa o shadow DOM)
    this._cliqueForaUsuario = (evento) => {
      if (!evento.composedPath().includes(menu)) this.fecharMenuUsuario();
    };

    // Fecha com Esc e devolve o foco ao botão
    this._teclaUsuario = (evento) => {
      if (evento.key === "Escape" && !painel.hidden) {
        this.fecharMenuUsuario();
        gatilho.focus();
      }
    };

    document.addEventListener("click", this._cliqueForaUsuario);
    document.addEventListener("keydown", this._teclaUsuario);
  }

  abrirMenuUsuario() {
    const raiz = this.shadowRoot;
    raiz.getElementById("usuario-painel").hidden = false;
    raiz.getElementById("usuario-gatilho").setAttribute("aria-expanded", "true");

    // Evita deixar o menu de acessibilidade aberto ao mesmo tempo
    raiz.querySelector(".acessibilidade")?.classList.remove("aberto");
  }

  fecharMenuUsuario() {
    const raiz = this.shadowRoot;
    const painel = raiz?.getElementById("usuario-painel");
    if (!painel || painel.hidden) return;

    painel.hidden = true;
    raiz.getElementById("usuario-gatilho").setAttribute("aria-expanded", "false");
  }

  sair() {
    // logout() vem do auth.js: remove "usuarioLogado" e redireciona para login.html
    if (typeof logout === "function") {
      logout();
      return;
    }

    // Plano B caso o auth.js não esteja carregado nesta página
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  }

  encerrarMenuUsuario() {
    document.removeEventListener("click", this._cliqueForaUsuario);
    document.removeEventListener("keydown", this._teclaUsuario);
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