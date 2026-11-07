import { useRef } from "react";
import IconCamera from "../../../assets/IconsEstoque/camera.png";
import IconGaleria from "../../../assets/IconsEstoque/galeria-de-imagens.png";
import { Link, useNavigate } from "react-router-dom";
import "./PanelDigitalizarCupom.css";

function PanelDigitalizarCupom() {
    const modalScanner = useRef(null);
    const navigate = useNavigate();
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
                    <button type="button" className="digitalizar-cupom-adicionar" aria-haspopup="dialog" onClick={() => modalScanner.current.showModal()}>Adicionar +</button>
                </div>

                <div className="digitalizar-cupom-preview">
                    <p>Nenhuma imagem selecionada.</p>
                </div>


            </section>

            <p className="digitalizar-cupom-aviso">
                As imagens são temporárias e não serão salvas no dispositivo pelo Conserva.
            </p>
            <dialog
                ref={modalScanner}
                className="scanner-modal"
                aria-labelledby="scanner-orientacao"
                onClick={(event) => {
                    if (event.target !== event.currentTarget) return;
                    const limites = event.currentTarget.getBoundingClientRect();
                    if (
                        event.clientX < limites.left || event.clientX > limites.right ||
                        event.clientY < limites.top || event.clientY > limites.bottom
                    ) {
                        event.currentTarget.close();
                    }
                }}
            >
                <button
                    type="button"
                    className="scanner-fechar"
                    aria-label="Fechar opções de escaneamento"
                    onClick={() => modalScanner.current.close()}
                >
                    ×
                </button>
                <p id="scanner-orientacao" className="scanner-orientacao">
                    <span>Tire uma foto ou escolha uma imagem do seu dispositivo.</span>
                </p>
                <div className="scanner-opcoes">
                    <button type="button" onClick={() => {
                            modalScanner.current.close();
                            navigate("/digitalizar-cupom");
                        }}>
                        <img src={IconCamera} alt="" />
                        <span>Tirar foto</span>
                    </button>
                    <button type="button" onClick={() => {
                            modalScanner.current.close();
                            navigate("/digitalizar-cupom");
                        }}>
                        <img src={IconGaleria} alt="" />
                        <span>Galeria</span>
                    </button>
                </div>
            </dialog>
        </main>
    );
}

export default PanelDigitalizarCupom;
