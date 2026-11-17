import AppHeader from "../../components/shared/AppHeader/AppHeader";
import BottomNav from "../../components/shared/BottomNav/BottomNav";
import PanelDigitalizarCupom from "../../components/compras/PanelDigitalizarCupom/PanelDigitalizarCupom";
import "../NovaCompra/NovaCompra.css";

function PageInserirImagem() {
    return (
        <div className="compra-pagina pagina-inserir-imagem">
            <AppHeader voltarPara="/nova-compra" rotuloVoltar="Voltar para nova compra" />
            <PanelDigitalizarCupom />
            <BottomNav />
        </div>
    );
}

export default PageInserirImagem;
