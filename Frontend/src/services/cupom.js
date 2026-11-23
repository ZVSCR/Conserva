import { apiFetch } from './api.js';
import { getApiErrorMessage } from './apiErrors.js';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;
const TIPOS_IMAGEM_SUPORTADOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function prepararImagem(foto) {
    const resposta = await fetch(foto);
    const imagem = await resposta.blob();
    if (!imagem.type.startsWith('image/')) throw new Error('Selecione apenas imagens.');
    if (imagem.size <= MAX_IMAGE_BYTES && TIPOS_IMAGEM_SUPORTADOS.has(imagem.type)) return imagem;
    if (typeof createImageBitmap !== 'function') {
        throw new Error('Não foi possível preparar a imagem. Use JPEG, PNG ou WebP com até 3 MB.');
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(imagem);
    } catch {
        throw new Error('Não foi possível preparar a imagem. Use JPEG, PNG ou WebP.');
    }

    try {
        let escala = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
        let qualidade = 0.85;
        for (let tentativa = 0; tentativa < 12; tentativa++) {
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(bitmap.width * escala));
            canvas.height = Math.max(1, Math.round(bitmap.height * escala));
            const contexto = canvas.getContext('2d');
            if (!contexto) throw new Error('Não foi possível preparar a imagem.');
            contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            const reduzida = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', qualidade);
            });
            if (!reduzida) throw new Error('Não foi possível preparar a imagem.');
            if (reduzida.size <= MAX_IMAGE_BYTES) return reduzida;
            if (qualidade > 0.6) qualidade -= 0.1;
            else {
                escala *= 0.8;
                qualidade = 0.82;
            }
        }
        throw new Error('A imagem é muito grande para ser processada.');
    } finally {
        bitmap.close();
    }
}

export async function digitalizarCupons(fotos) {
    if (!fotos.length || fotos.length > 10) {
        throw new Error('Selecione de 1 a 10 imagens para digitalizar.');
    }

    const resultados = [];
    for (const [indice, foto] of fotos.entries()) {
        const imagem = await prepararImagem(foto);
        const formulario = new FormData();
        formulario.append('imagens', imagem, `cupom-${indice + 1}`);

        const resposta = await apiFetch('/api/cupons/digitalizar', { method: 'POST', body: formulario });
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(getApiErrorMessage(dados, 'Não foi possível digitalizar os cupons.'));
        }
        if (!Array.isArray(dados.resultados) || dados.resultados.length !== 1) {
            throw new Error('A API retornou um resultado inválido para a imagem.');
        }
        const resultado = dados.resultados[0];
        if (typeof resultado.texto !== 'string' || !Array.isArray(resultado.itens_alimenticios)) {
            throw new Error('A API não retornou os itens padronizados pelo modelo.');
        }
        resultados.push(dados.resultados[0]);
    }
    return { resultados };
}
