const {
    listarComprasUsuario,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    atualizarInstanciasPorCompraId,
    createCompraVazia,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError,
    apagarCompraPorId
} = require('../repositories/compraRepository');

const {
    createCompraService
} = require('../services/compraService');

const {
    validateCreateCompraPayload,
    validateItensPayload
} = require('../middleware/compraValidator');

const allowedFields = [
    'quantidade',
    'valor_unitario',
    'nome_item',
    'unidade_de_medida',
    'validade_estimada'
];

const allowedCompraFields = [
    'data_compra',
    'estabelecimento'
];

const invalidResult = (message) => ({
    isValid: false,
    message
});

const hasField = (body, field) =>
    Object.prototype.hasOwnProperty.call(body, field) &&
    body[field] !== undefined;

const isValidIsoDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
};

const isValidIsoDateTime = (value) => {
    if (isValidIsoDate(value)) {
        return true;
    }

    if (typeof value !== 'string') {
        return false;
    }

    const match = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(value);

    return match !== null && isValidIsoDate(match[1]);
};

const parsePositiveIntegerParam = (value) => {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isSafeInteger(parsedValue) ? parsedValue : null;
};


const validateCompraPayload = (body) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return invalidResult('O corpo da requisição deve ser um objeto JSON.');
    }

    const receivedFields = Object.keys(body);
    const unknownFields = receivedFields.filter((field) =>
        !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
        return invalidResult(
            `Campos não permitidos: ${unknownFields.join(', ')}.`
        );
    }

    const hasAtLeastOneField = allowedFields.some((field) =>
        hasField(body, field)
    );

    if (!hasAtLeastOneField) {
        return invalidResult(
            'Forneça ao menos um campo válido para atualização.'
        );
    }

    if (hasField(body, 'quantidade')) {
        const { quantidade } = body;

        if (
            typeof quantidade !== 'number' ||
            !Number.isFinite(quantidade) ||
            quantidade <= 0
        ) {
            return invalidResult(
                'quantidade deve ser um número maior que zero.'
            );
        }
    }

    if (hasField(body, 'valor_unitario')) {
        const { valor_unitario } = body;

        if (
            typeof valor_unitario !== 'number' ||
            !Number.isFinite(valor_unitario) ||
            valor_unitario < 0
        ) {
            return invalidResult(
                'valor_unitario deve ser um número maior ou igual a zero.'
            );
        }
    }

    if (hasField(body, 'nome_item')) {
        const { nome_item } = body;

        if (
            typeof nome_item !== 'string' ||
            nome_item.trim().length === 0 ||
            nome_item.length > 100
        ) {
            return invalidResult(
                'nome_item deve ser um texto não vazio de até 100 caracteres.'
            );
        }
    }

    if (hasField(body, 'unidade_de_medida')) {
        const { unidade_de_medida } = body;

        if (
            typeof unidade_de_medida !== 'string' ||
            unidade_de_medida.trim().length === 0 ||
            unidade_de_medida.length > 20
        ) {
            return invalidResult(
                'unidade_de_medida deve ser um texto não vazio de até 20 caracteres.'
            );
        }
    }

    if (hasField(body, 'validade_estimada')) {
        const { validade_estimada } = body;

        if (
            validade_estimada !== null &&
            !isValidIsoDate(validade_estimada)
        ) {
            return invalidResult(
                'validade_estimada deve ser uma data válida no formato YYYY-MM-DD ou null.'
            );
        }
    }

    return { isValid: true };
};

const validateAtualizacaoCompraPayload = (body) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return invalidResult('O corpo da requisição deve ser um objeto JSON.');
    }

    const receivedFields = Object.keys(body);
    const unknownFields = receivedFields.filter((field) =>
        !allowedCompraFields.includes(field)
    );

    if (unknownFields.length > 0) {
        return invalidResult(
            `Campos não permitidos: ${unknownFields.join(', ')}.`
        );
    }

    const hasAtLeastOneField = allowedCompraFields.some((field) =>
        hasField(body, field)
    );

    if (!hasAtLeastOneField) {
        return invalidResult(
            'Forneça ao menos um campo válido para atualização da compra.'
        );
    }

    if (
        hasField(body, 'data_compra') &&
        !isValidIsoDateTime(body.data_compra)
    ) {
        return invalidResult(
            'data_compra deve ser uma data ISO válida no formato YYYY-MM-DD ou uma data/hora ISO.'
        );
    }

    if (hasField(body, 'estabelecimento')) {
        const { estabelecimento } = body;

        if (
            estabelecimento !== null &&
            (
                typeof estabelecimento !== 'string' ||
                estabelecimento.trim().length === 0 ||
                estabelecimento.length > 50
            )
        ) {
            return invalidResult(
                'estabelecimento deve ser um texto não vazio de até 50 caracteres ou null.'
            );
        }
    }

    return { isValid: true };
};

