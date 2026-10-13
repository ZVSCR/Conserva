const SERIAL_UPPER_LIMIT = 2_147_483_647;

// Recebe middleware
const {
    validateReceitaPayload
} = require('../middleware/receitaValidator');

// Recebe service
const {
    createReceitaService,
    updateReceitaService,
    getGastoPorReceitaService,
    getGastoReceitaService
} = require('../services/receitaService');

const {
    listReceitasRepo,
    getReceitaByIdRepo,
    deleteReceitaRepo
} = require('../repositories/receitaRepository')

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
        } catch (error) {
        console.error('Erro ao buscar receita:', error);

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

async function deleteReceita(req, res) {
    try {
        if (!/^[1-9]\d*$/.test(req.params.id)) {
            return res.status(400).json({
                error: 'id deve ser um inteiro positivo.'
            });
        }

        const receitaRemovida = await deleteReceitaRepo(Number(req.params.id));

        if (!receitaRemovida) {
            return res.status(404).json({
                error: 'Receita não encontrada.'
            });
        }

        return res.status(200).json({
            message: 'Receita removida com sucesso.',
            receita: receitaRemovida
        });
    } catch (error) {
        console.error('Erro ao remover receita:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

// atualiza informacoes basicas da receita
async function patchReceitaById(req, res) {
    try {
        const { id } = req.params;
        const receitaId = Number(id);
        if (
            !/^[1-9]\d*$/.test(id) ||
            !Number.isSafeInteger(receitaId) ||
            receitaId > SERIAL_UPPER_LIMIT
        ) {
            return res.status(400).json({
                erro: 'id deve ser um inteiro positivo.'
            });
        }
        // uma vez que todos os campos sempre conterao algo, podemos reutilizar
        // a validacao da payload de criacao
        const {
            isValid,
            errors
        } = validateReceitaPayload(req.body);
        if (!isValid)
            return res.status(400).json({
                errors
            });

        const receitaAtualizada = await updateReceitaService(receitaId, req.body);
        if (!receitaAtualizada)
            return res.status(404).json({
                erro: 'Receita não encontrada'
            });
        return res.status(200).json({
            message: 'Receita atualizada com sucesso',
            receitaAtualizada
        });
    } catch (error) {
        console.error('Erro ao atualizar receita: ', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

// adiciona um ingrediente na receita
async function postIngredienteReceitaById(req, res) {

}

// atualiza um ingrediente da receita
async function patchIngredienteReceitaById(req, res) {

}

// remove um ingrediente da receita
async function deleteIngredienteReceitaById(req, res) {

}

module.exports = {
    createReceita, 
    verificarReceita, 
    prepararReceita,
    listReceitas,
    getReceitaById,
    deleteReceita,
    patchReceitaById,
    postIngredienteReceitaById,
    patchIngredienteReceitaById,
    deleteIngredienteReceitaById,
};
