--1. Update de gasto ao atualizar itens
CREATE OR REPLACE FUNCTION atualizar_flag_gasto_item()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE estoque
    SET gasto = (quantidade_disponivel < NEW.quantidade)
    WHERE item_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_flag_gasto_item
AFTER UPDATE OF quantidade ON item
FOR EACH ROW
EXECUTE FUNCTION atualizar_flag_gasto_item();


--2. Update de gasto ao atualizar estoque
CREATE OR REPLACE FUNCTION atualizar_flag_gasto_estoque()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gasto := NEW.quantidade_disponivel < (
        SELECT quantidade FROM item WHERE id = NEW.item_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_flag_gasto_estoque
BEFORE INSERT OR UPDATE OF quantidade_disponivel ON estoque
FOR EACH ROW
EXECUTE FUNCTION atualizar_flag_gasto_estoque();