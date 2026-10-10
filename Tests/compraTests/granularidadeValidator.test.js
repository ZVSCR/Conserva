const { validateItem, validateItensPayload } = require('../../Backend/src/middleware/compraValidator');
const { normalizarItens } = require('../../Backend/src/services/granularidadeService');

const itemBase = {
    nome_item: 'Granola',
    quantidade: 0.5,
    unidade_de_medida: 'kg',
    valor_unitario: 20
};

test('preserva clientes antigos e classifica pela unidade', () => {
    expect(validateItem(itemBase, 0)).toEqual([]);
    expect(normalizarItens([{ ...itemBase, nome_item: 'Maçã', quantidade: 3, unidade_de_medida: 'un' }]))
        .toEqual([{ ...itemBase, nome_item: 'Maçã', quantidade: 3, unidade_de_medida: 'un', tipo_medida: 'unitaria' }]);
});

test('mantém três maçãs em um lote e expande duas embalagens variáveis', () => {
    const maca = { ...itemBase, nome_item: 'Maçã', quantidade: 3, unidade_de_medida: 'un', tipo_medida: 'unitaria' };
    const granola = { ...itemBase, tipo_medida: 'variavel', numero_embalagens: 2 };
    expect(validateItensPayload({ itens: [maca, granola] }).isValid).toBe(true);
    expect(normalizarItens([maca, granola])).toEqual([
        maca,
        { ...itemBase, tipo_medida: 'variavel' },
        { ...itemBase, tipo_medida: 'variavel' }
    ]);
});

test.each([
    [{ quantidade: 1.5, unidade_de_medida: 'un' }, 'quantidade'],
    [{ tipo_medida: 'unitaria' }, 'unidade_de_medida'],
    [{ tipo_medida: 'variavel', unidade_de_medida: 'un' }, 'unidade_de_medida'],
    [{ tipo_medida: 'pacote' }, 'tipo_medida'],
    [{ numero_embalagens: 0 }, 'numero_embalagens'],
    [{ numero_embalagens: 101 }, 'numero_embalagens']
])('rejeita combinação inválida %p', (overrides, field) => {
    expect(validateItem({ ...itemBase, ...overrides }, 0))
        .toContainEqual(expect.objectContaining({ field: `itens[0].${field}` }));
});

test('limita o número total de embalagens expandidas', () => {
    const itens = Array.from({ length: 6 }, () => ({ ...itemBase, numero_embalagens: 100 }));
    expect(validateItensPayload({ itens }).errors)
        .toContainEqual(expect.objectContaining({ field: 'itens' }));
});
