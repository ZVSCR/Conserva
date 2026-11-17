async function processarCupomComGemini(ocrText, listaReferencia) {
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

    const resposta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-secret': apiSecret
        },
        body: JSON.stringify({
            ocr_text: ocrText,
            lista_referencia: listaReferencia
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
    if (!resultado || !Array.isArray(resultado.itens_alimenticios)) {
        throw new Error('O serviço Gemini retornou um formato de resposta inválido.');
    }

    return resultado;
}

module.exports = { processarCupomComGemini };
