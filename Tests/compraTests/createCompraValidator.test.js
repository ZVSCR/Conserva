const {
    validateCreateCompraPayload
} = require('../../Backend/src/middleware/compraValidator');

function createValidItem(overrides = {}) {
    return {
        nome_item: 'Arroz',
        quantidade: 2,
        unidade_de_medida: 'kg',
        valor_unitario: 8.5,
        validade_estimada: '2027-03-01',
        ...overrides
    };
}

function createValidPayload(overrides = {}) {
    return {
        data_compra: '2026-09-20',
        estabelecimento: 'Mercado Central',
        itens: [createValidItem()],
        ...overrides
    };
}

function expectSingleError(payload, expectedError) {
    expect(validateCreateCompraPayload(payload)).toEqual({
        isValid: false,
        errors: [expectedError]
    });
}

describe('validateCreateCompraPayload', () => {
    describe('payload', () => {
        test('deve aceitar uma compra com todos os campos válidos', () => {
            expect(validateCreateCompraPayload(createValidPayload())).toEqual({
                isValid: true,
                errors: []
            });
        });

        test('deve aceitar uma compra sem as datas opcionais', () => {
            const payload = createValidPayload({
                data_compra: undefined,
                itens: [createValidItem({ validade_estimada: undefined })]
            });

            expect(validateCreateCompraPayload(payload)).toEqual({
                isValid: true,
                errors: []
            });
        });

        test.each([
            undefined,
            null,
            [],
            'compra',
            10,
            true
        ])('deve rejeitar payload inválido: %p', (payload) => {
            expectSingleError(payload, {
                field: 'payload',
                message: 'A requisição enviada não é um objeto válido.'
            });
        });
    });

    describe('estabelecimento', () => {
        test.each([undefined, null])(
            'deve rejeitar estabelecimento ausente: %p',
            (estabelecimento) => {
                expectSingleError(createValidPayload({ estabelecimento }), {
                    field: 'estabelecimento',
                    message: 'Estabelecimento é obrigatório.'
                });
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar estabelecimento que não seja string: %p',
            (estabelecimento) => {
                expectSingleError(createValidPayload({ estabelecimento }), {
                    field: 'estabelecimento',
                    message: 'Estabelecimento possui formato inválido.'
                });
            }
        );

        test('deve rejeitar estabelecimento contendo somente espaços', () => {
            expectSingleError(createValidPayload({ estabelecimento: '   ' }), {
                field: 'estabelecimento',
                message: 'Estabelecimento não pode conter apenas espaços.'
            });
        });

        test('deve aceitar estabelecimento com exatamente 50 caracteres', () => {
            const result = validateCreateCompraPayload(
                createValidPayload({ estabelecimento: 'a'.repeat(50) })
            );

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('deve rejeitar estabelecimento com mais de 50 caracteres', () => {
            expectSingleError(
                createValidPayload({ estabelecimento: 'a'.repeat(51) }),
                {
                    field: 'estabelecimento',
                    message: 'Estabelecimento deve possuir no máximo 50 caracteres.'
                }
            );
        });
    });

    describe('data da compra', () => {
        test.each([undefined, null])(
            'deve aceitar data da compra opcional ausente: %p',
            (data_compra) => {
                const result = validateCreateCompraPayload(
                    createValidPayload({ data_compra })
                );

                expect(result.isValid).toBe(true);
                expect(result.errors).toEqual([]);
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar data da compra que não seja string: %p',
            (data_compra) => {
                expectSingleError(createValidPayload({ data_compra }), {
                    field: 'data_compra',
                    message: 'Formato de data inválido. Data deve ser string.'
                });
            }
        );

        test.each([
            '',
            '   ',
            '20/09/2026',
            '2026-9-20',
            '2026-09-20T10:00:00Z'
        ])('deve rejeitar formato de data da compra inválido: %p', (data_compra) => {
            expectSingleError(createValidPayload({ data_compra }), {
                field: 'data_compra',
                message: 'Formato de data inválido. O formato correto é YYYY-MM-DD'
            });
        });

        test('deve rejeitar ano da compra anterior a 1926', () => {
            expectSingleError(createValidPayload({ data_compra: '1925-12-31' }), {
                field: 'data_compra',
                message: 'Forneça um ano igual ou posterior a 1926.'
            });
        });

        test.each([
            '2026-00-10',
            '2026-13-10',
            '2026-01-00',
            '2026-04-31',
            '2026-02-29'
        ])('deve rejeitar data da compra inexistente: %p', (data_compra) => {
            expectSingleError(createValidPayload({ data_compra }), {
                field: 'data_compra',
                message: 'Data não existe. Forneça uma data existente'
            });
        });

        test.each(['1926-01-01', '2028-02-29', '2026-12-31'])(
            'deve aceitar data da compra existente: %s',
            (data_compra) => {
                const result = validateCreateCompraPayload(
                    createValidPayload({ data_compra })
                );

                expect(result.isValid).toBe(true);
                expect(result.errors).toEqual([]);
            }
        );
    });

    describe('lista de itens', () => {
        test.each([undefined, null])(
            'deve rejeitar lista de itens ausente: %p',
            (itens) => {
                expectSingleError(createValidPayload({ itens }), {
                    field: 'itens',
                    message: 'O registro de itens é obrigatório.'
                });
            }
        );

        test.each([{}, 'item', 1, true])(
            'deve rejeitar lista de itens que não seja array: %p',
            (itens) => {
                expectSingleError(createValidPayload({ itens }), {
                    field: 'itens',
                    message: 'Formato do registro de itens inválido. Deve ser um array.'
                });
            }
        );

        test('deve rejeitar lista de itens vazia', () => {
            expectSingleError(createValidPayload({ itens: [] }), {
                field: 'itens',
                message: 'Compra deve ter ao menos um item registrado.'
            });
        });

        test.each([undefined, null, [], 'item', 1, true])(
            'deve rejeitar item que não seja objeto: %p',
            (item) => {
                expectSingleError(createValidPayload({ itens: [item] }), {
                    field: 'itens[0]',
                    message: 'Item 1 não é um objeto válido.'
                });
            }
        );

        test('deve validar todos os itens e identificar a posição do inválido', () => {
            const payload = createValidPayload({
                itens: [createValidItem(), null]
            });

            expectSingleError(payload, {
                field: 'itens[1]',
                message: 'Item 2 não é um objeto válido.'
            });
        });
    });

    describe('nome do item', () => {
        test.each([undefined, null])(
            'deve rejeitar nome do item ausente: %p',
            (nome_item) => {
                expectSingleError(
                    createValidPayload({ itens: [createValidItem({ nome_item })] }),
                    {
                        field: 'itens[0].nome_item',
                        message: 'O nome do item 1 é obrigatório.'
                    }
                );
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar nome do item que não seja string: %p',
            (nome_item) => {
                expectSingleError(
                    createValidPayload({ itens: [createValidItem({ nome_item })] }),
                    {
                        field: 'itens[0].nome_item',
                        message: 'Formato do nome do item 1 é inválido.'
                    }
                );
            }
        );

        test('deve rejeitar nome do item contendo somente espaços', () => {
            expectSingleError(
                createValidPayload({ itens: [createValidItem({ nome_item: '   ' })] }),
                {
                    field: 'itens[0].nome_item',
                    message: 'Nome do item 1 não pode conter apenas espaços.'
                }
            );
        });

        test('deve aceitar nome do item com exatamente 100 caracteres', () => {
            const payload = createValidPayload({
                itens: [createValidItem({ nome_item: 'a'.repeat(100) })]
            });

            expect(validateCreateCompraPayload(payload).isValid).toBe(true);
        });

        test('deve rejeitar nome do item com mais de 100 caracteres', () => {
            expectSingleError(
                createValidPayload({
                    itens: [createValidItem({ nome_item: 'a'.repeat(101) })]
                }),
                {
                    field: 'itens[0].nome_item',
                    message: 'Nome do item 1 deve possuir no máximo 100 caracteres.'
                }
            );
        });
    });

    describe('quantidade', () => {
        test.each([undefined, null])(
            'deve rejeitar quantidade ausente: %p',
            (quantidade) => {
                expectSingleError(
                    createValidPayload({ itens: [createValidItem({ quantidade })] }),
                    {
                        field: 'itens[0].quantidade',
                        message: 'Quantidade do item 1 é obrigatória.'
                    }
                );
            }
        );

        test.each(['2', true, {}, [], NaN, Infinity, -Infinity])(
            'deve rejeitar quantidade que não seja número finito: %p',
            (quantidade) => {
                expectSingleError(
                    createValidPayload({ itens: [createValidItem({ quantidade })] }),
                    {
                        field: 'itens[0].quantidade',
                        message: 'Formato da quantidade do item 1 não é válido.'
                    }
                );
            }
        );

        test.each([0, -1, -0.5])(
            'deve rejeitar quantidade menor ou igual a zero: %p',
            (quantidade) => {
                expectSingleError(
                    createValidPayload({ itens: [createValidItem({ quantidade })] }),
                    {
                        field: 'itens[0].quantidade',
                        message: 'Quantidade do item 1 deve ser maior que zero.'
                    }
                );
            }
        );

        test.each([0.01, 1, 2.5])(
            'deve aceitar quantidade positiva: %p',
            (quantidade) => {
                const payload = createValidPayload({
                    itens: [createValidItem({ quantidade })]
                });

                expect(validateCreateCompraPayload(payload).isValid).toBe(true);
            }
        );
    });

    describe('unidade de medida', () => {
        test.each([undefined, null])(
            'deve rejeitar unidade de medida ausente: %p',
            (unidade_de_medida) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ unidade_de_medida })]
                    }),
                    {
                        field: 'itens[0].unidade_de_medida',
                        message: 'Unidade de medida do item 1 é obrigatória.'
                    }
                );
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar unidade de medida que não seja string: %p',
            (unidade_de_medida) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ unidade_de_medida })]
                    }),
                    {
                        field: 'itens[0].unidade_de_medida',
                        message: 'Formato de unidade de medida do item 1 é inválido.'
                    }
                );
            }
        );

        test('deve rejeitar unidade de medida contendo somente espaços', () => {
            expectSingleError(
                createValidPayload({
                    itens: [createValidItem({ unidade_de_medida: '   ' })]
                }),
                {
                    field: 'itens[0].unidade_de_medida',
                    message: 'Unidade de medida do item 1 não pode conter apenas espaços'
                }
            );
        });

        test('deve aceitar unidade de medida com exatamente 20 caracteres', () => {
            const payload = createValidPayload({
                itens: [createValidItem({ unidade_de_medida: 'a'.repeat(20) })]
            });

            expect(validateCreateCompraPayload(payload).isValid).toBe(true);
        });

        test('deve rejeitar unidade de medida com mais de 20 caracteres', () => {
            expectSingleError(
                createValidPayload({
                    itens: [createValidItem({ unidade_de_medida: 'a'.repeat(21) })]
                }),
                {
                    field: 'itens[0].unidade_de_medida',
                    message: 'Unidade de medida do item 1 deve possuir no máximo 20 caracteres.'
                }
            );
        });
    });

    describe('valor unitário', () => {
        test.each([undefined, null])(
            'deve rejeitar valor unitário ausente: %p',
            (valor_unitario) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ valor_unitario })]
                    }),
                    {
                        field: 'itens[0].valor_unitario',
                        message: 'Valor unitário do item 1 é obrigatório.'
                    }
                );
            }
        );

        test.each(['8.5', true, {}, [], NaN, Infinity, -Infinity])(
            'deve rejeitar valor unitário que não seja número finito: %p',
            (valor_unitario) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ valor_unitario })]
                    }),
                    {
                        field: 'itens[0].valor_unitario',
                        message: 'Formato de valor unitário do item 1 é inválido.'
                    }
                );
            }
        );

        test.each([-0.01, -1])(
            'deve rejeitar valor unitário negativo: %p',
            (valor_unitario) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ valor_unitario })]
                    }),
                    {
                        field: 'itens[0].valor_unitario',
                        message: 'Valor unitário do item 1 deve ser maior ou igual a zero.'
                    }
                );
            }
        );

        test.each([0, 0.01, 100])(
            'deve aceitar valor unitário não negativo: %p',
            (valor_unitario) => {
                const payload = createValidPayload({
                    itens: [createValidItem({ valor_unitario })]
                });

                expect(validateCreateCompraPayload(payload).isValid).toBe(true);
            }
        );
    });

    describe('validade estimada', () => {
        test.each([undefined, null])(
            'deve aceitar validade estimada opcional ausente: %p',
            (validade_estimada) => {
                const payload = createValidPayload({
                    itens: [createValidItem({ validade_estimada })]
                });

                expect(validateCreateCompraPayload(payload).isValid).toBe(true);
            }
        );

        test.each([10, true, {}, []])(
            'deve rejeitar validade estimada que não seja string: %p',
            (validade_estimada) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ validade_estimada })]
                    }),
                    {
                        field: 'itens[0].validade_estimada',
                        message: 'Formato da data de validade do item 1 é inválido. O formato correto é string.'
                    }
                );
            }
        );

        test.each(['', '01/03/2027', '2027-3-01'])(
            'deve rejeitar formato de validade estimada inválido: %p',
            (validade_estimada) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ validade_estimada })]
                    }),
                    {
                        field: 'itens[0].validade_estimada',
                        message: 'Formato da data de validade do item 1 é inválido. Escreva no formato YYYY-MM-DD.'
                    }
                );
            }
        );

        test('deve rejeitar ano da validade estimada anterior a 1926', () => {
            expectSingleError(
                createValidPayload({
                    itens: [createValidItem({ validade_estimada: '1925-12-31' })]
                }),
                {
                    field: 'itens[0].validade_estimada',
                    message: 'Forneça um ano igual ou posterior a 1926 para a data de validade do item 1.'
                }
            );
        });

        test.each(['2027-00-01', '2027-13-01', '2027-02-29', '2027-04-31'])(
            'deve rejeitar validade estimada inexistente: %p',
            (validade_estimada) => {
                expectSingleError(
                    createValidPayload({
                        itens: [createValidItem({ validade_estimada })]
                    }),
                    {
                        field: 'itens[0].validade_estimada',
                        message: 'Data de validade do item 1 não existe. Forneça uma data existente.'
                    }
                );
            }
        );

        test.each(['1926-01-01', '2028-02-29', '2027-12-31'])(
            'deve aceitar validade estimada existente: %s',
            (validade_estimada) => {
                const payload = createValidPayload({
                    itens: [createValidItem({ validade_estimada })]
                });

                expect(validateCreateCompraPayload(payload).isValid).toBe(true);
            }
        );
    });

    describe('acúmulo de erros', () => {
        test('deve acumular erros de campos e itens diferentes', () => {
            const payload = createValidPayload({
                estabelecimento: '   ',
                data_compra: '2026-02-29',
                itens: [
                    createValidItem({
                        nome_item: '   ',
                        quantidade: 0,
                        unidade_de_medida: '   ',
                        valor_unitario: -1,
                        validade_estimada: '2027-02-29'
                    }),
                    null
                ]
            });

            const result = validateCreateCompraPayload(payload);

            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                {
                    field: 'estabelecimento',
                    message: 'Estabelecimento não pode conter apenas espaços.'
                },
                {
                    field: 'data_compra',
                    message: 'Data não existe. Forneça uma data existente'
                },
                {
                    field: 'itens[0].nome_item',
                    message: 'Nome do item 1 não pode conter apenas espaços.'
                },
                {
                    field: 'itens[0].quantidade',
                    message: 'Quantidade do item 1 deve ser maior que zero.'
                },
                {
                    field: 'itens[0].unidade_de_medida',
                    message: 'Unidade de medida do item 1 não pode conter apenas espaços'
                },
                {
                    field: 'itens[0].valor_unitario',
                    message: 'Valor unitário do item 1 deve ser maior ou igual a zero.'
                },
                {
                    field: 'itens[0].validade_estimada',
                    message: 'Data de validade do item 1 não existe. Forneça uma data existente.'
                },
                {
                    field: 'itens[1]',
                    message: 'Item 2 não é um objeto válido.'
                }
            ]);
        });
    });
});
