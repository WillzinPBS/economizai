<?php

function responder(array $dados, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function falhar(string $mensagem, int $status = 400, array $extras = []): never
{
    responder(['mensagem' => $mensagem] + $extras, $status);
}

function banco(): PDO
{
    static $conexao;
    if (!$conexao) {
        $config = require __DIR__ . '/config.php';
        $dsn = "mysql:host={$config['host']};port={$config['porta']};dbname={$config['banco']};charset=utf8mb4";
        $conexao = new PDO($dsn, $config['usuario'], $config['senha'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $conexao;
}

function consultar(string $sql, array $parametros = []): PDOStatement
{
    $consulta = banco()->prepare($sql);
    $consulta->execute($parametros);
    return $consulta;
}

function texto(array $dados, string $campo): string
{
    return isset($dados[$campo]) && is_string($dados[$campo]) ? trim($dados[$campo]) : '';
}

function digitos(string $valor): string
{
    return preg_replace('/\D/', '', $valor);
}

function normalizar(string $valor): string
{
    $valor = strtr($valor, [
        'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'ä' => 'a',
        'Á' => 'a', 'À' => 'a', 'Ã' => 'a', 'Â' => 'a', 'Ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'É' => 'e', 'È' => 'e', 'Ê' => 'e', 'Ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'Í' => 'i', 'Ì' => 'i', 'Î' => 'i', 'Ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'õ' => 'o', 'ô' => 'o', 'ö' => 'o',
        'Ó' => 'o', 'Ò' => 'o', 'Õ' => 'o', 'Ô' => 'o', 'Ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'Ú' => 'u', 'Ù' => 'u', 'Û' => 'u', 'Ü' => 'u', 'ç' => 'c', 'Ç' => 'c',
    ]);
    return strtolower(preg_replace('/\s+/u', ' ', trim($valor)));
}

function nomeValido(string $nome): bool
{
    return preg_match('/^[\p{L} ]{15,80}$/u', $nome) === 1;
}

function senhaValida(string $senha): bool
{
    return preg_match('/^[a-zA-Z]{8}$/', $senha) === 1;
}

function cpfValido(string $cpf): bool
{
    if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
        return false;
    }
    for ($tamanho = 9; $tamanho <= 10; $tamanho++) {
        $soma = 0;
        for ($i = 0; $i < $tamanho; $i++) {
            $soma += (int) $cpf[$i] * ($tamanho + 1 - $i);
        }
        $digito = (10 * $soma) % 11;
        if (($digito === 10 ? 0 : $digito) !== (int) $cpf[$tamanho]) {
            return false;
        }
    }
    return true;
}

function usuarioPublico(array $usuario): array
{
    return [
        'id' => (int) $usuario['id'],
        'nome' => $usuario['nome'],
        'login' => $usuario['login'],
        'perfil' => $usuario['perfil'],
        'foto' => $usuario['foto'],
    ];
}

function usuarioAtual(bool $obrigatorio = true): ?array
{
    $usuario = null;
    if (isset($_SESSION['usuario_id'])) {
        // Confere o banco em cada acesso para invalidar contas excluídas e sessões antigas.
        $usuario = consultar('SELECT * FROM usuarios WHERE id = ?', [$_SESSION['usuario_id']])->fetch();
        if (!$usuario || (int) $usuario['versao_sessao'] !== (int) ($_SESSION['versao_sessao'] ?? -1)) {
            $_SESSION = [];
            $usuario = null;
        }
    }
    if (!$usuario && $obrigatorio) {
        falhar('Faça login para continuar.', 401, ['redirecionar' => 'login.html']);
    }
    return $usuario ?: null;
}

function exigirMaster(): array
{
    $usuario = usuarioAtual();
    if ($usuario['perfil'] !== 'master') {
        falhar('Somente o usuário master pode acessar esta função.', 403);
    }
    return $usuario;
}

function desafioAtual(): array
{
    if (!isset($_SESSION['pendente_id'])) {
        falhar('Entre com login e senha para responder à verificação.', 401, ['redirecionar' => 'login.html']);
    }
    if (time() - ($_SESSION['pendente_inicio'] ?? 0) > 300) {
        $_SESSION = [];
        falhar('Entre com login e senha para responder à verificação.', 401, ['redirecionar' => 'login.html']);
    }
    $usuario = consultar('SELECT * FROM usuarios WHERE id = ?', [$_SESSION['pendente_id']])->fetch();
    if (!$usuario) {
        $_SESSION = [];
        falhar('Usuário não encontrado. Faça login novamente.', 401, ['redirecionar' => 'login.html']);
    }
    return $usuario;
}

function perguntas(): array
{
    return [
        'nomeMaterno' => 'Qual o nome da sua mãe?',
        'dataNascimento' => 'Qual a data do seu nascimento?',
        'cep' => 'Qual o CEP do seu endereço?',
    ];
}

function validarCadastro(array $dados): array
{
    $campos = ['nome', 'dataNascimento', 'sexo', 'nomeMaterno', 'cpf', 'email',
        'telefoneCelular', 'telefoneFixo', 'cep', 'logradouro', 'numero', 'bairro',
        'cidade', 'estado', 'endereco', 'login', 'senha', 'confirmaSenha'];
    $usuario = [];
    foreach ($campos as $campo) {
        $usuario[$campo] = texto($dados, $campo);
        if ($usuario[$campo] === '') {
            falhar('Preencha todos os campos obrigatórios.');
        }
    }
    $usuario['complemento'] = texto($dados, 'complemento');
    if (!nomeValido($usuario['nome'])) {
        falhar('O nome deve ter entre 15 e 80 letras e espaços.');
    }
    if (!preg_match('/^[\p{L} ]{2,80}$/u', $usuario['nomeMaterno'])) {
        falhar('Informe um nome materno válido, com até 80 letras.');
    }
    $data = DateTimeImmutable::createFromFormat('!Y-m-d', $usuario['dataNascimento']);
    if (!$data || $data->format('Y-m-d') !== $usuario['dataNascimento'] || $data > new DateTimeImmutable('today')) {
        falhar('Informe uma data de nascimento válida.');
    }
    if (!in_array($usuario['sexo'], ['masculino', 'feminino', 'outro', 'nao_informar', 'M', 'F', 'O', 'N'], true)) {
        falhar('Selecione uma opção de sexo válida.');
    }
    $usuario['cpf'] = digitos($usuario['cpf']);
    if (!cpfValido($usuario['cpf'])) {
        falhar('O CPF informado é inválido.');
    }
    if (!filter_var($usuario['email'], FILTER_VALIDATE_EMAIL) || strlen($usuario['email']) > 160) {
        falhar('Informe um e-mail válido.');
    }
    // Números de celular brasileiros podem ter 9 dígitos, além dos 2 do DDD.
    if (!preg_match('/^\(\+55\)\d{2}-\d{8,9}$/', $usuario['telefoneCelular']) ||
        !preg_match('/^\(\+55\)\d{2}-\d{8}$/', $usuario['telefoneFixo'])) {
        falhar('Use (+55)XX-XXXXXXXX nos telefones; celular também aceita 9 dígitos.');
    }
    if (!preg_match('/^\d{5}-?\d{3}$/', $usuario['cep'])) {
        falhar('Informe um CEP com 8 dígitos.');
    }
    $usuario['cep'] = digitos($usuario['cep']);
    if (!preg_match('/^[a-zA-Z]{6}$/', $usuario['login'])) {
        falhar('O login deve ter exatamente 6 letras.');
    }
    $usuario['login'] = strtolower($usuario['login']);
    if (!senhaValida($usuario['senha'])) {
        falhar('A senha deve ter exatamente 8 letras.');
    }
    if ($usuario['senha'] !== $usuario['confirmaSenha']) {
        falhar('A confirmação deve ser igual à senha.');
    }
    foreach (['logradouro' => 160, 'numero' => 20, 'complemento' => 100, 'bairro' => 100,
        'cidade' => 100, 'endereco' => 600] as $campo => $limite) {
        if (strlen($usuario[$campo]) > $limite) {
            falhar('O campo ' . $campo . ' ultrapassou o tamanho permitido.');
        }
    }
    $usuario['estado'] = strtoupper($usuario['estado']);
    $estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
        'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    if (!in_array($usuario['estado'], $estados, true)) {
        falhar('Informe uma sigla de estado válida.');
    }
    return $usuario;
}
