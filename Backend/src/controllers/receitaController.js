// Recebe middleware
const {
    validateReceitaPayload
} = require('../middleware/receitaValidator');

// Recebe service
const {
    createReceitaService
} = require('../services/receitaService');

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

module.exports = {
    createReceita
};