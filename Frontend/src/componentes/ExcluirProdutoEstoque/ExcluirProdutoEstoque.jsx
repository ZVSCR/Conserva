import ModalEstoque from '../ModalEstoque/ModalEstoque';

function ExcluirProdutoEstoque({ produto, onConfirmar, onCancelar }) {

    return (
        <ModalEstoque titulo="Excluir produto">

            <p className="estoque-modal-texto">
                Tem certeza que deseja excluir "{produto.nome}"?
            </p>

            <div className="estoque-modal-acoes">
                <button className="estoque-modal-botao-cancelar" onClick={onCancelar}>
                    Cancelar
                </button>
                <button className="estoque-modal-botao-excluir" onClick={onConfirmar}>
                    Excluir
                </button>
            </div>

        </ModalEstoque>
    );
}

export default ExcluirProdutoEstoque;