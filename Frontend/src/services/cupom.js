import { apiFetch } from './api.js';
import { getApiErrorMessage } from './apiErrors.js';

export async function digitalizarCupons(fotos) {
    if (!fotos.length || fotos.length > 10) {
        throw new Error('Selecione de 1 a 10 imagens para digitalizar.');
    }

    const formulario = new FormData();
    for (const [indice, foto] of fotos.entries()) {
        const imagem = await fetch(foto).then((resposta) => resposta.blob());
        if (!imagem.type.startsWith('image/')) throw new Error('Selecione apenas imagens.');
        if (imagem.size > 10 * 1024 * 1024) throw new Error('Cada imagem deve ter no máximo 10 MB.');
        formulario.append('imagens', imagem, `cupom-${indice + 1}`);
    }

    const resposta = await apiFetch('/api/cupons/digitalizar', { method: 'POST', body: formulario });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(getApiErrorMessage(dados, 'Não foi possível digitalizar os cupons.'));
    return dados;
}
