const { validateIngredientePayload, validateIngredienteId } = require('../middleware/ingredienteValidator');
const { createIngredienteService, updateIngredienteService, deleteIngredienteService } = require('../services/ingredienteService');
const { IngredienteError } = require('../errors/IngredienteError');

const SERIAL_UPPER_LIMIT = 2_147_483_647;

async function createIngrediente(req, res) {
    try {
        const { isValid, errors } = validateIngredientePayload(req.body);
        if (!isValid) return res.status(400).json({ errors });

        const ingrediente = await createIngredienteService(req.body);
        return res.status(201).json({
            message: 'Ingrediente registrado com sucesso.',
            ingrediente
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ingrediente já cadastrado.' });
        }

        console.error('Erro ao registrar ingrediente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

async function patchIngredienteById(req, res) {
    try {
        const { id } = req.params;
        const ingredienteId = Number(id);
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(ingredienteId) ||
            ingredienteId > SERIAL_UPPER_LIMIT) {
            return res.status(400).json({ error: 'id deve ser um inteiro positivo.' });
        }

        const { isValid, errors } = validateIngredientePayload(req.body);
        if (!isValid) return res.status(400).json({ errors });

        const ingrediente = await updateIngredienteService(ingredienteId, req.body, req.ingredienteUsuarioId);

        return res.status(200).json({
            message: 'Ingrediente atualizado com sucesso.',
            ingrediente
        });
    } catch (error) {
        if (error instanceof IngredienteError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ingrediente já cadastrado.' });
        }

        console.error('Erro ao atualizar ingrediente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

async function deleteIngrediente(req, res) {
    const { isValid, errors } = validateIngredienteId(req.params.id);
    if (!isValid) return res.status(400).json({ errors });

    try {
        await deleteIngredienteService(Number(req.params.id), req.ingredienteUsuarioId);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof IngredienteError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao excluir ingrediente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

module.exports = { createIngrediente, patchIngredienteById, deleteIngrediente };
