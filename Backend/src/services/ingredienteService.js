
const { listaIngredientes, aliasesToNome } = require('../data/ingredientes');

function normalizar(str) {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,;:!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function validarCatalogoIngredientes(lista = listaIngredientes, aliases = aliasesToNome) {
    if (!lista || typeof lista !== 'object' || Array.isArray(lista) ||
        !aliases || typeof aliases !== 'object' || Array.isArray(aliases)) {
        throw new TypeError('O catálogo e os aliases devem ser dicionários.');
    }

    const nomes = Object.values(lista);
    if (nomes.length === 0) {
        throw new Error('A lista de ingredientes está vazia.');
    }

    const nomesNormalizados = new Set();
    for (const [chave, nome] of Object.entries(lista)) {
        if (typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
            normalizar(nome) !== nome) {
            throw new Error(`Ingrediente inválido no catálogo: ${chave}.`);
        }
        if (nomesNormalizados.has(nome)) {
            throw new Error(`Ingrediente duplicado no catálogo: ${nome}.`);
        }
        if (chave !== nome.replace(/ /g, '_')) {
            throw new Error(`Chave inválida no catálogo: ${chave}.`);
        }
        nomesNormalizados.add(nome);
    }

    const aliasesNormalizados = new Map();
    for (const [alias, nome] of Object.entries(aliases)) {
        if (typeof nome !== 'string' || !nomesNormalizados.has(nome) ||
            !alias.trim() || !normalizar(alias)) {
            throw new Error(`Alias inválido ou sem ingrediente: ${alias}.`);
        }
        const aliasNormalizado = normalizar(alias);
        const anterior = aliasesNormalizados.get(aliasNormalizado);
        if (anterior && anterior !== nome) {
            throw new Error(`Alias aponta para ingredientes distintos: ${alias}.`);
        }
        aliasesNormalizados.set(aliasNormalizado, nome);
    }

    return nomes;
}

async function garantirIngredientesPadrao() {
    const nomes = validarCatalogoIngredientes();
    const { inserirIngredientesPadrao } = require('../repositories/ingredienteRepository');
    return inserirIngredientesPadrao(nomes);
}

validarCatalogoIngredientes();

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
    resolverNomeItem,
    validarCatalogoIngredientes,
    garantirIngredientesPadrao
};
