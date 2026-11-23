const { extrairCuponsEnviados } = require('../services/cupomUploadService');

async function digitalizarCupons(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'Envie pelo menos uma imagem no campo imagens.' });
    }

    try {
        const { resultados } = await extrairCuponsEnviados(req.files);
        return res.json({ resultados });
    } catch (erro) {
        console.error('Falha ao digitalizar cupom:', erro);
        return res.status(500).json({ error: 'Não foi possível processar as imagens no OCR. Tente novamente.' });
    }
}

module.exports = { digitalizarCupons };
