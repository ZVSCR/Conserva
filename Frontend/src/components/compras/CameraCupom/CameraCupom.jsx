import { useEffect, useRef, useState } from "react";
import { abrirCameraCupom, capturarFotoCupom, pararCameraCupom } from "../../../services/cameraCupom";
import "./CameraCupom.css";

function CameraCupom({ onConfirmar }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const ultimaCameraRef = useRef(null);
    const [foto, setFoto] = useState(null);
    const [erro, setErro] = useState("");
    const [pronta, setPronta] = useState(false);
    const [tentativa, setTentativa] = useState(0);
    const [cameras, setCameras] = useState([]);
    const [cameraId, setCameraId] = useState(null);

    useEffect(() => {
        if (foto) return;
        let cancelada = false;
        let stream;

        async function iniciarCamera() {
            try {
                stream = await abrirCameraCupom(cameraId);
                if (cancelada) {
                    pararCameraCupom(stream);
                    return;
                }
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                if (cancelada) return;
                ultimaCameraRef.current = {
                    deviceId: stream.getVideoTracks()[0]?.getSettings().deviceId || cameraId,
                };
                try {
                    const dispositivos = await navigator.mediaDevices.enumerateDevices();
                    if (!cancelada) {
                        setCameras(dispositivos.filter((dispositivo) => dispositivo.kind === "videoinput" && dispositivo.deviceId));
                    }
                } catch {
                    if (!cancelada) setCameras([]);
                }
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
    }, [foto, tentativa, cameraId]);

    function trocarCamera() {
        if (erro && ultimaCameraRef.current) {
            setCameraId(ultimaCameraRef.current.deviceId || null);
            reiniciarCamera();
            return;
        }
        if (!pronta || cameras.length < 2) return;
        const atual = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId;
        const outraCamera = cameras.find((camera) => camera.deviceId !== atual);
        if (!outraCamera) return;
        const indice = cameras.findIndex((camera) => camera.deviceId === atual);
        const proxima = indice < 0 ? outraCamera : cameras[(indice + 1) % cameras.length];
        setPronta(false);
        setErro("");
        setCameraId(proxima.deviceId);
    }

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
                {!foto && (
                        <button
                            type="button"
                            className="camera-cupom-trocar"
                            aria-label={erro ? "Voltar à câmera anterior" : "Trocar câmera"}
                            title={erro ? "Voltar à câmera anterior" : cameras.length > 1 ? "Trocar câmera" : "Nenhuma outra câmera disponível"}
                            disabled={erro ? !ultimaCameraRef.current : !pronta || cameras.length < 2}
                            onClick={trocarCamera}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M20 7a9 9 0 0 0-15-2L2 8" />
                                <path d="M2 3v5h5" />
                                <path d="M4 17a9 9 0 0 0 15 2l3-3" />
                                <path d="M22 21v-5h-5" />
                            </svg>
                        </button>
                )}
            </div>
        </section>
    );
}

export default CameraCupom;
