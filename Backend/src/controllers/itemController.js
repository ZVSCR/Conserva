function listarItens(req, res) {
    res.send(`Itens buscados para os ids: ...`);
}

function listarPorId(req, res) {
    const parametros = req.params;
    res.send(`Item buscado para o id ${parametros.id}: ...`);
}

module.exports = { listarItens, listarPorId }