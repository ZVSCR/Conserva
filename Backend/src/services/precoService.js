class PrecoInvalidoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PrecoInvalidoError';
    }
}

function calcularValorUnitario(valorTotalItem, quantidade) {
    if (typeof valorTotalItem !== 'number' || !Number.isFinite(valorTotalItem) || valorTotalItem < 0) {
        throw new PrecoInvalidoError('valor_total_item deve ser um número maior ou igual a zero.');
    }
    if (typeof quantidade !== 'number' || !Number.isFinite(quantidade) || quantidade <= 0) {
        throw new PrecoInvalidoError('quantidade deve ser um número maior que zero.');
    }
    const centavos = (valorTotalItem / quantidade) * 100;
    return Math.round(Number(centavos.toFixed(6))) / 100;
}

module.exports = { calcularValorUnitario, PrecoInvalidoError };