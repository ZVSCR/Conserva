import { useEffect, useMemo, useState } from "react";
import { apiFetch } from '../../../services/api';
import {
    adicionarIngredienteAReceita,
    atualizarIngredienteDaReceita,
    criarPayloadReceita,
    filtrarIngredientesGlobais,
    formatarQuantidadeIngrediente,
    removerIngredienteDaReceita,
} from "./receitaIngredientUtils";
import "./ModalAdicionarReceita.css";

const UNIDADES_DE_MEDIDA = ["un", "kg", "g", "L", "mL"];

function ModalAdicionarReceita({ onClose, onCreated }) {
    const [receita, setReceita] = useState({
        nome: "",
        descricao: "",
        modo_preparo: "",
    });
    const [ingredientesGlobais, setIngredientesGlobais] = useState([]);
    const [carregandoIngredientes, setCarregandoIngredientes] = useState(true);
    const [erroIngredientes, setErroIngredientes] = useState("");
    const [buscaIngrediente, setBuscaIngrediente] = useState("");
    const [ingredienteSelecionadoId, setIngredienteSelecionadoId] = useState("");
    const [quantidade, setQuantidade] = useState("");
    const [unidade, setUnidade] = useState("un");
    const [ingredientesReceita, setIngredientesReceita] = useState([]);
    const [ingredienteEditandoId, setIngredienteEditandoId] = useState(null);
    const [quantidadeEditando, setQuantidadeEditando] = useState("");
    const [unidadeEditando, setUnidadeEditando] = useState("un");
    const [menuIngredienteAbertoId, setMenuIngredienteAbertoId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        async function carregarIngredientes() {
            try {
                const response = await apiFetch("/api/ingredientes");
                const data = await response.json();

                if (!response.ok || !Array.isArray(data.ingredientes)) {
                    setErroIngredientes(data.error || data.message || "Não foi possível carregar os ingredientes.");
                    return;
                }

                setIngredientesGlobais(data.ingredientes);
            } catch (erro) {
                console.error("Erro ao carregar ingredientes:", erro);
                setErroIngredientes("Não foi possível conectar ao servidor para carregar os ingredientes.");
            } finally {
                setCarregandoIngredientes(false);
            }
        }

        carregarIngredientes();
    }, []);

    const ingredientesFiltrados = useMemo(() => {
        return filtrarIngredientesGlobais(ingredientesGlobais, buscaIngrediente);
    }, [buscaIngrediente, ingredientesGlobais]);

    const ingredienteSelecionado = ingredientesGlobais.find(
        (ingrediente) => String(ingrediente.id) === ingredienteSelecionadoId
    );

    function atualizarCampo(event) {
        const { name, value } = event.target;
        setReceita((atual) => ({ ...atual, [name]: value }));
        setErrorMsg("");
    }

    function adicionarIngrediente() {
        try {
            setIngredientesReceita(adicionarIngredienteAReceita(
                ingredientesReceita,
                ingredienteSelecionado,
                quantidade,
                unidade,
            ));
        } catch (erro) {
            setErrorMsg(erro.message);
            return;
        }

        setIngredienteSelecionadoId("");
        setQuantidade("");
        setUnidade("un");
        setErrorMsg("");
    }

    function iniciarEdicaoIngrediente(ingrediente) {
        setIngredienteEditandoId(ingrediente.id);
        setQuantidadeEditando(String(ingrediente.quantidade));
        setUnidadeEditando(ingrediente.unidade_de_medida);
        setMenuIngredienteAbertoId(null);
        setErrorMsg("");
    }

    function salvarEdicaoIngrediente(id) {
        try {
            setIngredientesReceita(atualizarIngredienteDaReceita(
                ingredientesReceita,
                id,
                quantidadeEditando,
                unidadeEditando,
            ));
        } catch (erro) {
            setErrorMsg(erro.message);
            return;
        }

        setIngredienteEditandoId(null);
        setErrorMsg("");
    }

    function removerIngrediente(id) {
        setIngredientesReceita(removerIngredienteDaReceita(ingredientesReceita, id));
        if (ingredienteEditandoId === id) setIngredienteEditandoId(null);
        setMenuIngredienteAbertoId(null);
        setErrorMsg("");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        if (!receita.nome.trim()) {
            setErrorMsg("Informe um nome para a receita.");
            return;
        }

        if (!receita.descricao.trim()) {
            setErrorMsg("Informe uma descrição para a receita.");
            return;
        }

        if (!receita.modo_preparo.trim()) {
            setErrorMsg("Informe o modo de preparo da receita.");
            return;
        }

        if (ingredientesReceita.length === 0) {
            setErrorMsg("Adicione ao menos um ingrediente à receita.");
            return;
        }

        if (ingredienteEditandoId !== null) {
            setErrorMsg("Salve ou cancele a edição do ingrediente antes de criar a receita.");
            return;
        }

        setErrorMsg("");
        setEnviando(true);
        try {
            const response = await apiFetch("/api/receitas/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(criarPayloadReceita(receita, ingredientesReceita)),
            });

            const data = await response.json();
            if (!response.ok) {
                const mensagem = Array.isArray(data.errors)
                    ? data.errors.map((erro) => erro.message).join(" ")
                    : data.error || data.message;
                setErrorMsg(mensagem || "Não foi possível registrar a receita.");
                return;
            }

            await onCreated();
            onClose();
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            setErrorMsg("Não foi possível conectar ao servidor.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div
            className="container-modal-adicionar-receita"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-adicionar-receita"
        >
            <h2 id="titulo-adicionar-receita">Adicionar receita</h2>
            <button
                type="button"
                className="modal-adicionar-receita-fechar"
                aria-label="Fechar"
                disabled={enviando}
                onClick={onClose}
            >
                ×
            </button>

            {errorMsg && <p className="receita-feedback receita-erro" role="alert">{errorMsg}</p>}

            <form className="form-modal-nova-receita" onSubmit={handleSubmit}>
                <label htmlFor="nome-receita">Nome</label>
                <input
                    id="nome-receita"
                    name="nome"
                    type="text"
                    value={receita.nome}
                    onChange={atualizarCampo}
                    maxLength={100}
                    autoFocus
                    required
                />

                <label htmlFor="descricao-receita">Descrição</label>
                <textarea
                    id="descricao-receita"
                    name="descricao"
                    value={receita.descricao}
                    onChange={atualizarCampo}
                    maxLength={1000}
                    required
                />

                <label htmlFor="modo-preparo-receita">Modo de preparo</label>
                <textarea
                    id="modo-preparo-receita"
                    name="modo_preparo"
                    value={receita.modo_preparo}
                    onChange={atualizarCampo}
                    maxLength={10000}
                    required
                />

                <section className="adicionar-receita-ingredientes" aria-labelledby="titulo-ingredientes-receita">
                    <h3 id="titulo-ingredientes-receita">Ingredientes</h3>

                    <label htmlFor="busca-ingrediente-receita">Buscar ingrediente</label>
                    <input
                        id="busca-ingrediente-receita"
                        type="search"
                        value={buscaIngrediente}
                        onChange={(event) => setBuscaIngrediente(event.target.value)}
                        placeholder="Pesquisar ingredientes..."
                        disabled={carregandoIngredientes || Boolean(erroIngredientes) || enviando}
                    />

                    <label htmlFor="ingrediente-global-receita">Ingrediente</label>
                    <select
                        id="ingrediente-global-receita"
                        value={ingredienteSelecionadoId}
                        onChange={(event) => setIngredienteSelecionadoId(event.target.value)}
                        disabled={carregandoIngredientes || Boolean(erroIngredientes) || enviando}
                    >
                        <option value="">
                            {carregandoIngredientes ? "Carregando ingredientes..." : "Selecione um ingrediente"}
                        </option>
                        {ingredientesFiltrados.map((ingrediente) => (
                            <option key={ingrediente.id} value={ingrediente.id}>
                                {ingrediente.nome}
                            </option>
                        ))}
                    </select>

                    {erroIngredientes && <p className="ingrediente-lista-erro" role="alert">{erroIngredientes}</p>}
                    {!carregandoIngredientes && !erroIngredientes && ingredientesFiltrados.length === 0 && (
                        <p className="ingrediente-lista-vazia">Nenhum ingrediente encontrado.</p>
                    )}

                    <div className="ingrediente-medidas">
                        <div>
                            <label htmlFor="quantidade-ingrediente-receita">Quantidade</label>
                            <input
                                id="quantidade-ingrediente-receita"
                                type="number"
                                min="0.01"
                                max="9999999.99"
                                step="0.01"
                                value={quantidade}
                                onChange={(event) => setQuantidade(event.target.value)}
                                disabled={enviando}
                            />
                        </div>
                        <div>
                            <label htmlFor="unidade-ingrediente-receita">Unidade de medida</label>
                            <select
                                id="unidade-ingrediente-receita"
                                value={unidade}
                                onChange={(event) => setUnidade(event.target.value)}
                                disabled={enviando}
                            >
                                {UNIDADES_DE_MEDIDA.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-adicionar-ingrediente"
                        onClick={adicionarIngrediente}
                        disabled={enviando || carregandoIngredientes || Boolean(erroIngredientes)}
                    >
                        Adicionar ingrediente
                    </button>

                    <ul className="lista-ingredientes-receita">
                        {ingredientesReceita.map((ingrediente) => (
                            <li key={ingrediente.id} className="item-ingrediente-receita">
                                {ingredienteEditandoId === ingrediente.id ? (
                                    <div className="ingrediente-edicao">
                                        <span className="item-ingrediente-nome">{ingrediente.nome}</span>
                                        <div className="ingrediente-medidas">
                                            <div>
                                                <label htmlFor={`quantidade-editar-${ingrediente.id}`}>Quantidade</label>
                                                <input
                                                    id={`quantidade-editar-${ingrediente.id}`}
                                                    type="number"
                                                    min="0.01"
                                                    max="9999999.99"
                                                    step="0.01"
                                                    value={quantidadeEditando}
                                                    onChange={(event) => setQuantidadeEditando(event.target.value)}
                                                    disabled={enviando}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`unidade-editar-${ingrediente.id}`}>Unidade</label>
                                                <select
                                                    id={`unidade-editar-${ingrediente.id}`}
                                                    value={unidadeEditando}
                                                    onChange={(event) => setUnidadeEditando(event.target.value)}
                                                    disabled={enviando}
                                                >
                                                    {UNIDADES_DE_MEDIDA.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="ingrediente-edicao-acoes">
                                            <button type="button" onClick={() => salvarEdicaoIngrediente(ingrediente.id)} disabled={enviando}>Salvar</button>
                                            <button type="button" onClick={() => setIngredienteEditandoId(null)} disabled={enviando}>Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="item-ingrediente-nome">
                                            <strong>{formatarQuantidadeIngrediente(ingrediente.quantidade)} {ingrediente.unidade_de_medida}</strong>{" "}{ingrediente.nome}
                                        </span>
                                        <div className="menu-ingrediente-receita">
                                            <button
                                                type="button"
                                                className="menu-ingrediente-botao"
                                                aria-label={`Opções de ${ingrediente.nome}`}
                                                aria-expanded={menuIngredienteAbertoId === ingrediente.id}
                                                onClick={() => setMenuIngredienteAbertoId((id) => id === ingrediente.id ? null : ingrediente.id)}
                                                disabled={enviando}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                    <circle cx="5" cy="12" r="2" />
                                                    <circle cx="12" cy="12" r="2" />
                                                    <circle cx="19" cy="12" r="2" />
                                                </svg>
                                            </button>
                                            {menuIngredienteAbertoId === ingrediente.id && (
                                                <div className="menu-ingrediente-opcoes" role="group" aria-label={`Ações para ${ingrediente.nome}`}>
                                                    <button type="button" onClick={() => iniciarEdicaoIngrediente(ingrediente)}>Modificar</button>
                                                    <button type="button" onClick={() => removerIngrediente(ingrediente.id)}>Remover</button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                <button
                    type="button"
                    disabled={enviando}
                    onClick={onClose}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={enviando}
                    className="btn-adicionar-receita"
                >
                    {enviando ? "Adicionando..." : "Adicionar receita"}
                </button>
            </form>
        </div>
    );
}

export default ModalAdicionarReceita;
