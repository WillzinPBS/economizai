<?php
// Também é possível informar esses valores pelas variáveis de ambiente do servidor.
return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'porta' => getenv('DB_PORT') ?: '3306',
    'banco' => getenv('DB_NAME') ?: 'economizai',
    'usuario' => getenv('DB_USER') ?: 'root',
    'senha' => getenv('DB_PASSWORD') ?: 'root',
];
