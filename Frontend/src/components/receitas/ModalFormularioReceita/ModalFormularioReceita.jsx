import "./ModalFormularioReceita.css";

function ModalFormularioReceita({ titulo, compacto = false, enviando, erro, onClose, children }) {
    const classeDialogo = compacto
        ? "receita-formulario-dialogo receita-formulario-dialogo--compacto"
        : "receita-formulario-dialogo";

    return (
        <div className="receita-formulario-overlay">
            <div className={classeDialogo} role="dialog" aria-modal="true" aria-labelledby="receita-formulario-titulo">
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
