export async function abrirCameraCupom() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("A câmera não está disponível. Acesse por HTTPS em um navegador compatível.");
    }

    try {
        return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { exact: "environment" } },
        });
    } catch (erro) {
        if (!["NotFoundError", "OverconstrainedError", "NotReadableError", "AbortError"].includes(erro.name)) {
            throw erro;
        }

        return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
}

export function pararCameraCupom(stream) {
    stream?.getTracks().forEach((track) => track.stop());
}

export function capturarFotoCupom(video) {
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        throw new Error("Aguarde a câmera carregar antes de tirar a foto.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível capturar a foto. Tente novamente.");
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
}
