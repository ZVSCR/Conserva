CREATE TABLE receita_ingrediente (
    receita_id INTEGER NOT NULL REFERENCES receita(id) ON DELETE CASCADE,
    ingrediente_id INTEGER NOT NULL REFERENCES ingrediente(id) ON DELETE RESTRICT,
    quantidade NUMERIC(9, 2) NOT NULL,
    unidade_de_medida VARCHAR(20) NOT NULL,
    PRIMARY KEY (receita_id, ingrediente_id),
    CONSTRAINT receita_ingrediente_quantidade_positiva CHECK (quantidade > 0),
    CONSTRAINT receita_ingrediente_unidade_valida CHECK (unidade_de_medida IN ('un', 'kg', 'g', 'L', 'mL'))
);