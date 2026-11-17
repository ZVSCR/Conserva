import PanelViewReceita from "../../components/receitas/PanelReceitas/PanelViewReceita";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

function ViewReceita() {
    return (
        <div className="receitas-page">
            <AppHeader variante="estoque" />
            <PanelViewReceita />
            <BottomNav padronizada />
        </div>
    )
}

export default ViewReceita;
