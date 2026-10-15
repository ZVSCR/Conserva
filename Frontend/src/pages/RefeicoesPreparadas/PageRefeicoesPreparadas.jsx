import PanelRefeicoesPreparadas from "../../components/receitas/PanelReceitasPreparadas/PanelReceitasPreparadas";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

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
