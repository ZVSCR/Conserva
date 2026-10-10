CREATE TABLE receita_ingrediente (
    receita_id INTEGER NOT NULL REFERENCES receita(id) ON DELETE CASCADE,
    ingrediente_id INTEGER NOT NULL REFERENCES ingrediente(id) ON DELETE CASCADE,
    quantidade NUMERIC(9, 2) NOT NULL,
    unidade_de_medida VARCHAR(20) NOT NULL,
    PRIMARY KEY (receita_id, ingrediente_id)
);