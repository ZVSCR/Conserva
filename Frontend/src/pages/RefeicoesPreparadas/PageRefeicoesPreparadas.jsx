import PanelRefeicoesPreparadas from "../../componentes/PanelReceitasPreparadas/PanelReceitasPreparadas";
import AppHeader from "../../componentes/AppHeader/AppHeader";
import BottomNav from "../../componentes/BottomNav/BottomNav";

function RefeicoesPreparadas() {
    return(
        <div>
            <AppHeader />
            <PanelRefeicoesPreparadas />
            <BottomNav />
        </div>
    )
}

export default RefeicoesPreparadas
