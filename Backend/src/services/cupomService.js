const { spawn } = require('node:child_process');
const path = require('node:path');

async function extrairTextoCupom(caminhoImagem) {
    if (typeof caminhoImagem !== 'string' || !caminhoImagem.trim()) {
        throw new Error('Informe o caminho da imagem.');
    }

    const script = path.join(__dirname, '../scripts/extrairTextoCupom.py');
    return new Promise((resolve, reject) => {
        const executavelPython = process.env.PYTHON_EXECUTABLE
            || 'python';
        const processo = spawn(executavelPython, [script, caminhoImagem], {
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });
        const partes = [];
        let tamanhoSaida = 0;
        let diagnostico = Buffer.alloc(0);
        let erroSaida;

        processo.stdout.on('data', (parte) => {
            if (erroSaida) return;
            tamanhoSaida += parte.length;
            if (tamanhoSaida > 1024 * 1024) {
                erroSaida = new Error('A resposta de texto do OCR ultrapassou o limite de 1 MB.');
                processo.kill();
                return;
            }
            partes.push(parte);
        });
        processo.stderr.on('data', (parte) => {
            // Progresso de downloads e avisos podem ser extensos. Consome tudo,
            // conservando somente o final para diagnosticar uma eventual falha.
            diagnostico = Buffer.concat([diagnostico, parte]).subarray(-64 * 1024);
        });
        processo.on('error', reject);
        processo.on('close', (codigo, sinal) => {
            if (erroSaida) return reject(erroSaida);
            if (codigo !== 0) {
                const erro = new Error(`O processo OCR falhou (${sinal || codigo}).`);
                erro.code = codigo;
                erro.stderr = diagnostico.toString('utf8');
                return reject(erro);
            }
            try {
                const texto = JSON.parse(Buffer.concat(partes).toString('utf8'));
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
