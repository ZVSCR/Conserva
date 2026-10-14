import './EstoqueModal.css';

//base dos modais do estoque: fundo + caixa + título.
// Os campos e os botões de cada modal entram como "children".
function EstoqueModal({ titulo, children }) {
    return (
        <div className="estoque-modal-overlay">
            <div className="estoque-modal-caixa">
                <h2 className="estoque-modal-titulo">{titulo}</h2>
                {children}
            </div>
        </div>
    );
}

export default EstoqueModal;