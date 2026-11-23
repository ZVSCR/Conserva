jest.mock('../../Backend/src/services/cupomService', () => ({ extrairItensCupom: jest.fn() }));
jest.mock('../../Backend/src/services/ingredienteService', () => ({ listIngredientesService: jest.fn() }));
jest.mock('../../Backend/src/services/chatModelService', () => ({ processarImagemComGemini: jest.fn() }));

const request = require('supertest');
const express = require('express');
const { createSessionToken, SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
const { extrairItensCupom } = require('../../Backend/src/services/cupomService');
const { listIngredientesService } = require('../../Backend/src/services/ingredienteService');
const { processarImagemComGemini } = require('../../Backend/src/services/chatModelService');
const cupomRoutes = require('../../Backend/src/routes/cupomRoutes');

const app = express();
app.use('/api/cupons', cupomRoutes);
const imagem = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGioAAAAASUVORK5CYII=', 'base64');
const enviar = () => request(app).post('/api/cupons/digitalizar')
    .set('Cookie', `${SESSION_COOKIE_NAME}=${createSessionToken(1)}`);
let processados = 0;

beforeEach(() => {
    jest.clearAllMocks();
    listIngredientesService.mockResolvedValue([{ id: 1, nome: 'arroz' }]);
    extrairItensCupom.mockReturnValue([]);
    processados = 0;
    processarImagemComGemini.mockImplementation(async (conteudo, mimeType) => {
        expect(conteudo).toEqual(imagem);
        expect(mimeType).toBe('image/png');
        const indice = processados++;
        return {
            ocr_text: `Cupom ${indice + 1}`,
            itens_alimenticios: [{ nome_padronizado: `Item ${indice + 1}` }]
        };
    });
});

test('exige sessão antes de receber as imagens', async () => {
    const resposta = await request(app).post('/api/cupons/digitalizar')
        .attach('imagens', imagem, 'cupom.png');
    expect(resposta.status).toBe(401);
    expect(processarImagemComGemini).not.toHaveBeenCalled();
});

test('retorna ao frontend os itens padronizados de cada imagem', async () => {
    const primeiraResposta = await enviar().attach('imagens', imagem, 'primeiro.png');
    const segundaResposta = await enviar().attach('imagens', imagem, 'segundo.png');

    expect(primeiraResposta.status).toBe(200);
    expect(primeiraResposta.body).toEqual({
        resultados: [{ texto: 'Cupom 1', itens: [], itens_alimenticios: [{ nome_padronizado: 'Item 1' }] }]
    });
    expect(segundaResposta.status).toBe(200);
    expect(segundaResposta.body).toEqual({
        resultados: [{ texto: 'Cupom 2', itens: [], itens_alimenticios: [{ nome_padronizado: 'Item 2' }] }]
    });
    expect(processarImagemComGemini).toHaveBeenCalledTimes(2);
});

test('remove a imagem quando o processamento falha e retorna erro sem detalhes internos', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    processarImagemComGemini.mockRejectedValue(new Error('Falha interna do Gemini'));
    try {
        const resposta = await enviar().attach('imagens', imagem, 'cupom.png');
        expect(resposta.status).toBe(500);
        expect(resposta.body.error).not.toContain('Falha interna');
    } finally {
        log.mockRestore();
    }
});

test('rejeita solicitação sem imagens', async () => {
    expect((await enviar()).status).toBe(400);
    expect(processarImagemComGemini).not.toHaveBeenCalled();
});

test('rejeita campo de upload incorreto e arquivo que não é imagem', async () => {
    expect((await enviar().attach('arquivo', imagem, 'cupom.png')).status).toBe(400);
    expect((await enviar().attach('imagens', Buffer.from('texto'), 'arquivo.txt')).status).toBe(400);
    expect(processarImagemComGemini).not.toHaveBeenCalled();
});

test('rejeita imagens acima do limite de 10 MB', async () => {
    const resposta = await enviar().attach('imagens', Buffer.alloc(10 * 1024 * 1024 + 1), 'grande.png');
    expect(resposta.status).toBe(413);
    expect(processarImagemComGemini).not.toHaveBeenCalled();
});

test('rejeita mais de dez imagens', async () => {
    const requisicao = enviar();
    for (let indice = 0; indice < 11; indice++) requisicao.attach('imagens', imagem, `cupom-${indice}.png`);
    expect((await requisicao).status).toBe(400);
    expect(processarImagemComGemini).not.toHaveBeenCalled();
});