const USUARIO_ID_TEMP = 1;
async function listarCompras(req, res) {
    try {
        //const usuarioId = req.params.id;

        const compras = await listarComprasUsuario(USUARIO_ID_TEMP);
        return res.status(200).json({
            status: 'success',
            message: 'Acesso bem sucedido.',
            data: compras
        });
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao buscar compras no banco de dados'
        });
    }
}

async function listarItensPorCompra(req, res) {
    try {
        //const usuarioId = req.params.id;
        const usuarioId = USUARIO_ID_TEMP;
        const compraId = parsePositiveIntegerParam(req.params.compraId)

        if (compraId === null) {
            return res.status(400).json({
                erro: 'compraId deve ser um inteiro positivo.'
            });
        }

        const itens = await listarCompraPorId(usuarioId, compraId);
        return res.status(200).json({
            status: 'success',
            message: 'Acesso bem sucedido.',
            data: itens
        });
    } catch (erro) {
        if (erro instanceof CompraNaoEncontradaError) {
            return res.status(404).json({
                erro: 'Compra não encontrada'
            });
        }

        return res.status(500).json({
            erro: 'Erro ao buscar itens da compra'
        });
    }
}

async function atualizarCompra(req, res) {
    try {
        const compraId = parsePositiveIntegerParam(req.params.compraId);

        if (compraId === null) {
            return res.status(400).json({
                erro: 'compraId deve ser um inteiro positivo.'
            });
        }

        const validation = validateAtualizacaoCompraPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                erro: validation.message
            });
        }

        const { data_compra, estabelecimento } = req.body;
        const compraAtualizada = await atualizarCompraPorId(compraId, {
            data_compra,
            estabelecimento
        });

        return res.status(200).json({
            status: 'success',
            message: 'Compra atualizada com sucesso.',
            data: compraAtualizada
        });
    } catch (erro) {
        if (erro instanceof CompraNaoEncontradaError) {
            return res.status(404).json({
                erro: erro.message
            });
        }

        return res.status(500).json({
            erro: 'Erro ao atualizar compra no banco'
        });
    }
}

async function atualizarItensPorCompra(req, res) {
    try {
        const compraId = parsePositiveIntegerParam(req.params.compraId);
        const itemId = parsePositiveIntegerParam(req.params.itemId);

        if (compraId === null) {
            return res.status(400).json({
                erro: 'compraId deve ser um inteiro positivo.'
            });
        }

        if (itemId === null) {
            return res.status(400).json({
                erro: 'itemId deve ser um inteiro positivo.'
            });
        }

        const validation = validateCompraPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                erro: validation.message
            });
        }

        const { quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada } = req.body;

        const resultadoAtualizacao = await atualizarPorCompraId(itemId, compraId, {
            quantidade,
            valor_unitario,
            nome_item,
            unidade_de_medida,
            validade_estimada
        });

        res.status(200).json({
            status: 'success',
            message: 'Itens atualizados com sucesso.',
            data: resultadoAtualizacao
        });
    } catch (erro) {
        if (erro instanceof ItemCompraNaoEncontradoError) {
            return res.status(404).json({
                erro: erro.message
            });
        }

        res.status(500).json({
            erro: 'Erro ao atualizar itens da compra no banco'
        });
    }
}

async function atualizarInstanciasPorCompra(req, res) {
    try {
        const compraId = parsePositiveIntegerParam(req.params.compraId);

        if (compraId === null) {
            return res.status(400).json({
                erro: 'compraId deve ser um inteiro positivo.'
            });
        }

        const { itemBusca, novosValores } = req.body;

        if (!itemBusca || typeof itemBusca !== 'object') {
            return res.status(400).json({
                erro: 'itemBusca é obrigatório e deve conter nome_item, quantidade, valor_unitario e validade_estimada.'
            });
        }

        const { nome_item, quantidade, valor_unitario, validade_estimada } = itemBusca;

        if (
            nome_item === undefined ||
            quantidade === undefined ||
            valor_unitario === undefined
        ) {
            return res.status(400).json({
                erro: 'itemBusca deve conter nome_item, quantidade e valor_unitario.'
            });
        }

        const validation = validateCompraPayload(novosValores);
        if (!validation.isValid) {
            return res.status(400).json({
                erro: validation.message
            });
        }

        const {
            quantidade: novaQuantidade,
            valor_unitario: novoValorUnitario,
            nome_item: novoNomeItem,
            unidade_de_medida: novaUnidadeDeMedida,
            validade_estimada: novaValidadeEstimada
        } = novosValores;

        const resultadoAtualizacao = await atualizarInstanciasPorCompraId(
            compraId,
            { nome_item, quantidade, valor_unitario, validade_estimada },
            {
                quantidade: novaQuantidade,
                valor_unitario: novoValorUnitario,
                nome_item: novoNomeItem,
                unidade_de_medida: novaUnidadeDeMedida,
                validade_estimada: novaValidadeEstimada
            }
        );

        res.status(200).json({
            status: 'success',
            message: 'Itens atualizados com sucesso.',
            data: resultadoAtualizacao
        });
    } catch (erro) {
        if (erro instanceof ItemCompraNaoEncontradoError) {
            return res.status(404).json({
                erro: erro.message
            })
        };
    }
}
// Exemplo de JSON a ser recebido:
// {
//     "usuario_id": 7,
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

