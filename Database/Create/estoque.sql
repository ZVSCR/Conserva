CREATE TABLE estoque(
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL UNIQUE,
    quantidade_disponivel NUMERIC(9, 2) NOT NULL,
    gasto BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT estoque_quantidade_nao_negativa CHECK (quantidade_disponivel >= 0),

    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);
