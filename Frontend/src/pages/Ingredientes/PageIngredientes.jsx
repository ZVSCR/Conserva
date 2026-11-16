import { Link } from "react-router-dom";
import PanelIngredientes from "../../components/ingredientes/PanelIngredientes/PanelIngredientes";
import BottomNav from "../../components/shared/BottomNav/BottomNav";
import setaVoltar from "../../assets/Ingredientes/arrow-left.svg";
import logoConserva from "../../assets/Ingredientes/conserva-logo.svg";
import "./PageIngredientes.css";

function PageIngredientes() {
    return (
        <div className="ingredientes-page">
            <header className="ingredientes-header">
                <Link className="ingredientes-voltar" to="/estoque" aria-label="Voltar ao estoque">
                    <img src={setaVoltar} alt="" />
                </Link>
                <img className="ingredientes-marca" src={logoConserva} alt="Conserva" />
            </header>
            <PanelIngredientes />
            <BottomNav padronizada />
        </div>
    );
}

export default PageIngredientes;
