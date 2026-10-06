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