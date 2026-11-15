import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { apiFetch } from '../../../services/api';
import IconScanner from '../../../assets/IconsEstoque/scanner.png';
import IconBusca from '../../../assets/IconsEstoque/lupa.png';
import IconEditar from '../../../assets/IconsEstoque/edit_item_icon_1.svg';
import IconExcluir from '../../../assets/IconsEstoque/delete_item_icon_1.svg';
import IconNovoItem from '../../../assets/NavegacaoEstoque/nova-compra.svg';
import "./PanelNovaCompra.css";

const MAX_VALOR_DECIMAL = 9999999.99;
const MAX_TOTAL_CENTAVOS = 999999999;
const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoQuantidade = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatarDataLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function novoItemVazio() {
    return {
        nome_item: "",
        preco_total_item: "",
        quantidade: "",
        unidade_medida: "un",
    };
}

function totalEmCentavos(itens) {
    return itens.reduce(
        (total, item) => total + Math.round(item.preco_total_item * 100),
        0
    );
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
    const busca = filtro.trim().toLowerCase();
    const itensFiltrados = itens.filter(
        (item) => 
        item.nome_item.toLowerCase().includes(busca) ||
        item.preco_total_item.toString().includes(busca) ||
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
            preco_total_item: itemCompra.preco_total_item,
        }));

        setLoading(true);
        setErrorMsg("");

        try {
            const response = await apiFetch("/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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
            preco_total_item: String(itemAtual.preco_total_item),
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
        const precoTotal = Number(item.preco_total_item);
        if (!ateDuasCasas.test(item.quantidade) || quantidade <= 0 || quantidade > MAX_VALOR_DECIMAL) {
            setItemErrorMsg("A quantidade deve ser maior que zero, ter até duas casas decimais e não ultrapassar 9.999.999,99.");
            return;
        }
        if (!ateDuasCasas.test(item.preco_total_item) || precoTotal > MAX_VALOR_DECIMAL) {
            setItemErrorMsg("O preço total deve ter até duas casas decimais e não ultrapassar R$ 9.999.999,99.");
            return;
        }

        const itemValidado = {
            nome_item: nome,
            quantidade,
            unidade_medida: item.unidade_medida,
            preco_total_item: precoTotal,
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
        <main className="nova-compra__painel">
            <h1 className="nova-compra__titulo">Itens comprados</h1>

            <div className="nova-compra__estabelecimento">
                <p>Estabelecimento:</p>
                <div className="nova-compra__estabelecimento-valor">
                    <p>{compra.estabelecimento || "Não informado"}</p>
                    <button
                        type="button"
                        className="nova-compra__editar-estabelecimento"
                        aria-label="Editar estabelecimento"
                        onClick={abrirModalEstabelecimento}
                        disabled={loading || compraRegistrada}
                    >
                        Editar
                    </button>
                </div>
            </div>

            <div className="nova-compra__busca">
                <img src={IconBusca} alt="" />
                <input
                    type="search"
                    aria-label="Pesquisar itens da compra"
                    placeholder="Pesquisar..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {errorMsg && <p className="nova-compra__erro" role="alert">{errorMsg}</p>}

            <form className="nova-compra__form" onSubmit={handleSubmit}>
                {itensFiltrados.length > 0 ? (
                    <ul className="nova-compra__lista" aria-label="Itens comprados">
                        {itensFiltrados.map((item) => (
                            <li key={item.idLocal} className="nova-compra__item">
                                <div className="nova-compra__item-descricao">
                                    <h2>{item.nome_item}</h2>
                                    <p className="nova-compra__item-detalhes">
                                        <span>{formatoPreco.format(item.preco_total_item)}</span>
                                        <span aria-hidden="true">/</span>
                                        <span>{formatoQuantidade.format(item.quantidade)} {item.unidade_medida}</span>
                                    </p>
                                </div>
                                <div className="nova-compra__item-acoes">
                                    <button
                                        type="button"
                                        aria-label={`Editar ${item.nome_item}`}
                                        onClick={() => abrirModalEdicaoItem(item)}
                                        disabled={loading || compraRegistrada}
                                    >
                                        <img src={IconEditar} alt="" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Excluir ${item.nome_item}`}
                                        onClick={() => setItens((atuais) => atuais.filter((atual) => atual.idLocal !== item.idLocal))}
                                        disabled={loading || compraRegistrada}
                                    >
                                        <img src={IconExcluir} alt="" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="nova-compra__estado" role="status">
                        {itens.length === 0 ? "Nenhum item adicionado." : "Nenhum item corresponde à pesquisa."}
                    </p>
                )}
                <button
                    type="button"
                    className="nova-compra__novo-item"
                    onClick={abrirModalNovoItem}
                    disabled={loading || compraRegistrada}
                >
                    Novo item
                    <img src={IconNovoItem} alt="" width="49" height="49" />
                </button>

                <div className="nova-compra__acoes">
                    <button
                        type="button"
                        className="nova-compra__botao"
                        onClick={() => navigate("/estoque")}
                        disabled={loading}
                    >
                        CANCELAR
                    </button>
                    <button
                        type="submit"
                        className="nova-compra__botao nova-compra__botao--principal"
                        disabled={loading || compraRegistrada}
                    >
                        {loading ? "SALVANDO..." : compraRegistrada ? "REGISTRADA" : "CONCLUIR"}
                    </button>
                </div>
            </form>

            <div className="nova-compra__scanner">
                <button
                    type="button"
                    className="nova-compra__botao"
                    onClick={() => navigate("/digitalizar-cupom")}
                    disabled={loading || compraRegistrada}
                >
                    <span>Escaneie seu cupom fiscal</span>
                    <img src={IconScanner} alt="" width="24" height="24" />
                </button>
            </div>

            {/*Modal de alterar o nome do estabelecimento*/}
            {modalEstabelecimentoAberto && (
                <div className="item-modal-overlay" role="presentation">
                    <form className="item-modal" onSubmit={salvarEstabelecimento} role="dialog" aria-modal="true" aria-labelledby="titulo-estabelecimento">
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
                            className="nova-compra__botao"
                            onClick={() => setModalEstabelecimentoAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="nova-compra__botao nova-compra__botao--principal"
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
                            Preço total do item
                            <input
                                name="preco_total_item"
                                type="number"
                                min="0"
                                max={MAX_VALOR_DECIMAL}
                                step="0.01"
                                value={item.preco_total_item}
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
                                placeholder="Ex: 1,2"
                                onChange={alterarItem}
                                required
                            />
                        </label>
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

                        {itemErrorMsg && <p className="item-modal-erro" role="alert">{itemErrorMsg}</p>}

                        <button
                            type="button"
                            className="nova-compra__botao"
                            onClick={fecharModalItem}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="nova-compra__botao nova-compra__botao--principal"
                        >
                            {itemEditandoId === null ? "Adicionar" : "Salvar alterações"}
                        </button>
                    </form>
                </div>
            )}
        </main>
    );
}

export default PanelNovaCompra;
