const { buscarItens, buscarPorId, atualizarPorId, apagarPorId, buscarItensPorUsuario } = require('../repositories/itemRepository');
const { adicionaItensACompraService } = require('../services/compraService');
const { validateItem } = require('../middleware/compraValidator');
const { validateDate } = require('../middleware/generalValidator');
const { quantidadeRepresentavel } = require('../services/granularidadeService');
const {
  GranularidadeInvalidaError,
  ItemCompraConflitoError,
  ItemCompraNaoEncontradoError
} = require('../repositories/compraRepository');

const validateItemPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, message: 'O corpo da requisição deve ser um objeto JSON.' };
  }
  const allowedFields = ['quantidade', 'valor_unitario', 'nome_item', 'unidade_de_medida', 'validade_estimada'];

  if (Object.keys(body).some(key => !allowedFields.includes(key))) {
    return { isValid: false, message: 'A atualização contém campos não permitidos.' };
  }

  // Garante que ao menos um campo permitido foi enviado
  const hasAtLeastOneField = Object.keys(body).some((key) =>
    allowedFields.includes(key) && body[key] !== undefined
  );

  if (!hasAtLeastOneField) {
    return {
      isValid: false,
      message: 'Forneça ao menos um campo válido para atualização.'
    };
  }

  if (body.quantidade !== undefined &&
      (typeof body.quantidade !== 'number' || !Number.isFinite(body.quantidade) || body.quantidade <= 0)) {
    return { isValid: false, message: 'quantidade deve ser um número maior que zero.' };
  }
  if (body.quantidade !== undefined && !quantidadeRepresentavel(body.quantidade)) {
    return { isValid: false, message: 'quantidade deve ter até duas casas decimais e caber no campo do banco.' };
  }
  if (body.valor_unitario !== undefined &&
      (typeof body.valor_unitario !== 'number' || !Number.isFinite(body.valor_unitario) || body.valor_unitario < 0)) {
    return { isValid: false, message: 'valor_unitario deve ser um número maior ou igual a zero.' };
  }
  if (body.nome_item !== undefined &&
      (typeof body.nome_item !== 'string' || !body.nome_item.trim() || body.nome_item.length > 100)) {
    return { isValid: false, message: 'nome_item deve ser um texto não vazio de até 100 caracteres.' };
  }
  if (body.unidade_de_medida !== undefined &&
      (typeof body.unidade_de_medida !== 'string' || !body.unidade_de_medida.trim() || body.unidade_de_medida.length > 20)) {
    return { isValid: false, message: 'unidade_de_medida deve ser um texto não vazio de até 20 caracteres.' };
  }
  if (body.validade_estimada !== undefined && validateDate({
    value: body.validade_estimada,
    field: 'validade_estimada',
    required: false,
    minYear: 1926,
    messages: { type: 'Data inválida.', format: 'Data inválida.', minYear: 'Data inválida.', invalid: 'Data inválida.' }
  }).length > 0) {
    return { isValid: false, message: 'validade_estimada deve ser uma data válida no formato YYYY-MM-DD ou null.' };
  }

  return { isValid: true };
};

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
async function listarItensGastos(req, res) {
    try {
        // Pega o ID do usuário injetado pelo mockAuth
        const usuarioId = req.user.id; 
        
        const items = await buscarItensPorUsuario(usuarioId);
        res.json(items);
    } catch (erro) {
        res.status(500).json({
            erro: 'Erro ao buscar os itens gastos do usuário no banco'
        });
    }
}
// =============================================================================
//ATUALIZAÇÃO

async function atualizarItem(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: 'id deve ser um inteiro positivo.' });
        }

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
        if (erro instanceof GranularidadeInvalidaError) {
            return res.status(400).json({ erro: erro.message });
        }
        if (erro instanceof ItemCompraConflitoError) {
            return res.status(409).json({ erro: erro.message });
        }
        if (erro instanceof ItemCompraNaoEncontradoError) {
            return res.status(404).json({ erro: erro.message });
        }
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
// =============================================================================
// CRIAÇÃO
async function criarItemHandler(req, res) {
    try {
        const usuarioId = req.body?.usuario_id;
        const compraId = req.body?.compra_id;
        if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0 ||
            !Number.isSafeInteger(compraId) || compraId <= 0) {
            return res.status(400).json({ erro: 'usuario_id e compra_id devem ser inteiros positivos.' });
        }

        const erros = validateItem(req.body, 0);
        if (erros.length > 0) {
            return res.status(400).json({ error: erros });
        }

        const resultado = await adicionaItensACompraService(usuarioId, compraId, { itens: [req.body] });
        res.status(201).json({ compraId: resultado.id });
    } catch (erro) {
        console.error(erro)
        res.status(500).json({
            erro: 'Erro ao criar item no estoque'
        });
    }
}
// =============================================================================
module.exports = { listarItens, listarPorId, atualizarItem, apagarId , criarItemHandler, listarItensGastos}
