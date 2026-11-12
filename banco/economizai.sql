CREATE DATABASE IF NOT EXISTS economizai
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE economizai;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    nome_materno VARCHAR(80) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    telefone_celular VARCHAR(20) NOT NULL,
    telefone_fixo VARCHAR(20) NOT NULL,
    cep CHAR(8) NOT NULL,
    logradouro VARCHAR(160) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100) NOT NULL DEFAULT '',
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    endereco VARCHAR(600) NOT NULL,
    login CHAR(6) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('master', 'comum') NOT NULL DEFAULT 'comum',
    foto MEDIUMTEXT NULL,
    versao_sessao INT UNSIGNED NOT NULL DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs_autenticacao (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    nome VARCHAR(80) NOT NULL,
    cpf CHAR(11) NOT NULL,
    perfil ENUM('master', 'comum') NOT NULL,
    fator VARCHAR(100) NOT NULL,
    data_hora DATETIME NOT NULL,
    INDEX idx_logs_data (data_hora),
    CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS produtos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    chave_nome VARCHAR(120) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    imagem MEDIUMTEXT NOT NULL,
    selo VARCHAR(30) NOT NULL DEFAULT 'seloMenorPreco',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_produto_nome_categoria (chave_nome, categoria)
);

CREATE TABLE IF NOT EXISTS ofertas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produto_id INT UNSIGNED NOT NULL,
    mercado VARCHAR(100) NOT NULL,
    chave_mercado VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    link VARCHAR(2048) NOT NULL DEFAULT '',
    cupom VARCHAR(60) NOT NULL DEFAULT '',
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_oferta_produto_mercado (produto_id, chave_mercado),
    CONSTRAINT fk_oferta_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS migracoes (
    nome VARCHAR(80) PRIMARY KEY,
    aplicada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curtidas (
    usuario_id INT UNSIGNED NOT NULL,
    produto_id INT UNSIGNED NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, produto_id),
    INDEX idx_curtidas_produto (produto_id),
    CONSTRAINT fk_curtida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_curtida_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promocoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    produto_id INT UNSIGNED NULL,
    nome VARCHAR(120) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    mercado VARCHAR(100) NOT NULL,
    imagem MEDIUMTEXT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    link VARCHAR(2048) NOT NULL,
    cupom VARCHAR(60) NOT NULL DEFAULT '',
    status ENUM('pendente', 'aprovada', 'rejeitada') NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisado_em DATETIME NULL,
    revisado_por INT UNSIGNED NULL,
    INDEX idx_promocoes_status (status, criado_em),
    CONSTRAINT fk_promocao_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_promocao_revisor FOREIGN KEY (revisado_por)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_promocao_produto FOREIGN KEY (produto_id)
        REFERENCES produtos(id) ON DELETE SET NULL
);

-- Migra bancos existentes sem interromper uma nova execuÃ§Ã£o deste arquivo.
SET @tem_tipo_promocao = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promocoes' AND COLUMN_NAME = 'tipo'
);
SET @migrar_tipo_promocao = IF(@tem_tipo_promocao = 0,
    'ALTER TABLE promocoes ADD COLUMN tipo VARCHAR(30) NOT NULL DEFAULT ''unidade'' AFTER categoria',
    'SELECT 1');
PREPARE migracao_tipo_promocao FROM @migrar_tipo_promocao;
EXECUTE migracao_tipo_promocao;
DEALLOCATE PREPARE migracao_tipo_promocao;

-- Conta de demonstração criada somente pelo SQL.
-- Login: master | Senha: Masteraa
-- Respostas 2FA: Maria Administradora | 01/01/1990 | 20040002
-- Troque os dados desta conta antes de publicar o sistema.
INSERT INTO usuarios
    (nome, data_nascimento, sexo, nome_materno, cpf, email,
    telefone_celular, telefone_fixo, cep, logradouro, numero, complemento,
    bairro, cidade, estado, endereco, login, senha, perfil)
SELECT 'Administrador Geral', '1990-01-01', 'outro', 'Maria Administradora',
    '52998224725', 'master@economizai.local', '(+55)21-999999999', '(+55)21-33334444',
    '20040002', 'Avenida Rio Branco', '1', '', 'Centro', 'Rio de Janeiro', 'RJ',
    'Avenida Rio Branco, 1, Centro, Rio de Janeiro - RJ, CEP 20040-002',
    'master', '$2y$12$NY2BkDy/OYd5WuP7EQABSuDsROHAbEwsHPfghgbBrEqkUxZbBrbq.', 'master'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'master');
