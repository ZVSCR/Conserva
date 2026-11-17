jest.mock('../../Backend/src/services/cupomService', () => ({ extrairCupom: jest.fn() }));
jest.mock('../../Backend/src/services/ingredienteService', () => ({ listIngredientesService: jest.fn() }));
jest.mock('../../Backend/src/services/chatModelService', () => ({ processarCupomComGemini: jest.fn() }));

const request = require('supertest');
const express = require('express');
const fs = require('node:fs/promises');
const { createSessionToken, SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
const { extrairCupom } = require('../../Backend/src/services/cupomService');
const { listIngredientesService } = require('../../Backend/src/services/ingredienteService');
const { processarCupomComGemini } = require('../../Backend/src/services/chatModelService');
const cupomRoutes = require('../../Backend/src/routes/cupomRoutes');

const app = express();
app.use('/api/cupons', cupomRoutes);
const imagem = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGioAAAAASUVORK5CYII=', 'base64');
const caminhos = [];
const enviar = () => request(app).post('/api/cupons/digitalizar')
    .set('Cookie', `${SESSION_COOKIE_NAME}=${createSessionToken(1)}`);

beforeEach(() => {
    jest.clearAllMocks();
    listIngredientesService.mockResolvedValue([]);
    processarCupomComGemini.mockResolvedValue({ itens_alimenticios: [] });
    caminhos.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    extrairCupom.mockImplementation(async (caminho) => {
        caminhos.push(caminho);
        expect(await fs.readFile(caminho)).toEqual(imagem);
        return { texto: `Cupom ${caminhos.length}`, itens: [] };
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('exige sessão antes de receber as imagens', async () => {
    const resposta = await request(app).post('/api/cupons/digitalizar')
        .attach('imagens', imagem, 'cupom.png');
    expect(resposta.status).toBe(401);
    expect(extrairCupom).not.toHaveBeenCalled();
});

test('entrega as imagens ao OCR em ordem e remove os arquivos temporários', async () => {
    const resposta = await enviar().attach('imagens', imagem, 'primeiro.png')
        .attach('imagens', imagem, 'segundo.png');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ resultados: [
        { texto: 'Cupom 1', itens: [] },
        { texto: 'Cupom 2', itens: [] }
    ] });
    expect(caminhos).toHaveLength(2);
    expect(caminhos[0]).not.toBe(caminhos[1]);
    for (const caminho of caminhos) await expect(fs.access(caminho)).rejects.toMatchObject({ code: 'ENOENT' });
});

test('remove a imagem quando o processo OCR falha e retorna erro sem detalhes internos', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    extrairCupom.mockImplementation(async (caminho) => {
        caminhos.push(caminho);
        throw new Error('Falha interna do Python');
    });
    try {
        const resposta = await enviar().attach('imagens', imagem, 'cupom.png');
        expect(resposta.status).toBe(500);
        expect(resposta.body.error).not.toContain('Falha interna');
        await expect(fs.access(caminhos[0])).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
        log.mockRestore();
    }
});

test('rejeita solicitação sem imagens', async () => {
    expect((await enviar()).status).toBe(400);
    expect(extrairCupom).not.toHaveBeenCalled();
});

test('rejeita campo de upload incorreto e arquivo que não é imagem', async () => {
    expect((await enviar().attach('arquivo', imagem, 'cupom.png')).status).toBe(400);
    expect((await enviar().attach('imagens', Buffer.from('texto'), 'arquivo.txt')).status).toBe(400);
    expect(extrairCupom).not.toHaveBeenCalled();
});

test('rejeita imagens acima do limite de 10 MB', async () => {
    const resposta = await enviar().attach('imagens', Buffer.alloc(10 * 1024 * 1024 + 1), 'grande.png');
    expect(resposta.status).toBe(413);
    expect(extrairCupom).not.toHaveBeenCalled();
});

test('rejeita mais de dez imagens', async () => {
    const requisicao = enviar();
    for (let indice = 0; indice < 11; indice++) requisicao.attach('imagens', imagem, `cupom-${indice}.png`);
    expect((await requisicao).status).toBe(400);
    expect(extrairCupom).not.toHaveBeenCalled();
});
