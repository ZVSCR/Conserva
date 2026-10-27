import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PanelIngredientes.css";

const API_URL = "http://localhost:3000/api/ingredientes";
const USUARIO_MOCK_ID = 1;
const ROTA_VOLTAR = "/estoque";

// Busca sem acento e sem diferença de maiúsculas (o backend guarda os nomes normalizados)
function normalizarBusca(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function ordenar(lista) {
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// O backend responde erros como { errors: [...] }, { error: "texto" } ou { error: [...] }
function mensagemDeErro(data, padrao) {
    if (Array.isArray(data?.errors)) return data.errors.map((e) => e.message).join(" ");
    if (Array.isArray(data?.error)) return data.error.map((e) => e.message).join(" ");
    if (typeof data?.error === "string") return data.error;
    return padrao;
}

function PanelIngredientes() {
    const navigate = useNavigate();

    const [ingredientes, setIngredientes] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Modal de criar/editar
    const [modalAberto, setModalAberto] = useState(false);
    const [ingredienteEditandoId, setIngredienteEditandoId] = useState(null);
    const [nome, setNome] = useState("");
    const [modalErrorMsg, setModalErrorMsg] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Modal de confirmar exclusão
    const [ingredienteExcluindo, setIngredienteExcluindo] = useState(null);
    const [excluirErrorMsg, setExcluirErrorMsg] = useState("");
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        async function carregarIngredientes() {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();

                if (!response.ok) {
                    setErrorMsg(mensagemDeErro(data, "Não foi possível carregar os ingredientes."));
                    return;
                }

                setIngredientes(data.ingredientes);
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                setErrorMsg("Não foi possível conectar ao servidor.");
            } finally {
                setLoading(false);
            }
        }

        carregarIngredientes();
    }, []);

    const busca = normalizarBusca(filtro);
    const ingredientesFiltrados = ingredientes.filter((ingrediente) =>
        normalizarBusca(ingrediente.nome).includes(busca)
    );

    function abrirModalNovo() {
        setNome("");
        setIngredienteEditandoId(null);
        setModalErrorMsg("");
        setModalAberto(true);
    }

    function abrirModalEdicao(ingrediente) {
        setNome(ingrediente.nome);
        setIngredienteEditandoId(ingrediente.id);
        setModalErrorMsg("");
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setIngredienteEditandoId(null);
        setModalErrorMsg("");
    }

    async function salvarIngrediente(event) {
        event.preventDefault();
        if (salvando) return;

        const nomeLimpo = nome.trim();
        if (!nomeLimpo || nomeLimpo.length > 100) {
            setModalErrorMsg("Informe um nome de até 100 caracteres.");
            return;
        }

        const editando = ingredienteEditandoId !== null;
        setSalvando(true);
        setModalErrorMsg("");

        try {
            const response = await fetch(editando ? `${API_URL}/${ingredienteEditandoId}` : API_URL, {
                method: editando ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome: nomeLimpo }),
            });

            const data = await response.json();

            if (!response.ok) {
                setModalErrorMsg(mensagemDeErro(data, "Não foi possível salvar o ingrediente."));
                return;
            }

            // Usa o que o backend devolveu, porque ele normaliza o nome (minúsculas, sem acento)
            const salvo = data.ingrediente;
            setIngredientes((atuais) =>
                ordenar(
                    editando
                        ? atuais.map((atual) => (atual.id === salvo.id ? salvo : atual))
                        : [...atuais, salvo]
                )
            );
            fecharModal();
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            setModalErrorMsg("Não foi possível conectar ao servidor.");
        } finally {
            setSalvando(false);
        }
    }

    function abrirModalExcluir(ingrediente) {
        setIngredienteExcluindo(ingrediente);
        setExcluirErrorMsg("");
    }

    function fecharModalExcluir() {
        setIngredienteExcluindo(null);
        setExcluirErrorMsg("");
    }

    async function confirmarExclusao() {
        if (excluindo || !ingredienteExcluindo) return;

        setExcluindo(true);
        setExcluirErrorMsg("");

        try {
            const response = await fetch(
                `${API_URL}/${ingredienteExcluindo.id}?usuario_id=${USUARIO_MOCK_ID}`,
                { method: "DELETE" }
            );

            // Sucesso é 204, sem corpo; só lê o JSON quando houve erro
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setExcluirErrorMsg(mensagemDeErro(data, "Não foi possível excluir o ingrediente."));
                return;
            }

            setIngredientes((atuais) => atuais.filter((atual) => atual.id !== ingredienteExcluindo.id));
            fecharModalExcluir();
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            setExcluirErrorMsg("Não foi possível conectar ao servidor.");
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="ingredientes-container">
            <h2 className="ingredientes-titulo">Ingredientes</h2>

            <div className="ingredientes-busca">
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {errorMsg && <p className="ingredientes-erro" role="alert">{errorMsg}</p>}

            <div className="ingredientes-lista">
                {loading ? (
                    <p className="ingredientes-vazio">Carregando ingredientes...</p>
                ) : ingredientesFiltrados.length > 0 ? (
                    ingredientesFiltrados.map((ingrediente) => (
                        <div key={ingrediente.id} className="ingredientes-card">
                            <h3 className="ingredientes-nome">{ingrediente.nome}</h3>
                            <div className="ingredientes-acoes">
                                <button
                                    type="button"
                                    className="ingredientes-btn-editar"
                                    aria-label={`Editar ${ingrediente.nome}`}
                                    onClick={() => abrirModalEdicao(ingrediente)}
                                >
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    className="ingredientes-btn-excluir"
                                    aria-label={`Excluir ${ingrediente.nome}`}
                                    onClick={() => abrirModalExcluir(ingrediente)}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="ingredientes-vazio">
                        {ingredientes.length === 0
                            ? "Nenhum ingrediente cadastrado."
                            : "Nenhum ingrediente corresponde à pesquisa."}
                    </p>
                )}
            </div>

            <button
                type="button"
                className="ingredientes-btn-novo"
                aria-label="Adicionar ingrediente"
                onClick={abrirModalNovo}
            >
                +
            </button>

            <div className="ingredientes-rodape">
                <button
                    type="button"
                    className="ingredientes-btn-cancelar"
                    onClick={() => navigate(ROTA_VOLTAR)}
                >
                    CANCELAR
                </button>
                <button
                    type="button"
                    className="ingredientes-btn-concluir"
                    onClick={() => navigate(ROTA_VOLTAR)}
                >
                    CONCLUIR
                </button>
            </div>

            {/* Modal de criar/editar */}
            {modalAberto && (
                <div className="ingredientes-modal-overlay">
                    <form
                        className="ingredientes-modal"
                        onSubmit={salvarIngrediente}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-ingrediente"
                    >
                        <h2 id="titulo-ingrediente">
                            {ingredienteEditandoId === null ? "Adicionar ingrediente" : "Editar ingrediente"}
                        </h2>
                        <label>
                            Nome do ingrediente
                            <input
                                type="text"
                                value={nome}
                                placeholder="Ex: Farinha de trigo"
                                maxLength={100}
                                onChange={(e) => {
                                    setNome(e.target.value);
                                    setModalErrorMsg("");
                                }}
                                required
                            />
                        </label>

                        {modalErrorMsg && <p className="ingredientes-modal-erro" role="alert">{modalErrorMsg}</p>}

                        <button
                            type="button"
                            className="ingredientes-btn-secundario"
                            onClick={fecharModal}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="ingredientes-btn-primario" disabled={salvando}>
                            {salvando ? "Salvando..." : ingredienteEditandoId === null ? "Adicionar" : "Salvar alterações"}
                        </button>
                    </form>
                </div>
            )}

            {/* Modal de confirmar exclusão */}
            {ingredienteExcluindo && (
                <div className="ingredientes-modal-overlay">
                    <div
                        className="ingredientes-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-excluir-ingrediente"
                    >
                        <h2 id="titulo-excluir-ingrediente">Excluir ingrediente</h2>
                        <p className="ingredientes-modal-texto">
                            Deseja excluir "{ingredienteExcluindo.nome}"?
                        </p>

                        {excluirErrorMsg && <p className="ingredientes-modal-erro" role="alert">{excluirErrorMsg}</p>}

                        <button
                            type="button"
                            className="ingredientes-btn-secundario"
                            onClick={fecharModalExcluir}
                            disabled={excluindo}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="ingredientes-btn-primario"
                            onClick={confirmarExclusao}
                            disabled={excluindo}
                        >
                            {excluindo ? "Excluindo..." : "Excluir"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PanelIngredientes;