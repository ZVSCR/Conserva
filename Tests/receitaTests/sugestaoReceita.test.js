const { calcularSugestoes, DIAS_PADRAO } = require('../../Backend/src/services/sugestaoReceita');

const leite = { ingrediente_id: 1, nome: 'leite' };
const farinha = { ingrediente_id: 2, nome: 'farinha de trigo' };
const ovo = { ingrediente_id: 3, nome: 'ovo' };

function receita(id, nome, ingredientes) {
    return { id, nome, descricao: `${nome}...`, ingredientes };
}

function estoque(ingrediente_id, quantidade_disponivel, unidade_de_medida, dias_para_vencer) {
    return { ingrediente_id, quantidade_disponivel, unidade_de_medida, dias_para_vencer };
}

describe('calcularSugestoes', () => {

    test('usa 3 dias como padrão.', () => {
        expect(DIAS_PADRAO).toBe(3);
    });

    test('não sugere nada quando nenhum item está perto de vencer.', () => {
        const receitas = [receita(1, 'Panqueca', [{ ...leite, quantidade: 200, unidade_de_medida: 'mL' }])];

        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', 10)])).toEqual([]);
        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', null)])).toEqual([]);
        expect(calcularSugestoes(receitas, [])).toEqual([]);
    });

    test('sugere a receita que usa um ingrediente a vencer e indica que pode ser feita.', () => {
        const receitas = [receita(1, 'Panqueca', [{ ...leite, quantidade: 200, unidade_de_medida: 'mL' }])];

        const resultado = calcularSugestoes(receitas, [estoque(1, 1, 'L', 2)]);

        expect(resultado).toHaveLength(1);
        expect(resultado[0].id).toBe(1);
        expect(resultado[0].ingredientes_vencendo).toEqual([{ ingrediente_id: 1, nome: 'leite', dias_para_vencer: 2 }]);
        expect(resultado[0].faltando).toEqual([]);
        expect(resultado[0].pode_preparar).toBe(true);
        expect(resultado[0].proxima_validade_dias).toBe(2);
    });

    test('considera o limite de dias informado (inclusive).', () => {
        const receitas = [receita(1, 'Panqueca', [{ ...leite, quantidade: 200, unidade_de_medida: 'mL' }])];

        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', 3)])).toHaveLength(1);
        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', 4)])).toHaveLength(0);
        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', 4)], 5)).toHaveLength(1);
    });

    test('ignora lotes já vencidos, tanto para sugerir quanto como disponíveis.', () => {
        const receitas = [receita(1, 'Panqueca', [{ ...leite, quantidade: 200, unidade_de_medida: 'mL' }])];

        expect(calcularSugestoes(receitas, [estoque(1, 1, 'L', -1)])).toEqual([]);

        // Um lote vencido e outro ainda bom: o vencido não conta como saldo.
        const resultado = calcularSugestoes(receitas, [
            estoque(1, 1, 'L', -2),
            estoque(1, 100, 'mL', 1),
        ]);
        expect(resultado[0].pode_preparar).toBe(false);
        expect(resultado[0].faltando[0]).toEqual({
            ingrediente_id: 1, nome: 'leite', unidade_de_medida: 'mL', quantidade: 100, motivo: 'insuficiente',
        });
    });

    test('converte unidades da mesma família (kg e g).', () => {
        const receitas = [receita(1, 'Bolo', [
            { ...farinha, quantidade: 1, unidade_de_medida: 'kg' },
            { ...leite, quantidade: 200, unidade_de_medida: 'mL' },
        ])];

        const resultado = calcularSugestoes(receitas, [
            estoque(2, 1000, 'g', null),
            estoque(1, 1, 'L', 1),
        ]);

        expect(resultado[0].pode_preparar).toBe(true);
    });

    test('soma lotes do mesmo ingrediente e usa o que vence primeiro.', () => {
        const receitas = [receita(1, 'Bolo', [{ ...leite, quantidade: 500, unidade_de_medida: 'mL' }])];

        const resultado = calcularSugestoes(receitas, [
            estoque(1, 300, 'mL', 9),
            estoque(1, 300, 'mL', 2),
        ]);

        expect(resultado[0].pode_preparar).toBe(true);
        expect(resultado[0].ingredientes_vencendo[0].dias_para_vencer).toBe(2);
    });

    test('informa quanto falta, na unidade da receita, quando o saldo é insuficiente.', () => {
        const receitas = [receita(1, 'Bolo', [
            { ...leite, quantidade: 500, unidade_de_medida: 'g' },
            { ...farinha, quantidade: 1, unidade_de_medida: 'kg' },
        ])];

        const resultado = calcularSugestoes(receitas, [
            estoque(1, 0.3, 'kg', 1),
            estoque(2, 400, 'g', null),
        ]);

        expect(resultado[0].pode_preparar).toBe(false);
        expect(resultado[0].faltando).toEqual([
            { ingrediente_id: 1, nome: 'leite', unidade_de_medida: 'g', quantidade: 200, motivo: 'insuficiente' },
            { ingrediente_id: 2, nome: 'farinha de trigo', unidade_de_medida: 'kg', quantidade: 0.6, motivo: 'insuficiente' },
        ]);
    });

    test('marca ingredientes ausentes e em unidade incompatível.', () => {
        const receitas = [receita(1, 'Omelete', [
            { ...leite, quantidade: 100, unidade_de_medida: 'mL' },
            { ...ovo, quantidade: 2, unidade_de_medida: 'un' },
            { ...farinha, quantidade: 2, unidade_de_medida: 'un' },
        ])];

        const resultado = calcularSugestoes(receitas, [
            estoque(1, 1, 'L', 1),
            estoque(2, 1, 'kg', null),
        ]);

        expect(resultado[0].faltando).toEqual([
            { ingrediente_id: 3, nome: 'ovo', unidade_de_medida: 'un', quantidade: 2, motivo: 'ausente' },
            { ingrediente_id: 2, nome: 'farinha de trigo', unidade_de_medida: 'un', quantidade: 2, motivo: 'unidade_diferente' },
        ]);
    });

    test('aceita quantidades como texto, como o NUMERIC do Postgres devolve.', () => {
        const receitas = [receita(1, 'Panqueca', [{ ...leite, quantidade: '200.00', unidade_de_medida: 'mL' }])];

        const resultado = calcularSugestoes(receitas, [estoque(1, '1.00', 'L', '2')]);

        expect(resultado[0].pode_preparar).toBe(true);
        expect(resultado[0].proxima_validade_dias).toBe(2);
    });

    test('ordena por vencimento, depois por menos itens faltando.', () => {
        const receitas = [
            receita(1, 'Zebra', [{ ...leite, quantidade: 100, unidade_de_medida: 'mL' }, { ...ovo, quantidade: 1, unidade_de_medida: 'un' }]),
            receita(2, 'Alfa', [{ ...leite, quantidade: 100, unidade_de_medida: 'mL' }]),
            receita(3, 'Beta', [{ ...farinha, quantidade: 100, unidade_de_medida: 'g' }]),
        ];

        const resultado = calcularSugestoes(receitas, [
            estoque(1, 1, 'L', 2),
            estoque(2, 1, 'kg', 1),
        ]);

        expect(resultado.map((s) => s.id)).toEqual([3, 2, 1]);
    });

    test('lida com receita sem ingredientes e estoque sem classificação.', () => {
        const receitas = [{ id: 1, nome: 'Vazia' }, receita(2, 'Panqueca', [{ ...leite, quantidade: 100, unidade_de_medida: 'mL' }])];

        const resultado = calcularSugestoes(receitas, [
            estoque(null, 1, 'L', 1),
            estoque(1, 1, 'L', 1),
        ]);

        expect(resultado.map((s) => s.id)).toEqual([2]);
    });
});