-- Corrige a validacao em gatilhos disparados por item e estoque.
BEGIN;

CREATE OR REPLACE FUNCTION validar_granularidade_estoque()
RETURNS TRIGGER AS $$
DECLARE
    id_item INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'item' THEN
        id_item := NEW.id;
    ELSE
        id_item := NEW.item_id;
    END IF;

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

COMMIT;
