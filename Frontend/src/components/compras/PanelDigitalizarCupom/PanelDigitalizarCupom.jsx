import { useRef, useState } from "react";
import CameraCupom from "../CameraCupom/CameraCupom";
import IconCamera from "../../../assets/IconsEstoque/camera.png";
import IconGaleria from "../../../assets/IconsEstoque/galeria-de-imagens.png";
import IconScannerBranco from "../../../assets/IconsEstoque/scanner branco.png";
import { useNavigate } from "react-router-dom";
import "./PanelDigitalizarCupom.css";
import { digitalizarCupons } from "../../../services/cupom";

function IconeLixeira({ size = 24 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC3545"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v2" />
            <path d="M5 6l1 14c.05.6.5 1 1.1 1h9.8c.6 0 1.05-.4 1.1-1l1-14" />
            <path d="M10 10v7M14 10v7" />
        </svg>
    );
}

function PanelDigitalizarCupom() {
    const modalScanner = useRef(null);
    const modalFoto = useRef(null);
    const inputGaleria = useRef(null);
    const navigate = useNavigate();
    const [cameraAberta, setCameraAberta] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [fotoAmpliada, setFotoAmpliada] = useState(null);
    const [erroGaleria, setErroGaleria] = useState("");
    const [carregandoImagem, setCarregandoImagem] = useState(false);
    const [digitalizando, setDigitalizando] = useState(false);
    const [erroDigitalizacao, setErroDigitalizacao] = useState("");
    const [digitalizacaoConcluida, setDigitalizacaoConcluida] = useState(false);
    const resultadoOcr = useRef(null);
    const envioEmAndamento = useRef(false);

    async function enviarParaOcr() {
        if (envioEmAndamento.current || !fotos.length) return;
        envioEmAndamento.current = true;
        setDigitalizando(true);
        setErroDigitalizacao("");
        setDigitalizacaoConcluida(false);
        resultadoOcr.current = null;
        try {
            resultadoOcr.current = await digitalizarCupons(fotos);
            setDigitalizacaoConcluida(true);
        } catch (erro) {
            setErroDigitalizacao(erro.message || "Não foi possível enviar as imagens ao OCR.");
        } finally {
            envioEmAndamento.current = false;
            setDigitalizando(false);
        }
    }

    function selecionarImagem(event) {
        const arquivo = event.target.files?.[0];
        event.target.value = "";
        if (!arquivo) return;
        setErroGaleria("");
        if (!arquivo.type.startsWith("image/")) {
            setErroGaleria("Selecione um arquivo de imagem.");
            return;
        }

        setCarregandoImagem(true);
        const leitor = new FileReader();
        leitor.onload = () => {
            confirmarFoto(leitor.result);
        };
        leitor.onerror = () => {
            setErroGaleria("Não foi possível ler a imagem. Tente selecionar novamente.");
        };
        leitor.onloadend = () => setCarregandoImagem(false);
        leitor.readAsDataURL(arquivo);
    }

    function ampliarFoto(indice) {
        setFotoAmpliada(indice);
        modalFoto.current.showModal();
    }

    function fecharScanner() {
        setCameraAberta(false);
        modalScanner.current.close();
    }

    function confirmarFoto(foto) {
        setDigitalizacaoConcluida(false);
        setErroDigitalizacao("");
        resultadoOcr.current = null;
        setFotos((atuais) => [...atuais, foto]);
        fecharScanner();
    }

    function removerFoto(indice) {
        setDigitalizacaoConcluida(false);
        setErroDigitalizacao("");
        resultadoOcr.current = null;
        setFotos((atuais) => atuais.filter((_, indiceAtual) => indiceAtual !== indice));
    }

    function cancelarDigitalizacao() {
        setFotos([]);
        setFotoAmpliada(null);
        navigate("/nova-compra");
    }
    return (
        <main className="digitalizar-cupom">
            <h1>Digitalizar Cupom</h1>

            <p className="digitalizar-cupom-descricao">Confira as imagens antes de continuar.</p>

            <section aria-labelledby="digitalizar-cupom-imagens">
                <div className="digitalizar-cupom-selecao">
                    <h2 id="digitalizar-cupom-imagens">Imagens selecionadas ({fotos.length})</h2>
                    <button type="button" className="digitalizar-cupom-adicionar" disabled={digitalizando} aria-haspopup="dialog" onClick={() => modalScanner.current.showModal()}>Adicionar +</button>
                </div>

                <div className="digitalizar-cupom-preview">
                    {fotos.length === 0 ? <p>Nenhuma imagem selecionada.</p> : fotos.map((foto, indice) => (
                        <figure className="digitalizar-cupom-cartao" key={indice}>
                            <button
                                type="button"
                                className="digitalizar-cupom-miniatura"
                                aria-label={`Ampliar imagem ${indice + 1}`}
                                aria-haspopup="dialog"
                                onClick={() => ampliarFoto(indice)}
                            >
                                <img src={foto} alt={`Cupom fotografado ${indice + 1}`} />
                            </button>
                            <figcaption className="digitalizar-cupom-cartao-rodape">
                                <span>Imagem {indice + 1}</span>
                                <button
                                    type="button"
                                    className="digitalizar-cupom-lixeira"
                                    aria-label={`Remover imagem ${indice + 1}`}
                                    onClick={() => removerFoto(indice)}
                                    disabled={digitalizando}
                                >
                                    <IconeLixeira size={20} />
                                </button>
                            </figcaption>
                        </figure>
                    ))}
                </div>


            </section>

            <p className="digitalizar-cupom-aviso">
                As imagens são temporárias e não serão salvas no dispositivo pelo Conserva.
            </p>
            {fotos.length > 0 && (
                <div className="digitalizar-cupom-acoes">
                    <button type="button" className="digitalizar-cupom-cancelar" disabled={digitalizando} onClick={cancelarDigitalizacao}>
                        Cancelar
                    </button>
                    <button type="button" className="digitalizar-cupom-digitalizar" disabled={digitalizando || carregandoImagem} onClick={enviarParaOcr}>
                        <span>{digitalizando ? "Digitalizando…" : "Digitalizar"}</span>
                        <img src={IconScannerBranco} alt="" />
                    </button>
                </div>
            )}
            {digitalizando && <p role="status">Processando imagens…</p>}
            {digitalizacaoConcluida && <p role="status">Imagens processadas pelo OCR.</p>}
            {erroDigitalizacao && <p className="scanner-erro" role="alert">{erroDigitalizacao}</p>}
            <dialog
                ref={modalFoto}
                className="digitalizar-cupom-foto-modal"
                aria-label={fotoAmpliada === null ? "Visualizar imagem" : `Imagem ${fotoAmpliada + 1} ampliada`}
                onClose={() => setFotoAmpliada(null)}
                onClick={(event) => {
                    if (event.target === event.currentTarget) modalFoto.current.close();
                }}
            >
                <button
                    type="button"
                    className="digitalizar-cupom-foto-fechar"
                    aria-label="Fechar imagem ampliada"
                    onClick={() => modalFoto.current.close()}
                >
                    ×
                </button>
                {fotoAmpliada !== null && (
                    <img src={fotos[fotoAmpliada]} alt={`Cupom fotografado ${fotoAmpliada + 1} ampliado`} />
                )}
            </dialog>
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
                    <button type="button" disabled={carregandoImagem} onClick={() => setCameraAberta(true)}>
                        <img src={IconCamera} alt="" />
                        <span>Tirar foto</span>
                    </button>
                    <button type="button" disabled={carregandoImagem} onClick={() => {
                            setErroGaleria("");
                            inputGaleria.current.click();
                        }}>
                        <img src={IconGaleria} alt="" />
                        <span>Galeria</span>
                    </button>
                </div>}
                <input
                    ref={inputGaleria}
                    type="file"
                    accept="image/*"
                    aria-label="Selecionar imagem do cupom"
                    hidden
                    onChange={selecionarImagem}
                />
                {carregandoImagem && <p role="status">Carregando imagem…</p>}
                {erroGaleria && <p className="scanner-erro" role="alert">{erroGaleria}</p>}
            </dialog>
        </main>
    );
}

export default PanelDigitalizarCupom;
