import "./PopupBase.css";

const LINHAS_PADRAO = ["Preparar", "Modificar", "Excluir"];

function PopupBase({ linhas = LINHAS_PADRAO }) {
    return (
        <ul className="receitas-popup-base">
            {linhas.map((linha, indice) => (
                <li className="receitas-popup-base__linha" key={indice}>
                    {linha}
                </li>
            ))}
        </ul>
    );
}

export default PopupBase;
