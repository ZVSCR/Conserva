const { processarCupomComGemini } = require('../../Backend/src/services/chatModelService');

describe('processarCupomComGemini', () => {
    const originalUrl = process.env.CHAT_MODEL_API_URL;
    const originalSecret = process.env.INTERNAL_API_SECRET;
    const fetchOriginal = global.fetch;

    beforeEach(() => {
        process.env.CHAT_MODEL_API_URL = 'https://gemini.example.com/api/v1/process-receipt';
        process.env.INTERNAL_API_SECRET = 'test-secret';
        global.fetch = jest.fn();
    });

    afterEach(() => {
        if (originalUrl === undefined) delete process.env.CHAT_MODEL_API_URL;
        else process.env.CHAT_MODEL_API_URL = originalUrl;
        if (originalSecret === undefined) delete process.env.INTERNAL_API_SECRET;
        else process.env.INTERNAL_API_SECRET = originalSecret;
        global.fetch = fetchOriginal;
    });

    test('envia texto OCR e referência ao endpoint configurado com autenticação interna', async () => {
        const resultado = { itens_alimenticios: [] };
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => resultado
        });

        await expect(processarCupomComGemini('ARROZ 1KG', ['arroz'])).resolves.toBe(resultado);
        expect(global.fetch).toHaveBeenCalledWith(
            new URL('https://gemini.example.com/api/v1/process-receipt'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-secret': 'test-secret'
                },
                body: JSON.stringify({
                    ocr_text: 'ARROZ 1KG',
                    lista_referencia: ['arroz']
                })
            })
        );
    });

    test('propaga erros HTTP informados pelo serviço Gemini', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 503,
            json: async () => ({ detail: 'Modelos indisponíveis' })
        });

        await expect(processarCupomComGemini('texto', []))
            .rejects.toThrow('Falha no serviço Gemini: Modelos indisponíveis');
    });

    test('falha claramente quando falta a URL de deploy ou o segredo', async () => {
        delete process.env.CHAT_MODEL_API_URL;
        await expect(processarCupomComGemini('texto', []))
            .rejects.toThrow('Configure CHAT_MODEL_API_URL');

        process.env.CHAT_MODEL_API_URL = 'https://gemini.example.com';
        delete process.env.INTERNAL_API_SECRET;
        await expect(processarCupomComGemini('texto', []))
            .rejects.toThrow('Configure INTERNAL_API_SECRET');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
