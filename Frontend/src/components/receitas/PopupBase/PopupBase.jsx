import "./PopupBase.css";

const LINHAS_PADRAO = ["Preparar", "Modificar", "Excluir"];

function PopupBase({ linhas = LINHAS_PADRAO }) {
    return (
        <ul className="receitas-popup-base">
            {linhas.map((linha, indice) => (
                <li
                    className={`receitas-popup-base__linha${linha.onClick ? " receitas-popup-base__linha--acao" : ""}`}
                    key={indice}
                >
                    {linha.onClick ? (
                        <button
                            type="button"
                            className="receitas-popup-base__acao"
                            onClick={linha.onClick}
                        >
                            {linha.texto}
                        </button>
                    ) : (typeof linha === "string" ? linha : linha.texto)}
                </li>
            ))}
        </ul>
    );
}

export default PopupBase;
