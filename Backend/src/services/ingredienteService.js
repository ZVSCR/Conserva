
const aliasesToNome = {
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

function normalizar(str) {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,;:!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const map = new Map(
    Object.entries(aliasesToNome).map(([alias, nome]) => [normalizar(alias), nome])
);

function parseItem(inputStr) {
    return normalizar(
        inputStr
            .toLowerCase()
            .replace(/\d+(?:[.,]\d+)?\s*(kg|un|g|ml|l)?\b/g, " ")
    );
}

function buscarNome(item) {
    const aliases = [...map.keys()].sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
        const regex = new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
        if (regex.test(item)) return map.get(alias);
    }
    return null;
}

function adicionarItem(inputStr) {
    const item = parseItem(inputStr);
    if (!item) return { needsName: false, item: null };                 // Entrada vazia / só números

    const nome = buscarNome(item);
    if (!nome) {
        return { needsName: true, rawItem: item };
    }

    return { needsName: false, item: nome };
}

function resolverNomeItem(rawItem, novoItemNome) {
    let itemFinal = parseItem(novoItemNome);
    itemFinal = buscarNome(itemFinal) ?? itemFinal;                     // Usa nome padrão se o informado for um alias conhecido

    map.set(rawItem, itemFinal);                                        // Aprende o novo item para próximas vezes

    return { needsName: false, item: itemFinal };
}

/* EXEMPLO DE CHAMADA DO MAPEAMENTO

    const raw = await ask('Adicione um item:\n');
        let result = adicionarItem(raw);

    if (result.needsName) {
        const novoNome = await ask('Item não encontrado, qual o nome do item?\n');
        result = resolverNomeItem(result.rawItem, novoNome);
    }
    console.log(result.item);

*/

module.exports = {
    adicionarItem,
    resolverNomeItem
};