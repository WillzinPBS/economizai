# Economizai

Site de comparação de preços com cadastro e autenticação em PHP e MySQL. O frontend usa HTML, CSS e JavaScript, sem etapa de compilação.

## Como executar no Windows com MySQL Workbench

Este projeto precisa do **MySQL Server** para guardar os dados e do **MySQL Workbench** para abrir a conexão e importar o banco pela interface. O Workbench é o programa gráfico de administração; instale o servidor também.

1. Baixe e instale o [MySQL Community Server 8.4 LTS](https://dev.mysql.com/downloads/mysql/8.4.html?os=3), escolhendo **Windows x64 MSI Installer**. No configurador, mantenha a porta `3306`, configure o serviço para iniciar com o Windows e crie uma senha para `root`.
2. Baixe e instale o [MySQL Workbench para Windows](https://dev.mysql.com/downloads/workbench/), escolhendo o instalador MSI Windows x64.
3. Abra o Workbench. Na tela inicial, clique no **+** ao lado de **MySQL Connections** e crie a conexão `Economizai` com:

   | Campo | Valor |
   | --- | --- |
   | Hostname | `127.0.0.1` |
   | Port | `3306` |
   | Username | `root` |
   | Password | A senha criada na instalação |

   Clique em **Test Connection** e depois abra a conexão.

4. No Workbench, use **File > Open SQL Script** e selecione `banco/economizai.sql` dentro da pasta deste projeto. Com o script aberto, clique no ícone de raio (**Execute**) para criar o banco e as tabelas. Em uma instalação nova, execute também `banco/catalogo-inicial.sql` para importar o catálogo inicial. Não é necessário reimportar o catálogo de um banco que já possui os produtos.
5. Em [api/config.php](api/config.php), preencha o valor de `'senha'` com a senha do MySQL. O endereço, a porta e o nome do banco já estão configurados para `127.0.0.1`, `3306` e `economizai`.
6. No VS Code, abra `C:\php\php.ini`, procure `;extension=pdo_mysql` e remova o `;` do início da linha. Salve o arquivo. O driver já está disponível em `C:\php\ext` neste computador.
7. Depois de preencher a conexão e ativar o driver, abra um terminal nesta pasta e atualize o banco existente:

   ```powershell
   & C:\php\php.exe banco/atualizar-curtidas.php
   ```

   A atualização cria a tabela de curtidas e remove os campos antigos de descrição das ofertas e promoções. Ela pode ser executada novamente e preserva os produtos, preços, usuários e solicitações existentes. Em um banco criado antes da remoção dos limites de nome, execute também [banco/atualizar-nomes.sql](banco/atualizar-nomes.sql) no Workbench para ampliar os campos de nome dos usuários e dos logs.

8. Inicie o PHP:

   ```powershell
   & C:\php\php.exe -S localhost:8000
   ```

9. Abra `http://localhost:8000` no navegador. Mantenha esse terminal aberto enquanto usa o site.

Para confirmar que o driver PHP foi ativado, abra outro terminal e execute `& C:\php\php.exe -m`; a lista deve conter `pdo_mysql`. Se preferir, inicie o PHP sem editar o `php.ini` com `& C:\php\php.exe -d extension=pdo_mysql -S localhost:8000`.

O projeto também funciona com PHP 8.1 ou superior e MariaDB. As configurações `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` podem ser definidas como variáveis de ambiente. As páginas e o PHP precisam usar a mesma origem; abrir os arquivos com `file://` ou com Live Server não executa o PHP.

## Contas e login

O cadastro público cria apenas usuários comuns. O usuário master é inserido pelo script SQL:

| Dado de demonstração | Valor |
| --- | --- |
| Login | `master` |
| Senha | `Masteraa` |
| Nome materno | `Maria Administradora` |
| Nascimento | `01/01/1990` |
| CEP | `20040002` |

Esses dados também estão no script SQL e devem ser trocados antes de publicar o sistema.

Depois de informar login e senha, responda à pergunta sorteada sobre nome materno, nascimento ou CEP. A sessão autenticada é criada após a resposta correta. Três respostas incorretas exigem um novo login.

As senhas ficam no banco como hashes gerados por `password_hash()`. Contas, senhas e curtidas não são salvas no `localStorage`; as preferências visuais e os identificadores dos itens do carrinho ficam no navegador.

## Funcionalidades

- Catálogo e ofertas por mercado carregados da API e persistidos no MySQL, com destaque para o menor preço.
- Envio de promoções por usuários autenticados, com categoria e tipo de venda; envios comuns aguardam aprovação e envios do master são publicados diretamente.
- Aprovação de promoções, alteração de produtos e ofertas e exclusão de produtos pelo master.
- Curtidas de produtos publicados por usuários autenticados, com uma curtida por usuário e contagem persistida no MySQL.
- Cadastro com validação de CPF, CEP, dados pessoais e confirmação de senha.
- Login com sessão PHP, perguntas de verificação e logout.
- Perfis comum e master, com permissões conferidas pela API.
- Configurações de nome e foto; alteração da própria senha pelo menu da conta do usuário comum.
- Consulta de usuários comuns por trecho do nome e exclusão pelo master.
- Download da lista de usuários comuns em PDF, respeitando o filtro por nome, disponível ao master.
- Logs de autenticação por nome ou CPF, com data, hora e pergunta utilizada.
- Tela com imagem da modelagem do banco de dados.
- Controles de contraste e tamanho da fonte no menu de acessibilidade.

O catálogo publicado usa as tabelas `produtos` e `ofertas`. A tabela `promocoes` mantém as solicitações e seu histórico de aprovação; uma solicitação pendente não aparece no catálogo. `curtidas` relaciona cada usuário aos produtos que ele curtiu e permite recuperar a contagem e o estado da curtida após um novo login ou em outro navegador. O frontend recebe os produtos e preços pela API, e os dados iniciais ficam no script de importação do banco.

## Regras do cadastro

- Nome e nome materno obrigatórios, sem tamanho ou formato fixo.
- Login obrigatório, de 1 a 6 letras.
- Senha obrigatória, de até 8 caracteres, com confirmação idêntica no cadastro e na troca.
- CPF: 11 dígitos, com conferência dos dígitos verificadores.
- CEP: 8 dígitos, com consulta ao ViaCEP e preenchimento manual quando a consulta falhar.
- Telefone fixo: prefixo `(+55)`, DDD de 2 dígitos e número de 8 dígitos, por exemplo `(+55)21-33334444`. O celular também aceita 9 dígitos, como `(+55)21-999998888`.

O enunciado exemplifica telefones com 8 dígitos após o DDD; o celular também aceita 9 para permitir os números brasileiros atuais.

## Organização

```text
api/                       Conexão, validações e ações PHP
banco/economizai.sql        Tabelas e cadastro inicial do master
banco/catalogo-inicial.sql  Dados iniciais de produtos e ofertas
banco/atualizar-curtidas.sql Atualização idempotente das curtidas e remoção dos campos antigos
banco/atualizar-curtidas.php Executa a atualização preservando os produtos existentes
css/                       Estilos
docs/REQUISITOS.md         Requisitos, permissões e modelo conceitual
docs/modelo-bd.svg         Diagrama das tabelas
js/api.js                  Comunicação com a API e estado da sessão
js/auth.js                 Cadastro e login
js/2fa.js                  Pergunta de verificação
js/configuracoes.js        Alterações da própria conta
js/postar.js               Envio de promoções
js/promocoes-admin.js      Aprovação, edição e exclusão de produtos
api/catalogo.php           Catálogo, ofertas e permissões de moderação
js/components/             Cabeçalho e rodapé compartilhados
modelo-bd.html             Tela do diagrama
usuarios.html              Consulta de usuários comuns
logs.html                  Histórico de autenticação
promocoes.html             Moderação e gestão do catálogo pelo master
```

A API recebe as ações em `api/index.php?acao=...`. As consultas usam GET; alterações usam POST com JSON. O PHP valida os dados e o perfil antes de acessar o banco com consultas preparadas.

## Documentação acadêmica

[docs/REQUISITOS.md](docs/REQUISITOS.md) reúne os requisitos funcionais e não funcionais, a matriz de acesso e a descrição do MER/DER. Os registros reais de reuniões, decisões, integrantes e atividades devem ser acrescentados pela equipe antes de preparar o documento acadêmico solicitado no enunciado.

## Testes

Com o PHP e um banco de testes em execução, use Node.js 22 ou superior:

```bash
node testes/integracao.mjs http://127.0.0.1:8000
```

O teste utiliza a conta master de demonstração, cria um usuário temporário e verifica cadastro, 2FA, permissões, alteração de senha, logs e exclusão. A conta temporária é removida ao final; os logs são preservados, como no restante do sistema. O Node.js é necessário apenas para executar esse teste.
