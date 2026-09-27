const { atualizarPorCompraId } = require('../repositories/compraRepository');

const {
    createCompraService
} = require('../services/compraService');

const {
    validateCreateCompraPayload
} = require('../middleware/compraValidator');

const validateCompraPayload = (body) => {
    const allowedFields = ['quantidade', 'valor_unitario', 'nome_item', 'unidade_de_medida', 'validade_estimada'];

    // Garante que ao menos um campo permitido foi enviado
    const hasAtLeastOneField = Object.keys(body).some((key) =>
        allowedFields.includes(key) && body[key] !== undefined
    );

    if (!hasAtLeastOneField) {
        return {
            isValid: false,
            message: 'Forneça ao menos um campo válido para atualização.'
        };
    }

    return { isValid: true };
};

async function atualizarItensPorCompra(req, res) {
    try {
        const { itemId, compraId } = req.params;

        const validation = validateCompraPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                erro: validation.message
            });
        }

        const { quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada } = req.body;

        const itemAtualizado = await atualizarPorCompraId(itemId, compraId, {
            quantidade,
            valor_unitario,
            nome_item,
            unidade_de_medida,
            validade_estimada
        });

        if (!itemAtualizado || itemAtualizado.length === 0) {
            return res.status(404).json({
                erro: 'Nenhum item encontrado para essa compra'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Itens atualizados com sucesso.',
            data: itemAtualizado
        });
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao atualizar itens da compra no banco'
        });
    }
}

async function createCompra(req, res) {
    // Exemplo de JSON a ser recebido:
    // {
    //     "data_compra": "2026-09-20",
    //     "estabelecimento": "Atacadão",
    //     "itens": [
    //         {
    //             "nome_item": "Arroz",
    //             "quantidade": 2,
    //             "unidade_de_medida": "kg",
    //             "valor_unitario": 8.5,
    //             "validade_estimada": "2027-03-01"
    //         }
    //     ]
    // }

    // Valida payload
    const validation = validateCreateCompraPayload(req.body);
    if (!validation.isValid) {

        return res.status(400).json({
            error: validation.errors
        });
    }

    // Valida usuário autenticado
    const userId = req.user.id;
    if (userId == undefined) {

        return res.status(401).json({
            error: 'Usuário não autenticado. Faça login para realizar esta tarefa.'
        });
    }

    // TODO: obter usuário autenticado
    // TODO: chamar compraService
    // TODO: responder 201
}

module.exports = {
    atualizarItensPorCompra,
    createCompra
}