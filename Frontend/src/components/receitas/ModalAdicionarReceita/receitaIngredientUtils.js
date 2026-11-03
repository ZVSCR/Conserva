const LIMITE_QUANTIDADE = 9999999.99;

function validarQuantidade(valor) {
    const quantidade = Number(valor);
    if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > LIMITE_QUANTIDADE ||
        !/^\d+(?:\.\d{1,2})?$/.test(String(quantidade))) {
        throw new Error("Informe uma quantidade positiva com até duas casas decimais.");
    }
    return quantidade;
}

export function filtrarIngredientesGlobais(ingredientes, busca) {
    const buscaNormalizada = normalizarBusca(busca);
    return ingredientes.filter((ingrediente) => normalizarBusca(ingrediente.nome).includes(buscaNormalizada));
}

function normalizarBusca(texto) {
    return texto
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export function formatarQuantidadeIngrediente(quantidade) {
    return Number(quantidade).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function adicionarIngredienteAReceita(atuais, ingrediente, quantidade, unidade) {
    if (!ingrediente) {
        throw new Error("Selecione um ingrediente da lista.");
    }
    if (atuais.some((item) => item.id === ingrediente.id)) {
        throw new Error("Esse ingrediente já foi adicionado à receita.");
    }

    return [
        ...atuais,
        {
            id: ingrediente.id,
            nome: ingrediente.nome,
            quantidade: validarQuantidade(quantidade),
            unidade_de_medida: unidade,
        },
    ];
}

export function atualizarIngredienteDaReceita(atuais, id, quantidade, unidade) {
    const quantidadeNumerica = validarQuantidade(quantidade);
    return atuais.map((ingrediente) => ingrediente.id === id
        ? { ...ingrediente, quantidade: quantidadeNumerica, unidade_de_medida: unidade }
        : ingrediente
    );
}

export function removerIngredienteDaReceita(atuais, id) {
    return atuais.filter((ingrediente) => ingrediente.id !== id);
}

export function criarPayloadReceita(receita, ingredientes) {
    return {
        nome: receita.nome,
        descricao: receita.descricao,
        modo_preparo: receita.modo_preparo,
        ingredientes: ingredientes.map(({ nome, quantidade, unidade_de_medida }) => ({
            nome,
            quantidade,
            unidade_de_medida,
        })),
    };
}
