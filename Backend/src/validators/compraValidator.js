// Contrato de retorno de validação quando há erro (exemplo):
// {
//     isValid: false,
//     errors: [
//         {
//             field: 'itens[1].quantidade',
//             message: 'Quantidade deve ser maior que zero.'
//         }
//     ]
// }
// A função principal deve acumular erros
// Cada função então deve retornar um array de erros

// Contrato de retorno de validação quando está tudo certo (exemplo):
// {
//     isValid: true,
//     errors: []
// }

// Valida integridade da entrada de estabelecimento
function validateEstabelecimento(estabelecimento) {

    const errors = [];

    // Estabelecimento existe?
    if (estabelecimento === undefined || estabelecimento === null) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento é obrigatório.'
        });

        return errors;
    }

    // Estabelecimento é string?
    if (typeof estabelecimento !== 'string') {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento possui formato inválid./'
        });

        return errors;
    }

    const normalizedEstabelecimento = estabelecimento.trim();

    // Estabelecimento é "    "?
    if (!normalizedEstabelecimento) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento não pode conter apenas espaços.'
        });

        return errors;
    }

    // Estabelecimento ultrapassa limite de caracteres?
    if (normalizedEstabelecimento.length > 50) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento deve possuir no máximo 50 caracteres.'
        });

        return errors;
    }

    return errors;
}

// Valida integridade da entrada de data de compra, se existe
function validateDataCompra(dataCompra) {

    const errors = [];

    // Se data não foi fornecida, encerra execução
    if (dataCompra === undefined || dataCompra === null) {
        return errors;
    }

    // Data é string?
    if (typeof dataCompra !== 'string') {
        errors.push({
            field: 'data_compra',
            message: 'Formato de data inválido. Data deve ser string.'
        });

        return errors;
    }

    // Expressão regular de formato de data esperado
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    // Formato de data é YYYY-MM-DD?
    if (!datePattern.test(dataCompra)) {
        errors.push({
            field: 'data_compra',
            message: 'Formato de data inválido. O formato correto é YYYY-MM-DD.'
        });

        return errors;
    }

    // Constrói data real
    const [ano, mes, dia] = dataCompra
        .split('-')
        .map(Number);

    const dataCandidata = new Date(Date.UTC(ano, mes - 1, dia)); // JavaScript numera meses de 0 a 11

    if (ano < 1900) {
        errors.push({
            field: 'data_compra',
            message: 'Forneça um ano válido (igual ou posterior a 1900).'
        });

        return errors;
    }

    // Verifica se data existe
    const isSameDate =
        dataCandidata.getUTCFullYear() === ano &&
        dataCandidata.getUTCMonth() === mes - 1 &&
        dataCandidata.getUTCDate() === dia;

    if (!isSameDate) {
        errors.push({
            field: 'data_compra',
            message: 'Data não existe. Forneça uma data existente.'
        });

        return errors;
    }

    // NOTE: compras futuras serão permitidas?

    return errors;
}

function validateItem(item, index) {
    // TODO: validar um item e identificar sua posição

    const errors = [];
    const fieldPrefix = `itens[${index}]`; // Nomenclatura do item

    // Item existe?
    if (
        item === undefined ||       // Item não definido?
        item === null ||            // Item nulo?
        Array.isArray(item) ||      // Item é array? (deve ser objeto)
        typeof item !== 'object'    // Item não é objeto?
    ) {
        errors.push({
            field: fieldPrefix,
            message: `Item ${index + 1} não é um objeto válido.`
        });

        return errors;
    }

    // Agora, campos estão seguros para acesso
    const {
        nome_item,
        quantidade,
        unidade_de_medida,
        valor_unitario,
        validade_estimada
    } = item;
    // Deste modo, cada erro pode explicitar campo
    // ${fieldPrefix}.nome_campo

    // 1. NOME DE ITEM
    // 1.1 Nome existe?
    if (nome_item === undefined || nome_item === null) {
        errors.push({
            field: `${fieldPrefix}.nome_item`,
            message: `O nome do item ${index + 1} é obrigatório.`
        });
    } else {
        // TODO: 1.2 é string?
        // TODO: 1.3 é "   "?
        // TODO: 1.4 tem até 100 caracteres?
    }

    // TODO: 2. QUANTIDADE
    // TODO: 2.1 é float?
    if () {

    } else {
        // TODO: 2.2 é > 0?
    }

    // TODO: 3. UNIDADE DE MEDIDA
    // TODO: 3.1 é string?
    if () {

    } else {
        // TODO: 3.2 é "   "?
        // TODO: 3.3 tem até 20 caracteres?
    }

    // TODO: 4. VALOR UNITÁRIO
    // TODO: 4.1 é float?
    if () {

    } else {
        // TODO: 4.2 é >= 0?
    }

    // TODO: 5. DATA DE VALIDADE ESTIMADA
    // TODO: 5.1 foi fornecida?
    if () {

    } else {
        // TODO: 5.2 é string?
        // TODO: 5.3 formato é YYYY-MM-DD?
        // TODO: 5.4 data existe?
    }

    return errors;
}

function validateItens(itens) {
    // TODO: validar se array não é vazio
    // TODO: chamar validateItem par cada item
}

function validateCreateCompraPayload(payload) {
    // TODO: executar validações modulares
    // TODO: reunir erros
    // TODO: devolver resultado

    const errors = [];

    // Payload é objeto?
    if (
        payload === null ||
        Array.isArray(payload) ||
        typeof payload !== 'object'
    ) {
        errors.push({
            field: 'payload',
            message: 'A requisição enviada não é um objeto válido.'
        });

        return {
            isValid: false,
            errors
        };
    }

    const {
        data_compra,
        estabelecimento,
        itens
    } = payload;

    // Valida estabelecimento e data de compra
    errors.push(...validateEstabelecimento(estabelecimento));
    errors.push(...validateDataCompra(data_compra));

    // Valida itens
    itens.forEach((item, index) => {
        // TODO: validação de itens
    });

    return {
        isValid: errors.length == 0,
        errors
    };
}

module.exports = {
    validateCreateCompraPayload
};