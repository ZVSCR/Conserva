jest.mock('../../Backend/src/services/cupomService', () => ({ extrairItensCupom: jest.fn() }));
jest.mock('../../Backend/src/services/ingredienteService', () => ({ listIngredientesService: jest.fn() }));
jest.mock('../../Backend/src/services/chatModelService', () => ({ processarImagemComGemini: jest.fn() }));

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { extrairItensCupom } = require('../../Backend/src/services/cupomService');
const { listIngredientesService } = require('../../Backend/src/services/ingredienteService');
const { processarImagemComGemini } = require('../../Backend/src/services/chatModelService');
const { extrairCuponsEnviados } = require('../../Backend/src/services/cupomUploadService');

beforeEach(() => {
    jest.clearAllMocks();
    listIngredientesService.mockResolvedValue([{ id: 1, nome: 'arroz' }]);
    extrairItensCupom.mockReturnValue([]);
});

test('retorna os itens padronizados de cada imagem na ordem recebida', async () => {
    const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-cupom-gemini-'));
    const arquivos = ['primeiro', 'segundo'].map((nome) => ({
        path: path.join(diretorio, nome),
        mimetype: 'image/png'
    }));
    const respostas = [
        { ocr_text: 'ARROZ 1KG', itens_alimenticios: [{ nome_padronizado: 'Arroz', quantidade: 1, medida: 'kg' }] },
        { ocr_text: 'FEIJAO 1KG', itens_alimenticios: [{ nome_padronizado: 'Feijão', quantidade: 1, medida: 'kg' }] }
    ];
    try {
        for (const arquivo of arquivos) await fs.writeFile(arquivo.path, 'imagem');
        processarImagemComGemini
            .mockResolvedValueOnce(respostas[0])
            .mockResolvedValueOnce(respostas[1]);
        extrairItensCupom.mockImplementation((texto) => [{ nome_item: texto }]);

        await expect(extrairCuponsEnviados(arquivos)).resolves.toEqual({
            resultados: [
                { texto: 'ARROZ 1KG', itens: [{ nome_item: 'ARROZ 1KG' }], itens_alimenticios: respostas[0].itens_alimenticios },
                { texto: 'FEIJAO 1KG', itens: [{ nome_item: 'FEIJAO 1KG' }], itens_alimenticios: respostas[1].itens_alimenticios }
            ]
        });
        expect(listIngredientesService).toHaveBeenCalledTimes(1);
        expect(processarImagemComGemini).toHaveBeenNthCalledWith(1, Buffer.from('imagem'), 'image/png', ['arroz']);
        expect(processarImagemComGemini).toHaveBeenNthCalledWith(2, Buffer.from('imagem'), 'image/png', ['arroz']);
        for (const arquivo of arquivos) {
            await expect(fs.access(arquivo.path)).rejects.toMatchObject({ code: 'ENOENT' });
        }
    } finally {
        await fs.rm(diretorio, { recursive: true, force: true });
    }
});

test('remove arquivos temporários quando o processamento Gemini falha', async () => {
    const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-cupom-gemini-'));
    const arquivo = { path: path.join(diretorio, 'cupom.png'), mimetype: 'image/png' };
    try {
        await fs.writeFile(arquivo.path, 'imagem');
        processarImagemComGemini.mockRejectedValue(new Error('Gemini indisponível'));

        await expect(extrairCuponsEnviados([arquivo])).rejects.toThrow('Gemini indisponível');
        await expect(fs.access(arquivo.path)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
        await fs.rm(diretorio, { recursive: true, force: true });
    }
});
