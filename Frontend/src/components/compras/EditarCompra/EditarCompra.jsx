import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../../../services/api";
import "./EditarCompra.css";

const MAX_VALOR_DECIMAL = 9999999.99;
const ATE_DUAS_CASAS = /^\d+(?:\.\d{1,2})?$/;
const UNIDADES_VARIAVEIS = ["kg", "g", "L", "mL"];
const CAMPOS_COMPRA = ["data_compra", "estabelecimento"];
const CAMPOS_ITEM = ["nome_item", "quantidade", "unidade_de_medida", "preco_total_item", "validade_estimada"];

const ROTULO_PRECO = "Preço total do item";

function paraInputData(valor) {
    return valor ? String(valor).slice(0, 10) : "";
}

function formatarDataBR(dataIso) {
    if (!dataIso) return "";
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// "un" é item unitário, as demais são de medida variável, o banco não permite misturar
function opcoesDeUnidade(unidade) {
    return unidade === "un" ? ["un"] : UNIDADES_VARIAVEIS;
}

// O backend responde erros em formatos diferentes (erro, error, errors, message)
function mensagemDeErro(data, padrao) {
    if (Array.isArray(data?.errors)) return data.errors.map((e) => e.message).join(" ");
    if (Array.isArray(data?.error)) return data.error.map((e) => e.message).join(" ");
    if (typeof data?.erro === "string") return data.erro;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    return padrao;
}

// Devolve só os campos cujo valor mudou em relação ao original
function camposAlterados(atual, original, campos) {
    const alterados = {};
    for (const campo of campos) {
        if (atual[campo] !== original[campo]) alterados[campo] = atual[campo];
    }
    return alterados;
}

function EditarCompra({ compraId, onSalvo, onFechar }) {
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState("");

    // Original é o que está no banco, o outro é o rascunho que o usuário edita
    const [compraOriginal, setCompraOriginal] = useState(null);
    const [compra, setCompra] = useState(null);
    const [itensOriginais, setItensOriginais] = useState([]);
    const [itens, setItens] = useState([]);

    const [salvando, setSalvando] = useState(false);
    const [errosSalvar, setErrosSalvar] = useState([]);

    // Modal dos dados da compra (null = fechado)
    const [compraModal, setCompraModal] = useState(null);
    const [compraModalErro, setCompraModalErro] = useState("");

    // Modal de item (itemModal null = fechado)
    const [itemEditandoId, setItemEditandoId] = useState(null);
    const [itemModal, setItemModal] = useState(null);
    const [itemModalErro, setItemModalErro] = useState("");

    useEffect(() => {
        let cancelado = false;

        async function carregar() {
            try {
                const response = await apiFetch(`/api/compras/${compraId}`);
                const data = await response.json();

                if (cancelado) return;

                if (!response.ok) {
                    setErroCarregar(mensagemDeErro(data, "Não foi possível carregar a compra."));
                    return;
                }

                const linhas = data.data || data; // uma linha por item, repetindo os dados da compra
                const dadosCompra = {
                    data_compra: paraInputData(linhas[0].data_compra),
                    estabelecimento: linhas[0].estabelecimento || "",
                };
                const dadosItens = linhas.map((linha) => ({
                    id: linha.item_id,
                    nome_item: linha.nome_item,
                    quantidade: Number(linha.quantidade),
                    unidade_de_medida: linha.unidade_de_medida,
                    preco_total_item: Number(linha.preco_total_item),
                    validade_estimada: paraInputData(linha.validade_estimada) || null,
                }));

                setCompraOriginal(dadosCompra);
                setCompra(dadosCompra);
                setItensOriginais(dadosItens);
                setItens(dadosItens);
            } catch (erro) {
                console.error("Erro ao carregar compra:", erro);
                if (!cancelado) setErroCarregar("Não foi possível conectar ao servidor.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }

        carregar();
        return () => {
            cancelado = true;
        };
    }, [compraId]);

    // ---- Modal dos dados da compra ----
    function abrirModalCompra() {
        setCompraModal({ estabelecimento: compra.estabelecimento, data_compra: compra.data_compra });
        setCompraModalErro("");
    }

    function alterarCompraModal(event) {
        const { name, value } = event.target;
        setCompraModal((atual) => ({ ...atual, [name]: value }));
        setCompraModalErro("");
    }

    function confirmarCompra(event) {
        event.preventDefault();

        const estabelecimento = compraModal.estabelecimento.trim();
        if (!estabelecimento || estabelecimento.length > 50) {
            setCompraModalErro("Informe um estabelecimento de até 50 caracteres.");
            return;
        }
        if (!compraModal.data_compra) {
            setCompraModalErro("Informe a data da compra.");
            return;
        }

        setCompra({ estabelecimento, data_compra: compraModal.data_compra });
        setCompraModal(null);
    }

    // ---- Modal de item ----
    function abrirModalItem(item) {
        setItemEditandoId(item.id);
        setItemModal({
            nome_item: item.nome_item,
            preco_total_item: String(item.preco_total_item),
            quantidade: String(item.quantidade),
            unidade_de_medida: item.unidade_de_medida,
            validade_estimada: item.validade_estimada ?? "",
        });
        setItemModalErro("");
    }

    function fecharModalItem() {
        setItemEditandoId(null);
        setItemModal(null);
        setItemModalErro("");
    }

    function alterarItemModal(event) {
        const { name, value } = event.target;
        setItemModal((atual) => ({ ...atual, [name]: value }));
        setItemModalErro("");
    }

    function confirmarItem(event) {
        event.preventDefault();

        const nome = itemModal.nome_item.trim();
        if (!nome || nome.length > 100) {
            setItemModalErro("Informe um nome de até 100 caracteres para o item.");
            return;
        }

        const quantidade = Number(itemModal.quantidade);
        const precoTotal = Number(itemModal.preco_total_item);

        if (!ATE_DUAS_CASAS.test(itemModal.quantidade) || quantidade <= 0 || quantidade > MAX_VALOR_DECIMAL) {
            setItemModalErro("A quantidade deve ser maior que zero, ter até duas casas decimais e não ultrapassar 9.999.999,99.");
            return;
        }
        if (itemModal.unidade_de_medida === "un" && !Number.isInteger(quantidade)) {
            setItemModalErro("Itens em unidades precisam de quantidade inteira.");
            return;
        }
        if (!ATE_DUAS_CASAS.test(itemModal.preco_total_item) || precoTotal > MAX_VALOR_DECIMAL) {
            setItemModalErro("O preço deve ter até duas casas decimais e não ultrapassar R$ 9.999.999,99.");
            return;
        }

        setItens((atuais) =>
            atuais.map((atual) =>
                atual.id === itemEditandoId
                    ? {
                          ...atual,
                          nome_item: nome,
                          quantidade,
                          unidade_de_medida: itemModal.unidade_de_medida,
                          preco_total_item: precoTotal,
                          validade_estimada: itemModal.validade_estimada || null,
                      }
                    : atual
            )
        );
        fecharModalItem();
    }

    function itemFoiAlterado(item) {
        const original = itensOriginais.find((o) => o.id === item.id);
        return Object.keys(camposAlterados(item, original, CAMPOS_ITEM)).length > 0;
    }

    // ---- Salvar no servidor: só o que mudou ----
    async function salvarEdicao() {
        if (salvando) return;

        const alteracoes = [];

        const camposCompra = camposAlterados(compra, compraOriginal, CAMPOS_COMPRA);
        if (Object.keys(camposCompra).length > 0) {
            alteracoes.push({
                descricao: "Dados da compra",
                url: `/api/compras/${compraId}`,
                corpo: camposCompra,
            });
        }

        for (const item of itens) {
            const original = itensOriginais.find((o) => o.id === item.id);
            const camposItem = camposAlterados(item, original, CAMPOS_ITEM);
            if (item.unidade_de_medida !== original.unidade_de_medida) {
                camposItem.quantidade = item.quantidade;
                camposItem.preco_total_item = item.preco_total_item;
            }
            if (Object.keys(camposItem).length > 0) {
                alteracoes.push({
                    descricao: `Item "${original.nome_item}"`,
                    url: `/api/compras/${compraId}/items/${item.id}`,
                    corpo: camposItem,
                });
            }
        }

        if (alteracoes.length === 0) {
            onFechar();
            return;
        }

        setSalvando(true);
        setErrosSalvar([]);

        // Em sequência: cada PATCH de item recalcula o total da compra e
        // ajusta o estoque, e duas dessas transações ao mesmo tempo podem se atropelar.
        // Se algo falhar, repetir é seguro: os PATCH gravam valores absolutos.
        const falhas = [];
        for (const alteracao of alteracoes) {
            try {
                const response = await apiFetch(alteracao.url, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(alteracao.corpo),
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    falhas.push(`${alteracao.descricao}: ${mensagemDeErro(data, "não foi possível salvar.")}`);
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                falhas.push(`${alteracao.descricao}: não foi possível conectar ao servidor.`);
            }
        }

        setSalvando(false);

        if (falhas.length > 0) {
            setErrosSalvar(falhas);
            return;
        }

        await onSalvo();
    }

    if (carregando) return <p className="editar-compra-status">Carregando itens...</p>;
    if (erroCarregar) return <p className="editar-compra-erro" role="alert">{erroCarregar}</p>;

    return (
        <div className="editar-compra">
            <div className="editar-compra-dados">
                <div>
                    <p className="editar-compra-rotulo">Estabelecimento</p>
                    <p className="editar-compra-valor">{compra.estabelecimento || "Não informado"}</p>
                </div>
                <div>
                    <p className="editar-compra-rotulo">Data</p>
                    <p className="editar-compra-valor">{formatarDataBR(compra.data_compra)}</p>
                </div>
                <button
                    type="button"
                    className="editar-compra-btn-link"
                    onClick={abrirModalCompra}
                    disabled={salvando}
                >
                    Editar dados
                </button>
            </div>

            <h4 className="editar-compra-subtitulo">Itens ({itens.length})</h4>

            <div className="editar-compra-itens">
                {itens.map((item) => (
                    <div key={item.id} className="editar-compra-item">
                        <div>
                            <h5 className="editar-compra-item-nome">
                                {item.nome_item}
                                {itemFoiAlterado(item) && <span className="editar-compra-tag">alterado</span>}
                            </h5>
                            <p className="editar-compra-item-detalhe">
                                {formatarMoeda(item.preco_total_item)} ·{" "}
                                {item.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} {item.unidade_de_medida}
                            </p>
                            <p className="editar-compra-item-detalhe">
                                Validade: {item.validade_estimada ? formatarDataBR(item.validade_estimada) : "não informada"}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="editar-compra-btn-link"
                            onClick={() => abrirModalItem(item)}
                            disabled={salvando}
                        >
                            Editar
                        </button>
                    </div>
                ))}
            </div>

            <p className="editar-compra-aviso">As alterações só são gravadas ao clicar em "Salvar edição".</p>

            {errosSalvar.length > 0 && (
                <ul className="editar-compra-erros" role="alert">
                    {errosSalvar.map((mensagem) => (
                        <li key={mensagem}>{mensagem}</li>
                    ))}
                </ul>
            )}

            <div className="editar-compra-acoes">
                <button
                    type="button"
                    className="editar-compra-btn-secundario"
                    onClick={onFechar}
                    disabled={salvando}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    className="editar-compra-btn-primario"
                    onClick={salvarEdicao}
                    disabled={salvando}
                >
                    {salvando ? "Salvando..." : "Salvar edição"}
                </button>
            </div>

            {/* Os modais vão para o document.body para não serem cortados pelo card */}
            {compraModal &&
                createPortal(
                    <div className="editar-compra-modal-overlay">
                        <form
                            className="editar-compra-modal"
                            onSubmit={confirmarCompra}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-editar-dados-compra"
                        >
                            <h2 id="titulo-editar-dados-compra">Dados da compra</h2>
                            <label>
                                Estabelecimento
                                <input
                                    name="estabelecimento"
                                    type="text"
                                    maxLength={50}
                                    value={compraModal.estabelecimento}
                                    onChange={alterarCompraModal}
                                    required
                                />
                            </label>
                            <label>
                                Data da compra
                                <input
                                    name="data_compra"
                                    type="date"
                                    value={compraModal.data_compra}
                                    onChange={alterarCompraModal}
                                    required
                                />
                            </label>

                            {compraModalErro && <p className="editar-compra-modal-erro" role="alert">{compraModalErro}</p>}

                            <button
                                type="button"
                                className="editar-compra-btn-secundario"
                                onClick={() => setCompraModal(null)}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="editar-compra-btn-primario">
                                Aplicar
                            </button>
                        </form>
                    </div>,
                    document.body
                )}

            {itemModal &&
                createPortal(
                    <div className="editar-compra-modal-overlay">
                        <form
                            className="editar-compra-modal"
                            onSubmit={confirmarItem}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-editar-item-compra"
                        >
                            <h2 id="titulo-editar-item-compra">Editar item</h2>
                            <label>
                                Nome do item
                                <input
                                    name="nome_item"
                                    type="text"
                                    maxLength={100}
                                    value={itemModal.nome_item}
                                    onChange={alterarItemModal}
                                    required
                                />
                            </label>
                            <label>
                                {ROTULO_PRECO}
                                <input
                                    name="preco_total_item"
                                    type="number"
                                    min="0"
                                    max={MAX_VALOR_DECIMAL}
                                    step="0.01"
                                    value={itemModal.preco_total_item}
                                    onChange={alterarItemModal}
                                    required
                                />
                            </label>
                            <div className="editar-compra-modal-linha">
                                <label>
                                    Quantidade
                                    <input
                                        name="quantidade"
                                        type="number"
                                        min={itemModal.unidade_de_medida === "un" ? "1" : "0.01"}
                                        max={MAX_VALOR_DECIMAL}
                                        step={itemModal.unidade_de_medida === "un" ? "1" : "0.01"}
                                        value={itemModal.quantidade}
                                        onChange={alterarItemModal}
                                        required
                                    />
                                </label>
                                <label>
                                    Unidade de medida
                                    <select
                                        name="unidade_de_medida"
                                        value={itemModal.unidade_de_medida}
                                        onChange={alterarItemModal}
                                    >
                                        {opcoesDeUnidade(itemModal.unidade_de_medida).map((unidade) => (
                                            <option key={unidade} value={unidade}>
                                                {unidade}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label>
                                Validade estimada (opcional)
                                <input
                                    name="validade_estimada"
                                    type="date"
                                    value={itemModal.validade_estimada}
                                    onChange={alterarItemModal}
                                />
                            </label>

                            {itemModalErro && <p className="editar-compra-modal-erro" role="alert">{itemModalErro}</p>}

                            <button
                                type="button"
                                className="editar-compra-btn-secundario"
                                onClick={fecharModalItem}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="editar-compra-btn-primario">
                                Aplicar
                            </button>
                        </form>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default EditarCompra;