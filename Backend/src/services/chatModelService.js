const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const TIPOS_IMAGEM_SUPORTADOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function processarImagemComGemini(imagem, mimeType, listaReferencia, dataCompra) {
    const apiUrl = process.env.CHAT_MODEL_API_URL;
    const apiSecret = process.env.INTERNAL_API_SECRET;
    if (!apiUrl) {
        throw new Error('Configure CHAT_MODEL_API_URL para conectar ao serviço Gemini.');
    }
    if (!apiSecret) {
        throw new Error('Configure INTERNAL_API_SECRET para autenticar no serviço Gemini.');
    }

    let url;
    try {
        url = new URL(apiUrl);
    } catch {
        throw new Error('CHAT_MODEL_API_URL deve ser uma URL válida.');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('CHAT_MODEL_API_URL deve usar HTTP ou HTTPS.');
    }
    if (!Buffer.isBuffer(imagem) || !imagem.length) {
        throw new Error('A imagem do cupom está vazia ou inválida.');
    }
    if (imagem.length > MAX_IMAGE_BYTES) {
        throw new Error('Cada imagem deve ter no máximo 3 MB.');
    }
    if (!TIPOS_IMAGEM_SUPORTADOS.has(mimeType)) {
        throw new Error('Formato de imagem não suportado. Use JPEG, PNG ou WebP.');
    }

    const resposta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-secret': apiSecret
        },
        body: JSON.stringify({
            image_base64: imagem.toString('base64'),
            mime_type: mimeType,
            lista_referencia: listaReferencia,
            data_compra: dataCompra
        })
    });

    let resultado;
    try {
        resultado = await resposta.json();
    } catch {
        throw new Error(`O serviço Gemini retornou uma resposta inválida (HTTP ${resposta.status}).`);
    }

    if (!resposta.ok) {
        const detalhe = resultado?.detail || resultado?.error || `HTTP ${resposta.status}`;
        throw new Error(`Falha no serviço Gemini: ${detalhe}`);
    }
    if (!resultado || typeof resultado.ocr_text !== 'string'
        || !Array.isArray(resultado.itens_alimenticios)) {
        throw new Error('O serviço Gemini retornou um formato de resposta inválido.');
    }

    return resultado;
}

module.exports = { processarImagemComGemini, MAX_IMAGE_BYTES, TIPOS_IMAGEM_SUPORTADOS };
