import "./ModalFormularioReceita.css";

function ModalFormularioReceita({ titulo, enviando, erro, onClose, children }) {
    return (
        <div className="receita-formulario-overlay">
            <div className="receita-formulario-dialogo" role="dialog" aria-modal="true" aria-labelledby="receita-formulario-titulo">
                <header className="receita-formulario-cabecalho">
                    <h2 id="receita-formulario-titulo">{titulo}</h2>
                    <button
                        type="button"
                        className="receita-formulario-fechar"
                        aria-label="Fechar"
                        disabled={enviando}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </header>
                {erro && <p className="receita-formulario-erro" role="alert">{erro}</p>}
                {children}
            </div>
        </div>
    );
}

export default ModalFormularioReceita;
