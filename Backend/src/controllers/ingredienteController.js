const { validateIngredientePayload } = require('../middleware/ingredienteValidator');
const { createIngredienteService } = require('../services/ingredienteService');

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

module.exports = { createIngrediente };
