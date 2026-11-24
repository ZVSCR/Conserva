const { processarImagemComGemini } = require('../../Backend/src/services/chatModelService');

describe('processarImagemComGemini', () => {
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

    test('envia a imagem e a lista de referencia ao Chat_model autenticado', async () => {
        const resultado = { ocr_text: 'ARROZ 1KG', itens_alimenticios: [] };
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => resultado
        });

        await expect(processarImagemComGemini(Buffer.from('imagem'), 'image/png', ['arroz']))
            .resolves.toBe(resultado);
        expect(global.fetch).toHaveBeenCalledWith(
            new URL('https://gemini.example.com/api/v1/process-receipt'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-secret': 'test-secret'
                },
                body: JSON.stringify({
                    image_base64: Buffer.from('imagem').toString('base64'),
                    mime_type: 'image/png',
                    lista_referencia: ['arroz']
                })
            })
        );
    });

    test('propaga erros HTTP informados pelo Chat_model', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 503,
            json: async () => ({ detail: 'Modelos indisponíveis' })
        });

        await expect(processarImagemComGemini(Buffer.from('imagem'), 'image/png', []))
            .rejects.toThrow('Falha no serviço Gemini: Modelos indisponíveis');
    });

    test('falha claramente quando falta a URL ou o segredo interno', async () => {
        delete process.env.CHAT_MODEL_API_URL;
        await expect(processarImagemComGemini(Buffer.from('imagem'), 'image/png', []))
            .rejects.toThrow('Configure CHAT_MODEL_API_URL');

        process.env.CHAT_MODEL_API_URL = 'https://gemini.example.com';
        delete process.env.INTERNAL_API_SECRET;
        await expect(processarImagemComGemini(Buffer.from('imagem'), 'image/png', []))
            .rejects.toThrow('Configure INTERNAL_API_SECRET');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
