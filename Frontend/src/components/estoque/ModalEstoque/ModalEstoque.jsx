import './ModalEstoque.css';

//base dos modais do estoque: fundo + caixa + título.
// Os campos e os botões de cada modal entram como "children".
function EstoqueModal({ titulo, children, as: Container = 'div', className = '', overlayClassName = '', ...props }) {
    return (
        <div className={`estoque-modal-overlay ${overlayClassName}`}>
            <Container className={`estoque-modal-caixa ${className}`} role="dialog" aria-modal="true" aria-label={titulo} {...props}>
                <h2 className="estoque-modal-titulo">{titulo}</h2>
                {children}
            </Container>
        </div>
    );
}

export default EstoqueModal;
