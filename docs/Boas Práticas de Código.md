# Boas Práticas de Código (Clean Code) no Projeto Economizou

## 1. O que é Clean Code?
Clean Code (código limpo) é um jeito de escrever código que seja:

- Fácil de ler
- Fácil de entender
- Fácil de manter

No projeto **Economizou** (HTML + Tailwind CSS + JavaScript), isso ajuda toda a equipe a evoluir o sistema sem confusão.

---

## 2. Nomes Significativos
Use nomes que expliquem claramente o que a variável, função ou arquivo faz.

### Ruim
```js
let x = 0;
function c(a, b) {
  return a - b;
}
```

### Bom
```js
let totalProdutos = 0;

function calcularDiferencaPreco(precoAtual, precoAnterior) {
  return precoAtual - precoAnterior;
}
```

---

## 3. Funções Pequenas
Uma função deve ter uma responsabilidade só.

### Ruim
```js
function processarLista(produtos) {
  // valida
  if (!produtos || produtos.length === 0) return;

  // calcula média
  let soma = 0;
  for (let i = 0; i < produtos.length; i++) {
    soma += produtos[i].preco;
  }
  const media = soma / produtos.length;

  // exibe no HTML
  document.getElementById("resultado").innerText = `Média: R$ ${media}`;
}
```

### Bom
```js
function listaVazia(produtos) {
  return !produtos || produtos.length === 0;
}

function calcularMediaPrecos(produtos) {
  const soma = produtos.reduce((total, produto) => total + produto.preco, 0);
  return soma / produtos.length;
}

function mostrarMediaNoPainel(media) {
  document.getElementById("resultado").innerText = `Média: R$ ${media.toFixed(2)}`;
}
```

---

## 4. DRY (Don’t Repeat Yourself)
Evite repetir o mesmo código em vários lugares.

### Ruim
```js
const preco1 = Number(input1.value.replace(",", "."));
const preco2 = Number(input2.value.replace(",", "."));
const preco3 = Number(input3.value.replace(",", "."));
```

### Bom
```js
function converterPreco(valorTexto) {
  return Number(valorTexto.replace(",", "."));
}

const preco1 = converterPreco(input1.value);
const preco2 = converterPreco(input2.value);
const preco3 = converterPreco(input3.value);
```

---

## 5. Código Legível
Código legível tem boa identação, espaçamento e organização.

### Ruim
```js
if(usuarioLogado){if(lista.length>0){mostrarLista(lista)}else{mostrarMensagem("Sem itens")}}
```

### Bom
```js
if (usuarioLogado) {
  if (lista.length > 0) {
    mostrarLista(lista);
  } else {
    mostrarMensagem("Sem itens");
  }
}
```

---

## 6. Comentários
Comente apenas quando necessário. O código deve se explicar sozinho na maioria dos casos.

### Ruim
```js
// Soma 1 no contador
contador = contador + 1;
```

### Bom
```js
// Regra de negócio: limite diário de comparações para usuário gratuito
if (comparacoesHoje >= LIMITE_GRATUITO) {
  bloquearNovaComparacao();
}
```

---

## 7. Organização de Pastas
Uma boa estrutura facilita encontrar arquivos e manter o projeto.

```txt
economizou/
  index.html
  pages/
  js/
    ui.js
    storage.js
    comparador.js
  css/
    styles.css
  assets/
    images/
    icons/
```

Dica: agrupe por função (interface, dados, regras, recursos visuais).

---

## 8. Separação de Responsabilidades
Cada parte do código deve cuidar de uma coisa.

- `ui.js`: atualização de tela
- `storage.js`: salvar e ler `localStorage`
- `comparador.js`: lógica de comparação de preços

### Exemplo
```js
// comparador.js
export function calcularEconomia(precoMaior, precoMenor) {
  return precoMaior - precoMenor;
}
```

```js
// ui.js
import { calcularEconomia } from "./comparador.js";

function mostrarEconomia(precoMaior, precoMenor) {
  const economia = calcularEconomia(precoMaior, precoMenor);
  resultado.textContent = `Você economiza R$ ${economia.toFixed(2)}`;
}
```

---

## 9. Reutilização de Código
Sempre que possível, transforme trechos repetidos em funções reutilizáveis.

### Exemplo
```js
export function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
```

Use em qualquer tela do sistema para manter padrão.

---

## 10. Padronização
Defina padrões de escrita para o time inteiro.

### Regras simples
- Use `camelCase` para variáveis e funções
- Use nomes em português (ou inglês) de forma consistente
- Sempre use `;` (ou nunca use), mas mantenha padrão único
- Use aspas duplas (ou simples), mantendo padrão
- Crie constantes para valores fixos (`LIMITE_GRATUITO`, `TAXA_DESCONTO`)

Padronização reduz erros e melhora a leitura.

---

## 11. Noções Básicas de Segurança
Mesmo em projetos iniciantes, segurança é importante.

### 1. Nunca confiar em entrada do usuário
Valide e trate dados antes de usar.

```js
function validarPreco(valor) {
  const preco = Number(valor);
  return Number.isFinite(preco) && preco >= 0;
}
```

### 2. Evite `innerHTML` com conteúdo do usuário
Prefira `textContent` para reduzir risco de XSS.

### Ruim
```js
resultado.innerHTML = entradaDoUsuario;
```

### Bom
```js
resultado.textContent = entradaDoUsuario;
```

### 3. Não armazenar dados sensíveis no `localStorage`
Evite salvar senhas, tokens privados ou informações pessoais sensíveis.

---

## 12. Checklist Rápido para o Economizou

- Os nomes estão claros?
- As funções estão pequenas?
- Há código repetido que pode virar função?
- Está fácil de ler?
- Os comentários realmente ajudam?
- As pastas estão organizadas?
- Cada arquivo tem responsabilidade definida?
- O código foi reutilizado onde possível?
- O padrão do time foi seguido?
- Existe validação básica de segurança?

---

## Conclusão
Clean Code não é “código perfeito”.  
É código que outra pessoa (ou você no futuro) consegue entender rapidamente.

Se você aplicar essas práticas no **Economizou**, o projeto ficará mais profissional, mais seguro e muito mais fácil de evoluir.
