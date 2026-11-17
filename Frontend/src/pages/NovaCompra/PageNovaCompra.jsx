import PanelNovaCompra from "../../components/compras/PanelNovaCompra/PanelNovaCompra";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

import "./NovaCompra.css";

function NovaCompra() {
    return (
        <div className="compra-pagina nova-compra">
            <AppHeader voltarPara="/estoque" rotuloVoltar="Voltar para o estoque" />
            <PanelNovaCompra />
            <BottomNav padronizada />
        </div>
    );
}

export default NovaCompra;
