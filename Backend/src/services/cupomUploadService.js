const { readFile, unlink } = require('node:fs/promises');
const { extrairItensCupom } = require('./cupomService');
const { listIngredientesService } = require('./ingredienteService');
const { processarImagemComGemini } = require('./chatModelService');

async function extrairCuponsEnviados(arquivos) {
    try {
        const ingredientes = await listIngredientesService();
        const listaReferencia = ingredientes.map(({ nome }) => nome);
        const resultados = [];
        for (const arquivo of arquivos) {
            const imagem = await readFile(arquivo.path);
            const resultadoGemini = await processarImagemComGemini(
                imagem,
                arquivo.mimetype,
                listaReferencia
            );
            console.log(
                'Saída final do modelo Gemini para o cupom:',
                JSON.stringify(resultadoGemini, null, 2)
            );
            resultados.push({
                texto: resultadoGemini.ocr_text,
                itens: extrairItensCupom(resultadoGemini.ocr_text)
            });
        }
        return resultados;
    } finally {
        // Remove também as imagens ainda não processadas quando o OCR falha.
        await Promise.all(arquivos.map((arquivo) => unlink(arquivo.path)));
    }
}

module.exports = { extrairCuponsEnviados };
