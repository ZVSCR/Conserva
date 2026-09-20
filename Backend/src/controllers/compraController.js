const {
    atualizarPorCompraId,
    ItemCompraNaoEncontradoError
} = require('../repositories/compraRepository');

const allowedFields = [
    'quantidade',
    'valor_unitario',
    'nome_item',
    'unidade_de_medida',
    'validade_estimada'
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

module.exports = { atualizarItensPorCompra };
