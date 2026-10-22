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

function somarTotalItens(itens) {
    let totalCentavos = 0;
    for (const item of itens) {
        const centavosUnitarios = Math.round(validarValorUnitario(item.valor_unitario) * 100);
        totalCentavos += Math.round(item.quantidade * centavosUnitarios);
        if (!Number.isSafeInteger(totalCentavos) || totalCentavos > MAX_CENTAVOS) {
            throw new PrecoInvalidoError('O valor total da compra ultrapassa o limite do banco.');
        }
    }
    return totalCentavos / 100;
}

module.exports = {
    valorUnitarioRepresentavel,
    validarValorUnitario,
    somarTotalItens,
    PrecoInvalidoError
};
