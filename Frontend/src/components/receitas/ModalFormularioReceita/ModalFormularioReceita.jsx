import { useId, useLayoutEffect, useRef } from "react";
import "./ModalFormularioReceita.css";

function ModalFormularioReceita({ titulo, compacto = false, enviando, erro, onClose, children }) {
    const dialogoRef = useRef(null);
    const tituloId = useId();
    const classeDialogo = compacto
        ? "receita-formulario-dialogo receita-formulario-dialogo--compacto"
        : "receita-formulario-dialogo";

    useLayoutEffect(() => {
        const dialogo = dialogoRef.current;
        const overflowAnterior = document.body.style.overflow;

        dialogo.showModal();
        document.body.style.overflow = "hidden";
        dialogo.querySelector("[data-foco-inicial]")?.focus();

        return () => {
            dialogo.close();
            document.body.style.overflow = overflowAnterior;
        };
    }, []);

    function cancelar(event) {
        event.preventDefault();
        if (!enviando) onClose();
    }

    return (
        <dialog
            ref={dialogoRef}
            className={classeDialogo}
            aria-labelledby={tituloId}
            aria-busy={enviando}
            onCancel={cancelar}
        >
            <header className="receita-formulario-cabecalho">
                <h2 id={tituloId}>{titulo}</h2>
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
        </dialog>
    );
}

export default ModalFormularioReceita;
