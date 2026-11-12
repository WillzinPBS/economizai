-- Execute no banco do projeto. Preserva produtos, ofertas e promoções.
CREATE TABLE IF NOT EXISTS curtidas (
    usuario_id INT UNSIGNED NOT NULL,
    produto_id INT UNSIGNED NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, produto_id),
    INDEX idx_curtidas_produto (produto_id),
    CONSTRAINT fk_curtida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_curtida_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

SET @remover_campo = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ofertas' AND COLUMN_NAME = 'descricao') > 0,
    'ALTER TABLE ofertas DROP COLUMN descricao', 'SELECT 1');
PREPARE atualizacao_curtidas FROM @remover_campo;
EXECUTE atualizacao_curtidas;
DEALLOCATE PREPARE atualizacao_curtidas;

SET @remover_campo = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promocoes' AND COLUMN_NAME = 'descricao') > 0,
    'ALTER TABLE promocoes DROP COLUMN descricao', 'SELECT 1');
PREPARE atualizacao_curtidas FROM @remover_campo;
EXECUTE atualizacao_curtidas;
DEALLOCATE PREPARE atualizacao_curtidas;
