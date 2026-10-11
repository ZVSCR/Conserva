const Decimal = require('decimal.js');
const { prepararReceitaRepo } = require('../repositories/receitaRepository');

const UNIDADES = {
    g:  { familia: 'massa',   fator: 1 },
    kg: { familia: 'massa',   fator: 1000 },
    mL: { familia: 'volume',  fator: 1 },
    L:  { familia: 'volume',  fator: 1000 },
    un: { familia: 'unidade', fator: 1 }
};

// Devolve null quando as unidades são de famílias diferentes (ex: g e un)
function converter(valor, de, para) {
    const origem = UNIDADES[de];
    const destino = UNIDADES[para];
    if (!origem || !destino || origem.familia !== destino.familia) return null;
    return new Decimal(valor).mul(origem.fator).div(destino.fator);
}

// Menor passo que o lote consegue guardar: 2 casas, ou inteiro se for unitário. Exp: 0,005 kg vira 0,01 kg
function arredondarParaCima(valor, tipoMedida) {
    return valor.toDecimalPlaces(tipoMedida === 'unitaria' ? 0 : 2, Decimal.ROUND_UP);
}
// Prioridade:
// 1. Item está aberto
// 2. Está mais próximo de vencer
// Percorre os lotes (já ordenados por prioridade) até cobrir a quantidade da receita

function alocarIngrediente(ingrediente, lotes) {
    const unidadeReceita = ingrediente.unidade_de_medida;
    let restante = new Decimal(ingrediente.quantidade); //Quanto falta para a receita
    let disponivel = new Decimal(0); //Soma do que existe nos lotes
    let haLoteCompativel = false; //Se algum lote tem unidade conversivel
    const usos = []; //Lista de lote X, com tantas unidades

    for (const lote of lotes) {
        if (restante.lte(0)) break;

        const disponivelLote = new Decimal(lote.quantidade_disponivel);
        const naUnidadeReceita = converter(disponivelLote, lote.unidade_de_medida, unidadeReceita);
        if (naUnidadeReceita === null) continue;

        haLoteCompativel = true;
        disponivel = disponivel.plus(naUnidadeReceita);

        const precisoNoLote = arredondarParaCima(
            converter(Decimal.min(restante, naUnidadeReceita), unidadeReceita, lote.unidade_de_medida),
            lote.tipo_medida
        );
        const gasto = Decimal.min(precisoNoLote, disponivelLote);
        const coberto = converter(gasto, lote.unidade_de_medida, unidadeReceita);

        usos.push({ estoque_id: lote.estoque_id, quantidade_gasta: gasto.toFixed(2) });
        restante = Decimal.max(restante.minus(coberto), 0);
    }

    if (restante.gt(0)) {
        let motivo = 'quantidade_insuficiente';
        if (lotes.length === 0) motivo = 'sem_estoque';
        else if (!haLoteCompativel) motivo = 'unidade_incompativel';

        return {
            ok: false,
            faltando: {
                ingrediente_id: ingrediente.ingrediente_id,
                ingrediente: ingrediente.nome,
                necessaria: ingrediente.quantidade,
                unidade: unidadeReceita,
                disponivel: disponivel.toFixed(2),
                motivo
            }
        };
    }

    return { ok: true, usos };
}

// Função pura: não acessa o banco
function planejarPreparo(ingredientes, lotes) {
    const usos = [];
    const faltando = [];

    for (const ingrediente of ingredientes) {
        const lotesDoIngrediente = lotes.filter(
            (lote) => lote.ingrediente_id === ingrediente.ingrediente_id
        );
        const resultado = alocarIngrediente(ingrediente, lotesDoIngrediente);

        if (resultado.ok) usos.push(...resultado.usos);
        else faltando.push(resultado.faltando);
    }

    return { ok: faltando.length === 0, usos, faltando };
}

function prepararReceitaService(usuarioId, receitaId) {
    return prepararReceitaRepo(usuarioId, receitaId, planejarPreparo);
}

function verificarReceitaService(usuarioId, receitaId) {
    return prepararReceitaRepo(usuarioId, receitaId, planejarPreparo, { simular: true });
}

module.exports = { planejarPreparo, converter, prepararReceitaService, verificarReceitaService };