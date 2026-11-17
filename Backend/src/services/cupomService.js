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

module.exports = { extrairItensCupom };
