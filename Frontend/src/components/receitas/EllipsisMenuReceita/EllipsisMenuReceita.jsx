import { useEffect, useId, useRef } from "react";
import PopupBase from "../PopupBase/PopupBase";
import "./EllipsisMenuReceita.css";

function EllipsisMenuReceita({ onClick, onModificar, onExcluir, rotulo = "Opções da receita" }) {
    const popupId = useId();
    const botaoRef = useRef(null);
    const popupRef = useRef(null);

    useEffect(() => {
        const fecharPopup = (event) => {
            const popup = popupRef.current;
            if (popup && popup.matches(":popover-open") &&
                (event.type === "resize" || !popup.contains(event.target))) {
                popup.hidePopover();
            }
        };

        window.addEventListener("scroll", fecharPopup, true);
        window.addEventListener("resize", fecharPopup);
        return () => {
            window.removeEventListener("scroll", fecharPopup, true);
            window.removeEventListener("resize", fecharPopup);
        };
    }, []);

    const posicionarPopup = (event) => {
        if (event.newState !== "open") return;

        const popup = popupRef.current;
        const botao = botaoRef.current.getBoundingClientRect();
        const margem = 8;
        const largura = popup.offsetWidth;
        const altura = popup.offsetHeight;
        const topo = botao.bottom + margem + altura <= window.innerHeight
            ? botao.bottom + margem
            : botao.top - altura - margem;

        popup.style.left = `${Math.max(margem, Math.min(botao.right - largura, window.innerWidth - largura - margem))}px`;
        popup.style.top = `${Math.max(margem, topo)}px`;
    };

    return (
        <>
            <button
                ref={botaoRef}
                type="button"
                className="ellipsis-menu-receita"
                aria-label={rotulo}
                onClick={onClick}
                popoverTarget={popupId}
            >
                <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                    stroke="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                </svg>
            </button>
            <div
                ref={popupRef}
                id={popupId}
                className="ellipsis-menu-receita__popup"
                popover="auto"
                onToggle={posicionarPopup}
            >
                <PopupBase linhas={[
                    "Preparar",
                    {
                        texto: "Modificar",
                        onClick: onModificar ? () => {
                            popupRef.current.hidePopover();
                            onModificar();
                        } : undefined,
                    },
                    {
                        texto: "Excluir",
                        onClick: onExcluir ? () => {
                            popupRef.current.hidePopover();
                            onExcluir();
                        } : undefined,
                    },
                ]} />
            </div>
        </>
    );
}

export default EllipsisMenuReceita;
