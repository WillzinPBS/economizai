<?php
function listarCurtidasCatalogo(int $usuarioId = 0): array
{
    $linhas = consultar('SELECT p.id AS produtoId, COUNT(c.usuario_id) AS total,
        COALESCE(MAX(c.usuario_id = ?), 0) AS curtido
        FROM produtos p LEFT JOIN curtidas c ON c.produto_id = p.id
        GROUP BY p.id ORDER BY p.id', [$usuarioId])->fetchAll();
    return array_map(static fn($linha) => [
        'produtoId' => (int) $linha['produtoId'],
        'total' => (int) $linha['total'],
        'curtido' => (bool) $linha['curtido'],
    ], $linhas);
}

function tratarCurtidas(string $acao, array $dados): void
{
    if ($acao === 'curtidas') {
        $usuario = usuarioAtual(false);
        responder(['curtidas' => listarCurtidasCatalogo((int) ($usuario['id'] ?? 0))]);
    }
    if ($acao !== 'curtir-produto') return;

    $usuario = usuarioAtual();
    $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id || !isset($dados['curtido']) || !is_bool($dados['curtido'])) {
        falhar('Informe um produto válido e o estado da curtida.');
    }
    banco()->beginTransaction();
    if (!consultar('SELECT id FROM produtos WHERE id = ? FOR UPDATE', [$id])->fetch()) {
        banco()->rollBack();
        falhar('Produto não encontrado.', 404);
    }
    if ($dados['curtido']) {
        consultar('INSERT INTO curtidas (usuario_id, produto_id) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE usuario_id = usuario_id', [$usuario['id'], $id]);
    } else {
        consultar('DELETE FROM curtidas WHERE usuario_id = ? AND produto_id = ?', [$usuario['id'], $id]);
    }
    $estado = consultar('SELECT COUNT(*) AS total, COALESCE(MAX(usuario_id = ?), 0) AS curtido
        FROM curtidas WHERE produto_id = ?', [$usuario['id'], $id])->fetch();
    banco()->commit();
    responder(['produtoId' => (int) $id, 'total' => (int) $estado['total'], 'curtido' => (bool) $estado['curtido']]);
}
