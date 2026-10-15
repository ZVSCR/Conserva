import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import "./PanelNovaCompra.css";

const MAX_VALOR_DECIMAL = 9999999.99;
const MAX_TOTAL_CENTAVOS = 999999999;

function formatarDataLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function novoItemVazio() {
    return {
        nome_item: "",
        valor_unitario: "",
        quantidade: "",
        unidade_medida: "un",
    };
}

function totalEmCentavos(itens) {
    return Math.round(itens.reduce(
        (total, item) => total + item.quantidade * Math.round(item.valor_unitario * 100),
        0
    ));
}

function PanelNovaCompra() {
    const navigate = useNavigate();
    const liberarNavegacao = useRef(false);
    const [modalItemAberto, setModalItemAberto] = useState(false);
    const [modalEstabelecimentoAberto, setModalEstabelecimentoAberto] = useState(false);
    const [itens, setItens] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [compra, setCompra] = useState(() => ({
        data_compra: formatarDataLocal(new Date()),
        estabelecimento: "",
    }));
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [compraRegistrada, setCompraRegistrada] = useState(false);
    const [estabelecimentoEditando, setEstabelecimentoEditando] = useState(compra.estabelecimento);
    const [estabelecimentoErrorMsg, setEstabelecimentoErrorMsg] = useState("");
    const [item, setItem] = useState(novoItemVazio);
    const [itemEditandoId, setItemEditandoId] = useState(null);
    const [itemErrorMsg, setItemErrorMsg] = useState("");
    const blocker = useBlocker(() => loading && !liberarNavegacao.current);
    const USUARIO_MOCK_ID = 1;
    const busca = filtro.trim().toLowerCase();
    const itensFiltrados = itens.filter(
        (item) => 
        item.nome_item.toLowerCase().includes(busca) ||
        item.valor_unitario.toString().includes(busca) ||
        item.quantidade.toString().includes(busca)
    );

    useEffect(() => {
        if (!loading) return;

        function avisarAntesDeSair(event) {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener("beforeunload", avisarAntesDeSair);
        return () => window.removeEventListener("beforeunload", avisarAntesDeSair);
    }, [loading]);

    useEffect(() => {
        if (blocker.state === "blocked") blocker.reset();
    }, [blocker]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || compraRegistrada) return;

        if (!compra.estabelecimento.trim()) {
            setErrorMsg("Informe o estabelecimento antes de concluir a compra.");
            return;
        }

        if (itens.length === 0) {
            setErrorMsg("Adicione ao menos um item antes de concluir a compra.");
            return;
        }

        if (totalEmCentavos(itens) > MAX_TOTAL_CENTAVOS) {
            setErrorMsg("O total da compra ultrapassa o limite permitido.");
            return;
        }

        const itensParaEnviar = itens.map((itemCompra) => ({
            nome_item: itemCompra.nome_item,
            quantidade: itemCompra.quantidade,
            unidade_de_medida: itemCompra.unidade_medida,
            valor_unitario: itemCompra.valor_unitario,
        }));

        setLoading(true);
        setErrorMsg("");

        try {
            const response = await fetch("http://localhost:3000/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id: USUARIO_MOCK_ID,
                    data_compra: compra.data_compra,
                    estabelecimento: compra.estabelecimento.trim(),
                    itens: itensParaEnviar,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const mensagem = Array.isArray(data.error)
                    ? data.error.map((erro) => erro.message).join(" ")
                    : data.error || data.message;
                setErrorMsg(mensagem || "Não foi possível registrar a compra.");
                return;
            }

            liberarNavegacao.current = true;
            setCompraRegistrada(true);
            navigate("/extrato-compras", { replace: true });
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            setErrorMsg("Não foi possível conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    function abrirModalEstabelecimento() {
        setEstabelecimentoEditando(compra.estabelecimento);
        setEstabelecimentoErrorMsg("");
        setModalEstabelecimentoAberto(true);
    }

    function salvarEstabelecimento(event) {
        event.preventDefault();
        const nome = estabelecimentoEditando.trim();
        if (!nome) {
            setEstabelecimentoErrorMsg("Informe um nome para o estabelecimento.");
            return;
        }

        setCompra((atual) => ({ ...atual, estabelecimento: nome }));
        setErrorMsg("");
        setModalEstabelecimentoAberto(false);
    }
    
    function alterarItem(event) {
        const { name, value } = event.target;
        setItem((atual) => ({ ...atual, [name]: value }));
        setItemErrorMsg("");
    }

    function abrirModalNovoItem() {
        setItem(novoItemVazio());
        setItemEditandoId(null);
        setItemErrorMsg("");
        setModalItemAberto(true);
    }

    function abrirModalEdicaoItem(itemAtual) {
        setItem({
            nome_item: itemAtual.nome_item,
            valor_unitario: String(itemAtual.valor_unitario),
            quantidade: String(itemAtual.quantidade),
            unidade_medida: itemAtual.unidade_medida,
        });
        setItemEditandoId(itemAtual.idLocal);
        setItemErrorMsg("");
        setModalItemAberto(true);
    }

    function fecharModalItem() {
        setModalItemAberto(false);
        setItemEditandoId(null);
        setItemErrorMsg("");
    }

    function salvarItem(event) {
        event.preventDefault();

        const nome = item.nome_item.trim();
        if (!nome || nome.length > 100) {
            setItemErrorMsg("Informe um nome de até 100 caracteres para o item.");
            return;
        }

        const ateDuasCasas = /^\d+(?:\.\d{1,2})?$/;
        const quantidade = Number(item.quantidade);
        const valorUnitario = Number(item.valor_unitario);
        if (!ateDuasCasas.test(item.quantidade) || quantidade <= 0 || quantidade > MAX_VALOR_DECIMAL) {
            setItemErrorMsg("A quantidade deve ser maior que zero, ter até duas casas decimais e não ultrapassar 9.999.999,99.");
            return;
        }
        if (!ateDuasCasas.test(item.valor_unitario) || valorUnitario > MAX_VALOR_DECIMAL) {
            setItemErrorMsg("O preço unitário deve ter até duas casas decimais e não ultrapassar R$ 9.999.999,99.");
            return;
        }

        const itemValidado = {
            nome_item: nome,
            quantidade,
            unidade_medida: item.unidade_medida,
            valor_unitario: valorUnitario,
        };
        const novosItens = itemEditandoId === null
            ? [...itens, { ...itemValidado, idLocal: crypto.randomUUID() }]
            : itens.map((atual) => atual.idLocal === itemEditandoId
                ? { ...atual, ...itemValidado }
                : atual);

        if (totalEmCentavos(novosItens) > MAX_TOTAL_CENTAVOS) {
            setItemErrorMsg("O total da compra ultrapassa R$ 9.999.999,99.");
            return;
        }

        setItens(novosItens);
        setErrorMsg("");
        fecharModalItem();
    }
    
    return (
        <div className="compra-container">
            <h2 className="compra-titulo">Itens comprados</h2>

            <div className="estabelecimento-container">
                <p className="estabelecimento-text">Estabelecimento:</p>
                <div className="estabelecimento-valor">
                    <p className="estabelecimento-name">{compra.estabelecimento || "Não informado"}</p>
                    <button
                        type="button"
                        className="btn-editar-estabelecimento"
                        onClick={abrirModalEstabelecimento}
                        disabled={loading || compraRegistrada}
                    >
                        Editar
                    </button>
                </div>
            </div>

            <div className="search-box">
                <input
                type="text"
                placeholder="Pesquisar..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {errorMsg && <p className="compra-feedback compra-erro" role="alert">{errorMsg}</p>}

            <form className="compra-form" onSubmit={handleSubmit}>
                <div className="lista-itens">
                    {itensFiltrados.length > 0 ? (
                        itensFiltrados.map((item) => (
                            <div key={item.idLocal} className="item-card">
                                <h3 className="nome-item">{item.nome_item}</h3>
                                <div className="item-info">
                                    <p className="preco-item">
                                        R$ {Number(item.valor_unitario).toFixed(2).replace(".", ",")}
                                    </p>
                                    <p className="quantidade-e-medida-item">
                                        {item.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} {item.unidade_medida}
                                    </p>
                                </div>
                                <div className="item-actions">
                                    <button
                                        type="button"
                                        className="btn btn-edit"
                                        onClick={() => abrirModalEdicaoItem(item)}
                                        disabled={loading || compraRegistrada}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-excluir"
                                        onClick={() => setItens((atuais) => atuais.filter((atual) => atual.idLocal !== item.idLocal))}
                                        disabled={loading || compraRegistrada}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>{itens.length === 0 ? "Nenhum item adicionado." : "Nenhum item corresponde à pesquisa."}</p>
                    )}
                    <button
                        type="button"
                        className="btn btn-novo-item"
                        onClick={abrirModalNovoItem}
                        disabled={loading || compraRegistrada}
                    >
                        +
                    </button>
                </div>
                
                <button type="button" className="btn btn-cancela-acao" onClick={() => navigate("/home")} disabled={loading}>
                    CANCELAR
                </button>
                <button type="submit" className="btn btn-post-compra" disabled={loading || compraRegistrada}>
                    {loading ? "SALVANDO..." : compraRegistrada ? "REGISTRADA" : "CONCLUIR"}
                </button>
            </form>

            {/*Modal de alterar o nome do estabelecimento*/}
            {modalEstabelecimentoAberto && (
                <div className="item-modal-overlay" role="presentation">
                    <form className="item-modal estabelecimento-modal" onSubmit={salvarEstabelecimento} role="dialog" aria-modal="true" aria-labelledby="titulo-estabelecimento">
                        <h2 id="titulo-estabelecimento">Alterar estabelecimento</h2>
                        <label>
                            Nome do estabelecimento
                            <input
                                name="estabelecimento"
                                type="text"
                                maxLength={50}
                                value={estabelecimentoEditando}
                                onChange={(event) => {
                                    setEstabelecimentoEditando(event.target.value);
                                    setEstabelecimentoErrorMsg("");
                                }}
                                required
                            />
                        </label>

                        {estabelecimentoErrorMsg && <p className="item-modal-erro" role="alert">{estabelecimentoErrorMsg}</p>}

                        <button 
                            type="button" 
                            className="btn btn-cancela-editar-nome-estabelecimento" 
                            onClick={() => setModalEstabelecimentoAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-altera-nome-estabelecimento"
                        >
                            Concluir
                        </button>
                    </form>
                </div>
            )}

            {/*Modal de adicionar item*/}
            {modalItemAberto && (
                <div className="item-modal-overlay">
                <form className="item-modal" onSubmit={salvarItem} role="dialog" aria-modal="true" aria-labelledby="titulo-item">
                    <h2 id="titulo-item">{itemEditandoId === null ? "Adicionar item" : "Editar item"}</h2>
                    <label>
                        Nome do item
                        <input
                            name="nome_item"
                            type="text"
                            value={item.nome_item}
                            placeholder="Ex: Arroz branco"
                            onChange={alterarItem}
                            maxLength={100}
                            required
                        />
                    </label>
                    <label>
                        Preço unitário
                        <input
                            name="valor_unitario"
                            type="number"
                            min="0"
                            max={MAX_VALOR_DECIMAL}
                            step="0.01"
                            value={item.valor_unitario}
                            placeholder="Ex: R$ 200,00"
                            onChange={alterarItem}
                            required
                        />
                    </label>
                    <label>
                        Quantidade
                        <input
                            name="quantidade"
                            type="number"
                            min="0.01"
                            max={MAX_VALOR_DECIMAL}
                            step="0.01"
                            value={item.quantidade}
                            placeholder="Ex: 1,2 kg"
                            onChange={alterarItem}
                            required
                        />
                    </label>
                    <div className="quantidade-medida">
                        <label>
                            Unidade de medida
                            <select
                                name="unidade_medida"
                                value={item.unidade_medida}
                                onChange={alterarItem}
                                >
                                <option value="un">un</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="mL">mL</option>
                            </select>
                        </label>
                    </div>

                    {itemErrorMsg && <p className="item-modal-erro" role="alert">{itemErrorMsg}</p>}

                    <button 
                        type="button" 
                        className="btn btn-cancela-novo-item" 
                        onClick={fecharModalItem}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-adiciona-novo-item"
                    >
                        {itemEditandoId === null ? "Adicionar" : "Salvar alterações"}
                    </button>
                </form>
            </div>
            )}
        </div>
    );
}

export default PanelNovaCompra;
