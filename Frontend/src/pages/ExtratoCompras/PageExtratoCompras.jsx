import PanelExtratoCompras from "../../components/compras/PanelExtratoCompras/PanelExtratoCompras";
import BackHeader from "../../components/shared/BackHeader/BackHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

function ExtratoCompras(){
    return(
        <div className="extrato-page">
            <BackHeader />
            <PanelExtratoCompras/>
            <BottomNav padronizada />
        </div>
    );
}

export default ExtratoCompras;
