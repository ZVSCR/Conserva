const app = require('./app');
const { garantirIngredientesPadrao } = require('./services/ingredienteService');

async function iniciarServidor() {
    await garantirIngredientesPadrao();
    return app.listen(3000, () => console.log('Backend rodando na porta 3000'));
}

if (require.main === module) {
    iniciarServidor().catch((erro) => {
        console.error('Falha ao carregar ingredientes; servidor não iniciado:', erro);
        process.exit(1);
    });
}

module.exports = { iniciarServidor };
