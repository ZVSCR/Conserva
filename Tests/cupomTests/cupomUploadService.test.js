jest.mock('../../Backend/src/services/cupomService', () => ({ extrairCupom: jest.fn() }));
jest.mock('../../Backend/src/services/ingredienteService', () => ({ listIngredientesService: jest.fn() }));
jest.mock('../../Backend/src/services/chatModelService', () => ({ processarCupomComGemini: jest.fn() }));

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { extrairCupom } = require('../../Backend/src/services/cupomService');
const { listIngredientesService } = require('../../Backend/src/services/ingredienteService');
const { processarCupomComGemini } = require('../../Backend/src/services/chatModelService');
const { extrairCuponsEnviados } = require('../../Backend/src/services/cupomUploadService');

beforeEach(() => {
    jest.clearAllMocks();
});

test('envia cada resultado OCR ao Gemini usando o catálogo e preserva o retorno do OCR', async () => {
    const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-cupom-gemini-'));
    const arquivo = { path: path.join(diretorio, 'cupom.png') };
    const resultadoOcr = { texto: 'ARROZ 1KG', itens: [] };
    const resultadoGemini = { itens_alimenticios: [{ nome_padronizado: 'arroz' }] };
    await fs.writeFile(arquivo.path, 'imagem');
    listIngredientesService.mockResolvedValue([{ id: 1, nome: 'arroz' }]);
    extrairCupom.mockResolvedValue(resultadoOcr);
    processarCupomComGemini.mockResolvedValue(resultadoGemini);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
        await expect(extrairCuponsEnviados([arquivo])).resolves.toEqual([resultadoOcr]);
        expect(processarCupomComGemini).toHaveBeenCalledWith('ARROZ 1KG', ['arroz']);
        expect(log).toHaveBeenCalledWith('Resultado do modelo Gemini para o cupom:', resultadoGemini);
    } finally {
        log.mockRestore();
        await fs.rmdir(diretorio);
    }
});

test('remove arquivos temporários quando o processamento Gemini falha', async () => {
    const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-cupom-gemini-'));
    const arquivo = { path: path.join(diretorio, 'cupom.png') };
    await fs.writeFile(arquivo.path, 'imagem');
    listIngredientesService.mockResolvedValue([]);
    extrairCupom.mockResolvedValue({ texto: 'ARROZ', itens: [] });
    processarCupomComGemini.mockRejectedValue(new Error('Gemini indisponível'));

    try {
        await expect(extrairCuponsEnviados([arquivo])).rejects.toThrow('Gemini indisponível');
        await expect(fs.access(arquivo.path)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
        await fs.rmdir(diretorio);
    }
});

test('remove todos os arquivos do lote, inclusive os não processados, após falha', async () => {
    const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-cupom-'));
    const arquivos = ['primeiro', 'segundo'].map((nome) => ({ path: path.join(diretorio, nome) }));
    try {
        for (const arquivo of arquivos) await fs.writeFile(arquivo.path, 'imagem');
        extrairCupom.mockRejectedValue(new Error('OCR falhou'));
        await expect(extrairCuponsEnviados(arquivos)).rejects.toThrow('OCR falhou');
        expect(extrairCupom).toHaveBeenCalledTimes(1);
        for (const arquivo of arquivos) await expect(fs.access(arquivo.path)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
        for (const arquivo of arquivos) await fs.unlink(arquivo.path).catch(() => {});
        await fs.rmdir(diretorio);
    }
});
