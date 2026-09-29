import PanelNovaCompra from "../../componentes/PanelNovaCompra/PanelNovaCompra";
import Header from "../../componentes/Header/Header";

import './NovaCompra.css';
function NovaCompra() {
    return (
        <div>
            <header className="Header">
                <h1>ConservaAI</h1>
                <a href="/scan">VOLTAR</a>
            </header>
            <PanelNovaCompra />
        </div>
    );
}

export default NovaCompra;