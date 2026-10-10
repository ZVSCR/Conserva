const UNIDADES_VARIAVEIS = new Set(['kg', 'g', 'L', 'mL']);
const MAX_EMBALAGENS = 100;
const MAX_ITENS_EXPANDIDOS = 500;
const MAX_QUANTIDADE = 9999999.99;

function quantidadeRepresentavel(valor) {
    return typeof valor === 'number' && Number.isFinite(valor) &&
        valor >= 0 && valor <= MAX_QUANTIDADE &&
        /^\d+(?:\.\d{1,2})?$/.test(String(valor));
}

function tipoMedida(item) {
    return item.tipo_medida ?? (item.unidade_de_medida === 'un' ? 'unitaria' : 'variavel');
}

function normalizarItens(itens) {
    return itens.flatMap((item) => {
        const { numero_embalagens, ...dados } = item;
        const tipo_medida = tipoMedida(item);
        const total = tipo_medida === 'variavel' ? (numero_embalagens ?? 1) : 1;

        return Array.from({ length: total }, () => ({ ...dados, tipo_medida }));
    });
}

module.exports = {
    UNIDADES_VARIAVEIS,
    MAX_EMBALAGENS,
    MAX_ITENS_EXPANDIDOS,
    quantidadeRepresentavel,
    tipoMedida,
    normalizarItens
};
