class BotaoPrincipal extends HTMLElement {
  static get observedAttributes() {
    return ["label", "width", "height", "icon", "icon-color", "bg-color", "text-color", "href", "button-type"];
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
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
          <rect x="2" y="4" width="20" height="16" rx="2"/>
        </svg>
      `,
      phone: `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>
        </svg>
      `,
      user: `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21a8 8 0 1 0-16 0"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `,
      plus: `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
      `
    };

    return icons[icon] || "";
  }

  getInlineStyle(width, height, bgColor, textColor, iconColor) {
    const styles = [];

    if (width) styles.push(`width:${width}`);
    if (height) styles.push(`height:${height}`);
    if (bgColor) styles.push(`background:${bgColor}`);
    if (textColor) styles.push(`color:${textColor}`);
    if (iconColor) styles.push(`--botao-icon-color:${iconColor}`);

    return styles.length ? ` style="${styles.join(";")}"` : "";
  }

  render() {
    const label = this.getAttribute("label") || "Botao";
    const icon = this.getAttribute("icon") || "";
    const width = this.getAttribute("width") || "";
    const height = this.getAttribute("height") || "";
    const iconColor = this.getAttribute("icon-color") || "";
    const bgColor = this.getAttribute("bg-color") || "";
    const textColor = this.getAttribute("text-color") || "";
    const href = this.getAttribute("href") || "";
    const buttonType = this.getAttribute("button-type") || "button";
    const inlineStyle = this.getInlineStyle(width, height, bgColor, textColor, iconColor);
    const iconMarkup = this.getIconSvg(icon);

    this.style.display = width === "100%" ? "block" : "inline-block";
    if (width) {
      this.style.width = width;
    } else {
      this.style.removeProperty("width");
    }

    if (href) {
      this.innerHTML = `
        <a class="botao-principal" href="${href}"${inlineStyle}>
          ${iconMarkup}
          <span>${label}</span>
        </a>
      `;
      return;
    }

    this.innerHTML = `
      <button class="botao-principal" type="${buttonType}"${inlineStyle}>
        ${iconMarkup}
        <span>${label}</span>
      </button>
    `;
  }
}

if (!customElements.get("botao-principal")) {
  customElements.define("botao-principal", BotaoPrincipal);
}
