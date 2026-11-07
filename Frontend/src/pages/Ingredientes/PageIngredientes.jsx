import PanelIngredientes from "../../components/ingredientes/PanelIngredientes/PanelIngredientes";
import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";

function PageIngredientes() {
    return (
        <div>
            <AppHeader />
            <PanelIngredientes />
            <BottomNav />
        </div>
    );
}

export default PageIngredientes;