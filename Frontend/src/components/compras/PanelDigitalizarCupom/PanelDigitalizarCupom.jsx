import { useRef, useState } from "react";
import CameraCupom from "../CameraCupom/CameraCupom";
import IconCamera from "../../../assets/IconsEstoque/camera.png";
import IconGaleria from "../../../assets/IconsEstoque/galeria-de-imagens.png";
import IconScannerBranco from "../../../assets/IconsEstoque/scanner branco.png";
import { useNavigate } from "react-router-dom";
import "./PanelDigitalizarCupom.css";
import { digitalizarCupons } from "../../../services/cupom";
import { apiFetch } from "../../../services/api";
import { getApiErrorMessage } from "../../../services/apiErrors";

const UNIDADES_MEDIDA = ["un", "kg", "g", "L", "mL"];
const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function totalDoItem(item) {
    return Math.round(Number(item.quantidade) * Number(item.valor_unitario) * 100) / 100;
}

function dataHoje() {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function prepararItem(item) {
    const unidade = item.medida?.trim().toLowerCase();
    const unidadesConhecidas = { un: "un", kg: "kg", g: "g", l: "L", ml: "mL" };
    const validade = typeof item.validade_estimada === "string"
        && /^\d{4}-\d{2}-\d{2}$/.test(item.validade_estimada)
        ? item.validade_estimada
        : "";
    return {
        ...item,
        nome_padronizado: item.nome_padronizado ?? "",
        quantidade: String(item.quantidade ?? ""),
        medida: unidadesConhecidas[unidade] ?? "",
        valor_unitario: String(item.valor_unitario ?? ""),
        validade_estimada: validade,
    };
}

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
    const [resultadosOcr, setResultadosOcr] = useState([]);
    const [itensDetectados, setItensDetectados] = useState([]);
    const [dataCompra, setDataCompra] = useState(dataHoje);
    const [estabelecimento, setEstabelecimento] = useState("");
    const [erroCompra, setErroCompra] = useState("");
    const [salvandoCompra, setSalvandoCompra] = useState(false);
    const envioEmAndamento = useRef(false);

    async function enviarParaOcr() {
        if (envioEmAndamento.current || !fotos.length) return;
        envioEmAndamento.current = true;
        setDigitalizando(true);
        setErroDigitalizacao("");
        setErroCompra("");
        setDigitalizacaoConcluida(false);
        setResultadosOcr([]);
        setItensDetectados([]);
        try {
            const resultado = await digitalizarCupons(fotos, dataCompra);
            setResultadosOcr(resultado.resultados);
            setItensDetectados(resultado.resultados.flatMap(({ itens_alimenticios }) =>
                itens_alimenticios.map(prepararItem)
            ));
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
        setResultadosOcr([]);
        setItensDetectados([]);
        setFotos((atuais) => [...atuais, foto]);
        fecharScanner();
    }

    function removerFoto(indice) {
        setDigitalizacaoConcluida(false);
        setErroDigitalizacao("");
        setResultadosOcr([]);
        setItensDetectados([]);
        setFotos((atuais) => atuais.filter((_, indiceAtual) => indiceAtual !== indice));
    }

    function alterarItem(indice, campo, valor) {
        setItensDetectados((atuais) => atuais.map((item, indiceAtual) =>
            indiceAtual === indice ? { ...item, [campo]: valor } : item
        ));
        setErroCompra("");
    }

    async function salvarCompra(event) {
        event.preventDefault();
        if (salvandoCompra || !itensDetectados.length) return;

        const estabelecimentoInformado = estabelecimento.trim();
        if (!estabelecimentoInformado || estabelecimentoInformado.length > 50) {
            setErroCompra("Informe um estabelecimento com até 50 caracteres.");
            return;
        }

        const itensParaEnviar = itensDetectados.map((item) => {
            const quantidade = Number(item.quantidade);
            return {
                nome_item: item.nome_padronizado.trim(),
                quantidade,
                unidade_de_medida: item.medida,
                preco_total_item: totalDoItem(item),
                ...(item.validade_estimada ? { validade_estimada: item.validade_estimada } : {}),
            };
        });
        const itemInvalido = itensParaEnviar.some((item) =>
            !item.nome_item || item.nome_item.length > 100 ||
            !Number.isFinite(item.quantidade) || item.quantidade <= 0 ||
            (item.unidade_de_medida === "un" && !Number.isInteger(item.quantidade)) ||
            !UNIDADES_MEDIDA.includes(item.unidade_de_medida) ||
            !Number.isFinite(item.preco_total_item) || item.preco_total_item < 0
        );
        if (itemInvalido) {
            setErroCompra("Revise os itens: nome, quantidade, unidade de medida e valor unitário devem ser válidos.");
            return;
        }

        setSalvandoCompra(true);
        setErroCompra("");
        try {
            const resposta = await apiFetch("/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data_compra: dataCompra,
                    estabelecimento: estabelecimentoInformado,
                    itens: itensParaEnviar,
                }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                setErroCompra(getApiErrorMessage(dados, "Não foi possível registrar a compra."));
                return;
            }
            navigate("/extrato-compras", { replace: true });
        } catch {
            setErroCompra("Não foi possível conectar ao servidor para registrar a compra.");
        } finally {
            setSalvandoCompra(false);
        }
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
                    <button type="button" className="digitalizar-cupom-adicionar" disabled={digitalizando || salvandoCompra} aria-haspopup="dialog" onClick={() => modalScanner.current.showModal()}>Adicionar +</button>
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
                                    disabled={digitalizando || salvandoCompra}
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
                    <button type="button" className="digitalizar-cupom-cancelar" disabled={digitalizando || salvandoCompra} onClick={cancelarDigitalizacao}>
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
            {digitalizacaoConcluida && (
                <section className="digitalizar-cupom-resultados" aria-labelledby="digitalizar-cupom-resultados-titulo">
                    <h2 id="digitalizar-cupom-resultados-titulo">Itens reconhecidos</h2>
                    {itensDetectados.length === 0 ? (
                        <p role="status">Nenhum item alimentício foi reconhecido nas imagens.</p>
                    ) : (
                        <>
                            <p>Confira os dados padronizados antes de registrar a compra.</p>
                            <form className="digitalizar-cupom-formulario" onSubmit={salvarCompra}>
                                <label>
                                    Estabelecimento
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={estabelecimento}
                                        onChange={(event) => setEstabelecimento(event.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Data da compra
                                    <input
                                        type="date"
                                        value={dataCompra}
                                        onChange={(event) => setDataCompra(event.target.value)}
                                        required
                                    />
                                </label>
                                <ul className="digitalizar-cupom-itens" aria-label="Itens padronizados pelo OCR">
                                    {itensDetectados.map((item, indice) => (
                                        <li key={`${indice}-${item.nome_padronizado}`}>
                                            <label>
                                                Item
                                                <input
                                                    type="text"
                                                    maxLength={100}
                                                    value={item.nome_padronizado}
                                                    onChange={(event) => alterarItem(indice, "nome_padronizado", event.target.value)}
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Quantidade
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    max="9999999.99"
                                                    step="0.01"
                                                    value={item.quantidade}
                                                    onChange={(event) => alterarItem(indice, "quantidade", event.target.value)}
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Unidade
                                                <select
                                                    value={item.medida}
                                                    onChange={(event) => alterarItem(indice, "medida", event.target.value)}
                                                    required
                                                >
                                                    <option value="" disabled>Selecione</option>
                                                    {UNIDADES_MEDIDA.map((unidade) => (
                                                        <option key={unidade} value={unidade}>{unidade}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Valor unitário
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.valor_unitario}
                                                    onChange={(event) => alterarItem(indice, "valor_unitario", event.target.value)}
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Validade estimada (opcional)
                                                <input
                                                    type="date"
                                                    value={item.validade_estimada}
                                                    onChange={(event) => alterarItem(indice, "validade_estimada", event.target.value)}
                                                />
                                            </label>
                                            <p className="digitalizar-cupom-total">
                                                Total do item: {FORMATO_MOEDA.format(totalDoItem(item))}
                                            </p>
                                            {item.is_item_novo && <span className="digitalizar-cupom-item-novo">Novo ingrediente</span>}
                                        </li>
                                    ))}
                                </ul>
                                {resultadosOcr.map((resultado, indice) => (
                                    <details key={indice}>
                                        <summary>Texto reconhecido da imagem {indice + 1}</summary>
                                        <pre>{resultado.texto}</pre>
                                    </details>
                                ))}
                                {erroCompra && <p className="scanner-erro" role="alert">{erroCompra}</p>}
                                <button
                                    type="submit"
                                    className="digitalizar-cupom-salvar"
                                    disabled={salvandoCompra}
                                >
                                    {salvandoCompra ? "Salvando compra…" : "Registrar compra"}
                                </button>
                            </form>
                        </>
                    )}
                </section>
            )}
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
