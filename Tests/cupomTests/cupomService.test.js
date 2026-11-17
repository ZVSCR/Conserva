jest.mock('node:child_process', () => ({ spawn: jest.fn() }));

const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { extrairTextoCupom, extrairItensCupom, extrairCupom } = require('../../Backend/src/services/cupomService');

function simularProcesso({ stdout = '', stderr = '', codigo = 0, erro } = {}) {
    const processo = new EventEmitter();
    processo.stdout = new PassThrough();
    processo.stderr = new PassThrough();
    processo.kill = jest.fn();
    queueMicrotask(() => {
        if (erro) processo.emit('error', erro);
        else {
            processo.stderr.end(stderr);
            processo.stdout.end(stdout);
            processo.emit('close', codigo, null);
        }
    });
    return processo;
}

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
        spawn.mockImplementation(() => simularProcesso({ stdout: JSON.stringify(cupom) }));
        await expect(extrairCupom('cupom.png')).resolves.toEqual({
            texto: cupom,
            itens: extrairItensCupom(cupom)
        });
    });
});

describe('extrairTextoCupom', () => {
    const executavelPythonOriginal = process.env.PYTHON_EXECUTABLE;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.PYTHON_EXECUTABLE;
    });

    afterAll(() => {
        if (executavelPythonOriginal === undefined) delete process.env.PYTHON_EXECUTABLE;
        else process.env.PYTHON_EXECUTABLE = executavelPythonOriginal;
    });

    test('extrai o texto sem interpretar o caminho como comando', async () => {
        spawn.mockImplementation(() => simularProcesso({ stdout: JSON.stringify('ARROZ\n2 UN x 5,00 10,00') }));

        await expect(extrairTextoCupom('cupons/minha compra.png'))
            .resolves.toBe('ARROZ\n2 UN x 5,00 10,00');
        expect(spawn).toHaveBeenCalledWith(
            'python',
            [expect.stringMatching(/extrairTextoCupom\.py$/), 'cupons/minha compra.png'],
            expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
        );
    });

    test('permite configurar o executavel Python no ambiente de deploy', async () => {
        process.env.PYTHON_EXECUTABLE = 'python-configurado';
        spawn.mockImplementation(() => simularProcesso({ stdout: JSON.stringify('ARROZ') }));

        await expect(extrairTextoCupom('cupom.png')).resolves.toBe('ARROZ');
        expect(spawn).toHaveBeenCalledWith(
            'python-configurado',
            [expect.stringMatching(/extrairTextoCupom\.py$/), 'cupom.png'],
            expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
        );
    });

    test('propaga falhas do processo OCR', async () => {
        const erro = new Error('EasyOCR indisponivel');
        spawn.mockImplementation(() => simularProcesso({ erro }));
        await expect(extrairTextoCupom('cupom.png')).rejects.toBe(erro);
    });

    test('rejeita uma resposta invalida do processo OCR', async () => {
        spawn.mockImplementation(() => simularProcesso({ stdout: 'aviso' }));
        await expect(extrairTextoCupom('cupom.png')).rejects.toThrow();
    });

    test.each(['', '   ', null, 42])('rejeita caminho invalido %p', async (caminho) => {
        await expect(extrairTextoCupom(caminho)).rejects.toThrow('Informe o caminho da imagem.');
        expect(spawn).not.toHaveBeenCalled();
    });

    test('consome mais de 1 MB de stderr sem interromper o reconhecimento', async () => {
        spawn.mockImplementation(() => simularProcesso({
            stdout: JSON.stringify('AÇÃO\nCAFÉ'),
            stderr: 'progresso do download\r'.repeat(100000)
        }));
        await expect(extrairTextoCupom('cupom.png')).resolves.toBe('AÇÃO\nCAFÉ');
    });

    test('preserva somente os últimos 64 KB de diagnóstico quando o Python falha', async () => {
        const final = 'ModuleNotFoundError: dependencia ausente';
        spawn.mockImplementation(() => simularProcesso({ stderr: 'x'.repeat(2 * 1024 * 1024) + final, codigo: 1 }));
        try {
            await extrairTextoCupom('cupom.png');
            throw new Error('Deveria rejeitar a falha do Python');
        } catch (erro) {
            expect(erro.code).toBe(1);
            expect(Buffer.byteLength(erro.stderr)).toBe(64 * 1024);
            expect(erro.stderr.endsWith(final)).toBe(true);
        }
    });

    test('interrompe respostas de texto acima de 1 MB', async () => {
        let processo;
        spawn.mockImplementation(() => {
            processo = simularProcesso({ stdout: 'x'.repeat(1024 * 1024 + 1) });
            return processo;
        });
        await expect(extrairTextoCupom('cupom.png')).rejects.toThrow('ultrapassou');
        expect(processo.kill).toHaveBeenCalledTimes(1);
    });
});
