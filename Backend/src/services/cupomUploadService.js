const { unlink } = require('node:fs/promises');
const { extrairCupom } = require('./cupomService');

async function extrairCuponsEnviados(arquivos) {
    try {
        const resultados = [];
        for (const arquivo of arquivos) {
            resultados.push(await extrairCupom(arquivo.path));
        }
        return resultados;
    } finally {
        // Remove também as imagens ainda não processadas quando o OCR falha.
        await Promise.all(arquivos.map((arquivo) => unlink(arquivo.path)));
    }
}

module.exports = { extrairCuponsEnviados };
