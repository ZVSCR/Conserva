import test from 'node:test';
import assert from 'node:assert/strict';
import { abrirCameraCupom, capturarFotoCupom, pararCameraCupom } from '../../Frontend/src/services/cameraCupom.js';

function substituirGlobal(t, nome, valor) {
    const anterior = Object.getOwnPropertyDescriptor(globalThis, nome);
    Object.defineProperty(globalThis, nome, { configurable: true, writable: true, value: valor });
    t.after(() => {
        if (anterior) Object.defineProperty(globalThis, nome, anterior);
        else delete globalThis[nome];
    });
}

test('solicita somente a câmera traseira, sem áudio', async (t) => {
    const stream = {};
    const getUserMedia = t.mock.fn(async () => stream);
    substituirGlobal(t, 'navigator', { mediaDevices: { getUserMedia } });
    assert.equal(await abrirCameraCupom(), stream);
    assert.deepEqual(getUserMedia.mock.calls[0].arguments, [{
        audio: false,
        video: { facingMode: { exact: 'environment' } },
    }]);
});

test('orienta quando a API não está disponível e propaga recusa de permissão', async (t) => {
    substituirGlobal(t, 'navigator', {});
    await assert.rejects(abrirCameraCupom(), /HTTPS/);
    const erro = new Error('Permissão negada');
    navigator.mediaDevices = { getUserMedia: async () => { throw erro; } };
    await assert.rejects(abrirCameraCupom(), (recebido) => recebido === erro);
});

test('desliga todas as faixas da câmera e aceita stream ausente', (t) => {
    const stop = t.mock.fn();
    pararCameraCupom({ getTracks: () => [{ stop }, { stop }] });
    assert.equal(stop.mock.callCount(), 2);
    assert.doesNotThrow(() => pararCameraCupom(null));
});

test('não captura antes de existir um quadro de vídeo', () => {
    assert.throws(() => capturarFotoCupom({ readyState: 0 }), /Aguarde/);
});

test('captura JPEG nas dimensões originais, sem recortar o cupom', (t) => {
    const drawImage = t.mock.fn();
    const toDataURL = t.mock.fn(() => 'data:image/jpeg;base64,foto');
    const canvas = { getContext: () => ({ drawImage }), toDataURL };
    substituirGlobal(t, 'document', { createElement: () => canvas });
    const video = { readyState: 2, videoWidth: 1080, videoHeight: 1920 };
    assert.equal(capturarFotoCupom(video), 'data:image/jpeg;base64,foto');
    assert.equal(canvas.width, 1080);
    assert.equal(canvas.height, 1920);
    assert.deepEqual(drawImage.mock.calls[0].arguments, [video, 0, 0, 1080, 1920]);
    assert.deepEqual(toDataURL.mock.calls[0].arguments, ['image/jpeg', 0.92]);
});
