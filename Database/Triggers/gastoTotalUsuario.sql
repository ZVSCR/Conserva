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
