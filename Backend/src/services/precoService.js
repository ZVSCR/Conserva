const Decimal = require('decimal.js');
const { quantidadeRepresentavel } = require('./granularidadeService');

class PrecoInvalidoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PrecoInvalidoError';
    }
}

const MAX_CENTAVOS = 999999999; // numeric(9, 2) em item e compra

function valorUnitarioRepresentavel(valor) {
    return typeof valor === 'number' && Number.isFinite(valor) &&
        valor >= 0 && valor <= MAX_CENTAVOS / 100 &&
        /^\d+(?:\.\d{1,2})?$/.test(String(valor));
}

function validarValorUnitario(valor) {
    if (!valorUnitarioRepresentavel(valor)) {
        throw new PrecoInvalidoError('valor_unitario deve ter até duas casas decimais e caber no campo do banco.');
    }
    return valor;
}

function validarPrecoTotal(valor) {
    if (!valorUnitarioRepresentavel(valor)) {
        throw new PrecoInvalidoError('preco_total_item deve ser um número maior ou igual a zero, com até duas casas decimais e no máximo 9.999.999,99.');
    }
    return valor;
}

function calcularTotalItem(quantidade, valorUnitario) {
    return new Decimal(quantidade).mul(valorUnitario)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

// O total cobre a linha inteira; quantidade é a medida de cada embalagem.
// O preço persistido continua sendo por un, kg, g, L ou mL.
function inferirValorUnitario(precoTotal, quantidade, numeroEmbalagens = 1) {
    validarPrecoTotal(precoTotal);
    if (!quantidadeRepresentavel(quantidade) || quantidade <= 0 ||
        !Number.isSafeInteger(numeroEmbalagens) || numeroEmbalagens < 1) {
        throw new PrecoInvalidoError('Quantidade ou número de embalagens inválido para calcular o preço.');
    }

    const unitario = new Decimal(precoTotal).div(quantidade).div(numeroEmbalagens)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
    validarValorUnitario(unitario);

    // Não aceitar um total que se transforma em outro depois de gravado.
    const reconstruido = new Decimal(calcularTotalItem(quantidade, unitario)).mul(numeroEmbalagens);
    if (!reconstruido.eq(precoTotal)) {
        throw new PrecoInvalidoError('O preço total informado não pode ser representado com essa quantidade e um preço unitário de até duas casas decimais. Confira a quantidade, a unidade e o total.');
    }
    return unitario;
}

function somarTotalItens(itens) {
    let totalCentavos = 0;
    for (const item of itens) {
        const totalItem = calcularTotalItem(item.quantidade, validarValorUnitario(item.valor_unitario));
        totalCentavos += Math.round(totalItem * 100);
        if (!Number.isSafeInteger(totalCentavos) || totalCentavos > MAX_CENTAVOS) {
            throw new PrecoInvalidoError('O valor total da compra ultrapassa o limite do banco.');
        }
    }
    return totalCentavos / 100;
}

module.exports = {
    valorUnitarioRepresentavel,
    validarValorUnitario,
    validarPrecoTotal,
    calcularTotalItem,
    inferirValorUnitario,
    somarTotalItens,
    PrecoInvalidoError
};
