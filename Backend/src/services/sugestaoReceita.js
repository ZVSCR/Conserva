// Regras de negócio puras (sem banco) para sugerir receitas a partir do que está perto de vencer.
const DIAS_PADRAO = 3;
const TOLERANCIA = 1e-6;

// Cada unidade pertence a uma família e tem um fator até a unidade base (g, mL ou un).
const UNIDADES = {
    un: { familia: 'unidade', fator: 1 },
    g: { familia: 'massa', fator: 1 },
    kg: { familia: 'massa', fator: 1000 },
    mL: { familia: 'volume', fator: 1 },
    L: { familia: 'volume', fator: 1000 },
};

function paraBase(quantidade, unidade) {
    const info = UNIDADES[unidade];
    const valor = Number(quantidade);
    if (!info || !Number.isFinite(valor)) return null;
    return { familia: info.familia, quantidade: valor * info.fator };
}

function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

// estoque: linhas de { ingrediente_id, unidade_de_medida, quantidade_disponivel, dias_para_vencer }
// receitas: { id, nome, descricao, ingredientes: [{ ingrediente_id, nome, quantidade, unidade_de_medida }] }
function calcularSugestoes(receitas, estoque, dias = DIAS_PADRAO) {
    const lotesPorIngrediente = new Map();
    for (const linha of estoque) {
        const base = paraBase(linha.quantidade_disponivel, linha.unidade_de_medida);
        if (!base || base.quantidade <= 0 || linha.ingrediente_id == null) continue;

        const lotes = lotesPorIngrediente.get(linha.ingrediente_id) ?? [];
        lotes.push({
            ...base,
            diasParaVencer: linha.dias_para_vencer == null ? null : Number(linha.dias_para_vencer),
        });
        lotesPorIngrediente.set(linha.ingrediente_id, lotes);
    }

    const sugestoes = [];

    for (const receita of receitas) {
        const vencendo = [];
        const faltando = [];

        for (const ingrediente of receita.ingredientes ?? []) {
            // Lotes já vencidos não contam: não faz sentido sugerir cozinhar com eles.
            const lotes = (lotesPorIngrediente.get(ingrediente.ingrediente_id) ?? [])
                .filter((lote) => lote.diasParaVencer === null || lote.diasParaVencer >= 0);

            const diasDosLotes = lotes
                .map((lote) => lote.diasParaVencer)
                .filter((valor) => valor !== null && valor <= dias);
            if (diasDosLotes.length > 0) {
                vencendo.push({
                    ingrediente_id: ingrediente.ingrediente_id,
                    nome: ingrediente.nome,
                    dias_para_vencer: Math.min(...diasDosLotes),
                });
            }

            const necessario = paraBase(ingrediente.quantidade, ingrediente.unidade_de_medida);
            if (!necessario) continue;

            const mesmaFamilia = lotes.filter((lote) => lote.familia === necessario.familia);
            const disponivel = mesmaFamilia.reduce((soma, lote) => soma + lote.quantidade, 0);
            if (disponivel + TOLERANCIA >= necessario.quantidade) continue;

            const item = {
                ingrediente_id: ingrediente.ingrediente_id,
                nome: ingrediente.nome,
                unidade_de_medida: ingrediente.unidade_de_medida,
            };

            if (mesmaFamilia.length > 0) {
                const fator = UNIDADES[ingrediente.unidade_de_medida].fator;
                faltando.push({
                    ...item,
                    quantidade: arredondar((necessario.quantidade - disponivel) / fator),
                    motivo: 'insuficiente',
                });
            } else {
                faltando.push({
                    ...item,
                    quantidade: arredondar(Number(ingrediente.quantidade)),
                    motivo: lotes.length > 0 ? 'unidade_diferente' : 'ausente',
                });
            }
        }

        if (vencendo.length === 0) continue;

        vencendo.sort((a, b) => a.dias_para_vencer - b.dias_para_vencer || a.nome.localeCompare(b.nome, 'pt-BR'));

        sugestoes.push({
            id: receita.id,
            nome: receita.nome,
            descricao: receita.descricao ?? null,
            ingredientes_vencendo: vencendo,
            faltando,
            pode_preparar: faltando.length === 0,
            proxima_validade_dias: vencendo[0].dias_para_vencer,
        });
    }

    return sugestoes.sort((a, b) =>
        a.proxima_validade_dias - b.proxima_validade_dias ||
        a.faltando.length - b.faltando.length ||
        b.ingredientes_vencendo.length - a.ingredientes_vencendo.length ||
        a.nome.localeCompare(b.nome, 'pt-BR')
    );
}

module.exports = { calcularSugestoes, DIAS_PADRAO };