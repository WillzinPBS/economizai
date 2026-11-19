<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/../api/funcoes.php';

try {
    $antes = [];
    foreach (['produtos', 'ofertas', 'promocoes'] as $tabela) {
        $antes[$tabela] = (int) consultar("SELECT COUNT(*) FROM $tabela")->fetchColumn();
    }
    banco()->exec(file_get_contents(__DIR__ . '/atualizar-curtidas.sql'));
    foreach ($antes as $tabela => $quantidade) {
        if ((int) consultar("SELECT COUNT(*) FROM $tabela")->fetchColumn() !== $quantidade) {
            throw new RuntimeException("A quantidade de registros de $tabela foi alterada.");
        }
    }
    echo "Curtidas configuradas e campos de descrição removidos.\n";
    echo $antes['produtos'] . " produtos, " . $antes['ofertas'] . " ofertas e " . $antes['promocoes'] . " promoções preservados.\n";
} catch (Throwable $erro) {
    fwrite(STDERR, "Não foi possível atualizar o banco: " . $erro->getMessage() . "\n");
    exit(1);
}
