<?php
// Produtos publicados e preços por mercado são mantidos no MySQL.
function categoriasCatalogo(): array
{
    return ['Bebidas', 'Alimentos Básicos', 'Laticínios', 'Limpeza', 'Massas', 'Mercearia', 'Carnes'];
}

function tiposCatalogo(): array
{
    return ['unidade', 'quilo', 'grama', 'litro', 'mililitro', 'pacote', 'caixa', 'dúzia'];
}

function imagemCatalogo(string $imagem, bool $permitirUrl = false): string
{
    if ($permitirUrl && (preg_match('#^https?://#i', $imagem) || preg_match('#^img/[a-z0-9._/-]+$#i', $imagem))) {
        return $imagem;
    }
    if (!preg_match('#^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $imagem, $partes)) {
        falhar('Envie uma foto PNG, JPG ou WebP.');
    }
    $bytes = base64_decode($partes[2], true);
    $info = $bytes === false ? false : @getimagesizefromstring($bytes);
    if (!$info || strlen($bytes) > 1048576 || $info[0] > 2048 || $info[1] > 2048 ||
        !in_array($info['mime'], ['image/png', 'image/jpeg', 'image/webp'], true)) {
        falhar('A foto deve ter até 1 MB e 2048 pixels.');
    }
    return $imagem;
}

function validarProdutoCatalogo(array $dados): array
{
    $nome = texto($dados, 'nome');
    $categoria = texto($dados, 'categoria');
    $tipo = texto($dados, 'tipo');
    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 120 || !in_array($categoria, categoriasCatalogo(), true) ||
        !in_array($tipo, tiposCatalogo(), true)) {
        falhar('Confira o nome, a categoria e o tipo de venda.');
    }
    return ['nome' => $nome, 'categoria' => $categoria, 'tipo' => $tipo];
}

function validarOfertaCatalogo(array $dados, bool $postagem = false): array
{
    $mercado = texto($dados, 'mercado');
    $preco = filter_var($dados['preco'] ?? null, FILTER_VALIDATE_FLOAT);
    $link = texto($dados, 'link');
    $cupom = texto($dados, 'cupom');
    if ($mercado === '' || mb_strlen($mercado) > 100 || $preco === false || !is_finite($preco) ||
        $preco < 0.01 || $preco > 99999999.99 || mb_strlen($link) > 2048 || mb_strlen($cupom) > 60 ||
        ($postagem && $link === '') ||
        ($link !== '' && (!filter_var($link, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $link)))) {
        falhar('Confira o mercado, preço, link e cupom.');
    }
    return ['mercado' => $mercado, 'preco' => round($preco, 2), 'link' => $link, 'cupom' => $cupom];
}

function gravarOfertaCatalogo(int $produtoId, array $oferta, bool $preservar = false): void
{
    $sql = 'INSERT INTO ofertas (produto_id, mercado, chave_mercado, preco, link, cupom) VALUES (?, ?, ?, ?, ?, ?)';
    $sql .= $preservar ? ' ON DUPLICATE KEY UPDATE id = id' :
        ' ON DUPLICATE KEY UPDATE mercado = VALUES(mercado), preco = VALUES(preco), link = VALUES(link), cupom = VALUES(cupom)';
    consultar($sql, [$produtoId, $oferta['mercado'], normalizar($oferta['mercado']), $oferta['preco'],
        $oferta['link'] ?? '', $oferta['cupom'] ?? '']);
}

