import PanelExtratoCompras from "../../components/compras/PanelExtratoCompras/PanelExtratoCompras";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

function ExtratoCompras(){
    return(
        <div>
            <AppHeader />
            <PanelExtratoCompras/>
            <BottomNav />
        </div>
    );
}

export default ExtratoCompras;
