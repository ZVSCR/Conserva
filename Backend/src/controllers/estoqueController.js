const { buscarEstoque, atualizarQuantidade } = require('../repositories/estoqueRepository');

async function listarEstoque(req, res) {
    try {
        const usuarioId = req.user.id;
        const estoque = await buscarEstoque(usuarioId);
        res.json(estoque);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar estoque no banco' });
    }
}

async function atualizarQuantidadeItem(req, res) {
    try {
        const { id } = req.params;               
        const { quantidade } = req.body;

        if (typeof quantidade !== 'number' || quantidade < 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade numérica válida (>= 0).' });
        }

        const resultado = await atualizarQuantidade(id, quantidade);

        if (!resultado) {
            return res.status(404).json({ erro: 'Item não encontrado no estoque' });
        }

        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar quantidade no estoque' });
    }
}

module.exports = { listarEstoque, atualizarQuantidadeItem };