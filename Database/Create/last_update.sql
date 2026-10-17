BEGIN;

-- 1. Criar a tabela de ingredientes
CREATE TABLE ingrediente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Adicionar os novos campos e restrições à tabela item
ALTER TABLE item
ADD COLUMN tipo_medida VARCHAR(10),
ADD COLUMN ingrediente_id INTEGER REFERENCES ingrediente(id);

-- Adicionar restrição para quantidade positiva
ALTER TABLE item
ADD CONSTRAINT item_quantidade_positiva
CHECK (quantidade > 0);

-- 3. Adicionar o campo gasto à tabela estoque
ALTER TABLE estoque
ADD COLUMN gasto BOOLEAN NOT NULL DEFAULT FALSE;

-- Adicionar restrição para quantidade não negativa
ALTER TABLE estoque
ADD CONSTRAINT estoque_quantidade_nao_negativa
CHECK (quantidade_disponivel >= 0);

-- 4. Criar a tabela de associação entre receitas e ingredientes
CREATE TABLE receita_ingrediente (
    receita_id INTEGER NOT NULL
        REFERENCES receita(id) ON DELETE CASCADE,

    ingrediente_id INTEGER NOT NULL
        REFERENCES ingrediente(id) ON DELETE RESTRICT,

    quantidade NUMERIC(9, 2) NOT NULL,

    unidade_de_medida VARCHAR(20) NOT NULL,

    PRIMARY KEY (receita_id, ingrediente_id),

    CONSTRAINT receita_ingrediente_quantidade_positiva
        CHECK (quantidade > 0),

    CONSTRAINT receita_ingrediente_unidade_valida
        CHECK (unidade_de_medida IN ('un', 'kg', 'g', 'L', 'mL'))
);

-- 5. Dono da receita (obrigatório). As receitas do sistema pertencem ao usuário administrador.
--    ATENÇÃO: apaga todas as receitas existentes e, em cascata, os ingredientes delas e o histórico de preparo. Depois, cadastre as receitas de novo com o usuário correto.
DELETE FROM receita;

ALTER TABLE receita
ADD COLUMN usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;

COMMIT;

