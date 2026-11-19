<?php
declare(strict_types=1);

require __DIR__ . '/funcoes.php';

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

// Gera um PDF de texto com paginação, sem precisar instalar bibliotecas.
function textoPdf(string $texto): string
{
    $texto = preg_replace('/[\x00-\x1F\x7F]/', ' ', $texto);
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $texto);
}

function gerarPdf(array $usuarios): string
{
    $linhas = [];
    foreach ($usuarios as $usuario) {
        $campos = [
            $usuario['nome'],
            'Login: ' . $usuario['login'] . ' | CPF: ' . $usuario['cpf'],
            'E-mail: ' . $usuario['email'],
        ];
        foreach ($campos as $campo) {
            $bytes = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $campo);
            foreach (str_split($bytes, 50) as $trecho) {
                $linhas[] = $trecho;
            }
        }
        $linhas[] = '';
    }
    // Com início em y=730 e passo de 13 pontos, a última linha fica acima do rodapé.
    $paginas = array_chunk($linhas, 52) ?: [['Nenhum usuario encontrado.']];
    $objetos = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        2 => '',
        3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ];
    $referencias = [];
    foreach ($paginas as $indice => $linhasPagina) {
        $paginaId = count($objetos) + 1;
        $conteudoId = $paginaId + 1;
        $referencias[] = "$paginaId 0 R";
        $objetos[$paginaId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents $conteudoId 0 R >>";
        $conteudo = "BT /F1 18 Tf 40 792 Td (Economizai - Lista de usuarios) Tj ET\n";
        $subtitulo = 'Emitido em ' . date('d/m/Y H:i') . ' | ' . count($usuarios) . ' usuario(s)';
        $conteudo .= 'BT /F1 10 Tf 40 770 Td (' . textoPdf($subtitulo) . ") Tj ET\n";
        $y = 730;
        foreach ($linhasPagina as $linha) {
            $conteudo .= "BT /F1 10 Tf 40 $y Td (" . textoPdf($linha) . ") Tj ET\n";
            $y -= 13;
        }
        $rodape = 'Pagina ' . ($indice + 1) . ' de ' . count($paginas);
        $conteudo .= 'BT /F1 10 Tf 40 30 Td (' . textoPdf($rodape) . ") Tj ET\n";
        $objetos[$conteudoId] = '<< /Length ' . strlen($conteudo) . ">>\nstream\n" . $conteudo . "endstream";
    }
    $objetos[2] = '<< /Type /Pages /Kids [' . implode(' ', $referencias) . '] /Count ' . count($paginas) . ' >>';
    $pdf = "%PDF-1.4\n";
    $posicoes = [0];
    foreach ($objetos as $id => $objeto) {
        $posicoes[$id] = strlen($pdf);
        $pdf .= "$id 0 obj\n$objeto\nendobj\n";
    }
    $inicioTabela = strlen($pdf);
    $pdf .= 'xref' . "\n0 " . (count($objetos) + 1) . "\n0000000000 65535 f \n";
    foreach (array_slice($posicoes, 1) as $posicao) {
        $pdf .= sprintf("%010d 00000 n \n", $posicao);
    }
    return $pdf . 'trailer << /Size ' . (count($objetos) + 1) . " /Root 1 0 R >>\nstartxref\n$inicioTabela\n%%EOF";
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');
        falhar('Método HTTP não permitido.', 405);
    }
    exigirMaster();
    $usuarios = consultar("SELECT nome, login, cpf, email FROM usuarios
        WHERE perfil = 'comum' AND LOCATE(?, nome) > 0 ORDER BY nome", [texto($_GET, 'busca')])->fetchAll();
    $pdf = gerarPdf($usuarios);
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="usuarios-economizai.pdf"');
    header('Content-Length: ' . strlen($pdf));
    echo $pdf;
} catch (Throwable $erro) {
    error_log('Economizai PDF: ' . $erro->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    falhar('Não foi possível gerar a lista. Confira a conexão com o banco de dados.', 503);
}
