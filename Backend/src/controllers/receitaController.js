// Recebe middleware
const {
    validateReceitaPayload
} = require('../middleware/receitaValidator');

// Recebe service
const {
    createReceitaService
} = require('../services/receitaService');

const {
    listReceitasRepo,
    getReceitaByIdRepo
} = require('../repositories/receitaRepository')

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

const {
    ReceitaNaoEncontradaError,
    ReceitaSemIngredientesError,
    IngredientesInsuficientesError
} = require('../repositories/receitaRepository');

const {
    prepararReceitaService,
    verificarReceitaService
} = require('../services/receitaPreparoService');

function tratarErroPreparo(erro, res) {
    if (erro instanceof ReceitaNaoEncontradaError) {
        return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof ReceitaSemIngredientesError) {
        return res.status(422).json({ erro: erro.message });
    }
    if (erro instanceof IngredientesInsuficientesError) {
        return res.status(409).json({ erro: erro.message, faltando: erro.faltando });
    }

    console.error('Erro ao preparar receita:', erro);
    return res.status(500).json({ erro: 'Erro ao preparar receita' });
}

async function verificarReceita(req, res) {
    try {
        const receitaId = Number(req.params.receitaId);
        if (!Number.isSafeInteger(receitaId) || receitaId <= 0) {
            return res.status(400).json({ erro: 'receitaId deve ser um inteiro positivo.' });
        }

        const plano = await verificarReceitaService(req.user.id, receitaId);

        return res.status(200).json({
            status: 'success',
            data: { podePreparar: plano.ok, faltando: plano.faltando }
        });
    } catch (erro) {
        return tratarErroPreparo(erro, res);
    }
}

async function prepararReceita(req, res) {
    try {
        const receitaId = Number(req.params.receitaId);
        if (!Number.isSafeInteger(receitaId) || receitaId <= 0) {
            return res.status(400).json({ erro: 'receitaId deve ser um inteiro positivo.' });
        }

        const resultado = await prepararReceitaService(req.user.id, receitaId);

        return res.status(201).json({
            status: 'success',
            message: 'Receita preparada com sucesso.',
            data: resultado
        });
    } catch (erro) {
        return tratarErroPreparo(erro, res);
    }
}

async function listReceitas(req, res) {
    try {
        const receitas = await listReceitasRepo();

        return res.status(200).json({
            receitas
        });
    } catch (error) {
        console.error('Erro ao listar receitas:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

async function getReceitaById(req, res) {
    try {
        // Só aceita inteiros positivos
        if (!/^[1-9]\d*$/.test(req.params.id)) {
            return res.status(400).json({
                error: 'id deve ser um inteiro positivo.'
            });
        }

        const receita = await getReceitaByIdRepo(Number(req.params.id));

        if (!receita) {
            return res.status(404).json({
                error: 'Receita não encontrada.'
            });
        }

        return res.status(200).json({
            receita
        });
    } catch (error) {
        console.error('Erro ao buscar receita:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    createReceita, 
    verificarReceita, 
    prepararReceita,
    listReceitas,
    getReceitaById
};