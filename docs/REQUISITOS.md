# Requisitos do Economizai

O sistema divulga produtos e permite o cadastro de clientes. A implementação reaproveita o frontend do Economizai e acrescenta PHP, MySQL e sessões para atender ao projeto de Back-End.

## Requisitos funcionais

| Código | Requisito |
| --- | --- |
| RF01 | Exibir menu e produtos com nome, imagem, categoria, tipo de venda e preços na tela principal. |
| RF02 | Cadastrar usuários comuns com nome, nascimento, sexo, nome materno, CPF, e-mail, celular, telefone fixo, endereço, login e senha. |
| RF03 | Validar os campos obrigatórios, CPF, CEP, login, senha e confirmação antes de persistir os dados. |
| RF04 | Consultar o endereço pelo CEP e permitir preenchimento manual quando o serviço externo falhar. |
| RF05 | Validar login e senha no banco e iniciar a etapa de verificação adicional. |
| RF06 | Sortear uma pergunta sobre nome materno, nascimento ou CEP e validar a resposta conforme o cadastro. |
| RF07 | Encerrar a tentativa de autenticação após três respostas incorretas e solicitar um novo login. |
| RF08 | Criar a sessão autenticada somente depois da resposta correta. |
| RF09 | Exibir login, menu e logout em todas as telas após a autenticação. |
| RF10 | Criar o usuário master pelo script SQL e impedir a escolha desse perfil no cadastro público. |
| RF11 | Permitir ao master consultar usuários comuns por trecho do nome. |
| RF12 | Permitir ao master excluir usuários comuns, com confirmação na interface e atualização da lista. |
| RF13 | Permitir ao usuário comum alterar somente a própria senha. |
| RF14 | Mostrar logs de entrada dos usuários comuns, com nome, CPF, data, hora e pergunta utilizada, em ordem mais recente. |
| RF15 | Permitir ao master filtrar os logs por nome ou CPF, ou consultar todos. |
| RF16 | Exibir imagem da modelagem do banco para os dois perfis autenticados. |
| RF17 | Exibir mensagens de erro e sucesso sem usar `alert()`. |
| RF18 | Oferecer contraste e controles de aumento e diminuição da fonte. |
| RF19 | Permitir ao master baixar a lista de usuários comuns em PDF, respeitando o filtro por trecho do nome. |
| RF20 | Carregar o catálogo e os preços por mercado da API, com persistência de produtos e ofertas no MySQL. |
| RF21 | Permitir somente a usuários autenticados enviar uma promoção com categoria e tipo de venda; envios comuns aguardam aprovação e envios do master são publicados diretamente. |
| RF22 | Permitir ao master aprovar solicitações e editar ou excluir produtos e suas ofertas. |
| RF23 | Agrupar ofertas por produto e mercado, destacando o menor preço e comparando os preços dos mesmos itens disponíveis. |
| RF24 | Permitir que usuários autenticados curtam e descurtam produtos publicados, mantendo no MySQL uma curtida por usuário e produto e a contagem total. |

A exportação em PDF e os controles de acessibilidade implementam os desafios adicionais do enunciado.

## Requisitos não funcionais

| Código | Requisito |
| --- | --- |
| RNF01 | Backend em PHP e persistência em MySQL. |
| RNF02 | Interface responsiva com a identidade visual do Economizai. |
| RNF03 | Código simples, separado entre interface, comunicação, validações e banco. |
| RNF04 | Senhas armazenadas com hash; nunca persistir senhas no navegador. |
| RNF05 | Consultas SQL preparadas e validação de dados no servidor. |
| RNF06 | Controle de permissões no servidor por sessão e perfil. |
| RNF07 | Cookie de sessão HTTP-only, com SameSite e renovação do identificador na autenticação. |
| RNF08 | Manter os registros históricos de autenticação após a exclusão de um usuário. |

## Matriz de acesso

