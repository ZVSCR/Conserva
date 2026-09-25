const { buscarEstoque, atualizarQuantidade, buscarValorEstoquePorUsuario, buscarItensEstoquePorUsuario } = require('../repositories/estoqueRepository');

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
        const { itemId } = req.params;               
        const { quantidade } = req.body;

        if (typeof quantidade !== 'number' || quantidade < 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade numérica válida (>= 0).' });
        }

        const resultado = await atualizarQuantidade(itemId, quantidade);

        if (!resultado) {
            return res.status(404).json({ erro: 'Item não encontrado no estoque' });
        }

        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar quantidade no estoque' });
    }
}

const listarGastosEstoque = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    if (!usuarioId) {
      return res.status(400).json({ message: 'O id do usuário é obrigatório.' });
    }

    const gastos = await buscarValorEstoquePorUsuario(usuarioId);

    if (!gastos) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({
      status: 'success',
      data: gastos
    });
  } catch (error) {
    console.error('Erro em listarGastosEstoque:', error);
    return res.status(500).json({ message: 'Erro ao buscar o total de gastos do usuário.' });
  }
};

const listarItensEstoque = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const itens = await buscarItensEstoquePorUsuario(usuarioId);

    return res.status(200).json({
      status: 'success',
      data: itens
    });
  } catch (error) {
    console.error('Erro em listarItensEstoque:', error);
    return res.status(500).json({ message: 'Erro ao buscar os itens do estoque.' });
  }
};

async function listarConsumo(req, res) {
    try {
        const usuarioId = req.user.id;
        const consumo = await buscarConsumo(usuarioId);
        res.json(consumo);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar consumo no banco' });
    }
}

module.exports = { listarEstoque, atualizarQuantidadeItem, listarGastosEstoque, listarItensEstoque, listarConsumo };
