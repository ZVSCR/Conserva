jest.mock('../../Backend/src/repositories/ingredienteRepository', () => ({
    inserirIngredientesPadrao: jest.fn(),
    createIngredienteRepo: jest.fn(),
    deleteIngredienteRepo: jest.fn()
}));

const { listaIngredientes, aliasesToNome } = require('../../Backend/src/data/ingredientes');
const { inserirIngredientesPadrao, createIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');
const {
    adicionarItem,
    identificarIngredientePadrao,
    identificarIngredienteCandidato,
    validarCatalogoIngredientes,
    garantirIngredientesPadrao,
    createIngredienteService
} = require('../../Backend/src/services/ingredienteService');

const { deleteIngredienteService } = require('../../Backend/src/services/ingredienteService');
const { deleteIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');

beforeEach(() => jest.clearAllMocks());

describe('exclusão de ingrediente', () => {
    test('administrador exclui ingrediente existente', async () => {
        deleteIngredienteRepo.mockResolvedValue({ id: 12 });
        await expect(deleteIngredienteService(12, 1)).resolves.toEqual({ id: 12 });
        expect(deleteIngredienteRepo).toHaveBeenCalledWith(12);
        expect(deleteIngredienteRepo).toHaveBeenCalledTimes(1);
    });

    test.each([2, 3, undefined, null, '1'])('usuário %p não pode excluir', async (usuarioId) => {
        await expect(deleteIngredienteService(12, usuarioId)).rejects.toMatchObject({ statusCode: 403 });
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test('ingrediente inexistente gera erro de domínio', async () => {
        deleteIngredienteRepo.mockResolvedValue(undefined);
        await expect(deleteIngredienteService(12, 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('propaga falha do repositório', async () => {
        const erro = new Error('Banco indisponível');
        deleteIngredienteRepo.mockRejectedValue(erro);
        await expect(deleteIngredienteService(12, 1)).rejects.toBe(erro);
    });
});

test('todos os aliases apontam para um ingrediente canônico sem duplicatas', () => {
    const nomes = validarCatalogoIngredientes();
    expect(new Set(nomes).size).toBe(nomes.length);
    expect(nomes).toContain('leite');
    expect(aliasesToNome['leite integral']).toBe('leite');
    expect(nomes).toContain('ovo');
    expect(aliasesToNome.ovos).toBe('ovo');
});

test('rejeita ingrediente repetido e alias sem destino', () => {
    expect(() => validarCatalogoIngredientes(
        { leite: 'leite', outro: 'leite' }, { leite: 'leite' }
    )).toThrow('Ingrediente duplicado');
    expect(() => validarCatalogoIngredientes(
        { leite: 'leite' }, { leite: 'iogurte' }
    )).toThrow('Alias inválido');
});

test('rejeita aliases equivalentes que apontam para ingredientes diferentes', () => {
    expect(() => validarCatalogoIngredientes(
        { leite: 'leite', iogurte: 'iogurte' },
        { cafe: 'leite', 'café': 'iogurte' }
    )).toThrow('ingredientes distintos');
});

test('preserva a resolução existente e deixa nomes desconhecidos pendentes', () => {
    expect(adicionarItem('Leite integral A 1L')).toEqual({ needsName: false, item: 'leite' });
    expect(adicionarItem('Produto sem alias')).toEqual({
        needsName: true,
        rawItem: 'produto sem alias'
    });
    expect(identificarIngredientePadrao('Leite marca A 1L')).toBe('leite');
    expect(identificarIngredientePadrao('Produto sem alias')).toBeNull();
    expect(identificarIngredienteCandidato('Leite marca A 1L'))
        .toEqual({ nome: 'leite', obrigatorio: true });
    expect(identificarIngredienteCandidato('Coco Ralado'))
        .toEqual({ nome: 'coco ralado', obrigatorio: false });
    expect(identificarIngredienteCandidato('!!!'))
        .toEqual({ nome: null, obrigatorio: false });
});

test('valida o catálogo antes de enviar nomes únicos à rotina de inserção', async () => {
    inserirIngredientesPadrao.mockResolvedValue(3);

    await expect(garantirIngredientesPadrao()).resolves.toBe(3);
    expect(inserirIngredientesPadrao).toHaveBeenCalledTimes(1);
    expect(inserirIngredientesPadrao).toHaveBeenCalledWith(Object.values(listaIngredientes));
});

test('cadastro pela API resolve aliases exatos e mantém nomes novos', async () => {
    createIngredienteRepo.mockImplementation(async (nome) => ({ id: 1, nome }));

    await expect(createIngredienteService({ nome: 'Ovos' })).resolves.toEqual({ id: 1, nome: 'ovo' });
    await expect(createIngredienteService({ nome: 'Coco Ralado' }))
        .resolves.toEqual({ id: 1, nome: 'coco ralado' });
    expect(createIngredienteRepo).toHaveBeenNthCalledWith(1, 'ovo');
    expect(createIngredienteRepo).toHaveBeenNthCalledWith(2, 'coco ralado');
});
