import { API_BASE_URL } from "../../../services/apiConfig";
import { useState, useEffect } from "react";
import "./PanelViewReceita.css";
import ModalAdicionarReceita from "../ModalAdicionarReceita/ModalAdicionarReceita";
import ExcluirProdutoEstoque from "../../estoque/ExcluirProdutoEstoque/ExcluirProdutoEstoque";
import EllipsisMenuReceita from "../EllipsisMenuReceita/EllipsisMenuReceita";

function PanelViewReceita() {
    const [receitas, setReceitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [busca, setBusca] = useState("");
    const [receitaExpandidaId, setReceitaExpandidaId] = useState(null);
    const [preparando, setPreparando] = useState(false);
    const [mensagemPreparo, setMensagemPreparo] = useState("");
    // Identificação temporária, seguindo o mesmo padrão de Compras.
    const USUARIO_MOCK_ID = 1;
    const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
    const [receitaExcluindo, setReceitaExcluindo] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");
    //const [receitaRegistrada, setReceitaRegistrada] = useState(false);

    // Busca as receitas registradas para exibição
    const fetchReceitas = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/receitas?usuario_id=${USUARIO_MOCK_ID}`, {
                method: "GET",
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || data.message || "Erro ao carregar o catálogo de receitas.");
                return;
            }

            if (!Array.isArray(data.receitas)) {
                setErrorMsg("Resposta inválida ao carregar o catálogo de receitas.");
                return;
            }

            setErrorMsg("");
            setReceitas(data.receitas);
        } catch (error) {
            console.error("Erro na requisição:", error);
            setErrorMsg("Não foi possível conectar ao servidor para carregar o catálogo de receitas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceitas();
    }, []);

    // Fecha o pop-up com a tecla Esc enquanto ele estiver aberto
    useEffect(() => {
        if (receitaExpandidaId === null) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") setReceitaExpandidaId(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [receitaExpandidaId]);

    // Barra de busca do catálogo de receitas
    const receitasFiltradas = receitas.filter(
        (receita) =>
            (receita.nome && receita.nome.toLowerCase().includes(busca.toLowerCase())) ||
            (receita.descricao && receita.descricao.toLowerCase().includes(busca.toLowerCase()))
    );

    // Receita exibida no pop-up (undefined quando nenhuma está expandida)
    const receitaExpandida = receitas.find((receita) => receita.id === receitaExpandidaId);

    const fecharPopup = () => {
        setReceitaExpandidaId(null);
        setMensagemPreparo("");
    };

    const abrirReceita = (id) => {
        setReceitaExpandidaId(id);
        setMensagemPreparo("");
    };

    const abrirModalNovaReceita = () => {
        setModalNovaReceitaAberto(true);
    };

    const fecharModalNovaReceita = () => {
        setModalNovaReceitaAberto(false);
    }

    const confirmarExclusao = async () => {
        if (!receitaExcluindo || excluindo) return;

        setExcluindo(true);
        setErroExclusao("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/receitas/${receitaExcluindo.id}?usuario_id=${USUARIO_MOCK_ID}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                setErroExclusao(data.erro || data.message || "Não foi possível excluir a receita.");
                return;
            }

            setReceitas((atuais) => atuais.filter((receita) => receita.id !== receitaExcluindo.id));
            if (receitaExpandidaId === receitaExcluindo.id) fecharPopup();
            setReceitaExcluindo(null);
        } catch (error) {
            console.error("Erro ao excluir receita:", error);
            setErroExclusao("Não foi possível conectar ao servidor para excluir a receita.");
        } finally {
            setExcluindo(false);
        }
    };

    const prepararReceita = async (receitaId) => {
        setPreparando(true);
        setMensagemPreparo("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/receitas/${receitaId}/preparar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario_id: USUARIO_MOCK_ID }),
            });
            const data = await response.json();

            if (!response.ok) {
                setMensagemPreparo(data.erro || data.error || "Não foi possível preparar a receita.");
                return;
            }

            setMensagemPreparo("Receita preparada com sucesso. O estoque foi atualizado.");
        } catch (error) {
            console.error("Erro ao preparar receita:", error);
            setMensagemPreparo("Não foi possível conectar ao servidor para preparar a receita.");
        } finally {
            setPreparando(false);
        }
    };

    if (loading) {
        return (
            <div className="receita-container">
                <p style={{ color: "#fff", textAlign: "center" }}>Carregando receitas...</p>
            </div>
        )
    }

    return (
        <div className="receita-container">
            <h2 className="receita-title">Catálogo de Receitas</h2>

            {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}

            <div className="receita-actions">
                <button
                    type="button"
                    className="btn-adicionar"
                    onClick={abrirModalNovaReceita}
                    disabled={loading /*|| receitaRegistrada*/}>
                        Adicionar receita
                </button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            <div className="receitas-list">
                {receitasFiltradas.length > 0 ? (
                    receitasFiltradas.map((receita) => (
                        <div
                            key={receita.id}
                            className="receita-card"
                        >
                            <button
                                type="button"
                                className="receita-abrir"
                                aria-label={`Ver receita ${receita.nome}`}
                                onClick={() => abrirReceita(receita.id)}
                            >
                                <div className="receita-info">
                                    <h3>
                                        {receita.nome}
                                    </h3>
                                    <p className="receita-descricao">
                                        {receita.descricao}
                                    </p>
                                </div>
                            </button>
                            <EllipsisMenuReceita
                                rotulo={`Opções da receita ${receita.nome}`}
                                onExcluir={() => {
                                    setErroExclusao("");
                                    setReceitaExcluindo(receita);
                                }}
                            />
                        </div>
                    ))
                ) : (
                    <p className="no-results">Nenhuma receita encontrada.</p>
                )}
            </div>

            {/* Pop-up com os detalhes da receita selecionada */}
            {receitaExpandida && (
                <div className="modal-overlay" onClick={fecharPopup}>
                    <div
                        className="modal-content"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-receita-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            aria-label="Fechar"
                            onClick={fecharPopup}
                        >
                            ×
                        </button>

                        <h2 id="modal-receita-titulo" className="modal-titulo">
                            {receitaExpandida.nome}
                        </h2>

                        <p className="modal-descricao">
                            {receitaExpandida.descricao || "Sem descrição."}
                        </p>

                        <h3 className="modal-subtitulo">Modo de preparo</h3>
                        <p className="modal-preparo">
                            {receitaExpandida.modo_preparo || "Modo de preparo não informado."}
                        </p>

                        <button
                            type="button"
                            disabled={preparando}
                            onClick={() => prepararReceita(receitaExpandida.id)}
                        >
                            {preparando ? "Preparando..." : "Preparar receita e atualizar estoque"}
                        </button>
                        {mensagemPreparo && <p role="status">{mensagemPreparo}</p>}
                    </div>
                </div>
            )}

            {receitaExcluindo && (
                <ExcluirProdutoEstoque
                    produto={receitaExcluindo}
                    titulo="Excluir receita"
                    mensagem={<>Tem certeza que deseja excluir "{receitaExcluindo.nome}" de suas receitas?</>}
                    excluindo={excluindo}
                    erro={erroExclusao}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setReceitaExcluindo(null)}
                />
            )}

            {modalNovaReceitaAberto && (
                <div className="modal-nova-receita">
                    <ModalAdicionarReceita onClose={fecharModalNovaReceita} onCreated={fetchReceitas} usuarioId={USUARIO_MOCK_ID}/>
                </div>
            )}
        </div>
    );
}

export default PanelViewReceita;
