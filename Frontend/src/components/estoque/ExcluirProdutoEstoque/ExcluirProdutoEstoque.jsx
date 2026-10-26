import ModalEstoque from '../ModalEstoque/ModalEstoque';

function ExcluirProdutoEstoque({
    produto,
    onConfirmar,
    onCancelar,
    titulo = "Excluir produto",
    mensagem = <>Tem certeza que deseja excluir "{produto.nome}"?</>,
    excluindo = false,
    erro = "",
}) {

    return (
        <ModalEstoque titulo={titulo}>

            <p className="estoque-modal-texto">
                {mensagem}
            </p>

            {erro && <p className="estoque-modal-texto" role="alert">{erro}</p>}

            <div className="estoque-modal-acoes">
                <button type="button" className="estoque-modal-botao-cancelar" onClick={onCancelar} disabled={excluindo}>
                    Cancelar
                </button>
                <button type="button" className="estoque-modal-botao-excluir" onClick={onConfirmar} disabled={excluindo}>
                    {excluindo ? "Excluindo..." : "Excluir"}
                </button>
            </div>

        </ModalEstoque>
    );
}

export default ExcluirProdutoEstoque;
