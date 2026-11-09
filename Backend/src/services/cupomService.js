const { execFile } = require('node:child_process');
const path = require('node:path');

async function extrairTextoCupom(caminhoImagem) {
    if (typeof caminhoImagem !== 'string' || !caminhoImagem.trim()) {
        throw new Error('Informe o caminho da imagem.');
    }

    const script = path.join(__dirname, '../scripts/extrairTextoCupom.py');
    return new Promise((resolve, reject) => {
        execFile('python', [script, caminhoImagem], { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (erro, stdout) => {
            if (erro) return reject(erro);
            try {
                const texto = JSON.parse(stdout);
                if (typeof texto !== 'string') throw new Error('Resposta OCR invalida.');
                resolve(texto);
            } catch (erroResposta) {
                reject(erroResposta);
            }
        });
    });
}

function extrairItensCupom(texto) {
    // Layout confirmado: indice, codigo, descricao, QTD, UN, VL UN, VL TOT.
    const trechos = texto.replace(/\s+/g, ' ').trim().split(/(?=\b\d+ \d{8,}\b)/);
    const formatoItem = /^\d+ \d{8,} (.+?) (\d+) UN \d+,\d{2} (\d+,\d{2})(?=\s|$)/;

    return trechos.flatMap((trecho) => {
        const item = trecho.match(formatoItem);
        if (!item) return [];
        return [{
            nome_item: item[1],
            quantidade: Number(item[2]),
            preco_total_item: Number(item[3].replace(',', '.'))
        }];
    });
}

async function extrairCupom(caminhoImagem) {
    const texto = await extrairTextoCupom(caminhoImagem);
    return { texto, itens: extrairItensCupom(texto) };
}

module.exports = { extrairTextoCupom, extrairItensCupom, extrairCupom };
