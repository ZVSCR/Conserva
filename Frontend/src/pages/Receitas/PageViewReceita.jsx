import PanelViewReceita from "../../components/receitas/PanelReceitas/PanelViewReceita";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

function ViewReceita() {
    return (
        <div>
            <AppHeader />
            <PanelViewReceita />
            <BottomNav />
        </div>
    )
}

export default ViewReceita;
