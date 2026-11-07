import assert from "node:assert/strict";
import test from "node:test";
import {
    adicionarIngredienteAReceita,
    atualizarIngredienteDaReceita,
    criarPayloadReceita,
    filtrarIngredientesGlobais,
    formatarQuantidadeIngrediente,
    removerIngredienteDaReceita,
} from "../src/components/receitas/ModalAdicionarReceita/receitaIngredientUtils.js";

const ingredienteGlobal = { id: 3, nome: "Açúcar" };
const itemReceita = {
    id: 3,
    nome: "Açúcar",
    quantidade: 2,
    unidade_de_medida: "kg",
};

test("filtra ingredientes sem diferenciar maiúsculas nem acentos", () => {
    const ingredientes = [ingredienteGlobal, { id: 4, nome: "Farinha" }];

    assert.deepEqual(filtrarIngredientesGlobais(ingredientes, "acucar"), [ingredienteGlobal]);
    assert.deepEqual(filtrarIngredientesGlobais(ingredientes, " FARINHA "), [ingredientes[1]]);
});

test("adiciona ingrediente selecionado com quantidade e unidade", () => {
    const resultado = adicionarIngredienteAReceita([], ingredienteGlobal, "1.5", "g");

    assert.deepEqual(resultado, [{
        id: 3,
        nome: "Açúcar",
        quantidade: 1.5,
        unidade_de_medida: "g",
    }]);
});

test("não adiciona ingrediente sem seleção, duplicado ou com quantidade inválida", () => {
    assert.throws(() => adicionarIngredienteAReceita([], null, "1", "un"), /Selecione um ingrediente/);
    assert.throws(() => adicionarIngredienteAReceita([itemReceita], ingredienteGlobal, "1", "un"), /já foi adicionado/);

    for (const quantidade of ["", "0", "-1", "1.234", "10000000"]) {
        assert.throws(
            () => adicionarIngredienteAReceita([], ingredienteGlobal, quantidade, "kg"),
            /quantidade positiva com até duas casas decimais/
        );
    }
});

test("modifica somente quantidade e unidade do ingrediente selecionado", () => {
    const outroIngrediente = { id: 5, nome: "Farinha", quantidade: 3, unidade_de_medida: "kg" };

    assert.deepEqual(
        atualizarIngredienteDaReceita([itemReceita, outroIngrediente], 3, "2.25", "g"),
        [
            { ...itemReceita, quantidade: 2.25, unidade_de_medida: "g" },
            outroIngrediente,
        ]
    );
});

test("remove ingrediente da lista sem alterar a lista original", () => {
    const ingredientes = [itemReceita, { id: 5, nome: "Farinha", quantidade: 3, unidade_de_medida: "kg" }];

    assert.deepEqual(removerIngredienteDaReceita(ingredientes, 3), [ingredientes[1]]);
    assert.equal(ingredientes.length, 2);
});

test("monta payload de criação com cada ingrediente e seus dados de medida", () => {
    const receita = {
        nome: "Bolo",
        descricao: "Bolo simples",
        modo_preparo: "Misturar e assar",
    };
    const payload = criarPayloadReceita(receita, [itemReceita]);

    assert.deepEqual(payload, {
        ...receita,
        ingredientes: [{ nome: "Açúcar", quantidade: 2, unidade_de_medida: "kg" }],
    });
    assert.equal("id" in payload.ingredientes[0], false);
});

test("formata quantidade para exibição em português", () => {
    assert.equal(formatarQuantidadeIngrediente(1.5), "1,5");
});
