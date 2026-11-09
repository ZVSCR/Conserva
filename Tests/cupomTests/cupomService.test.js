jest.mock('node:child_process', () => ({ execFile: jest.fn() }));

const { execFile } = require('node:child_process');
const { extrairTextoCupom, extrairItensCupom, extrairCupom } = require('../../Backend/src/services/cupomService');

const cupom = `SUPERMERCADO PREÇO BOM LTDA
CNPJ: 12.345.678/0001-99
# CÓDIGO DESCRIÇÃO QTD UN VL UN(R$) VL TOT(R$)
1 78910001 ARROZ INTEGRAL 1KG 2 UN 5,50 11,00
2 78920002 LEITE INTEGRAL 1L 12 UN 4,20 50,40
3 78930003 OLEO DE SOJA 900ML 1 UN 6,80 6,80
4 78940004 CAFE TORRADO 500G 2 UN 14,50 29,00
----------------------------------------------------------------
QTD. TOTAL DE ITENS: 4
VALOR TOTAL R$: 97,20
FORMA DE PAGAMENTO: CARTÃO DE CRÉDITO R$: 97,20
Federal: R$ 4,20 Estadual: R$ 11,66 Municipal: R$ 0,00
Data: 08/11/2026 22:15:00
CHAVE DE ACESSO: 3526 1112 3456 7800 0199 6500 1000 1234 5612 3456 7890`;

describe('extrairItensCupom', () => {
    test.each([cupom, cupom.replace(/\n/g, ' '), cupom.replace(/ /g, '\n')])(
        'extrai os quatro itens, preserva o nome e usa o total da linha', (texto) => {
            expect(extrairItensCupom(texto)).toEqual([
                { nome_item: 'ARROZ INTEGRAL 1KG', quantidade: 2, preco_total_item: 11 },
                { nome_item: 'LEITE INTEGRAL 1L', quantidade: 12, preco_total_item: 50.4 },
                { nome_item: 'OLEO DE SOJA 900ML', quantidade: 1, preco_total_item: 6.8 },
                { nome_item: 'CAFE TORRADO 500G', quantidade: 2, preco_total_item: 29 }
            ]);
        }
    );

    test('retorna lista vazia quando nao ha itens reconhecidos', () => {
        expect(extrairItensCupom('')).toEqual([]);
        expect(extrairItensCupom('VALOR TOTAL R$: 97,20')).toEqual([]);
    });

    test('nao mistura um item incompleto com o seguinte', () => {
        expect(extrairItensCupom('1 78910001 ARROZ 2 UN 5,50\n2 78920002 LEITE 12 UN 4,20 50,40'))
            .toEqual([{ nome_item: 'LEITE', quantidade: 12, preco_total_item: 50.4 }]);
    });
});

describe('extrairCupom', () => {
    test('retorna o texto OCR e seus itens a partir da imagem', async () => {
        execFile.mockImplementation((programa, argumentos, opcoes, callback) => {
            callback(null, JSON.stringify(cupom), '');
        });
        await expect(extrairCupom('cupom.png')).resolves.toEqual({
            texto: cupom,
            itens: extrairItensCupom(cupom)
        });
    });
});

describe('extrairTextoCupom', () => {
    beforeEach(() => jest.clearAllMocks());

    test('extrai o texto sem interpretar o caminho como comando', async () => {
        execFile.mockImplementation((programa, argumentos, opcoes, callback) => {
            callback(null, JSON.stringify('ARROZ\n2 UN x 5,00 10,00'), '');
        });

        await expect(extrairTextoCupom('cupons/minha compra.png'))
            .resolves.toBe('ARROZ\n2 UN x 5,00 10,00');
        expect(execFile).toHaveBeenCalledWith(
            'python',
            [expect.stringMatching(/extrairTextoCupom\.py$/), 'cupons/minha compra.png'],
            expect.objectContaining({ encoding: 'utf8' }),
            expect.any(Function)
        );
    });

    test('propaga falhas do processo OCR', async () => {
        const erro = new Error('EasyOCR indisponivel');
        execFile.mockImplementation((programa, argumentos, opcoes, callback) => callback(erro));
        await expect(extrairTextoCupom('cupom.png')).rejects.toBe(erro);
    });

    test('rejeita uma resposta invalida do processo OCR', async () => {
        execFile.mockImplementation((programa, argumentos, opcoes, callback) => callback(null, 'aviso'));
        await expect(extrairTextoCupom('cupom.png')).rejects.toThrow();
    });

    test.each(['', '   ', null, 42])('rejeita caminho invalido %p', async (caminho) => {
        await expect(extrairTextoCupom(caminho)).rejects.toThrow('Informe o caminho da imagem.');
        expect(execFile).not.toHaveBeenCalled();
    });
});
