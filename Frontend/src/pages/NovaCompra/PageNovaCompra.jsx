import PanelNovaCompra from "../../components/compras/PanelNovaCompra/PanelNovaCompra";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

import './NovaCompra.css';
function NovaCompra() {
    return (
        <div>
            <AppHeader />
            <PanelNovaCompra />
            <BottomNav />
        </div>
    );
}

export default NovaCompra;
