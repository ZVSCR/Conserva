const {
    validateReceitaPayload
} = require('../../Backend/src/middleware/receitaValidator');

function createValidPayload(overrides = {}) {
    return {
        nome: 'Bolo de Fubá',
        descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
        modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.',
        ...overrides
    };
}

function expectSingleError(payload, expectedError) {
    expect(validateReceitaPayload(payload)).toEqual({
        isValid: false,
        errors: [expectedError]
    });
}

describe('validateReceitaPayload', () => {
    describe('payload', () => {
        test('deve aceitar uma receita com todos os campos válidos', () => {
            expect(validateReceitaPayload(createValidPayload())).toEqual({
                isValid: true,
                errors: []
            });
        });

        test.each([
            undefined,
            null,
            [],
            'receita',
            10,
            true
        ])('deve rejeitar payload inválido: %p', (payload) => {
            expectSingleError(payload, {
                field: 'payload',
                message: 'A requisição enviada não é um objeto válido.'
            });
        });
    });

    describe.each([
        {
            campo: 'nome',
            max: 100,
            messages: {
                required: 'Nome é obrigatório.',
                type: 'Nome possui formato inválido.',
                blank: 'Nome não pode conter apenas espaços.',
                maxLength: 'Nome deve possuir no máximo 100 caracteres.'
            }
        },
        {
            campo: 'descricao',
            max: 1000,
            messages: {
                required: 'Descrição é obrigatória.',
                type: 'Descrição possui formato inválido.',
                blank: 'Descrição não pode conter apenas espaços.',
                maxLength: 'Descrição deve possuir no máximo 1.000 caracteres.'
            }
        },
        {
            campo: 'modo_preparo',
            max: 10000,
            messages: {
                required: 'Modo de preparo é obrigatório.',
                type: 'Modo de preparo possui formato inválido.',
                blank: 'Modo de preparo não pode conter apenas espaços.',
                maxLength: 'Modo de preparo deve possuir no máximo 10.000 caracteres.'
            }
        }
    ])('$campo', ({ campo, max, messages }) => {
        test.each([undefined, null])(
            'deve rejeitar valor ausente: %p',
            (valor) => {
                expectSingleError(createValidPayload({ [campo]: valor }), {
                    field: campo,
                    message: messages.required
                });
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar valor que não seja string: %p',
            (valor) => {
                expectSingleError(createValidPayload({ [campo]: valor }), {
                    field: campo,
                    message: messages.type
                });
            }
        );

        test('deve rejeitar valor contendo somente espaços', () => {
            expectSingleError(createValidPayload({ [campo]: '   ' }), {
                field: campo,
                message: messages.blank
            });
        });

        test(`deve aceitar valor com exatamente ${max} caracteres`, () => {
            const result = validateReceitaPayload(
                createValidPayload({ [campo]: 'a'.repeat(max) })
            );

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test(`deve rejeitar valor com mais de ${max} caracteres`, () => {
            expectSingleError(
                createValidPayload({ [campo]: 'a'.repeat(max + 1) }),
                {
                    field: campo,
                    message: messages.maxLength
                }
            );
        });
    });

    describe('acúmulo de erros', () => {
        test('deve acumular erros de todos os campos, na ordem do payload', () => {
            const payload = {
                nome: '   ',
                descricao: 10,
                modo_preparo: undefined
            };

            const result = validateReceitaPayload(payload);

            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                {
                    field: 'nome',
                    message: 'Nome não pode conter apenas espaços.'
                },
                {
                    field: 'descricao',
                    message: 'Descrição possui formato inválido.'
                },
                {
                    field: 'modo_preparo',
                    message: 'Modo de preparo é obrigatório.'
                }
            ]);
        });

        test('deve ignorar campos desconhecidos no payload', () => {
            const result = validateReceitaPayload(
                createValidPayload({ campo_extra: 'qualquer coisa' })
            );

            expect(result).toEqual({ isValid: true, errors: [] });
        });
    });

    describe('ingredientes', () => {
        const ingredienteValido = {
            nome: 'Farinha de trigo',
            quantidade: 9999999.99,
            unidade_de_medida: 'g'
        };

        test('valida ingredientes quando a opção é ativada', () => {
            expect(validateReceitaPayload(
                createValidPayload({ ingredientes: [ingredienteValido] }),
                true
            )).toEqual({ isValid: true, errors: [] });
        });

        test('não valida ingredientes por padrão, para manter o uso pelo PATCH', () => {
            expect(validateReceitaPayload(
                createValidPayload({ ingredientes: 'inválido' })
            )).toEqual({ isValid: true, errors: [] });
        });

        test.each([undefined, null])('exige ingredientes quando ativado: %p', (ingredientes) => {
            const result = validateReceitaPayload(
                createValidPayload({ ingredientes }),
                true
            );

            expect(result.errors).toContainEqual({
                field: 'ingredientes',
                message: 'A receita deve conter ao menos um ingrediente.'
            });
        });

        test('rejeita ingredientes que não sejam array', () => {
            const result = validateReceitaPayload(
                createValidPayload({ ingredientes: {} }),
                true
            );

            expect(result.errors).toContainEqual({
                field: 'ingredientes',
                message: 'Formato de ingredientes inválido. Deve ser um array.'
            });
        });

        test('rejeita array vazio', () => {
            const result = validateReceitaPayload(
                createValidPayload({ ingredientes: [] }),
                true
            );

            expect(result.errors).toContainEqual({
                field: 'ingredientes',
                message: 'A receita deve conter ao menos um ingrediente.'
            });
        });

        test('valida os atributos e os limites de cada ingrediente', () => {
            const result = validateReceitaPayload(createValidPayload({
                ingredientes: [{
                    nome: ' '.repeat(101),
                    quantidade: 10000000,
                    unidade_de_medida: 'x'
                }]
            }), true);

            expect(result.isValid).toBe(false);
            expect(result.errors.map(({ field }) => field)).toEqual([
                'ingredientes[0].nome',
                'ingredientes[0].quantidade',
                'ingredientes[0].unidade_de_medida'
            ]);
        });

        test('rejeita itens que não sejam objetos', () => {
            const result = validateReceitaPayload(
                createValidPayload({ ingredientes: [null] }),
                true
            );

            expect(result.errors).toContainEqual({
                field: 'ingredientes[0]',
                message: 'Ingrediente 1 não é um objeto válido.'
            });
        });
    });
});
