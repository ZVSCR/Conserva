import { useRef, useState } from "react";
import CameraCupom from "../CameraCupom/CameraCupom";
import IconCamera from "../../../assets/IconsEstoque/camera.png";
import IconGaleria from "../../../assets/IconsEstoque/galeria-de-imagens.png";
import { Link, useNavigate } from "react-router-dom";
import "./PanelDigitalizarCupom.css";

function PanelDigitalizarCupom() {
    const modalScanner = useRef(null);
    const navigate = useNavigate();
    const [cameraAberta, setCameraAberta] = useState(false);
    const [fotos, setFotos] = useState([]);

    function fecharScanner() {
        setCameraAberta(false);
        modalScanner.current.close();
    }

    function confirmarFoto(foto) {
        setFotos((atuais) => [...atuais, foto]);
        fecharScanner();
    }
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
                    <h2 id="digitalizar-cupom-imagens">Imagens selecionadas ({fotos.length})</h2>
                    <button type="button" className="digitalizar-cupom-adicionar" aria-haspopup="dialog" onClick={() => modalScanner.current.showModal()}>Adicionar +</button>
                </div>

                <div className="digitalizar-cupom-preview">
                    {fotos.length === 0 ? <p>Nenhuma imagem selecionada.</p> : fotos.map((foto, indice) => (
                        <img key={indice} src={foto} alt={`Cupom fotografado ${indice + 1}`} />
                    ))}
                </div>


            </section>

            <p className="digitalizar-cupom-aviso">
                As imagens são temporárias e não serão salvas no dispositivo pelo Conserva.
            </p>
            <dialog
                ref={modalScanner}
                className="scanner-modal"
                aria-labelledby="scanner-orientacao"
                onCancel={() => setCameraAberta(false)}
                onClose={() => setCameraAberta(false)}
                onClick={(event) => {
                    if (event.target !== event.currentTarget) return;
                    const limites = event.currentTarget.getBoundingClientRect();
                    if (
                        event.clientX < limites.left || event.clientX > limites.right ||
                        event.clientY < limites.top || event.clientY > limites.bottom
                    ) {
                        fecharScanner();
                    }
                }}
            >
                <button
                    type="button"
                    className="scanner-fechar"
                    aria-label="Fechar escaneamento"
                    onClick={fecharScanner}
                >
                    ×
                </button>
                <p id="scanner-orientacao" className="scanner-orientacao">
                    <span>{cameraAberta ? "Fotografar cupom" : "Tire uma foto ou escolha uma imagem do seu dispositivo."}</span>
                </p>
                {cameraAberta ? <CameraCupom onConfirmar={confirmarFoto} /> : <div className="scanner-opcoes">
                    <button type="button" onClick={() => setCameraAberta(true)}>
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
                </div>}
            </dialog>
        </main>
    );
}

export default PanelDigitalizarCupom;
