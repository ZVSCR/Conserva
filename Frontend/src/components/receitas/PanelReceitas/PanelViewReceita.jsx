import { useState, useEffect } from "react";
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../contexts/useAuth';
import "./PanelViewReceita.css";
import ModalAdicionarReceita from "../ModalAdicionarReceita/ModalAdicionarReceita";
import ModalEditarReceita from "../ModalEditarReceita/ModalEditarReceita";
import ExcluirProdutoEstoque from "../../estoque/ExcluirProdutoEstoque/ExcluirProdutoEstoque";
import EllipsisMenuReceita from "../EllipsisMenuReceita/EllipsisMenuReceita";
import IconBusca from '../../../assets/IconsEstoque/lupa.png';
import IconReceita from '../../../assets/IconsEstoque/livro-de-receitas.png';

function textoDias(dias) {
    if (dias === 0) return "vence hoje";
    if (dias === 1) return "vence amanhã";
    return `vence em ${dias} dias`;
}

function textoVencimento(sugestao) {
    const [primeiro, ...outros] = sugestao.ingredientes_vencendo;
    const extra = outros.length > 0 ? ` e mais ${outros.length}` : "";
    return `Usa ${primeiro.nome} (${textoDias(primeiro.dias_para_vencer)})${extra}`;
}

function textoFalta(item) {
    if (item.motivo === "unidade_diferente") {
        return `${item.nome}: você tem em outra unidade de medida (a receita pede ${item.quantidade} ${item.unidade_de_medida})`;
    }
    return `${item.quantidade} ${item.unidade_de_medida} de ${item.nome}`;
}

