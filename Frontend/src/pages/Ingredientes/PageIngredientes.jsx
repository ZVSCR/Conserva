import PanelIngredientes from "../../components/ingredientes/PanelIngredientes/PanelIngredientes";
import BottomNav from "../../components/shared/BottomNav/BottomNav";
import BackHeader from "../../components/shared/BackHeader/BackHeader";
import "./PageIngredientes.css";

function PageIngredientes() {
    return (
        <div className="ingredientes-page">
            <BackHeader />
            <PanelIngredientes />
            <BottomNav padronizada />
        </div>
    );
}

export default PageIngredientes;
