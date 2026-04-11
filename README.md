# Economizou

Sistema web de comparação de preços criado por estudantes de Análise e Desenvolvimento de Sistemas para ajudar usuários a economizar no dia a dia, comparando produtos entre diferentes mercados.

## Objetivo do Projeto

O **Economizou** foi desenvolvido para facilitar decisões de compra com base em preço.  
A proposta é simples: mostrar, de forma clara, onde está o menor valor de um produto entre mercados cadastrados.

Com isso, o usuário pode:

- Comparar preços rapidamente
- Identificar o mercado mais vantajoso
- Economizar tempo e dinheiro

## Arquitetura da Solução

O projeto segue uma arquitetura separada em **front-end** e **back-end (API)**.

### Front-end

Responsável pela interface com o usuário, navegação entre páginas e exibição das comparações.

- Desenvolvido com HTML, Tailwind CSS e JavaScript
- Realiza requisições HTTP para consumir dados da API
- Aplica validações de formulário no lado do cliente

### Back-end (API)

Responsável pela lógica de negócio e manipulação de dados.

- Desenvolvido com JavaScript (Node.js)
- Disponibiliza endpoints REST
- Processa cadastro, login e dados de produtos para comparação

### Comunicação entre camadas

O front-end consome a API via HTTP.  
Para o funcionamento completo do sistema (principalmente autenticação e dados dinâmicos), a API precisa estar em execução.

## Funcionalidades

- Cadastro de usuários com validação no front-end
- Login de usuários
- Dashboard com navegação
- Página de produtos
- Comparação de preços entre mercados
- Destaque automático do menor preço

## Tecnologias Utilizadas

### Front-end

- HTML
- Tailwind CSS
- JavaScript

### Back-end

- JavaScript (Node.js)
- API REST

## Como Executar o Front-end

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd economizou
```

### 2. Abrir o projeto

Como o front-end atual é baseado em páginas estáticas, você pode abrir o arquivo principal diretamente no navegador:

- `index.html`

Também é possível usar uma extensão de servidor local (ex.: Live Server no VS Code) para melhor experiência de desenvolvimento.

### 3. Acessar as páginas

- Página inicial: `index.html`
- Dashboard: `dashboard.html`
- Produtos: `produto.html`

## Importante sobre a API

Para recursos completos, a **API deve estar rodando**.

Sem a API, funcionalidades que dependem de dados dinâmicos e autenticação podem não funcionar corretamente, como:

- Cadastro persistente de usuários
- Login real com validação no servidor
- Carregamento de dados de produtos vindos do back-end

## Estrutura de Pastas

```txt
economizou/
├── assets/               # Recursos estáticos gerais
├── css/                  # Estilos do projeto
├── docs/                 # Documentação, branding e materiais de apoio
├── JS/                   # Scripts JavaScript do front-end
│   ├── auth.js           # Regras de autenticação no front-end
│   ├── produtos.js       # Regras e manipulação da página de produtos
│   ├── storage.js        # Persistência local (ex.: localStorage)
│   ├── ui.js             # Regras de interface e comportamento visual
│   └── validation.js     # Validações de formulários
├── dashboard.html        # Página de dashboard
├── index.html            # Página inicial / entrada do sistema
└── produto.html          # Página de produtos e comparação
```

## Equipe

Projeto desenvolvido por estudantes de **Análise e Desenvolvimento de Sistemas**.

Sugestão para preencher:

- Nome do integrante 1 - Função (ex.: Front-end)
- Nome do integrante 2 - Função (ex.: Back-end)
- Nome do integrante 3 - Função (ex.: Documentação/QA)

## Melhorias Futuras

- Integração completa e documentada com API em ambiente de produção
- Filtros avançados por categoria, marca e faixa de preço
- Histórico de preços por produto e mercado
- Painel administrativo para gestão de mercados e itens
- Testes automatizados (front-end e API)
- Documentação de endpoints com Swagger/OpenAPI
- Deploy contínuo (CI/CD) com ambientes de homologação e produção

## Licença

Definir a licença do projeto (ex.: MIT) para uso e contribuição.
