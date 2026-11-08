import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";
import PanelDigitalizarCupom from "../../components/compras/PanelDigitalizarCupom/PanelDigitalizarCupom";

function PageInserirImagem() {
    return (
        <div className="pagina-inserir-imagem">
            <AppHeader />
            <PanelDigitalizarCupom />
            <BottomNav />
        </div>
    );
}

export default PageInserirImagem;
