const instancia = [];                                                   // Armazena itens adicionados

const aliasesToNome = {                                                 // Dicionario de nomes conhecidos
    "req.": "requeijao",
    "requeijao": "requeijao",
    "leite": "leite",
    "pao": "pao",
};

const map = new Map(Object.entries(aliasesToNome));                     // Faz o mapeamento de nomes definidos no dicionario

function parseItem(inputStr) {
    let item = inputStr.toLowerCase();
    let quant;

    if (/\d+/.test(item)) {                                            // Verifica se foi definida uma quantidade
        quant = parseInt(item.match(/\d+/g)[0]);
        item = item.replace(/\d+/g, '').trim();                        // Retira números do nome
    } else {
        item = item.trim();
        quant = 1;                                                     // Sem quantidade -> assume 1
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