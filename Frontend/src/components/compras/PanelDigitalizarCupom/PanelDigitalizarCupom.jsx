import { Link } from "react-router-dom";
import "./PanelDigitalizarCupom.css";

function PanelDigitalizarCupom() {
    return (
        <main className="digitalizar-cupom">
            <div className="digitalizar-cupom-cabecalho">
                <Link to="/nova-compra" className="digitalizar-cupom-voltar" aria-label="Voltar para nova compra">
                    ←
                </Link>
                <h1>Digitalizar Cupom</h1>
            </div>

            <p className="digitalizar-cupom-descricao">Confira as imagens antes de continuar.</p>

            <section aria-labelledby="digitalizar-cupom-imagens">
                <div className="digitalizar-cupom-selecao">
                    <h2 id="digitalizar-cupom-imagens">Imagens selecionadas (0)</h2>
                    <span className="digitalizar-cupom-adicionar">Adicionar +</span>
                </div>

                <div className="digitalizar-cupom-preview">
                    <p>Nenhuma imagem selecionada.</p>
                </div>

                <div className="digitalizar-cupom-mais-imagens">
                    <p>Adicionar mais imagens</p>
                    <span>Tirar foto ou escolher da galeria</span>
                </div>
            </section>

            <p className="digitalizar-cupom-aviso">
                As imagens são temporárias e não serão salvas no dispositivo pelo Conserva.
            </p>
        </main>
    );
}

export default PanelDigitalizarCupom;