function PanelViewReceita() {
    const { user } = useAuth();
    const [receitas, setReceitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [busca, setBusca] = useState("");
    const [receitaExpandidaId, setReceitaExpandidaId] = useState(null);
    const [preparando, setPreparando] = useState(false);
    const [mensagemPreparo, setMensagemPreparo] = useState("");
    const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
    const [receitaEditando, setReceitaEditando] = useState(null);
    const [receitaExcluindo, setReceitaExcluindo] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");
    //const [receitaRegistrada, setReceitaRegistrada] = useState(false);
    const [sugestoes, setSugestoes] = useState({});
    const [apenasVencendo, setApenasVencendo] = useState(false);

    // Busca as receitas registradas para exibição
    const fetchReceitas = async () => {
        try {
            const response = await apiFetch('/api/receitas', {
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

    const fetchSugestoes = async () => {
    try {
        const response = await apiFetch("/api/receitas/sugestoes");
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.sugestoes)) return;

        setSugestoes(Object.fromEntries(data.sugestoes.map((sugestao) => [sugestao.id, sugestao])));
    } catch (error) {
        console.error("Erro ao carregar sugestões por validade:", error);
    }
    };

    useEffect(() => {
        fetchReceitas();
        fetchSugestoes();
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
    const receitasFiltradas = receitas
        .filter(
            (receita) =>
                (receita.nome && receita.nome.toLowerCase().includes(busca.toLowerCase())) ||
                (receita.descricao && receita.descricao.toLowerCase().includes(busca.toLowerCase()))
        )
        .filter((receita) => !apenasVencendo || sugestoes[receita.id])
        .sort((a, b) => {
            const diasA = sugestoes[a.id]?.proxima_validade_dias ?? Infinity;
            const diasB = sugestoes[b.id]?.proxima_validade_dias ?? Infinity;
            if (diasA === diasB) return 0;
            return diasA < diasB ? -1 : 1;
    });

    const totalSugestoes = Object.keys(sugestoes).length;

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

    const fecharModalEditarReceita = () => {
        setReceitaEditando(null);
    };

    const atualizarReceitaNaLista = (receitaAtualizada) => {
        setReceitas((atuais) => atuais.map((receita) =>
            receita.id === receitaAtualizada.id ? { ...receita, ...receitaAtualizada } : receita
        ));
    };

    const podeGerenciarReceita = (receita) => user != null && (
        receita.usuario_id === user.id || (user.id === 1 && receita.usuario_id === null)
    );

    const confirmarExclusao = async () => {
        if (!receitaExcluindo || excluindo) return;

        setExcluindo(true);
        setErroExclusao("");

        try {
            const response = await apiFetch(`/api/receitas/${receitaExcluindo.id}`, {
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
        if (preparando) return;

        setPreparando(true);
        setMensagemPreparo("");

        try {
            const response = await apiFetch(`/api/receitas/${receitaId}/preparar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const data = await response.json();

            if (!response.ok) {
                setMensagemPreparo(data.erro || data.error || "Não foi possível preparar a receita.");
                return;
            }

            setMensagemPreparo("Receita preparada com sucesso. O estoque foi atualizado.");
            fetchSugestoes();
        } catch (error) {
            console.error("Erro ao preparar receita:", error);
            setMensagemPreparo("Não foi possível conectar ao servidor para preparar a receita.");
        } finally {
            setPreparando(false);
        }
    };

    return (
        <main className="receita-container">
            <h2 className="receita-title">Catálogo de Receitas</h2>

            {errorMsg && <p className="receita-erro" role="alert">{errorMsg}</p>}
            {!receitaExpandida && (preparando || mensagemPreparo) && (
                <p role="status">{preparando ? "Preparando..." : mensagemPreparo}</p>
            )}

            <div className="receita-actions">
                <button
                    type="button"
                    className="receita-nova-botao"
                    onClick={abrirModalNovaReceita}
                    disabled={loading}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M3 17h18M5 15a7 7 0 0 1 14 0M12 8V6" strokeLinecap="round" />
                        </svg>
                        Nova Receita
                </button>
            </div>

            <div className="receita-busca">
                <img src={IconBusca} alt="" />
                <input
                    type="search"
                    aria-label="Pesquisar receitas por nome ou descrição"
                    placeholder="Pesquisar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {totalSugestoes > 0 && (
                <button
                    type="button"
                    className={`receita-filtro-vencimento${apenasVencendo ? " receita-filtro-vencimento--ativo" : ""}`}
                    aria-pressed={apenasVencendo}
                    onClick={() => setApenasVencendo((atual) => !atual)}
                >
                    Aproveitar o que vai vencer ({totalSugestoes})
                </button>
            )}

            <div className="receitas-list">
                {loading ? (
                    <p className="receita-status" role="status">Carregando receitas...</p>
                ) : receitasFiltradas.length > 0 ? (
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
                                <span className="receita-miniatura" aria-hidden="true">
                                    <img src={IconReceita} alt="" />
                                </span>
                                <div className="receita-info">
                                    <h3>
                                        {receita.nome}
                                    </h3>
                                    <p className="receita-descricao">
                                        {receita.descricao}
                                    </p>
                                    {sugestoes[receita.id] && (
                                        <p className="receita-vencimento">{textoVencimento(sugestoes[receita.id])}</p>
                                    )}
                                </div>
                            </button>
                            <EllipsisMenuReceita
                                rotulo={`Opções da receita ${receita.nome}`}
                                onPreparar={preparando ? undefined : () => prepararReceita(receita.id)}
                                onModificar={podeGerenciarReceita(receita) ? () => setReceitaEditando(receita) : undefined}
                                onExcluir={podeGerenciarReceita(receita) ? () => {
                                    setErroExclusao("");
                                    setReceitaExcluindo(receita);
                                } : undefined}
                            />
                        </div>
                    ))
                ) : (
                    <p className="receita-status">Nenhuma receita encontrada.</p>
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

                        <h3 className="modal-subtitulo modal-ingredientes-titulo">Ingredientes</h3>
                        {Array.isArray(receitaExpandida.ingredientes) && receitaExpandida.ingredientes.length > 0 ? (
                            <ul className="modal-ingredientes-lista">
                                {receitaExpandida.ingredientes.map((ingrediente) => (
                                    <li key={ingrediente.ingrediente_id}>
                                        <span className="modal-ingrediente-quantidade">
                                            {ingrediente.quantidade} {ingrediente.unidade_de_medida}
                                        </span>
                                        {" "}{ingrediente.nome}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="modal-ingredientes-vazio">Nenhum ingrediente cadastrado.</p>
                        )}

                        {sugestoes[receitaExpandida.id] && (
                            <section className="modal-vencimento">
                                <h3 className="modal-subtitulo">Aproveite o que vai vencer</h3>
                                <ul>
                                    {sugestoes[receitaExpandida.id].ingredientes_vencendo.map((ingrediente) => (
                                        <li key={ingrediente.ingrediente_id}>
                                            {ingrediente.nome}: {textoDias(ingrediente.dias_para_vencer)}
                                        </li>
                                    ))}
                                </ul>

                                {sugestoes[receitaExpandida.id].pode_preparar ? (
                                    <p className="modal-vencimento-ok">Você tem tudo o que precisa para preparar esta receita.</p>
                                ) : (
                                    <>
                                        <h3 className="modal-subtitulo">O que falta</h3>
                                        <ul>
                                            {sugestoes[receitaExpandida.id].faltando.map((item) => (
                                                <li key={item.ingrediente_id}>{textoFalta(item)}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </section>
                        )}

                        <button
                            type="button"
                            className="receita-nova-botao modal-preparar-botao"
                            onClick={() => prepararReceita(receitaExpandida.id)}
                            disabled={preparando}
                        >
                            {preparando ? "Preparando..." : "Preparar receita"}
                        </button>
                        {(preparando || mensagemPreparo) && (
                            <p className="modal-preparar-status" role="status">
                                {preparando ? "Preparando receita..." : mensagemPreparo}
                            </p>
                        )}

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
                    <ModalAdicionarReceita
                        onClose={fecharModalNovaReceita}
                        onCreated={async () => {
                            await fetchReceitas();
                            await fetchSugestoes();
                        }}
                    />
                </div>
            )}

            {receitaEditando && (
                <div className="modal-nova-receita">
                    <ModalEditarReceita
                        receita={receitaEditando}
                        onClose={fecharModalEditarReceita}
                        onUpdated={atualizarReceitaNaLista}
                    />
                </div>
            )}
        </main>
    );
}

export default PanelViewReceita;
