const {
    inferirValorUnitario, calcularTotalItem, somarTotalItens, PrecoInvalidoError
} = require('../../Backend/src/services/precoService');

test.each([
    [12, 3, 1, 4],
    [8, 0.5, 1, 16],
    [20, 0.5, 2, 20],
    [30, 0.5, 3, 20],
    [0, 3, 1, 0],
    [10, 0.3, 1, 33.33],
    [9999999.99, 1, 1, 9999999.99]
])('converte total %s para quantidade %s em %s registro(s)', (total, quantidade, registros, esperado) => {
    expect(inferirValorUnitario(total, quantidade, registros)).toBe(esperado);
    expect(somarTotalItens(Array.from({ length: registros }, () => ({ quantidade, valor_unitario: esperado })))).toBe(total);
});

test.each([
    [10, 3, 1],       // 3,33 x 3 não conserva os dez reais.
    [8, 500, 1],      // Preço por grama não cabe em duas casas.
    [10, 0.5, 3],     // Embalagens iguais não podem receber 3,333... centavos por preço de pacote.
    [9999999.99, 0.01, 1]
])('rejeita total %s não representável para quantidade %s e %s registro(s)', (total, quantidade, registros) => {
    expect(() => inferirValorUnitario(total, quantidade, registros)).toThrow(PrecoInvalidoError);
});

test.each([null, undefined, '12', -1, NaN, Infinity, 1.234, 10000000])('rejeita preço total inválido %s', total => {
    expect(() => inferirValorUnitario(total, 1)).toThrow(PrecoInvalidoError);
});

test('o arredondamento monetário é por registro e segue a mesma regra do SQL', () => {
    expect(calcularTotalItem(0.5, 15.99)).toBe(8);
    expect(somarTotalItens([{ quantidade: 0.5, valor_unitario: 0.01 }, { quantidade: 0.5, valor_unitario: 0.01 }])).toBe(0.02);
});

test.each([0, -1, NaN, 0.001])('não divide por quantidade inválida %s', quantidade => {
    expect(() => inferirValorUnitario(10, quantidade)).toThrow(PrecoInvalidoError);
});
