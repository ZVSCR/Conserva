-- 1. Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(11) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Compras
CREATE TABLE compra (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(9, 2) NOT NULL,
    estabelecimento VARCHAR(50)
);

-- 3. Tabela de Ingredientes (categoria base: ovo, leite, farinha de trigo)
CREATE TABLE ingrediente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 4. Tabela de Itens Comprados
CREATE TABLE item (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
    nome_item VARCHAR(100) NOT NULL,
    quantidade NUMERIC(9, 2) NOT NULL,
    unidade_de_medida VARCHAR(20) NOT NULL,
    tipo_medida VARCHAR(10) NOT NULL,
    valor_unitario NUMERIC(9, 2) NOT NULL,
    validade_estimada DATE,
    ingrediente_id integer references ingrediente(id), --adicionado o id de ingrediente
    CONSTRAINT item_quantidade_positiva CHECK (quantidade > 0),
    CONSTRAINT item_tipo_medida_valido CHECK (
        (tipo_medida = 'unitaria' AND unidade_de_medida = 'un' AND quantidade = trunc(quantidade))
        OR (tipo_medida = 'variavel' AND unidade_de_medida IN ('kg', 'g', 'L', 'mL'))
    )
);

-- 5. Tabela de Estoque
CREATE TABLE estoque (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL UNIQUE REFERENCES item(id) ON DELETE CASCADE,
    quantidade_disponivel NUMERIC(9, 2) NOT NULL,
    gasto BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT estoque_quantidade_nao_negativa CHECK (quantidade_disponivel >= 0)
);

-- 6. Tabela de Receitas
CREATE TABLE receita (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    modo_preparo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Receitas Preparadas
CREATE TABLE receita_preparada (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receita_id INTEGER NOT NULL REFERENCES receita(id) ON DELETE CASCADE,
    data_preparo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de Associação entre Estoque e Receita Preparada
CREATE TABLE receita_preparada_estoque (
    receita_preparada_id INTEGER NOT NULL REFERENCES receita_preparada(id) ON DELETE CASCADE,
    estoque_id INTEGER NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
    quantidade_gasta NUMERIC(9, 2) NOT NULL,
    PRIMARY KEY (receita_preparada_id, estoque_id)
);

-- 9. Tabela de relação de Receita e Ingrediente
CREATE TABLE receita_ingrediente (
    receita_id INTEGER NOT NULL REFERENCES receita(id) ON DELETE CASCADE,
    ingrediente_id INTEGER NOT NULL REFERENCES ingrediente(id) ON DELETE RESTRICT,
    quantidade NUMERIC(9, 2) NOT NULL,
    unidade_de_medida VARCHAR(20) NOT NULL,
    PRIMARY KEY (receita_id, ingrediente_id),
    CONSTRAINT receita_ingrediente_quantidade_positiva CHECK (quantidade > 0),
    CONSTRAINT receita_ingrediente_unidade_valida CHECK (unidade_de_medida IN ('un', 'kg', 'g', 'L', 'mL'))
);
