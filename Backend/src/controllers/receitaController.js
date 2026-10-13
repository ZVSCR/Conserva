// Recebe middleware
const {
    validateReceitaPayload
} = require('../middleware/receitaValidator');

// Recebe service
const {
    createReceitaService,
    getGastoPorReceitaService,
    getGastoReceitaService
} = require('../services/receitaService');

// Converte valor para inteiro positivo; retorna null se inválido
function parsePositiveInt(value) {

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const number = Number(value);

    return Number.isSafeInteger(number) && number > 0 ? number : null;
}

async function createReceita(req, res) {

    // TODO: chamar valida payload
    // TODO: chamar serviço cria receita
    // TODO: Definição de status e mensagens de resposta

    try {

        // Valida payload
        const {
            isValid,
            errors
        } = validateReceitaPayload(req.body);

        // Retorna mensagem e status 400 se payload não é válido
        if (!isValid) {
            return res.status(400).json({
                errors
            });
        }

        // Chama serviço para criar a receita
        const receita = await createReceitaService(req.body);

        // Retorna mensagem de criação status 201 se receita foi inserida no BD
        return res.status(201).json({
            message: 'Receita registrada com sucesso.',
            receita
        });
    } catch (error) {

        // Registra mensagem de erro no log
        console.error('Erro ao registrar receita:', error);

        // Retorna mensagem e status 500 se houve erro interno
        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

// GET /receitas/gastos?usuario_id=
// Lista o gasto acumulado de cada receita
async function getGastoPorReceita(req, res) {

    try {

        let usuarioId;

        if (req.query.usuario_id !== undefined) {
            usuarioId = parsePositiveInt(req.query.usuario_id);

            if (usuarioId === null) {
                return res.status(400).json({
                    errors: [{
                        field: 'usuario_id',
                        message: 'usuario_id deve ser um inteiro positivo.'
                    }]
                });
            }
        }

        const receitas = await getGastoPorReceitaService({ usuarioId });

        return res.status(200).json({ receitas });
    } catch (error) {

        console.error('Erro ao consultar gasto por receita:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

// GET /receitas/:id/gasto?usuario_id=
// Retorna o gasto de uma receita, detalhado por preparo
async function getGastoReceita(req, res) {

    try {

        const receitaId = parsePositiveInt(req.params.id);

        if (receitaId === null) {
            return res.status(400).json({
                errors: [{
                    field: 'id',
                    message: 'id deve ser um inteiro positivo.'
                }]
            });
        }

        let usuarioId;

        if (req.query.usuario_id !== undefined) {
            usuarioId = parsePositiveInt(req.query.usuario_id);

            if (usuarioId === null) {
                return res.status(400).json({
                    errors: [{
                        field: 'usuario_id',
                        message: 'usuario_id deve ser um inteiro positivo.'
                    }]
                });
            }
        }

        const gasto = await getGastoReceitaService({ receitaId, usuarioId });

        if (!gasto) {
            return res.status(404).json({
                error: 'Receita não encontrada.'
            });
        }

        return res.status(200).json({ receita: gasto });
    } catch (error) {

        console.error('Erro ao consultar gasto da receita:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    createReceita,
    getGastoPorReceita,
    getGastoReceita
};