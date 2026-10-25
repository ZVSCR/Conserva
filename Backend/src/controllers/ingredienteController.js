const { validateIngredientePayload, validateIngredienteId } = require('../middleware/ingredienteValidator');
const { createIngredienteService, deleteIngredienteService } = require('../services/ingredienteService');
const { IngredienteError } = require('../errors/IngredienteError');

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

module.exports = { createIngrediente, deleteIngrediente };
