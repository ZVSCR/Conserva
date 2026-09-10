const instancia = [];                                                   // Armazena itens adicionados

const aliasesToNome = {                                                 // Dicionario de nomes conhecidos
    "req": "requeijao",
    "requeijao": "requeijao",
    "leite": "leite",
    "pao": "pao",
    "sal": "sal",
    "banana": "banana",
    "mamao": "mamao",
    "manteiga": "manteiga",
    "mant": "manteiga",
    "margarina": "margarina",
    "marg": "margarina",
    "queijo": "queijo",
    "qjo": "queijo",
    "qj": "queijo",
    "iogurte": "iogurte",
    "iog": "iogurte",
    "creme de leite": "creme de leite",
    "cr leite": "creme de leite",
    "leite condensado": "leite condensado",
    "lt cond": "leite condensado",
    "leite integral": "leite",
    "leite desnatado": "leite",
    "pao frances": "pao",
    "pao de forma": "pao de forma",
    "pao forma": "pao de forma",
    "farinha": "farinha de trigo",
    "far trigo": "farinha de trigo",
    "acucar": "acucar",
    "acuc": "acucar",
    "arroz": "arroz",
    "feijao": "feijao",
    "fj": "feijao",
    "macarrao": "macarrao",
    "macar.": "macarrao",
    "aveia": "aveia",
    "oleo": "oleo de soja",
    "azeite": "azeite de oliva",
    "az": "azeite de oliva",
    "vinagre": "vinagre",
    "pimenta do reino": "pimenta do reino",
    "pim reino": "pimenta do reino",
    "frango": "frango",
    "fgo": "frango",
    "carne bovina": "carne bovina",
    "carne": "carne bovina",
    "carne moida": "carne moida",
    "carne moída": "carne moida",
    "linguica": "linguica",
    "ling": "linguica",
    "bacon": "bacon",
    "peixe": "peixe",
    "maca": "maca",
    "maçã": "maca",
    "laranja": "laranja",
    "lar": "laranja",
    "uva": "uva",
    "abacaxi": "abacaxi",
    "abacax.": "abacaxi",
    "limao": "limao",
    "mel": "melancia",
    "melancia": "melancia",
    "morango": "morango",
    "tomate": "tomate",
    "tom": "tomate",
    "cebola": "cebola",
    "ceb": "cebola",
    "alho": "alho",
    "batata": "batata",
    "bat": "batata",
    "cenoura": "cenoura",
    "cen": "cenoura",
    "alface": "alface",
    "pimentao": "pimentao",
    "cafe": "cafe",
    "café": "cafe",
    "suco": "suco",
    "refrigerante": "refrigerante",
    "refri": "refrigerante",
    "agua": "agua",
    "água": "agua",
    "cerveja": "cerveja",
    "cerv": "cerveja",
};

const aliasesOrdenados = Object.keys(aliasesToNome)
    .sort((a, b) => b.length - a.length);

const map = new Map(Object.entries(aliasesOrdenados));                     // Faz o mapeamento de nomes definidos no dicionario

function parseItem(inputStr) {
    let item = inputStr.toLowerCase();
    let quant;

    const quantidadeEncontrada = item.match(/(\d+(?:\.\d{1,3})?)(\s*(kg|un|g|ml|l))?\b/);

    if (quantidadeEncontrada) {
        quant = parseFloat(quantidadeEncontrada[1]);
        item = item.replace(quantidadeEncontrada[0], '').replace(/\s+/g, ' ').replace(/[.,;:!?]/g, "").trim();          //Normaliza os nomes
    } else {
        item = item.trim();
        quant = 1;
    }

    return { item, quant };
}

function inserirNaInstancia(item, quant) {
    const existing = instancia.find((o) => o.Nome === item);
    if (existing) {
        existing.quantidade += quant;
    } else {
        instancia.push({ Nome: item, quantidade: quant });
    }

    instancia.sort((a, b) => a.Nome.localeCompare(b.Nome));             // Ordena em ordem alfabética
}

/**
 * Passo 1: tenta adicionar um item a partir de uma string.
 * Se o item não for reconhecido, retorna { needsName: true, rawItem, quant }
 * em vez de inserir — o chamador deve então obter o nome (de onde quiser)
 * e chamar resolverNomeItem() para completar.
 *
 * @param {string} inputStr
 * @returns {Object} 
 */
function adicionarItem(inputStr) {
    const { item, quant } = parseItem(inputStr);

    const known = Array.from(map.values()).includes(item) || Array.from(map.keys()).includes(item);

    if (!known) {
        return { needsName: true, rawItem: item, quant };               // Sinaliza que precisa de input adicional
    }

    let nomeFinal = item;
    for (const [key, value] of map) {                                  // Substitui pelo nome padrão se presente no dicionário
        if (nomeFinal.includes(key)) {
            nomeFinal = value;
        }
    }

    inserirNaInstancia(nomeFinal, quant);
    return { needsName: false, instancia };
}

/** 
 * Passo 2: chamado quando adicionarItem() retornou needsName: true.
 * Recebe o nome definido pelo usuário e completa a inserção.
 *
 * @param {string} rawItem - o item original retornado por adicionarItem
 * @param {number} quant - a quantidade retornada por adicionarItem
 * @param {string} novoItemNome - nome informado pelo usuário para esse item
 * @returns {Object} instancia atualizada
 */
function resolverNomeItem(rawItem, quant, novoItemNome) {
    let itemFinal = novoItemNome.toLowerCase().trim();

    if (Array.from(map.keys()).includes(itemFinal)) {                  // Se o nome informado bate com um alias conhecido
        for (const [key, value] of map) {
            if (itemFinal.includes(key)) {
                itemFinal = value;
            }
        }
    }

    map.set(rawItem, itemFinal);                                       // Aprende o novo item para próximas vezes
    inserirNaInstancia(itemFinal, quant);

    return { needsName: false, instancia };
}

module.exports = { adicionarItem, resolverNomeItem, instancia };

/*  EXEMPLO DE CHAMADA

const readline = require('readline');
const { adicionarItem, resolverNomeItem, instancia } = require('./dicionario');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
    for (let i = 0; i < 5; i++) {
        const raw = await ask('Adicione um item:\n');
        const result = adicionarItem(raw);

        if (result.needsName) {
            const novoNome = await ask('Item não encontrado, qual o nome do item?\n');
            resolverNomeItem(result.rawItem, result.quant, novoNome);
        }
    }
    console.log(instancia);
    rl.close();
}

main();

*/