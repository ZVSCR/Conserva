jest.mock('../../Backend/src/services/cupomService', () => ({ extrairCupom: jest.fn() }));

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { extrairCupom } = require('../../Backend/src/services/cupomService');
const { extrairCuponsEnviados } = require('../../Backend/src/services/cupomUploadService');

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
