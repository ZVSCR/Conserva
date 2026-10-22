jest.mock('../../Backend/src/app', () => ({ listen: jest.fn() }));
jest.mock('../../Backend/src/services/ingredienteService', () => ({
    garantirIngredientesPadrao: jest.fn()
}));

const app = require('../../Backend/src/app');
const { garantirIngredientesPadrao } = require('../../Backend/src/services/ingredienteService');
const { iniciarServidor } = require('../../Backend/src/index');

beforeEach(() => jest.clearAllMocks());

test('importar o ponto de entrada não inicia a carga nem abre a porta', () => {
    expect(garantirIngredientesPadrao).not.toHaveBeenCalled();
    expect(app.listen).not.toHaveBeenCalled();
});

test('só aceita requisições depois que a carga termina', async () => {
    let concluirCarga;
    garantirIngredientesPadrao.mockReturnValue(new Promise((resolve) => {
        concluirCarga = resolve;
    }));
    const servidor = { close: jest.fn() };
    app.listen.mockReturnValue(servidor);

    const inicio = iniciarServidor();
    expect(garantirIngredientesPadrao).toHaveBeenCalledTimes(1);
    expect(app.listen).not.toHaveBeenCalled();

    concluirCarga();
    await expect(inicio).resolves.toBe(servidor);
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
});

test('se a carga falhar, não abre a porta e repassa o erro', async () => {
    const erro = new Error('Banco indisponível');
    garantirIngredientesPadrao.mockRejectedValue(erro);

    await expect(iniciarServidor()).rejects.toBe(erro);
    expect(app.listen).not.toHaveBeenCalled();
});
