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

-- O saldo depende de colunas de item e estoque; por isso a validação é
-- adiada até o fim da transação que eventualmente altera as duas tabelas.
CREATE OR REPLACE FUNCTION validar_granularidade_estoque()
RETURNS TRIGGER AS $$
DECLARE
    id_item INTEGER;
BEGIN
    id_item := CASE WHEN TG_TABLE_NAME = 'item' THEN NEW.id ELSE NEW.item_id END;

    IF EXISTS (
        SELECT 1
        FROM estoque e
        JOIN item i ON i.id = e.item_id
        WHERE i.id = id_item
          AND (
              e.quantidade_disponivel > i.quantidade
              OR (i.tipo_medida = 'unitaria'
                  AND e.quantidade_disponivel <> trunc(e.quantidade_disponivel))
          )
    ) THEN
        RAISE EXCEPTION 'Saldo do estoque incompatível com o item %', id_item;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_validar_granularidade_estoque
AFTER INSERT OR UPDATE ON estoque
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_granularidade_estoque();

CREATE CONSTRAINT TRIGGER trg_validar_granularidade_item
AFTER UPDATE ON item
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_granularidade_estoque();


-- Requer users.gasto_total (ver Migrations/usuario_gasto_total.sql).
CREATE OR REPLACE FUNCTION atualizar_gasto_total_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET gasto_total = gasto_total + NEW.valor_total
        WHERE id = NEW.usuario_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET gasto_total = gasto_total - OLD.valor_total
        WHERE id = OLD.usuario_id;
    ELSIF OLD.usuario_id = NEW.usuario_id THEN
        UPDATE users SET gasto_total = gasto_total + NEW.valor_total - OLD.valor_total
        WHERE id = NEW.usuario_id;
    ELSE
        -- Ordem consistente ao transferir compras entre usuarios.
        PERFORM id FROM users WHERE id IN (OLD.usuario_id, NEW.usuario_id)
        ORDER BY id FOR UPDATE;
        UPDATE users SET gasto_total = gasto_total - OLD.valor_total
        WHERE id = OLD.usuario_id;
        UPDATE users SET gasto_total = gasto_total + NEW.valor_total
        WHERE id = NEW.usuario_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gasto_total_usuario ON compra;
CREATE TRIGGER trg_gasto_total_usuario
AFTER INSERT OR DELETE OR UPDATE OF valor_total, usuario_id ON compra
FOR EACH ROW EXECUTE FUNCTION atualizar_gasto_total_usuario();
