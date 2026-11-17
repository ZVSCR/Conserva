const { unlink } = require('node:fs/promises');
const { extrairCupom } = require('./cupomService');
const { listIngredientesService } = require('./ingredienteService');
const { processarCupomComGemini } = require('./chatModelService');

async function extrairCuponsEnviados(arquivos) {
    try {
        let listaReferencia;
        const resultados = [];
        for (const arquivo of arquivos) {
            const resultado = await extrairCupom(arquivo.path);
            if (!listaReferencia) {
                const ingredientes = await listIngredientesService();
                listaReferencia = ingredientes.map(({ nome }) => nome);
            }
            const resultadoGemini = await processarCupomComGemini(resultado.texto, listaReferencia);
            console.log('Resultado do modelo Gemini para o cupom:', resultadoGemini);
            resultados.push(resultado);
        }
        return resultados;
    } finally {
        // Remove também as imagens ainda não processadas quando o OCR falha.
        await Promise.all(arquivos.map((arquivo) => unlink(arquivo.path)));
    }
}

module.exports = { extrairCuponsEnviados };
