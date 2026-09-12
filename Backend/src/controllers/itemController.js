const { buscarItens, buscarPorId, apagarPorId } = require('../repositories/itemRepository');

// =============================================================================
// LISTAGEM
async function listarItens(req, res) {
    try {
        const items = await buscarItens();
        res.json(items);
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao buscar itens no banco'
        });
    }
}

async function listarPorId(req, res) {
    try {
        const { id } = req.params;
        const item = await buscarPorId(id);
        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado'
            });
        }
        res.json(item);
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao buscar item no banco'
        });
    }
}
// =============================================================================

// =============================================================================
// REMOÇÃO
async function apagarId(req, res) {
    try {
        const { id } = req.params;
        const resultado  = await apagarPorId(id);
        if (!resultado)
            return res.status(404).json({
                erro: "Item não encontrado"
            })
        res.sendStatus(204);
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao buscar item no banco'
        })
    }
}
// =============================================================================

module.exports = { listarItens, listarPorId, apagarId }
