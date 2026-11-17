jest.mock('node:child_process', () => ({ spawn: jest.fn() }));

const { spawn } = require('node:child_process');
const spawnReal = jest.requireActual('node:child_process').spawn;
const { extrairTextoCupom } = require('../../Backend/src/services/cupomService');

test('processo real pode escrever mais de 1 MB de logs antes do JSON do OCR', async () => {
    // Usa Node como processo filho para testar os pipes sem Python/modelos.
    spawn.mockImplementation(() => spawnReal(process.execPath, ['-e', `
        process.stderr.write('x'.repeat(2 * 1024 * 1024), () => {
            process.stdout.write(JSON.stringify('ARROZ\\nCAFÉ'));
        });
    `], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }));
    await expect(extrairTextoCupom('cupom.png')).resolves.toBe('ARROZ\nCAFÉ');
});