| Recurso | Visitante | Comum | Master |
| --- | --- | --- | --- |
| Página principal e catálogo publicado | Sim | Sim | Sim |
| Enviar promoção | — | Sim, com aprovação | Sim, publicação direta |
| Curtir e descurtir produto publicado | — | Sim | Sim |
| Ver contagem de curtidas | Sim | Sim | Sim |
| Aprovar promoções e editar/excluir produtos | — | — | Sim |
| Cadastro público de usuário comum | Sim | Sim | Sim |
| Login e etapa de verificação | Sim | Sim | Sim |
| Logout | — | Sim | Sim |
| Próprios nome e foto | — | Sim | Sim |
| Alterar a própria senha | — | Sim | — |
| Consultar e excluir usuários comuns | — | — | Sim |
| Baixar lista de usuários em PDF | — | — | Sim |
| Consultar logs de autenticação | — | — | Sim |
| Modelo do banco | — | Sim | Sim |
| Acessibilidade | Sim | Sim | Sim |

O formulário de cadastro sempre cria uma conta comum, independentemente de quem abriu a página. O perfil master não é uma opção do formulário.

## Regras dos dados

O nome e o nome materno são obrigatórios e aceitam comprimentos e caracteres variados. O login tem de 1 a 6 letras. A senha é obrigatória, tem até 8 caracteres e exige confirmação idêntica no cadastro e na troca. O CPF precisa ter os dígitos verificadores corretos. O nascimento deve representar uma data válida e anterior ou igual ao dia atual. E-mail, sexo e endereço completo são obrigatórios.

O CEP aceita 8 dígitos, com ou sem a máscara na interface. A busca externa preenche logradouro, bairro, cidade e estado; número e complemento são informados pelo usuário. A falha de conexão permite completar o endereço manualmente.

Os telefones usam `(+55)XX-XXXXXXXX`. A implementação também permite 9 dígitos após o DDD para celulares. Essa é uma adaptação deliberada do exemplo do enunciado.

## MER — modelo conceitual

**Usuário:** pessoa cadastrada no sistema, com dados de identificação, contato, endereço e credenciais. O atributo `perfil` distingue comum de master. Nome materno, data de nascimento e CEP também são usados nas perguntas de verificação.

**Log de autenticação:** registro de uma entrada concluída, contendo data e hora, fator utilizado e uma cópia do nome e CPF do usuário naquele momento. O registro preserva o histórico mesmo quando a conta é excluída.

**Produto:** item do catálogo, identificado pelo nome normalizado e categoria, com tipo de venda, imagem e selo. Produtos e ofertas são a fonte única do catálogo exibido no frontend.

**Oferta:** preço e dados de compra de um produto em um mercado. A combinação de produto e nome normalizado do mercado é única. O mesmo produto pode possuir várias ofertas, usadas para destacar o menor preço e comparar os mercados.

**Promoção:** solicitação enviada por um usuário, com cópia dos dados propostos, status de aprovação, autor, revisor e referência opcional ao produto publicado. O usuário comum envia uma solicitação pendente; o master aprova ou publica diretamente. A aprovação cria ou atualiza o produto e a oferta do mercado correspondente.

**Curtida:** vínculo entre um usuário e um produto publicado, com a data de criação. A chave composta por usuário e produto impede curtidas duplicadas. Ao descurtir, esse vínculo é removido; a contagem corresponde aos vínculos existentes no banco.

**Migração:** registro de uma importação já aplicada. Impede que uma nova execução da migração recrie os itens migrados ou produtos posteriormente excluídos.

**Relacionamentos:** um usuário pode possuir vários logs, enviar várias promoções e revisar várias solicitações. Um produto pode possuir várias ofertas e ser referenciado por várias promoções. Usuários e produtos possuem uma relação muitos para muitos por meio de `curtidas`. Excluir um produto remove suas ofertas e curtidas (`CASCADE`) e deixa a referência das solicitações nula (`SET NULL`). Excluir uma conta remove suas próprias solicitações de promoção e curtidas, mantém os logs históricos e deixa nulas as referências ao revisor.

