class BotaoPrincipal extends HTMLElement {
  static get observedAttributes() {
    return ["label", "width", "height", "icon", "icon-color", "bg-color", "text-color"];
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

  getIconSvg(icon) {
    const icons = {
      mail: `
        <svg
          class="icon lucide-mail" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>
        </svg>
      `,
      phone: `
        <svg
          class="icon lucide-mail" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>
        </svg>
      `,
      user: `
      <svg 
      class="icon lucide-user" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" troke-linejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/>
      </svg>
    `,
      soma: `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      `
    };

    return icons[icon] || "";
  }

  render() {
    const label = this.getAttribute("label") || "Botão";
    const icon = this.getAttribute("icon") || "";
    const width = this.getAttribute("width") || "";
    const height = this.getAttribute("height") || "";
    const iconColor = this.getAttribute("icon-color") || "#ffffff";
    const bgColor = this.getAttribute("bg-color") || "#2563eb";
    const textColor = this.getAttribute("text-color") || "#ffffff";
    const margin = this.getAttribute("margin") || "";

    this.shadowRoot.innerHTML = `
      <style>
        .btn {
          font-family:  'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: ${width};
          height: ${height};
          padding: 8px 14px 8px 14px;
          border: none;
          border-radius: 8px;
          background: ${bgColor};
          color: ${textColor};
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          margin: ${margin};
          transition: 0.2s ease;
        }

        .btn:hover {
          filter: brightness(0.9);
        }

        .btn:active {
          transform: scale(0.98);
        }

        .icon {
          width: 18px;
          height: 18px;
          color: ${iconColor};
          flex-shrink: 0;
        }
      </style>

      <button class="btn" type="button">
        ${this.getIconSvg(icon)}
        <span>${label}</span>
      </button>
    `;
  }
}

customElements.define("botao-principal", BotaoPrincipal);