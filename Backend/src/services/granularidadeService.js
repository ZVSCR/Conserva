const UNIDADES_VARIAVEIS = new Set(['kg', 'g', 'L', 'mL']);
const MAX_EMBALAGENS = 100;
const MAX_ITENS_EXPANDIDOS = 500;

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
    tipoMedida,
    normalizarItens
};
