function PopupBase({ linhas = [] }) {
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
