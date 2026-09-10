const { buscarItens, buscarPorId } = require('../repositories/itemRepository');

async function listarItens(req, res) {
    const items = await buscarItens();
    res.json(items);
}

async function listarPorId(req, res) {
    const { id } = req.params;
    const item = await buscarPorId(id);
    res.json(item);
}

module.exports = { listarItens, listarPorId }