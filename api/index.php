<?php
declare(strict_types=1);

require __DIR__ . '/funcoes.php';
require __DIR__ . '/catalogo.php';
require __DIR__ . '/curtidas.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('America/Sao_Paulo');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('economizai_sessao');
session_set_cookie_params([
    'httponly' => true,
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
    'path' => '/',
]);
session_start();

try {
    $acao = $_GET['acao'] ?? 'sessao';
    $metodo = $_SERVER['REQUEST_METHOD'];
    $leituras = ['sessao', 'desafio', 'usuarios', 'logs', 'promocoes', 'produtos', 'catalogo-opcoes', 'curtidas'];
    $escritas = ['cadastro', 'login', '2fa', 'logout', 'excluir-usuario', 'senha', 'perfil', 'postar', 'aprovar-promocao', 'rejeitar-promocao', 'editar-produto', 'excluir-produto', 'curtir-produto'];
    if (!in_array($acao, array_merge($leituras, $escritas), true)) {
        falhar('Função não encontrada.', 404);
    }
    $esperado = in_array($acao, $leituras, true) ? 'GET' : 'POST';
    if ($metodo !== $esperado) {
        header('Allow: ' . $esperado);
        falhar('Método HTTP não permitido.', 405);
    }
    $dados = [];
    if ($metodo === 'POST') {
        // Rejeita formulários de outros sites e requisições JSON de outra origem.
        $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
        $origemEsperada = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'];
        if (($origem !== '' && $origem !== $origemEsperada) ||
            ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
            falhar('A origem desta requisição não é permitida.', 403);
        }
        if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
            falhar('Envie os dados no formato JSON.', 415);
        }
        $corpo = file_get_contents('php://input', false, null, 0, 2097153);
        if (strlen($corpo) > 2097152) {
            falhar('O envio ultrapassou o tamanho permitido.', 413);
        }
        $dados = json_decode($corpo, true);
        if (!is_array($dados) || json_last_error() !== JSON_ERROR_NONE) {
            falhar('Os dados enviados são inválidos.');
        }
    }

    if ($acao === 'sessao') {
        $usuario = usuarioAtual(false);
        responder(['usuario' => $usuario ? usuarioPublico($usuario) : null]);
    }

    if ($acao === 'cadastro') {
        $usuario = validarCadastro($dados);
        $existe = consultar('SELECT id FROM usuarios WHERE login = ? OR cpf = ? OR email = ?',
            [$usuario['login'], $usuario['cpf'], $usuario['email']])->fetch();
        if ($existe) {
            falhar('Login, CPF ou e-mail já cadastrado.', 409);
        }
        consultar('INSERT INTO usuarios
            (nome, data_nascimento, sexo, nome_materno, cpf, email, telefone_celular,
            telefone_fixo, cep, logradouro, numero, complemento, bairro, cidade, estado,
            endereco, login, senha, perfil)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            $usuario['nome'], $usuario['dataNascimento'], $usuario['sexo'], $usuario['nomeMaterno'],
            $usuario['cpf'], $usuario['email'], $usuario['telefoneCelular'], $usuario['telefoneFixo'],
            $usuario['cep'], $usuario['logradouro'], $usuario['numero'], $usuario['complemento'],
            $usuario['bairro'], $usuario['cidade'], $usuario['estado'], $usuario['endereco'],
            $usuario['login'], gerarHashSenha($usuario['senha']), 'comum',
        ]);
        responder(['mensagem' => 'Cadastro realizado. Entre com seu login e senha.', 'redirecionar' => 'login.html'], 201);
    }

    if ($acao === 'login') {
        $_SESSION = [];
        session_regenerate_id(true);
        $login = strtolower(texto($dados, 'login'));
        $senha = textoOriginal($dados, 'senha');
        if ($login === '' || $senha === '') {
            falhar('Preencha o login e a senha.');
        }
        $usuario = consultar('SELECT * FROM usuarios WHERE login = ?', [$login])->fetch();
        if (!$usuario || !verificarSenha($senha, $usuario['senha'])) {
            falhar('Login ou senha inválidos.', 401);
        }
        $tipos = array_keys(perguntas());
        $_SESSION['pendente_id'] = (int) $usuario['id'];
        $_SESSION['pendente_inicio'] = time();
        $_SESSION['pergunta'] = $tipos[random_int(0, count($tipos) - 1)];
        $_SESSION['tentativas'] = 0;
        responder(['mensagem' => 'Responda à pergunta para concluir o login.', 'redirecionar' => '2fa.html']);
    }

    if ($acao === 'desafio') {
        desafioAtual();
        $tipo = $_SESSION['pergunta'];
        responder(['pergunta' => perguntas()[$tipo], 'tipo' => $tipo, 'restantes' => 3 - $_SESSION['tentativas']]);
    }

    if ($acao === '2fa') {
        $usuario = desafioAtual();
        $resposta = texto($dados, 'resposta');
        if ($resposta === '') {
            falhar('Preencha a resposta.');
        }
        $tipo = $_SESSION['pergunta'];
        $correta = false;
        if ($tipo === 'nomeMaterno') {
            $correta = normalizar($resposta) === normalizar($usuario['nome_materno']);
        } elseif ($tipo === 'cep') {
            $correta = digitos($resposta) === $usuario['cep'];
        } else {
            if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $resposta, $partes)) {
                $resposta = $partes[3] . '-' . $partes[2] . '-' . $partes[1];
            }
            $correta = $resposta === $usuario['data_nascimento'];
        }
        if (!$correta) {
            $_SESSION['tentativas']++;
            if ($_SESSION['tentativas'] >= 3) {
                $_SESSION = [];
                session_regenerate_id(true);
                falhar('3 tentativas sem sucesso! Favor realizar Login novamente.', 401, ['redirecionar' => 'login.html', 'restantes' => 0]);
            }
            falhar('Resposta incorreta. Tente novamente.', 400, ['restantes' => 3 - $_SESSION['tentativas']]);
        }
        consultar('INSERT INTO logs_autenticacao (usuario_id, nome, cpf, perfil, fator, data_hora) VALUES (?, ?, ?, ?, ?, ?)',
            [$usuario['id'], $usuario['nome'], $usuario['cpf'], $usuario['perfil'], perguntas()[$tipo], date('Y-m-d H:i:s')]);
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = (int) $usuario['id'];
        $_SESSION['versao_sessao'] = (int) $usuario['versao_sessao'];
        responder(['mensagem' => 'Login realizado.', 'usuario' => usuarioPublico($usuario), 'redirecionar' => 'index.html']);
    }

    if ($acao === 'logout') {
        $_SESSION = [];
        $cookie = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $cookie['path'],
            'secure' => $cookie['secure'], 'httponly' => true, 'samesite' => 'Lax']);
        session_destroy();
        responder(['mensagem' => 'Você saiu da conta.']);
    }

    tratarCurtidas($acao, $dados);
    tratarCatalogo($acao, $dados);

    if ($acao === 'usuarios') {
        exigirMaster();
        $busca = texto($_GET, 'busca');
        // LOCATE trata %, _ e outros símbolos como texto, sem curingas de LIKE.
        $usuarios = consultar("SELECT id, nome, login, cpf, email FROM usuarios
            WHERE perfil = 'comum' AND LOCATE(?, nome) > 0 ORDER BY nome", [$busca])->fetchAll();
        foreach ($usuarios as &$usuario) {
            $usuario['id'] = (int) $usuario['id'];
        }
        responder(['usuarios' => $usuarios]);
    }

    if ($acao === 'excluir-usuario') {
        exigirMaster();
        $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            falhar('Selecione um usuário válido.');
        }
        $consulta = consultar("DELETE FROM usuarios WHERE id = ? AND perfil = 'comum'", [$id]);
        if (!$consulta->rowCount()) {
            falhar('Usuário comum não encontrado.', 404);
        }
        responder(['mensagem' => 'Usuário excluído.']);
    }

    if ($acao === 'logs') {
        exigirMaster();
        $busca = texto($_GET, 'busca');
        $cpf = digitos($busca);
        $logs = consultar("SELECT id, data_hora, nome, cpf, fator FROM logs_autenticacao
            WHERE perfil = 'comum' AND (LOCATE(?, nome) > 0 OR (? <> '' AND LOCATE(?, cpf) > 0))
            ORDER BY data_hora DESC, id DESC", [$busca, $cpf, $cpf])->fetchAll();
        foreach ($logs as &$log) {
            $log['id'] = (int) $log['id'];
            $log['dataHora'] = (new DateTimeImmutable($log['data_hora']))->format(DateTimeInterface::ATOM);
            unset($log['data_hora']);
        }
        responder(['logs' => $logs]);
    }

    if ($acao === 'senha') {
        $usuario = usuarioAtual();
        if ($usuario['perfil'] !== 'comum') {
            falhar('Somente o usuário comum pode alterar a própria senha.', 403);
        }
        $atual = textoOriginal($dados, 'senhaAtual');
        $nova = textoOriginal($dados, 'novaSenha');
        if (!verificarSenha($atual, $usuario['senha'])) {
            falhar('A senha atual está incorreta.');
        }
        if ($nova === '') {
            falhar('Informe a nova senha.');
        }
        if ($nova !== textoOriginal($dados, 'confirmaSenha')) {
            falhar('A confirmação deve ser igual à nova senha.');
        }
        if ($atual === $nova) {
            falhar('A nova senha deve ser diferente da atual.');
        }
        consultar('UPDATE usuarios SET senha = ?, versao_sessao = versao_sessao + 1 WHERE id = ?',
            [gerarHashSenha($nova), $usuario['id']]);
        $_SESSION['versao_sessao'] = (int) $usuario['versao_sessao'] + 1;
        responder(['mensagem' => 'Senha alterada com sucesso.']);
    }

    if ($acao === 'perfil') {
        $usuario = usuarioAtual();
        $nome = array_key_exists('nome', $dados) ? texto($dados, 'nome') : $usuario['nome'];
        if (!nomeValido($nome)) {
            falhar('Informe seu nome.');
        }
        $foto = $usuario['foto'];
        if (array_key_exists('foto', $dados)) {
            $foto = texto($dados, 'foto');
            if ($foto !== '') {
                if (!preg_match('#^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $foto, $partes)) {
                    falhar('Envie uma foto PNG, JPG ou WebP.');
                }
                $bytes = base64_decode($partes[2], true);
                $imagem = $bytes === false ? false : @getimagesizefromstring($bytes);
                if (!$imagem || strlen($bytes) > 1048576 || $imagem[0] > 2048 || $imagem[1] > 2048 ||
                    !in_array($imagem['mime'], ['image/png', 'image/jpeg', 'image/webp'], true)) {
                    falhar('A foto deve ser uma imagem de até 1 MB e 2048 pixels.');
                }
            }
            $foto = $foto === '' ? null : $foto;
        }
        consultar('UPDATE usuarios SET nome = ?, foto = ? WHERE id = ?', [$nome, $foto, $usuario['id']]);
        $usuario['nome'] = $nome;
        $usuario['foto'] = $foto;
        responder(['mensagem' => 'Perfil atualizado.', 'usuario' => usuarioPublico($usuario)]);
    }
} catch (PDOException $erro) {
    error_log('Economizai: ' . $erro->getMessage());
    if ($erro->getCode() === '23000') {
        falhar('Login, CPF ou e-mail já cadastrado.', 409);
    }
    falhar('Não foi possível acessar o banco de dados. Confira a configuração do servidor.', 503);
} catch (Throwable $erro) {
    error_log('Economizai: ' . $erro->getMessage());
    falhar('Ocorreu um erro inesperado. Tente novamente.', 500);
}
