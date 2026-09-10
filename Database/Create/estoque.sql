CREATE TABLE EstoqueItem (
    id,
    usuario_id INT NOT NULL,
    item_id INT NOT NULL,
    quantidade_disponivel INT NOT NULL DEFAULT 1,
    
    PRIMARY KEY (id, usuario_id, item_id),
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item(id),
       
);
