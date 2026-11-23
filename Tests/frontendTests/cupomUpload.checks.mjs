import test from 'node:test';
import assert from 'node:assert/strict';
import { digitalizarCupons } from '../../Frontend/src/services/cupom.js';

const foto = 'data:image/png;base64,aW1hZ2Vt';
const fetchOriginal = globalThis.fetch;

test('converte as fotos em multipart, envia a sessão e preserva a resposta OCR', async (t) => {
    const resultado = {
        resultados: [{
            texto: 'ARROZ',
            itens: [],
            itens_alimenticios: [{ nome_padronizado: 'Arroz', quantidade: 1, medida: 'kg', valor_unitario: 5 }]
        }]
    };
    const resultadoEsperado = { resultados: [...resultado.resultados, ...resultado.resultados] };
    let envios = 0;
    t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
        if (url.startsWith('data:')) return fetchOriginal(url);
        envios++;
        assert.equal(url, 'http://localhost:3000/api/cupons/digitalizar');
        assert.equal(opcoes.method, 'POST');
        assert.equal(opcoes.credentials, 'include');
        assert.equal(opcoes.headers, undefined);
        const imagens = opcoes.body.getAll('imagens');
        assert.equal(imagens.length, 1);
        assert.equal(imagens[0].type, 'image/png');
        assert.equal(await imagens[0].text(), 'imagem');
        return { status: 200, ok: true, json: async () => resultado };
    });
    assert.deepEqual(await digitalizarCupons([foto, foto]), resultadoEsperado);
    assert.equal(envios, 2);
});

test('propaga erro da API para permitir uma nova tentativa sem apagar as fotos', async (t) => {
    t.mock.method(globalThis, 'fetch', async (url) => url.startsWith('data:')
        ? fetchOriginal(url)
        : { status: 500, ok: false, json: async () => ({ error: 'OCR indisponível.' }) });
    const fotos = [foto];
    await assert.rejects(digitalizarCupons(fotos), /OCR indisponível/);
    assert.deepEqual(fotos, [foto]);
});

test('valida quantidade e tipo de arquivo antes de enviar à API', async (t) => {
    const fetch = t.mock.method(globalThis, 'fetch', fetchOriginal);
    await assert.rejects(digitalizarCupons([]), /1 a 10/);
    await assert.rejects(digitalizarCupons(Array(11).fill(foto)), /1 a 10/);
    assert.equal(fetch.mock.callCount(), 0);
    await assert.rejects(digitalizarCupons(['data:text/plain;base64,dGV4dG8=']), /apenas imagens/);
    assert.equal(fetch.mock.callCount(), 1);
});
