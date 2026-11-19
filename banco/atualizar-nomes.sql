USE economizai;

ALTER TABLE usuarios
    MODIFY nome LONGTEXT NOT NULL,
    MODIFY nome_materno LONGTEXT NOT NULL;

ALTER TABLE logs_autenticacao
    MODIFY nome LONGTEXT NOT NULL;