async function createCompraVaziaController(req, res) {
    try {
        const { usuarioId, data_compra, estabelecimento } = req.body;
        const resultado = await createCompraVazia(usuarioId, data_compra, estabelecimento);
        res.status(201).json(resultado);
    } catch (erro) {
        console.error(erro)
        res.status(500).json({
            erro: 'Erro ao criar compra'
        });
    }
}

async function createCompra(req, res) {

    // Valida payload
    const validation = validateCreateCompraPayload(req.body);
    if (!validation.isValid) {

        return res.status(400).json({
            error: validation.errors
        });
    }

    // Identificação temporária para testar funcionalidade; não autentica o usuário.
    const userId = req.body.usuario_id;
    if (!Number.isSafeInteger(userId) || userId <= 0) {

        return res.status(400).json({
            error: [{
                field: 'usuario_id',
                message: 'Informe um ID de usuário inteiro e positivo.'
            }]
        });
    }

    try {

        // Chama serviço de criar compra
        const result = await createCompraService(userId, req.body);

        return res.status(201).json({
            message: 'Compra registrada com sucesso.',
            compra: result.id
        });
    } catch (error) {

        // Log de descrição do erro encontrado
        console.log('Erro ao registrar compra:', error);

        // Retorna status 500 de erro
        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }

}

async function apagarCompra(req, res) {
    try {
        const compraId = parsePositiveIntegerParam(req.params.compraId);

        if (compraId === null) {
            return res.status(400).json({
                erro: 'compraId deve ser um inteiro positivo.'
            });
        }

        const compraRemovida = await apagarCompraPorId(USUARIO_ID_TEMP, compraId);

        return res.status(200).json({
            status: 'success',
            message: 'Compra removida com sucesso.',
            data: compraRemovida
        });
    } catch (erro) {
        if (erro instanceof CompraNaoEncontradaError) {
            return res.status(404).json({
                erro: erro.message
            });
        }

        return res.status(500).json({
            erro: 'Erro ao remover compra no banco'
        });
    }
}



async function updateCompraAddItens(req, res) {

    // TODO: Definir endpoint desta tarefa
    // TODO: Chama service para executar tarefa
    // TODO: Middleware
    // TODO: Service
    // TODO: Repository

    // Valida payload
    const validation = validateItensPayload(req.body);
    if (!validation.isValid) {

        return res.status(400).json({
            error: validation.errors
        });
    }

    // Identificação temporária de IDs de usuário e compra
    const userId = req.body.usuario_id;
    const compraId = req.body.compra_id;
    // Valida IDs de usuário
    if (!Number.isSafeInteger(userId) || userId <= 0) {

        return res.status(400).json({
            error: [{
                field: 'usuario_id',
                message: 'Informe um ID de usuário inteiro e positivo.'
            }]
        });
    }
    // Valida ID de compra
    if (!Number.isSafeInteger(comprarId) || userId <= 0) {

        return res.status(400).json({
            error: [{
                field: 'compra_id',
                message: 'Informe um ID de compra inteiro e positivo.'
            }]
        });
    }

    try {

        // Chama serviço de criar comrpa
        const result = await updateCompraAddItensService(userId, compraId, req.body);

        return res.status(201).json({
            message: 'Compra atualizada com novos itens com sucesso.',
            compra: result.id
        });

    } catch (error) {

        // Log de descrição do erro encontrado
        console.log('Erro ao registrar compra:', error);

        // Retorna status 500 de erro
        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }

}

module.exports = {
    listarCompras,
    listarItensPorCompra,
    atualizarCompra,
    atualizarItensPorCompra,
    atualizarInstanciasPorCompra,
    updateCompraAddItens,
    createCompraVaziaController,
    createCompra,
    apagarCompra
};
