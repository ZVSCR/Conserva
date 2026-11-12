import { useEffect, useRef, useState } from "react";
import { abrirCameraCupom, capturarFotoCupom, pararCameraCupom } from "../../../services/cameraCupom";
import "./CameraCupom.css";

function CameraCupom({ onConfirmar }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [foto, setFoto] = useState(null);
    const [erro, setErro] = useState("");
    const [pronta, setPronta] = useState(false);
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        if (foto) return;
        let cancelada = false;
        let stream;

        async function iniciarCamera() {
            try {
                stream = await abrirCameraCupom();
                if (cancelada) {
                    pararCameraCupom(stream);
                    return;
                }
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            } catch (error) {
                pararCameraCupom(stream);
                if (cancelada) return;
                setPronta(false);
                const mensagens = {
                    NotAllowedError: "Permita o acesso à câmera no navegador para tirar a foto.",
                    NotFoundError: "Nenhuma câmera foi encontrada neste dispositivo.",
                    OverconstrainedError: "Nenhuma câmera compatível está disponível neste dispositivo.",
                    NotReadableError: "Não foi possível abrir a câmera. Verifique se outro aplicativo está usando ela.",
                };
                setErro(mensagens[error.name] || error.message || "Não foi possível abrir a câmera. Tente novamente.");
            }
        }

        iniciarCamera();
        return () => {
            cancelada = true;
            pararCameraCupom(stream);
            streamRef.current = null;
        };
    }, [foto, tentativa]);

    function tirarFoto() {
        try {
            const imagem = capturarFotoCupom(videoRef.current);
            pararCameraCupom(streamRef.current);
            setFoto(imagem);
            setPronta(false);
            setErro("");
        } catch (error) {
            setErro(error.message);
        }
    }

    function reiniciarCamera() {
        setErro("");
        setPronta(false);
        setFoto(null);
        setTentativa((atual) => atual + 1);
    }

    return (
        <section className="camera-cupom" aria-label="Câmera do cupom">
            <p>{foto ? "Confira a foto antes de confirmar." : "Enquadre o cupom inteiro e tire a foto."}</p>
            {foto ? (
                <img className="camera-cupom-imagem" src={foto} alt="Prévia da foto do cupom" />
            ) : (
                <video
                    ref={videoRef}
                    className="camera-cupom-imagem"
                    autoPlay
                    playsInline
                    muted
                    aria-label="Imagem ao vivo da câmera"
                    onCanPlay={() => setPronta(true)}
                />
            )}
            {!foto && !pronta && !erro && <p role="status">Aguardando acesso à câmera…</p>}
            {erro && <p className="camera-cupom-erro" role="alert">{erro}</p>}
            <div className="camera-cupom-acoes">
                {foto ? (
                    <>
                        <button type="button" onClick={reiniciarCamera}>Tirar novamente</button>
                        <button type="button" className="camera-cupom-confirmar" onClick={() => onConfirmar(foto)}>Confirmar foto</button>
                    </>
                ) : erro ? (
                    <button type="button" onClick={reiniciarCamera}>Tentar novamente</button>
                ) : (
                    <button type="button" className="camera-cupom-confirmar" disabled={!pronta} onClick={tirarFoto}>Tirar foto</button>
                )}
            </div>
        </section>
    );
}

export default CameraCupom;
