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
//ATUALIZAÇÃO

async function atualizarItem(req, res) {
    try {
        const { id } = req.params;

        const validation = validateItemPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                erro: validation.message
            });
        }

        const { quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada } = req.body;

        const itemAtualizado = await atualizarPorId(id, {
            quantidade,
            valor_unitario,
            nome_item,
            unidade_de_medida,
            validade_estimada
        });

        if (!itemAtualizado) {
            return res.status(404).json({
                erro: 'Item não encontrado para atualização'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Item atualizado com sucesso.',
            data: itemAtualizado
        });
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao atualizar item no banco'
        });
    }
}

// =============================================================================
// REMOÇÃO
async function apagarId(req, res) {
    try {
        const { id } = req.params;
        const resultado = await apagarPorId(id);
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

module.exports = { listarItens, listarPorId, atualizarItem, apagarId }