## DER — modelo físico

O diagrama de tabelas está em [modelo-bd.svg](modelo-bd.svg) e pode ser visto na tela [modelo-bd.html](../modelo-bd.html). A criação das tabelas e o cadastro inicial do master estão em [banco/economizai.sql](../banco/economizai.sql).

As tabelas `produtos` e `ofertas` armazenam o catálogo publicado. `promocoes` registra as solicitações e seu histórico, `curtidas` mantém a interação dos usuários com os produtos e `migracoes` preserva o registro da importação inicial. O mercado permanece como atributo da oferta, sem uma tabela separada. As restrições únicas são `(chave_nome, categoria)` em produtos e `(produto_id, chave_mercado)` em ofertas. A chave primária de `curtidas` é `(usuario_id, produto_id)`, com índice por `produto_id` para a contagem das curtidas.

Após configurar o banco existente, execute `php banco/atualizar-curtidas.php`. A atualização cria a tabela de curtidas e remove os antigos campos de descrição de ofertas e promoções, preservando os demais dados. Pode ser executada novamente. Para um banco novo, os produtos iniciais podem ser importados por `banco/catalogo-inicial.sql` depois da criação das tabelas.

## Roteiro de validação

1. Importar o banco e iniciar o PHP.
2. Cadastrar um usuário comum com dados válidos e verificar a rejeição de CPF, login e senha inválidos.
3. Entrar com senha incorreta e conferir o feedback; depois entrar com credenciais corretas e concluir a pergunta sorteada.
4. Errar a pergunta três vezes, conferir a mensagem e verificar que é necessário informar as credenciais novamente.
5. Conferir login, logout, contraste e tamanho da fonte em desktop e celular.
6. Alterar a própria senha como comum e validar o novo login.
7. Entrar como master, pesquisar nomes por substring, confirmar uma exclusão e verificar a atualização da lista.
8. Filtrar logs por nome, CPF e todos; conferir data, hora, pergunta e ordem decrescente.
9. Tentar as ações administrativas como comum e conferir o bloqueio pelo servidor.
10. Abrir o modelo do banco com ambos os perfis e comparar com o script SQL.
11. Baixar a lista em PDF como master e conferir se ela respeita o filtro por nome.
12. Executar a atualização do banco duas vezes e conferir que produtos e ofertas existentes foram preservados e que a tabela de curtidas foi criada sem campos antigos de descrição nas ofertas ou promoções.
13. Enviar uma promoção como comum, verificar que não aparece no catálogo antes da aprovação e aprová-la como master.
14. Editar produto e oferta como master, verificar os novos dados no catálogo, na busca e na comparação; excluir um produto e conferir a remoção de suas ofertas.
15. Tentar aprovar, editar e excluir produtos como visitante e como comum e conferir o bloqueio pela API.
16. Curtir um produto como comum, conferir o aumento da contagem e verificar que uma segunda curtida do mesmo usuário não cria um registro duplicado.
17. Recarregar a página, sair e entrar novamente; conferir que a curtida e a contagem permanecem no banco. Descurtir e conferir a redução da contagem.
18. Curtir com dois usuários diferentes e verificar a contagem conjunta; tentar curtir sem sessão e conferir a exigência de login.

## Registros da equipe

Este arquivo é a base técnica para o documento acadêmico. Antes da entrega, a equipe deve acrescentar os próprios dados e registros reais:

- Número do grupo e nomes dos integrantes.
- Atividades realizadas por cada integrante.
- Datas, participantes e decisões de cada reunião.
- Evidências dos testes em desktop e celular.
- Documento final no formato e com o nome solicitados pela disciplina.

Essas informações não foram inventadas ou preenchidas automaticamente.