function publicarPromocao(array $item, ?int $idPreferido = null, bool $preservar = false): int
{
    $produto = consultar('SELECT id, tipo FROM produtos WHERE chave_nome = ? AND categoria = ? FOR UPDATE',
        [normalizar($item['nome']), $item['categoria']])->fetch();
    if ($produto) {
        if (!$preservar && $produto['tipo'] !== $item['tipo']) {
            falhar('Este produto já existe com venda por ' . $produto['tipo'] . '. Use o mesmo tipo para comparar os preços.', 409);
        }
        $id = (int) $produto['id'];
    } else {
        consultar('INSERT INTO produtos (id, nome, chave_nome, categoria, tipo, imagem, selo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$idPreferido, $item['nome'], normalizar($item['nome']), $item['categoria'], $item['tipo'], $item['imagem'], $item['selo'] ?? 'seloMenorPreco']);
        $id = (int) banco()->lastInsertId();
    }
    gravarOfertaCatalogo($id, $item, $preservar);
    return $id;
}

function listarProdutosCatalogo(bool $administracao = false): array
{
    $usuario = usuarioAtual(false);
    $curtidas = array_column(listarCurtidasCatalogo((int) ($usuario['id'] ?? 0)), null, 'produtoId');
    $produtos = consultar('SELECT id, nome, categoria, tipo, imagem, selo FROM produtos ORDER BY id')->fetchAll();
    $ofertas = consultar('SELECT id, produto_id, mercado, preco, link, cupom FROM ofertas ORDER BY preco, id')->fetchAll();
    $porProduto = [];
    foreach ($ofertas as $oferta) {
        $oferta['id'] = (int) $oferta['id'];
        $porProduto[$oferta['produto_id']][] = $oferta;
    }
    $resultado = [];
    foreach ($produtos as $produto) {
        $produto['id'] = (int) $produto['id'];
        $precos = $porProduto[$produto['id']] ?? [];
        if (!$precos) continue;
        if ($administracao) {
            $produto['ofertas'] = $precos;
        } else {
            $produto['totalCurtidas'] = $curtidas[$produto['id']]['total'] ?? 0;
            $produto['curtido'] = $curtidas[$produto['id']]['curtido'] ?? false;
            $melhor = $precos[0];
            $produto['tipo'] = 'por ' . $produto['tipo'];
            $produto['preco'] = 'R$ ' . number_format((float) $melhor['preco'], 2, ',', '.');
            $produto['mercado'] = $melhor['mercado'];
            $produto['menorPreco'] = true;
            $produto['link'] = $melhor['link'];
            $produto['cupom'] = $melhor['cupom'];
            $produto['outrosMercados'] = array_map(static fn($oferta) => [
                'nome' => $oferta['mercado'], 'preco' => 'R$ ' . number_format((float) $oferta['preco'], 2, ',', '.'),
            ], array_slice($precos, 1));
        }
        $resultado[] = $produto;
    }
    return $resultado;
}

function tratarCatalogo(string $acao, array $dados): void
{
    if ($acao === 'catalogo-opcoes') responder(['categorias' => categoriasCatalogo(), 'tipos' => tiposCatalogo()]);
    if ($acao === 'produtos') responder(['produtos' => listarProdutosCatalogo()]);
    if ($acao === 'promocoes') {
        exigirMaster();
        responder(['produtos' => listarProdutosCatalogo(true), 'pendentes' => consultar("SELECT * FROM promocoes WHERE status = 'pendente' ORDER BY criado_em, id")->fetchAll()]);
    }
    if ($acao === 'postar') {
        $usuario = usuarioAtual();
        $item = validarProdutoCatalogo($dados) + validarOfertaCatalogo($dados, true);
        $item['imagem'] = imagemCatalogo(texto($dados, 'imagem'));
        $existente = consultar('SELECT categoria, tipo FROM produtos WHERE chave_nome = ? AND categoria = ?', [normalizar($item['nome']), $item['categoria']])->fetch();
        if ($existente && $existente['tipo'] !== $item['tipo']) falhar('O tipo de venda deve ser ' . $existente['tipo'] . ', como no produto existente.', 409);
        $master = $usuario['perfil'] === 'master';
        banco()->beginTransaction();
        $produtoId = $master ? publicarPromocao($item) : null;
        consultar('INSERT INTO promocoes (usuario_id, produto_id, nome, categoria, tipo, mercado, imagem, preco, link, cupom, status, revisado_por, revisado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$usuario['id'], $produtoId, $item['nome'], $item['categoria'], $item['tipo'], $item['mercado'], $item['imagem'], $item['preco'],
                $item['link'], $item['cupom'], $master ? 'aprovada' : 'pendente', $master ? $usuario['id'] : null, $master ? date('Y-m-d H:i:s') : null]);
        banco()->commit();
        responder(['mensagem' => $master ? 'Promoção publicada.' : 'Promoção enviada para aprovação.'], 201);
    }
    if ($acao === 'aprovar-promocao' || $acao === 'rejeitar-promocao') {
        $usuario = exigirMaster();
        $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) falhar('Promoção inválida.');
        banco()->beginTransaction();
        $item = consultar("SELECT * FROM promocoes WHERE id = ? AND status = 'pendente' FOR UPDATE", [$id])->fetch();
        if (!$item) falhar('Promoção pendente não encontrada.', 404);
        $aprovar = $acao === 'aprovar-promocao';
        $produtoId = $aprovar ? publicarPromocao($item) : null;
        consultar('UPDATE promocoes SET status = ?, produto_id = ?, revisado_em = NOW(), revisado_por = ? WHERE id = ?',
            [$aprovar ? 'aprovada' : 'rejeitada', $produtoId, $usuario['id'], $id]);
        banco()->commit();
        responder(['mensagem' => $aprovar ? 'Promoção aprovada e publicada.' : 'Promoção rejeitada.']);
    }
    if ($acao === 'editar-produto') {
        exigirMaster();
        $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) falhar('Produto inválido.');
        $produto = validarProdutoCatalogo($dados);
        $ofertas = $dados['ofertas'] ?? [];
        if (!is_array($ofertas) || count($ofertas) < 1 || count($ofertas) > 50) falhar('Informe de 1 a 50 ofertas.');
        $validadas = [];
        foreach ($ofertas as $oferta) {
            if (!is_array($oferta)) falhar('Oferta inválida.');
            $oferta = validarOfertaCatalogo($oferta);
            $chave = normalizar($oferta['mercado']);
            if (isset($validadas[$chave])) falhar('Há mercados repetidos nas ofertas.');
            $validadas[$chave] = $oferta;
        }
        banco()->beginTransaction();
        $atual = consultar('SELECT imagem FROM produtos WHERE id = ? FOR UPDATE', [$id])->fetch();
        if (!$atual) falhar('Produto não encontrado.', 404);
        $imagem = texto($dados, 'imagem');
        $imagem = $imagem === '' ? $atual['imagem'] : imagemCatalogo($imagem, true);
        $duplicado = consultar('SELECT id FROM produtos WHERE chave_nome = ? AND categoria = ? AND id <> ?', [normalizar($produto['nome']), $produto['categoria'], $id])->fetch();
        if ($duplicado) falhar('Já existe um produto com esse nome e categoria.', 409);
        consultar('UPDATE produtos SET nome = ?, chave_nome = ?, categoria = ?, tipo = ?, imagem = ? WHERE id = ?',
            [$produto['nome'], normalizar($produto['nome']), $produto['categoria'], $produto['tipo'], $imagem, $id]);
        consultar('DELETE FROM ofertas WHERE produto_id = ?', [$id]);
        foreach ($validadas as $oferta) gravarOfertaCatalogo($id, $oferta);
        banco()->commit();
        responder(['mensagem' => 'Produto e preços atualizados.']);
    }
    if ($acao === 'excluir-produto') {
        exigirMaster();
        $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) falhar('Produto inválido.');
        $resultado = consultar('DELETE FROM produtos WHERE id = ?', [$id]);
        if (!$resultado->rowCount()) falhar('Produto não encontrado.', 404);
        responder(['mensagem' => 'Produto e suas ofertas excluídos.']);
    }
}
