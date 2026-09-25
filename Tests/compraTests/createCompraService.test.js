const {
    createCompraService
} = require('../../Backend/src/services/compraService');

test('deve encaminhar os dois itens para a criação da compra', async () => {
    // Preparar
    const usuarioId = 7;
    const payload = {
        data_compra: '2026-09-20',
        estabelecimento: 'Atacadão',
        itens: [
            {
                nome_item: 'Arroz',
                quantidade: 2,
                unidade_de_medida: 'kg',
                valor_unitario: 8.5
            },
            {
                nome_item: 'Feijão',
                quantidade: 3,
                unidade_de_medida: 'kg',
                valor_unitario: 4
            }
        ]
    };

    const repository = {
        insertCompraBD: jest.fn().mockResolvedValue({ id: 42 })
    };

    // Executar
    await createCompraService(usuarioId, payload, repository);

    // Verificar
    expect(repository.insertCompraBD).toHaveBeenCalledTimes(1);

    const [dadosRecebidos] = repository.insertCompraBD.mock.calls[0];

    expect(dadosRecebidos.itens).toHaveLength(2);
    expect(dadosRecebidos.itens.map(item => item.nome_item))
        .toEqual(['Arroz', 'Feijão']);
});

test('deve garantir associação de cada lote de estoque ao ID do usuário autenticado', () => {

});

test('deve garantir equivalência entre quantidade registrada no lote e quantidade comprada', () => {

});