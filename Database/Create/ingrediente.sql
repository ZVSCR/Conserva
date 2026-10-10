-- Tabela de Ingredientes (categoria base: ovo, leite, farinha de trigo)
CREATE TABLE ingrediente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);
